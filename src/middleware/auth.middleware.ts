import { Request, Response, NextFunction } from 'express';
import { supabase } from '../utils/supabase';
import { UnauthorizedError } from '../utils/errors';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role?: string;
    };
    rawUser?: any;
}

export const authenticate = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('Auth Middleware: Missing or invalid header');
            throw new UnauthorizedError('Missing or invalid authorization header');
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error('Auth Middleware: Verification failed', error);
            throw new UnauthorizedError('Invalid or expired token');
        }

        // Attach user to request
        // console.log('Auth Middleware: User verified', user.id);
        req.user = {
            id: user.id,
            email: user.email!,
            // Pass the full user object (or metadata) if needed by syncUser
            // For now, we only need basic fields, but syncUser needs metadata for name/avatar
            // Let's expand this to include metadata
        };
        (req as any).rawUser = user;

        next();
    } catch (error) {
        console.error('Auth Middleware: Error', error);
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
            const { data: { user } } = await supabase.auth.getUser(token);

            if (user) {
                req.user = {
                    id: user.id,
                    email: user.email!,
                };
            }
        }

        next();
    } catch (error) {
        next();
    }
};
