import serverless from 'serverless-http';
import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ResumeService } from '../services/resume.service';
import { authenticate, AuthRequest, optionalAuth } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';
import { requestLogger } from '../middleware/request-logger.middleware';

const app = express();
const router = Router();
const resumeService = new ResumeService();

// Middleware
app.use(requestLogger);
app.use(helmet());
app.use(cors());
app.use(express.json());

// Share resume (make public)
router.post('/:id/share', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const result = await resumeService.share(req.params.id, req.user!.id);
        res.json({ data: result });
    } catch (error) {
        next(error);
    }
});

// Unshare resume (make private)
router.delete('/:id/share', authenticate, async (req: AuthRequest, res, next) => {
    try {
        await resumeService.unshare(req.params.id, req.user!.id);
        res.json({ message: 'Resume is now private' });
    } catch (error) {
        next(error);
    }
});

// Update share settings
router.patch('/:id/share', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { isPublic } = req.body;

        if (typeof isPublic !== 'boolean') {
            res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'isPublic must be a boolean',
                },
            });
            return;
        }

        const resume = await resumeService.updateShareSettings(
            req.params.id,
            req.user!.id,
            isPublic
        );
        res.json({ data: resume });
    } catch (error) {
        next(error);
    }
});

// Get resume analytics
router.get('/:id/analytics', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const analytics = await resumeService.getAnalytics(req.params.id, req.user!.id);
        res.json({ data: analytics });
    } catch (error) {
        next(error);
    }
});

// Get public resume (no auth required)
router.get('/public/:slug', optionalAuth, async (req: AuthRequest, res, next) => {
    try {
        const resume = await resumeService.getPublicResume(req.params.slug);
        res.json({ data: resume });
    } catch (error) {
        next(error);
    }
});

// Mount routes - handle both /resumes/* and /* paths
app.use('/resumes', router);
app.use('/', router);

// Error handler
app.use(errorHandler);

export const handler = serverless(app);
