import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { config } from '../config';

/**
 * Generate actionable suggestions based on error type
 */
function getErrorSuggestions(err: AppError): string[] {
    const suggestions: string[] = [];

    switch (err.code) {
        case 'FILE_VALIDATION_ERROR':
            suggestions.push('Ensure your file is a PDF or DOCX format');
            suggestions.push('Check that your file size is under 10MB');
            suggestions.push('Try converting your resume to PDF if using another format');
            break;

        case 'FILE_PARSING_ERROR':
            suggestions.push('Try converting your resume to a different format (PDF or DOCX)');
            suggestions.push('Ensure your resume contains readable text (not just images)');
            suggestions.push('Check that your file is not corrupted');
            break;

        case 'AI_EXTRACTION_ERROR':
            suggestions.push('Ensure your resume has clear section headings');
            suggestions.push('Try simplifying complex formatting or layouts');
            suggestions.push('Verify that your resume contains standard sections (experience, education, skills)');
            break;

        case 'AI_TIMEOUT_ERROR':
            suggestions.push('Try uploading a shorter resume (2-3 pages recommended)');
            suggestions.push('Simplify complex formatting or remove unnecessary content');
            suggestions.push('Wait a moment and try again');
            break;

        case 'AI_RATE_LIMIT_ERROR':
            suggestions.push('Wait a few minutes before trying again');
            suggestions.push('Check your import rate limit status');
            break;

        case 'CONTENT_VALIDATION_ERROR':
            suggestions.push('Ensure your resume includes your full name and email');
            suggestions.push('Add missing required sections (experience, education)');
            suggestions.push('Check that dates are in a standard format');
            break;

        case 'PARTIAL_IMPORT_ERROR':
            suggestions.push('Review the imported resume and fill in missing sections');
            suggestions.push('You can manually edit incomplete fields in the editor');
            suggestions.push('Try re-uploading with a clearer resume format');
            break;

        case 'RATE_LIMIT_EXCEEDED':
            suggestions.push(`You can import ${process.env.IMPORT_RATE_LIMIT || 5} resumes per hour`);
            suggestions.push('Wait for your rate limit to reset');
            suggestions.push('Check /resumes/import-ai/status for remaining imports');
            break;

        case 'UNAUTHORIZED':
            suggestions.push('Please log in to import resumes');
            suggestions.push('Your session may have expired - try logging in again');
            break;

        default:
            suggestions.push('Try again in a few moments');
            suggestions.push('Contact support if the problem persists');
    }

    return suggestions;
}

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    // Log error with context
    const errorContext = {
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
        ip: req.ip,
        userAgent: req.get('user-agent'),
    };

    if (err instanceof AppError) {
        // Log application errors at appropriate level
        if (err.statusCode >= 500) {
            logger.error('Application error', { error: err.message, code: err.code, ...errorContext });
        } else {
            logger.warn('Client error', { error: err.message, code: err.code, ...errorContext });
        }

        const suggestions = getErrorSuggestions(err);

        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code || 'ERROR',
                message: err.message,
                details: err.details,
                suggestions,
            },
        });
    }

    // Log unexpected errors with full stack trace
    logger.error('Unexpected error', {
        error: err.message,
        stack: err.stack,
        ...errorContext,
    });

    return res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: config.env === 'production'
                ? 'An unexpected error occurred'
                : err.message,
            suggestions: [
                'Try again in a few moments',
                'Contact support if the problem persists',
            ],
        },
    });
};
