import serverless from 'serverless-http';
import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { UserService } from '../services/user.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';
import { requestLogger } from '../middleware/request-logger.middleware';

const app = express();
const router = Router();
const userService = new UserService();

// Middleware
app.use(requestLogger);
app.use(helmet());
app.use(cors());
app.use(express.json());

// Get current user profile
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const profile = await userService.getProfile(req.user!.id);
        res.json(profile);
    } catch (error) {
        next(error);
    }
});

// Update profile
router.put('/me', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const profile = await userService.updateProfile(req.user!.id, req.body);
        res.json(profile);
    } catch (error) {
        next(error);
    }
});

// Delete account
router.delete('/me', authenticate, async (req: AuthRequest, res, next) => {
    try {
        await userService.deleteAccount(req.user!.id);
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// Update preferences
router.put('/me/preferences', authenticate, async (req: AuthRequest, res, next) => {
    try {
        await userService.updatePreferences(req.user!.id, req.body);
        res.json({ message: 'Preferences updated successfully' });
    } catch (error) {
        next(error);
    }
});

// Mount routes - handle both /users/* and /* paths
app.use('/users', router);
app.use('/', router);

// Error handler
app.use(errorHandler);

export const handler = serverless(app);
