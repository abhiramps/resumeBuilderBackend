import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    // Log request
    logger.info(`→ ${req.method} ${req.path}`, {
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        body: req.method !== 'GET' && Object.keys(req.body).length > 0 ? '...' : undefined,
        ip: req.ip,
    });

    // Capture response
    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 400 ? 'error' : res.statusCode >= 300 ? 'warn' : 'info';

        logger[level](`← ${req.method} ${req.path} ${res.statusCode}`, {
            duration: `${duration}ms`,
            statusCode: res.statusCode,
        });
    });

    next();
};
