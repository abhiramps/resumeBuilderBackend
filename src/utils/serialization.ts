/**
 * Utility functions for handling data serialization
 */

/**
 * Convert BigInt values to strings for JSON serialization
 * Recursively handles nested objects and arrays
 */
export function serializeBigInt<T>(obj: T): T {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (typeof obj === 'bigint') {
        return String(obj) as any;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => serializeBigInt(item)) as any;
    }

    if (typeof obj === 'object') {
        const serialized: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                serialized[key] = serializeBigInt(obj[key]);
            }
        }
        return serialized;
    }

    return obj;
}
