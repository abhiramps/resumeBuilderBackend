import OpenAI from 'openai';
import { ExtractionResult, ValidationResult, AIParserConfig, AIParserResponse } from '../types/ai-parser.types';
import { logger } from '../utils/logger';
import { AIExtractionError, AITimeoutError, AIRateLimitError } from '../utils/errors';

const DEFAULT_CONFIG: AIParserConfig = {
    provider: 'openai',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    temperature: 0.1, // Low temperature for consistent extraction
    maxTokens: 4000,
    timeout: parseInt(process.env.AI_TIMEOUT || '20000', 10), // 20 seconds
    retryAttempts: parseInt(process.env.AI_MAX_RETRIES || '2', 10),
    retryDelay: 1000, // 1 second, exponential backoff
};

// Initialize OpenAI client outside handler for reuse across Lambda invocations
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
    if (!openaiClient) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is not set');
        }
        openaiClient = new OpenAI({
            apiKey,
            timeout: DEFAULT_CONFIG.timeout,
        });
    }
    return openaiClient;
}

export class AIParserService {
    private config: AIParserConfig;

    constructor(config?: Partial<AIParserConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Extract structured resume data from text using AI
     */
    async extractResumeData(text: string): Promise<AIParserResponse> {
        logger.info('Starting AI resume extraction', {
            textLength: text.length,
            model: this.config.model,
        });

        const startTime = Date.now();

        try {
            const extraction = await this.callAIWithRetry(text);
            const validation = this.validateExtraction(extraction);
            const confidence = this.calculateConfidence(extraction, validation);

            const duration = Date.now() - startTime;
            logger.info('AI extraction completed', {
                duration,
                confidence,
                isValid: validation.isValid,
                incompleteSections: validation.incompleteSections,
            });

            return {
                extraction,
                confidence,
                validation,
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error('AI extraction failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
            });
            throw error;
        }
    }

    /**
     * Call AI service with retry logic and exponential backoff
     */
    private async callAIWithRetry(text: string): Promise<ExtractionResult> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
            try {
                if (attempt > 0) {
                    const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
                    logger.info(`Retrying AI call (attempt ${attempt + 1}/${this.config.retryAttempts + 1}) after ${delay}ms`);
                    await this.sleep(delay);
                }

                return await this.callOpenAI(text);
            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                logger.warn(`AI call attempt ${attempt + 1} failed`, {
                    error: lastError.message,
                    attempt: attempt + 1,
                    maxAttempts: this.config.retryAttempts + 1,
                });

                // Don't retry on certain errors
                if (this.isNonRetryableError(error)) {
                    throw error;
                }
            }
        }

        throw new AIExtractionError(
            `AI extraction failed after ${this.config.retryAttempts + 1} attempts: ${lastError?.message || 'Unknown error'}`,
            { attempts: this.config.retryAttempts + 1, lastError: lastError?.message }
        );
    }

    /**
     * Call OpenAI API with structured prompt
     */
    private async callOpenAI(text: string): Promise<ExtractionResult> {
        const client = getOpenAIClient();

        const systemPrompt = this.buildSystemPrompt();
        const userPrompt = this.buildUserPrompt(text);

        try {
            const completion = await client.chat.completions.create({
                model: this.config.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens,
                response_format: { type: 'json_object' },
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) {
                throw new AIExtractionError('AI returned empty response');
            }

            const parsed = JSON.parse(content);
            return this.normalizeExtraction(parsed);
        } catch (error) {
            if (error instanceof Error) {
                const message = error.message.toLowerCase();

                if (message.includes('timeout') || message.includes('timed out')) {
                    throw new AITimeoutError(
                        'AI extraction timed out. Please try again with a simpler resume format.',
                        { timeout: this.config.timeout }
                    );
                }

                if (message.includes('rate_limit') || message.includes('rate limit') || message.includes('429')) {
                    throw new AIRateLimitError(
                        'AI service rate limit exceeded. Please try again in a few moments.',
                        { retryAfter: 60 }
                    );
                }

                if (message.includes('json')) {
                    throw new AIExtractionError(
                        'Failed to parse AI response. The resume format may be too complex.',
                        { parseError: error.message }
                    );
                }
            }
            throw error;
        }
    }

    /**
     * Build system prompt for AI
     */
    private buildSystemPrompt(): string {
        return `You are a resume parser that extracts structured data from resume text.

Output Format: JSON matching this exact schema:
{
  "personalInfo": {
    "fullName": "string (required)",
    "email": "string (required)",
    "phone": "string (optional)",
    "location": "string (optional)",
    "linkedin": "string (optional, full URL)",
    "github": "string (optional, full URL)",
    "website": "string (optional, full URL)"
  },
  "summary": "string (optional, professional summary or objective)",
  "experience": [
    {
      "company": "string (required)",
      "position": "string (required)",
      "location": "string (optional)",
      "startDate": "string (YYYY-MM-DD or YYYY-MM format)",
      "endDate": "string (YYYY-MM-DD or YYYY-MM format, or omit if current)",
      "current": boolean (true if currently working here),
      "description": "string (optional)",
      "highlights": ["string array of bullet points"]
    }
  ],
  "education": [
    {
      "institution": "string (required)",
      "degree": "string (required)",
      "field": "string (optional, field of study)",
      "location": "string (optional)",
      "startDate": "string (YYYY-MM-DD or YYYY-MM format)",
      "endDate": "string (YYYY-MM-DD or YYYY-MM format)",
      "gpa": "string (optional)"
    }
  ],
  "skills": [
    {
      "name": "string (required)",
      "category": "string (optional: Languages, Databases, Frontend, Backend, Cloud, Tools)"
    }
  ],
  "certifications": [
    {
      "name": "string (required)",
      "issuer": "string (required)",
      "date": "string (YYYY-MM-DD or YYYY-MM format)",
      "expiryDate": "string (optional)",
      "credentialId": "string (optional)"
    }
  ],
  "projects": [
    {
      "name": "string (required)",
      "description": "string (optional)",
      "technologies": ["array of technology names"],
      "url": "string (optional)",
      "github": "string (optional)",
      "startDate": "string (optional)",
      "endDate": "string (optional)"
    }
  ],
  "languages": [
    {
      "name": "string (required)",
      "proficiency": "string (optional: Native, Fluent, Professional, Intermediate, Basic)"
    }
  ]
}

Rules:
1. Parse dates to YYYY-MM-DD or YYYY-MM format (normalize "Jan 2020" to "2020-01", "January 2020" to "2020-01")
2. If a field is missing or unclear, omit it (don't use null or empty strings)
3. Extract bullet points as separate array items in highlights
4. Preserve original phrasing in descriptions and highlights
5. For skills, try to categorize into: Languages, Databases, Frontend, Backend, Cloud, Tools
6. Extract all URLs as complete URLs (add https:// if missing)
7. For current positions, set "current": true and omit "endDate"
8. Be generous in extraction - include data even if formatting is non-standard
9. Return valid JSON only, no additional text`;
    }

    /**
     * Build user prompt with resume text
     */
    private buildUserPrompt(text: string): string {
        // Truncate text if too long (keep first 15000 chars to stay within token limits)
        const truncatedText = text.length > 15000 ? text.substring(0, 15000) + '\n\n[Resume truncated due to length]' : text;

        return `Extract structured data from the following resume text:\n\n${truncatedText}`;
    }

    /**
     * Normalize extraction result to ensure consistent format
     */
    private normalizeExtraction(data: any): ExtractionResult {
        return {
            personalInfo: data.personalInfo || {},
            summary: data.summary || undefined,
            experience: Array.isArray(data.experience) ? data.experience : [],
            education: Array.isArray(data.education) ? data.education : [],
            skills: Array.isArray(data.skills) ? data.skills : [],
            certifications: Array.isArray(data.certifications) ? data.certifications : [],
            projects: Array.isArray(data.projects) ? data.projects : [],
            languages: Array.isArray(data.languages) ? data.languages : [],
        };
    }

    /**
     * Validate extraction result
     */
    validateExtraction(extraction: ExtractionResult): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        const incompleteSections: string[] = [];

        // Validate personal info
        if (!extraction.personalInfo.fullName) {
            errors.push('Full name is required');
            incompleteSections.push('personalInfo');
        }
        if (!extraction.personalInfo.email) {
            errors.push('Email is required');
            incompleteSections.push('personalInfo');
        }

        // Check for empty sections
        if (extraction.experience.length === 0) {
            warnings.push('No work experience found');
            incompleteSections.push('experience');
        }
        if (extraction.education.length === 0) {
            warnings.push('No education found');
            incompleteSections.push('education');
        }
        if (extraction.skills.length === 0) {
            warnings.push('No skills found');
            incompleteSections.push('skills');
        }

        // Validate experience entries
        extraction.experience.forEach((exp, index) => {
            if (!exp.company) {
                errors.push(`Experience entry ${index + 1}: Company name is required`);
            }
            if (!exp.position) {
                errors.push(`Experience entry ${index + 1}: Position is required`);
            }
        });

        // Validate education entries
        extraction.education.forEach((edu, index) => {
            if (!edu.institution) {
                errors.push(`Education entry ${index + 1}: Institution is required`);
            }
            if (!edu.degree) {
                errors.push(`Education entry ${index + 1}: Degree is required`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            incompleteSections: Array.from(new Set(incompleteSections)),
        };
    }

    /**
     * Calculate confidence score based on extraction completeness
     * 
     * Scoring breakdown:
     * - Personal Info: 30 points (name: 10, email: 10, phone: 5, location: 5)
     * - Experience: 25 points (has entries: 15, detailed highlights: 10)
     * - Education: 15 points (has entries: 15)
     * - Skills: 15 points (5+ skills: 15, 1-4 skills: 10)
     * - Summary: 10 points (50+ chars: 10, 20-49 chars: 5)
     * - Projects: 5 points (has entries: 5)
     * - Certifications: 5 points (has entries: 5) [BONUS]
     * - Languages: 5 points (has entries: 5) [BONUS]
     * 
     * Penalties:
     * - Validation errors: -5 points each
     * - Warnings: -2 points each
     * 
     * Score ranges:
     * - 90-100: Excellent extraction
     * - 70-89: Good extraction, minor review needed
     * - 50-69: Fair extraction, review recommended
     * - 0-49: Poor extraction, significant review required
     */
    calculateConfidence(extraction: ExtractionResult, validation: ValidationResult): number {
        let score = 0;
        let maxScore = 0;

        // Personal info (30 points) - CRITICAL
        maxScore += 30;
        if (extraction.personalInfo.fullName) score += 10;
        if (extraction.personalInfo.email) score += 10;
        if (extraction.personalInfo.phone) score += 5;
        if (extraction.personalInfo.location) score += 5;

        // Experience (25 points) - VERY IMPORTANT
        maxScore += 25;
        if (extraction.experience.length > 0) {
            score += 15;
            // Bonus for detailed experience entries
            const avgHighlights = extraction.experience.reduce((sum, exp) => sum + (exp.highlights?.length || 0), 0) / extraction.experience.length;
            if (avgHighlights >= 3) score += 10; // 3+ highlights per job
            else if (avgHighlights >= 2) score += 7; // 2+ highlights per job
            else if (avgHighlights >= 1) score += 4; // 1+ highlights per job
        }

        // Education (15 points) - IMPORTANT
        maxScore += 15;
        if (extraction.education.length > 0) {
            score += 15;
            // Bonus for complete education entries
            const completeEntries = extraction.education.filter(edu =>
                edu.institution && edu.degree && edu.field
            ).length;
            if (completeEntries === extraction.education.length && completeEntries > 0) {
                score += 3; // All entries are complete
            }
        }

        // Skills (15 points) - IMPORTANT
        maxScore += 15;
        if (extraction.skills.length >= 10) score += 15; // 10+ skills
        else if (extraction.skills.length >= 5) score += 12; // 5-9 skills
        else if (extraction.skills.length >= 3) score += 8; // 3-4 skills
        else if (extraction.skills.length > 0) score += 5; // 1-2 skills

        // Summary (10 points) - NICE TO HAVE
        maxScore += 10;
        if (extraction.summary) {
            if (extraction.summary.length >= 100) score += 10; // Detailed summary
            else if (extraction.summary.length >= 50) score += 7; // Good summary
            else if (extraction.summary.length >= 20) score += 4; // Brief summary
        }

        // Projects (5 points) - NICE TO HAVE
        maxScore += 5;
        if (extraction.projects.length >= 3) score += 5; // 3+ projects
        else if (extraction.projects.length > 0) score += 3; // 1-2 projects

        // Bonus points for additional sections (not counted in maxScore)
        // Certifications (5 bonus points)
        if (extraction.certifications && extraction.certifications.length > 0) {
            score += Math.min(5, extraction.certifications.length * 2);
        }

        // Languages (5 bonus points)
        if (extraction.languages && extraction.languages.length > 0) {
            score += Math.min(5, extraction.languages.length * 2);
        }

        // Penalties for validation issues
        const errorPenalty = validation.errors.length * 5;
        const warningPenalty = validation.warnings.length * 2;
        score = Math.max(0, score - errorPenalty - warningPenalty);

        // Calculate percentage (bonus points can push score above 100)
        const percentage = Math.round((score / maxScore) * 100);

        // Cap at 100
        return Math.min(100, percentage);
    }

    /**
     * Check if error is non-retryable
     */
    private isNonRetryableError(error: any): boolean {
        if (error instanceof AITimeoutError || error instanceof AIRateLimitError || error instanceof AIExtractionError) {
            return true;
        }
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            return message.includes('invalid') || message.includes('authentication') || message.includes('authorization');
        }
        return false;
    }

    /**
     * Get human-readable confidence level
     */
    getConfidenceLevel(score: number): {
        level: 'excellent' | 'good' | 'fair' | 'poor';
        message: string;
        requiresReview: boolean;
    } {
        if (score >= 90) {
            return {
                level: 'excellent',
                message: 'Excellent extraction quality. Resume is ready to use.',
                requiresReview: false,
            };
        } else if (score >= 70) {
            return {
                level: 'good',
                message: 'Good extraction quality. Minor review recommended.',
                requiresReview: false,
            };
        } else if (score >= 50) {
            return {
                level: 'fair',
                message: 'Fair extraction quality. Please review and complete missing information.',
                requiresReview: true,
            };
        } else {
            return {
                level: 'poor',
                message: 'Low extraction quality. Significant review and editing required.',
                requiresReview: true,
            };
        }
    }

    /**
     * Sleep utility for retry delays
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
