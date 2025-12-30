import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { logger } from '../utils/logger';

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store for rate limiting
// In production, consider using Redis for distributed rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
    maxRequests: number;
    windowMs: number;
    keyPrefix?: string;
}

/**
 * Rate limiting middleware
 * Limits requests per user within a time window
 */
export const rateLimit = (options: RateLimitOptions) => {
    const { maxRequests, windowMs, keyPrefix = 'rate-limit' } = options;

    return (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            // Rate limiting requires authentication
            if (!req.user?.id) {
                return next();
            }

            const userId = req.user.id;
            const key = `${keyPrefix}:${userId}`;
            const now = Date.now();

            // Get or create rate limit entry
            let entry = rateLimitStore.get(key);

            if (!entry || entry.resetTime < now) {
                // Create new entry or reset expired entry
                entry = {
                    count: 0,
                    resetTime: now + windowMs,
                };
                rateLimitStore.set(key, entry);
            }

            // Increment request count
            entry.count++;

            // Check if limit exceeded
            if (entry.count > maxRequests) {
                const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

                logger.warn('Rate limit exceeded', {
                    userId,
                    count: entry.count,
                    maxRequests,
                    retryAfter,
                });

                res.status(429).json({
                    success: false,
                    error: {
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: `You have exceeded the import limit of ${maxRequests} requests per hour. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
                        retryAfter,
                    },
                });
                return;
            }

            // Add rate limit headers
            res.setHeader('X-RateLimit-Limit', maxRequests.toString());
            res.setHeader('X-RateLimit-Remaining', (maxRequests - entry.count).toString());
            res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

            logger.debug('Rate limit check passed', {
                userId,
                count: entry.count,
                maxRequests,
                remaining: maxRequests - entry.count,
            });

            next();
        } catch (error) {
            logger.error('Rate limit middleware error', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            // Don't block request on rate limit errors
            next();
        }
    };
};

/**
 * Import-specific rate limiter
 * 5 imports per hour per user
 */
export const importRateLimit = rateLimit({
    maxRequests: parseInt(process.env.IMPORT_RATE_LIMIT || '5', 10),
    windowMs: parseInt(process.env.IMPORT_RATE_WINDOW || '3600000', 10), // 1 hour in ms
    keyPrefix: 'import',
});

/**
 * Get current rate limit status for a user
 */
export const getRateLimitStatus = (userId: string, keyPrefix: string = 'import') => {
    const key = `${keyPrefix}:${userId}`;
    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < Date.now()) {
        return {
            count: 0,
            remaining: parseInt(process.env.IMPORT_RATE_LIMIT || '5', 10),
            resetTime: null,
        };
    }

    const maxRequests = parseInt(process.env.IMPORT_RATE_LIMIT || '5', 10);
    return {
        count: entry.count,
        remaining: Math.max(0, maxRequests - entry.count),
        resetTime: new Date(entry.resetTime),
    };
};

/**
 * Reset rate limit for a user (admin function)
 */
export const resetRateLimit = (userId: string, keyPrefix: string = 'import') => {
    const key = `${keyPrefix}:${userId}`;
    rateLimitStore.delete(key);
    logger.info('Rate limit reset', { userId, keyPrefix });
};
