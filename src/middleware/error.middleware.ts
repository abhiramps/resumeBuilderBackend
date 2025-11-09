import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

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
            logger.error('Application error', { error: err.message, ...errorContext });
        } else {
            logger.warn('Client error', { error: err.message, ...errorContext });
        }

        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code || 'ERROR',
                message: err.message,
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
            message: process.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred'
                : err.message,
        },
    });
};
