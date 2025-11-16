import serverless from 'serverless-http';
import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { VersionService } from '../services/version.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createVersionSchema } from '../validators/version.validators';
import { errorHandler } from '../middleware/error.middleware';
import { requestLogger } from '../middleware/request-logger.middleware';

const app = express();
const router = Router();
const versionService = new VersionService();

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

// Create version snapshot
router.post(
    '/:resumeId/versions',
    authenticate,
    validateRequest(createVersionSchema),
    async (req: AuthRequest, res, next) => {
        try {
            const version = await versionService.createVersion(
                req.params.resumeId,
                req.user!.id,
                req.body
            );
            res.status(201).json({ data: version });
        } catch (error) {
            next(error);
        }
    }
);

// List resume versions
router.get('/:resumeId/versions', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const versions = await versionService.listVersions(
            req.params.resumeId,
            req.user!.id
        );
        res.json({ data: versions });
    } catch (error) {
        next(error);
    }
});

// Get specific version
router.get('/:resumeId/versions/:versionId', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const version = await versionService.getVersionById(
            req.params.resumeId,
            req.params.versionId,
            req.user!.id
        );
        res.json({ data: version });
    } catch (error) {
        next(error);
    }
});

// Restore to specific version
router.post(
    '/:resumeId/versions/:versionId/restore',
    authenticate,
    async (req: AuthRequest, res, next) => {
        try {
            await versionService.restoreVersion(
                req.params.resumeId,
                req.params.versionId,
                req.user!.id
            );
            res.json({ message: 'Version restored successfully' });
        } catch (error) {
            next(error);
        }
    }
);

// Compare versions
router.get(
    '/:resumeId/versions/compare',
    authenticate,
    async (req: AuthRequest, res, next) => {
        try {
            const { version1, version2 } = req.query;

            if (!version1 || !version2) {
                res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Both version1 and version2 query parameters are required',
                    },
                });
                return;
            }

            const comparison = await versionService.compareVersions(
                req.params.resumeId,
                version1 as string,
                version2 as string,
                req.user!.id
            );
            res.json({ data: comparison });
        } catch (error) {
            next(error);
        }
    }
);

// Delete specific version
router.delete(
    '/:resumeId/versions/:versionId',
    authenticate,
    async (req: AuthRequest, res, next) => {
        try {
            await versionService.deleteVersion(
                req.params.resumeId,
                req.params.versionId,
                req.user!.id
            );
            res.json({ message: 'Version deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
);

// Delete old versions (keep most recent N)
router.post(
    '/:resumeId/versions/cleanup',
    authenticate,
    async (req: AuthRequest, res, next) => {
        try {
            const { keepCount = 10 } = req.body;
            const deletedCount = await versionService.deleteOldVersions(
                req.params.resumeId,
                req.user!.id,
                keepCount
            );
            res.json({
                message: `Deleted ${deletedCount} old versions`,
                deletedCount,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Mount routes - handle both /resumes/* and /* paths
app.use('/resumes', router);
app.use('/', router);

// Error handler
app.use(errorHandler);

export const handler = serverless(app);
