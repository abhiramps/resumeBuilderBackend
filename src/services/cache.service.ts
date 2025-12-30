import crypto from 'crypto';
import { logger } from '../utils/logger';

export interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

export interface CacheStats {
    hits: number;
    misses: number;
    size: number;
}

/**
 * In-memory cache service for AI import results
 * Can be upgraded to Redis for production use
 */
export class CacheService {
    private cache: Map<string, CacheEntry<any>>;
    private stats: CacheStats;
    private cleanupInterval: NodeJS.Timeout | null;
    private readonly defaultTTL: number;

    constructor(ttlMs: number = 3600000) {
        // Default TTL: 1 hour
        this.cache = new Map();
        this.stats = { hits: 0, misses: 0, size: 0 };
        this.defaultTTL = ttlMs;
        this.cleanupInterval = null;

        // Start cleanup interval (every 5 minutes)
        this.startCleanup();
    }

    /**
     * Generate hash from buffer for cache key
     */
    generateFileHash(buffer: Buffer): string {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    /**
     * Get cached value by key
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            logger.debug('Cache miss', { key });
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.stats.misses++;
            this.stats.size = this.cache.size;
            logger.debug('Cache expired', { key });
            return null;
        }

        this.stats.hits++;
        logger.debug('Cache hit', { key });
        return entry.data as T;
    }

    /**
     * Set cached value with TTL
     */
    set<T>(key: string, data: T, ttlMs?: number): void {
        const ttl = ttlMs || this.defaultTTL;
        const expiresAt = Date.now() + ttl;

        this.cache.set(key, {
            data,
            expiresAt,
        });

        this.stats.size = this.cache.size;
        logger.debug('Cache set', { key, ttl, expiresAt });
    }

    /**
     * Delete cached value
     */
    delete(key: string): boolean {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.stats.size = this.cache.size;
            logger.debug('Cache deleted', { key });
        }
        return deleted;
    }

    /**
     * Clear all cached values
     */
    clear(): void {
        this.cache.clear();
        this.stats = { hits: 0, misses: 0, size: 0 };
        logger.info('Cache cleared');
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        return { ...this.stats };
    }

    /**
     * Get cache hit rate
     */
    getHitRate(): number {
        const total = this.stats.hits + this.stats.misses;
        return total === 0 ? 0 : this.stats.hits / total;
    }

    /**
     * Start automatic cleanup of expired entries
     */
    private startCleanup(): void {
        // Run cleanup every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpired();
        }, 5 * 60 * 1000);

        // Ensure cleanup runs on process exit
        if (this.cleanupInterval.unref) {
            this.cleanupInterval.unref();
        }
    }

    /**
     * Clean up expired entries
     */
    private cleanupExpired(): void {
        const now = Date.now();
        let removed = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                removed++;
            }
        }

        if (removed > 0) {
            this.stats.size = this.cache.size;
            logger.info('Cache cleanup completed', {
                removed,
                remaining: this.cache.size,
            });
        }
    }

    /**
     * Stop cleanup interval
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.clear();
        logger.info('Cache service destroyed');
    }
}

// Singleton instance for Lambda reuse
let cacheInstance: CacheService | null = null;

/**
 * Get or create cache service instance
 */
export function getCacheService(): CacheService {
    if (!cacheInstance) {
        const ttl = parseInt(process.env.CACHE_TTL || '3600000', 10); // 1 hour default
        cacheInstance = new CacheService(ttl);
        logger.info('Cache service initialized', { ttl });
    }
    return cacheInstance;
}
