import { Request, Response, NextFunction } from 'express';
import { supabase } from '../utils/supabase';
import { UnauthorizedError } from '../utils/errors';
import { User } from '@supabase/supabase-js';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role?: string;
    };
    supabaseUser?: User;
}

// Token verification cache. Each Supabase getUser call is a network round-trip
// (~50-200ms); caching results keyed by token avoids re-validating the same JWT
// on every request to a warm Lambda container.
const TOKEN_CACHE_MAX = 500;
const TOKEN_CACHE_TTL_MS = 5 * 60 * 1000;
const tokenCache = new Map<string, { user: User; expiresAt: number }>();

function decodeJwtExpMs(token: string): number | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
        return null;
    }
}

async function verifyToken(token: string): Promise<User | null> {
    const now = Date.now();
    const cached = tokenCache.get(token);
    if (cached && cached.expiresAt > now) {
        return cached.user;
    }
    if (cached) {
        tokenCache.delete(token);
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
        return null;
    }

    const jwtExp = decodeJwtExpMs(token);
    const expiresAt = jwtExp ? Math.min(now + TOKEN_CACHE_TTL_MS, jwtExp) : now + TOKEN_CACHE_TTL_MS;

    if (tokenCache.size >= TOKEN_CACHE_MAX) {
        // Simple FIFO eviction; insertion order is preserved by Map.
        const firstKey = tokenCache.keys().next().value;
        if (firstKey) tokenCache.delete(firstKey);
    }
    tokenCache.set(token, { user: data.user, expiresAt });
    return data.user;
}

export const authenticate = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Missing or invalid authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        const user = await verifyToken(token);

        if (!user) {
            throw new UnauthorizedError('Invalid or expired token');
        }

        req.user = {
            id: user.id,
            email: user.email!,
        };
        req.supabaseUser = user;

        next();
    } catch (error) {
        next(error);
    }
};

export const optionalAuth = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            const user = await verifyToken(token);

            if (user) {
                req.user = {
                    id: user.id,
                    email: user.email!,
                };
                req.supabaseUser = user;
            }
        }

        next();
    } catch {
        next();
    }
};
