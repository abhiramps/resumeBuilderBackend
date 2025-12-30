import 'dotenv/config';
import serverless from 'serverless-http';
import express, { Router } from 'express';
import helmet from 'helmet';
import { ImportService } from '../services/import.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { importRateLimit } from '../middleware/rate-limit.middleware';
import { errorHandler } from '../middleware/error.middleware';
import { requestLogger } from '../middleware/request-logger.middleware';
import { logger } from '../utils/logger';
import { BadRequestError } from '../utils/errors';

const app = express();
const router = Router();
const importService = new ImportService();

// Middleware
app.use(requestLogger);
app.use(helmet());
// CORS is handled by API Gateway - see serverless.yml
app.use(express.json({ limit: '15mb' })); // Increased limit for base64-encoded files

/**
 * POST /resumes/import-ai
 * Import resume from PDF/DOCX using AI parsing
 * 
 * Request body (multipart/form-data converted to base64 by API Gateway):
 * - file: base64-encoded file content
 * - filename: original filename
 * - contentType: MIME type
 * 
 * Response:
 * - 201: Resume created successfully
 * - 400: Invalid file or validation error
 * - 401: Unauthorized
 * - 429: Rate limit exceeded
 * - 500: Server error
 */
router.post(
    '/import-ai',
    authenticate,
    importRateLimit,
    async (req: AuthRequest, res, next) => {
        const startTime = Date.now();

        try {
            logger.info('AI import request received', {
                userId: req.user!.id,
                contentType: req.headers['content-type'],
            });

            // Extract file data from request
            const { file, filename, contentType } = req.body;

            logger.info('Request body received', {
                userId: req.user!.id,
                hasFile: !!file,
                fileType: typeof file,
                fileLength: file?.length,
                filename,
                contentType,
                bodyKeys: Object.keys(req.body),
            });

            if (!file) {
                throw new BadRequestError('No file provided. Please upload a PDF or DOCX file.');
            }

            // Decode base64 file (API Gateway encodes multipart/form-data as base64)
            let buffer: Buffer;
            try {
                buffer = Buffer.from(file, 'base64');

                logger.info('File decoded successfully', {
                    userId: req.user!.id,
                    filename,
                    contentType,
                    bufferSize: buffer.length,
                    firstBytes: buffer.slice(0, 20).toString('hex'),
                });
            } catch (error) {
                logger.error('File decoding failed', {
                    userId: req.user!.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    fileLength: file?.length,
                });
                throw new BadRequestError('Invalid file encoding. Please try uploading the file again.');
            }

            // Determine file type from content type or filename
            let fileType: 'pdf' | 'docx' | undefined;
            if (contentType?.includes('pdf') || filename?.toLowerCase().endsWith('.pdf')) {
                fileType = 'pdf';
            } else if (
                contentType?.includes('wordprocessingml') ||
                contentType?.includes('msword') ||
                filename?.toLowerCase().endsWith('.docx')
            ) {
                fileType = 'docx';
            }

            // Import resume
            const result = await importService.importFromFile(
                req.user!.id,
                buffer,
                { fileType }
            );

            // Clean up buffer
            buffer = null as any;

            if (!result.success) {
                throw new BadRequestError(result.error || 'Import failed');
            }

            const duration = Date.now() - startTime;
            logger.info('AI import completed successfully', {
                userId: req.user!.id,
                resumeId: result.resume!.id,
                confidenceScore: result.confidenceScore,
                duration,
            });

            res.status(201).json({
                success: true,
                data: {
                    resume: result.resume,
                    confidenceScore: result.confidenceScore,
                    incompleteSections: result.incompleteSections,
                },
            });
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error('AI import failed', {
                userId: req.user?.id,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
            });
            next(error);
        }
    }
);

/**
 * GET /resumes/import-ai/status
 * Get current rate limit status for imports
 */
router.get(
    '/import-ai/status',
    authenticate,
    async (req: AuthRequest, res, next) => {
        try {
            const { getRateLimitStatus } = await import('../middleware/rate-limit.middleware');
            const status = getRateLimitStatus(req.user!.id, 'import');

            res.json({
                success: true,
                data: {
                    remaining: status.remaining,
                    resetTime: status.resetTime,
                    limit: parseInt(process.env.IMPORT_RATE_LIMIT || '5', 10),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Mount router
app.use('/resumes', router);

// Error handler (must be last)
app.use(errorHandler);

// Export handler for Lambda
export const handler = serverless(app);
