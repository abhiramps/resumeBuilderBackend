import { Request, Response, NextFunction } from 'express';
import { supabase } from '../utils/supabase';
import { UnauthorizedError } from '../utils/errors';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role?: string;
    };
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

        // Verify token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            throw new UnauthorizedError('Invalid or expired token');
        }

        // Attach user to request
        req.user = {
            id: user.id,
            email: user.email!,
        };

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
