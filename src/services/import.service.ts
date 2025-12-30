import { AIParserService } from './ai-parser.service';
import { FileParserService } from './file-parser.service';
import { ContentMapperService } from './content-mapper.service';
import { ResumeService } from './resume.service';
import { getCacheService } from './cache.service';
import { Resume } from '../types/resume.types';
import { ValidationResult, ExtractionResult } from '../types/ai-parser.types';
import { logger } from '../utils/logger';
import {
    FileValidationError,
    FileParsingError,
    ContentValidationError,
    PartialImportError,
} from '../utils/errors';

export interface ImportResult {
    success: boolean;
    resume?: Resume;
    error?: string;
    confidenceScore?: number;
    incompleteSections?: string[];
    cached?: boolean; // Indicates if result came from cache
}

export interface ImportOptions {
    fileType?: 'pdf' | 'docx';
    skipValidation?: boolean;
    skipCache?: boolean; // Option to bypass cache
}

export class ImportService {
    private aiParser: AIParserService;
    private fileParser: FileParserService;
    private contentMapper: ContentMapperService;
    private resumeService: ResumeService;

    constructor() {
        this.aiParser = new AIParserService();
        this.fileParser = new FileParserService();
        this.contentMapper = new ContentMapperService();
        this.resumeService = new ResumeService();
    }

    /**
     * Import resume from file buffer using AI parsing
     */
    async importFromFile(
        userId: string,
        buffer: Buffer,
        options: ImportOptions = {}
    ): Promise<ImportResult> {
        const startTime = Date.now();

        logger.info('Starting AI-powered resume import', {
            userId,
            bufferSize: buffer.length,
            fileType: options.fileType,
            skipCache: options.skipCache,
        });

        try {
            // Step 1: Validate file
            this.validateFile(buffer);

            // Step 2: Check cache for duplicate imports (unless skipCache is true)
            if (!options.skipCache) {
                const cacheService = getCacheService();
                const fileHash = cacheService.generateFileHash(buffer);
                const cacheKey = `import:${fileHash}`;

                const cachedResult = cacheService.get<{
                    extraction: ExtractionResult;
                    confidence: number;
                }>(cacheKey);

                if (cachedResult) {
                    logger.info('Cache hit for file import', {
                        userId,
                        fileHash,
                        cacheStats: cacheService.getStats(),
                    });

                    // Use cached extraction result but create new resume
                    const result = await this.createResumeFromExtraction(
                        userId,
                        cachedResult.extraction,
                        cachedResult.confidence
                    );

                    const duration = Date.now() - startTime;
                    logger.info('Resume import completed from cache', {
                        userId,
                        resumeId: result.resume?.id,
                        confidenceScore: result.confidenceScore,
                        duration,
                    });

                    return {
                        ...result,
                        cached: true,
                    };
                }

                logger.info('Cache miss for file import', {
                    userId,
                    fileHash,
                    cacheStats: cacheService.getStats(),
                });
            }

            // Step 3: Extract text from file
            const text = await this.extractText(buffer, options.fileType);

            // Step 4: Process AI import
            const result = await this.processAIImport(userId, text, buffer, options.skipCache);

            const duration = Date.now() - startTime;
            logger.info('Resume import completed successfully', {
                userId,
                resumeId: result.resume?.id,
                confidenceScore: result.confidenceScore,
                duration,
            });

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error('Resume import failed', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Import failed due to an unknown error',
            };
        }
    }

    /**
     * Process AI import from extracted text
     */
    async processAIImport(
        userId: string,
        text: string,
        buffer?: Buffer,
        skipCache?: boolean
    ): Promise<ImportResult> {
        try {
            // Step 1: Extract structured data using AI
            logger.info('Calling AI parser', { userId, textLength: text.length });
            const aiResponse = await this.aiParser.extractResumeData(text);

            // Step 2: Cache the extraction result (if buffer provided and not skipping cache)
            if (buffer && !skipCache) {
                const cacheService = getCacheService();
                const fileHash = cacheService.generateFileHash(buffer);
                const cacheKey = `import:${fileHash}`;

                cacheService.set(cacheKey, {
                    extraction: aiResponse.extraction,
                    confidence: aiResponse.confidence,
                });

                logger.info('Cached extraction result', {
                    userId,
                    fileHash,
                    cacheStats: cacheService.getStats(),
                });
            }

            // Step 3: Create resume from extraction
            return await this.createResumeFromExtraction(
                userId,
                aiResponse.extraction,
                aiResponse.confidence
            );
        } catch (error) {
            logger.error('AI import processing failed', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }

    /**
     * Create resume from AI extraction result
     */
    private async createResumeFromExtraction(
        userId: string,
        extraction: ExtractionResult,
        confidence: number
    ): Promise<ImportResult> {
        // Step 1: Map to ResumeContent structure
        logger.info('Mapping content', { userId });
        const content = this.contentMapper.mapToResumeContent(extraction);

        // Step 2: Validate mapped content
        logger.info('Validating mapped content', { userId });
        const validation = this.contentMapper.validateMappedContent(content);

        // Handle partial imports (low confidence or incomplete sections)
        if (confidence < 70 || validation.incompleteSections.length > 0) {
            logger.warn('Partial import detected', {
                userId,
                confidence,
                incompleteSections: validation.incompleteSections,
                errors: validation.errors,
            });

            // If there are critical validation errors, throw error
            if (!validation.isValid) {
                throw new ContentValidationError(
                    `Resume validation failed: ${validation.errors.join(', ')}`,
                    {
                        errors: validation.errors,
                        warnings: validation.warnings,
                        incompleteSections: validation.incompleteSections,
                    }
                );
            }

            // If confidence is very low, warn about partial import
            if (confidence < 50) {
                throw new PartialImportError(
                    'Resume import completed with low confidence. Please review and complete missing information.',
                    {
                        confidence,
                        incompleteSections: validation.incompleteSections,
                        warnings: validation.warnings,
                    }
                );
            }
        }

        // Step 3: Create resume in database
        logger.info('Creating resume in database', { userId });
        const resume = await this.createResume(userId, content);

        return {
            success: true,
            resume,
            confidenceScore: confidence,
            incompleteSections: validation.incompleteSections,
            cached: false,
        };
    }

    /**
     * Validate file before processing
     */
    private validateFile(buffer: Buffer): void {
        try {
            // Validate file size (10MB max)
            const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);
            this.fileParser.validateFileSize(buffer, maxSize);
        } catch (error) {
            throw new FileValidationError(
                error instanceof Error ? error.message : 'File size validation failed',
                { maxSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), actualSize: buffer.length }
            );
        }

        // Validate file type
        const fileType = this.fileParser.detectFileType(buffer);
        if (fileType === 'unknown') {
            throw new FileValidationError(
                'Unsupported file type. Please upload a PDF or DOCX file.',
                { supportedFormats: ['PDF', 'DOCX'] }
            );
        }

        logger.info('File validation passed', {
            fileType,
            size: buffer.length,
        });
    }

    /**
     * Extract text from file buffer
     */
    private async extractText(buffer: Buffer, fileType?: 'pdf' | 'docx'): Promise<string> {
        try {
            const text = await this.fileParser.extractText(buffer, fileType);

            if (!text || text.trim().length < 100) {
                throw new FileParsingError(
                    'Extracted text is too short. Please ensure your resume contains readable text.',
                    { extractedLength: text?.length || 0, minimumRequired: 100 }
                );
            }

            logger.info('Text extraction successful', {
                textLength: text.length,
            });

            return text;
        } catch (error) {
            logger.error('Text extraction failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });

            if (error instanceof FileParsingError) {
                throw error;
            }

            throw new FileParsingError(
                error instanceof Error ? error.message : 'Failed to extract text from file',
                { fileType }
            );
        }
    }

    /**
     * Create resume in database
     */
    private async createResume(userId: string, content: any): Promise<Resume> {
        try {
            const title = this.generateResumeTitle();

            const resume = await this.resumeService.create(userId, {
                title,
                templateId: 'professional', // Default template for AI imports
                content,
            });

            logger.info('Resume created successfully', {
                userId,
                resumeId: resume.id,
                title,
            });

            return resume;
        } catch (error) {
            logger.error('Resume creation failed', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }

    /**
     * Generate resume title with timestamp
     */
    private generateResumeTitle(): string {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
        return `Imported Resume - ${dateStr}`;
    }

    /**
     * Calculate confidence score (delegated to AI parser)
     */
    calculateConfidence(extraction: any, validation: ValidationResult): number {
        return this.aiParser.calculateConfidence(extraction, validation);
    }
}
