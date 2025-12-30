import mammoth from 'mammoth';
import { logger } from '../utils/logger';
import { BadRequestError } from '../utils/errors';

export class FileParserService {
    /**
     * Extract text from PDF buffer
     */
    async extractTextFromPDF(buffer: Buffer): Promise<string> {
        logger.info('Starting PDF text extraction', {
            bufferSize: buffer.length,
        });

        const startTime = Date.now();

        try {
            // Validate buffer
            if (!buffer || buffer.length === 0) {
                throw new BadRequestError('PDF buffer is empty');
            }

            // Check PDF signature
            const signature = buffer.toString('utf8', 0, 4);
            if (signature !== '%PDF') {
                logger.error('Invalid PDF signature', {
                    signature,
                    firstBytes: buffer.slice(0, 20).toString('hex'),
                });
                throw new BadRequestError('File does not appear to be a valid PDF');
            }

            logger.info('PDF signature validated', { signature });

            // Use dynamic import to get pdf-parse
            const pdfParse = require('pdf-parse');
            const data = await pdfParse(buffer, {
                // Maximize text extraction
                max: 0, // No page limit
            });

            logger.info('PDF parsed successfully', {
                pages: data.numpages,
                rawTextLength: data.text?.length || 0,
            });

            const text = this.cleanText(data.text);
            const duration = Date.now() - startTime;

            logger.info('PDF extraction completed', {
                duration,
                textLength: text.length,
                pages: data.numpages,
            });

            if (!text || text.trim().length === 0) {
                throw new BadRequestError('PDF appears to be empty or contains only images. Please use a text-based PDF.');
            }

            return text;
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error('PDF extraction failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                errorType: error?.constructor?.name,
                stack: error instanceof Error ? error.stack : undefined,
                duration,
                bufferLength: buffer?.length,
            });

            if (error instanceof BadRequestError) {
                throw error;
            }

            throw new BadRequestError(
                'Failed to extract text from PDF. The file may be corrupted or password-protected.'
            );
        }
    }

    /**
     * Extract text from DOCX buffer
     */
    async extractTextFromDOCX(buffer: Buffer): Promise<string> {
        logger.info('Starting DOCX text extraction', {
            bufferSize: buffer.length,
        });

        const startTime = Date.now();

        try {
            const result = await mammoth.extractRawText({ buffer });

            const text = this.cleanText(result.value);
            const duration = Date.now() - startTime;

            logger.info('DOCX extraction completed', {
                duration,
                textLength: text.length,
                messages: result.messages.length,
            });

            // Log any warnings from mammoth
            if (result.messages.length > 0) {
                logger.warn('DOCX extraction warnings', {
                    messages: result.messages.map(m => m.message),
                });
            }

            if (!text || text.trim().length === 0) {
                throw new BadRequestError('DOCX appears to be empty. Please check the file content.');
            }

            return text;
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error('DOCX extraction failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
            });

            if (error instanceof BadRequestError) {
                throw error;
            }

            throw new BadRequestError(
                'Failed to extract text from DOCX. The file may be corrupted or in an unsupported format.'
            );
        }
    }

    /**
     * Clean and normalize extracted text
     */
    private cleanText(text: string): string {
        if (!text) return '';

        return text
            // Remove excessive whitespace
            .replace(/[ \t]+/g, ' ')
            // Remove excessive newlines (more than 2 consecutive)
            .replace(/\n{3,}/g, '\n\n')
            // Remove page numbers (common patterns)
            .replace(/^\s*\d+\s*$/gm, '')
            // Remove common headers/footers patterns
            .replace(/^Page \d+ of \d+$/gim, '')
            .replace(/^Page \d+$/gim, '')
            // Trim each line
            .split('\n')
            .map(line => line.trim())
            .join('\n')
            // Final trim
            .trim();
    }

    /**
     * Detect file type from buffer
     */
    detectFileType(buffer: Buffer): 'pdf' | 'docx' | 'unknown' {
        // Check PDF signature
        if (buffer.length >= 4 && buffer.toString('utf8', 0, 4) === '%PDF') {
            return 'pdf';
        }

        // Check DOCX signature (ZIP file starting with PK)
        if (
            buffer.length >= 4 &&
            buffer[0] === 0x50 &&
            buffer[1] === 0x4b &&
            buffer[2] === 0x03 &&
            buffer[3] === 0x04
        ) {
            // Further check for DOCX by looking for word/ directory in ZIP
            const bufferStr = buffer.toString('utf8', 0, Math.min(buffer.length, 1000));
            if (bufferStr.includes('word/')) {
                return 'docx';
            }
        }

        return 'unknown';
    }

    /**
     * Validate file size
     */
    validateFileSize(buffer: Buffer, maxSizeBytes: number = 10 * 1024 * 1024): void {
        if (buffer.length > maxSizeBytes) {
            const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
            const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(0);
            throw new BadRequestError(
                `File size (${sizeMB}MB) exceeds maximum allowed size of ${maxSizeMB}MB`
            );
        }
    }

    /**
     * Extract text based on file type
     */
    async extractText(buffer: Buffer, fileType?: 'pdf' | 'docx'): Promise<string> {
        // Validate file size first
        this.validateFileSize(buffer);

        // Detect file type if not provided
        const detectedType = fileType || this.detectFileType(buffer);

        logger.info('Extracting text from file', {
            fileType: detectedType,
            bufferSize: buffer.length,
        });

        switch (detectedType) {
            case 'pdf':
                return this.extractTextFromPDF(buffer);
            case 'docx':
                return this.extractTextFromDOCX(buffer);
            default:
                throw new BadRequestError(
                    'Unsupported file type. Please upload a PDF or DOCX file.'
                );
        }
    }
}
