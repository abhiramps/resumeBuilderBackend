import serverless from 'serverless-http';
import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AuthService } from '../services/auth.service';
import { validateRequest } from '../middleware/validation.middleware';
import { signUpSchema, signInSchema, resetPasswordSchema } from '../validators/auth.validators';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';
import { requestLogger } from '../middleware/request-logger.middleware';

const app = express();
const router = Router();
const authService = new AuthService();

// Middleware
app.use(requestLogger);
app.use(helmet());
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://resume-builder-qhrz3j5hf-abhiramps-projects.vercel.app',
        /\.vercel\.app$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Sign up
router.post('/signup', validateRequest(signUpSchema), async (req, res, next) => {
    try {
        const result = await authService.signUp(req.body);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
});

// Sign in
router.post('/signin', validateRequest(signInSchema), async (req, res, next) => {
    try {
        const result = await authService.signIn(req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Sign out
router.post('/signout', async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        await authService.signOut(token!);
        res.json({ message: 'Signed out successfully' });
    } catch (error) {
        next(error);
    }
});

// Reset password
router.post('/reset-password', validateRequest(resetPasswordSchema), async (req, res, next) => {
    try {
        await authService.resetPassword(req.body.email);
        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        next(error);
    }
});

// OAuth sign in
router.get('/oauth/:provider', async (req, res, next) => {
    try {
        const { provider } = req.params;
        const result = await authService.signInWithOAuth(provider as 'google' | 'github');
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// OAuth callback
router.get('/oauth/callback', async (req, res, next) => {
    try {
        const { code } = req.query;
        const result = await authService.handleOAuthCallback(code as string);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Get current session
router.get('/session', authenticate, async (req: AuthRequest, res, next) => {
    try {
        res.json({
            user: req.user,
        });
    } catch (error) {
        next(error);
    }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
    try {
        const { refresh_token } = req.body;
        const result = await authService.refreshSession(refresh_token);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Get sessions
router.get('/sessions', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const sessions = await authService.getSessions(req.user!.id);
        res.json(sessions);
    } catch (error) {
        next(error);
    }
});

// Revoke session
router.delete('/sessions/:id', authenticate, async (req, res, next) => {
    try {
        await authService.revokeSession(req.params.id);
        res.json({ message: 'Session revoked successfully' });
    } catch (error) {
        next(error);
    }
});

// Mount routes - handle both /auth/* and /* paths
app.use('/auth', router);
app.use('/', router);

// Error handler
app.use(errorHandler);

export const handler = serverless(app);
