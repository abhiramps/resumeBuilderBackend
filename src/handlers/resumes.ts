import serverless from 'serverless-http';
import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ResumeService } from '../services/resume.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createResumeSchema, updateResumeSchema } from '../validators/resume.validators';
import { errorHandler } from '../middleware/error.middleware';
import { requestLogger } from '../middleware/request-logger.middleware';

const app = express();
const router = Router();
const resumeService = new ResumeService();

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

// Import resume
router.post('/import', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const resume = await resumeService.import(req.user!.id, req.body);
        res.status(201).json({ data: resume });
    } catch (error) {
        next(error);
    }
});

// Bulk export
router.post('/export', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { resumeIds } = req.body;
        const data = await resumeService.bulkExport(req.user!.id, resumeIds);
        res.json({ data });
    } catch (error) {
        next(error);
    }
});

// Create resume
router.post('/', authenticate, validateRequest(createResumeSchema), async (req: AuthRequest, res, next) => {
    try {
        const resume = await resumeService.create(req.user!.id, req.body);
        res.status(201).json({ data: resume });
    } catch (error) {
        next(error);
    }
});

// Search resumes
router.get('/search', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { q, page, limit, status, template, sortBy, sortOrder } = req.query;

        if (!q || typeof q !== 'string') {
            res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Search query parameter "q" is required',
                },
            });
            return;
        }

        const result = await resumeService.search(req.user!.id, q, {
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            status: status as 'draft' | 'published' | undefined,
            template: template as string | undefined,
            sortBy: sortBy as 'updatedAt' | 'createdAt' | 'title' | 'relevance' | undefined,
            sortOrder: sortOrder as 'asc' | 'desc' | undefined,
        });

        const pageNum = page ? parseInt(page as string) : 1;
        const limitNum = limit ? parseInt(limit as string) : 10;

        res.json({
            data: result.resumes,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: result.total,
                totalPages: Math.ceil(result.total / limitNum),
            },
        });
    } catch (error) {
        next(error);
    }
});

// List resumes
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { page, limit, status, template, sortBy, sortOrder } = req.query;
        const result = await resumeService.list(req.user!.id, {
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            status: status as 'draft' | 'published' | undefined,
            template: template as string | undefined,
            sortBy: sortBy as 'updatedAt' | 'createdAt' | 'title' | undefined,
            sortOrder: sortOrder as 'asc' | 'desc' | undefined,
        });

        const pageNum = page ? parseInt(page as string) : 1;
        const limitNum = limit ? parseInt(limit as string) : 10;

        res.json({
            data: result.resumes,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: result.total,
                totalPages: Math.ceil(result.total / limitNum),
            },
        });
    } catch (error) {
        next(error);
    }
});

// Get resume by ID
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const resume = await resumeService.getById(req.params.id, req.user!.id);
        res.json({ data: resume });
    } catch (error) {
        next(error);
    }
});

// Update resume
router.put('/:id', authenticate, validateRequest(updateResumeSchema), async (req: AuthRequest, res, next) => {
    try {
        const resume = await resumeService.update(req.params.id, req.user!.id, req.body);
        res.json({ data: resume });
    } catch (error) {
        next(error);
    }
});

// Export resume
router.get('/:id/export', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const data = await resumeService.export(req.params.id, req.user!.id);
        res.json({ data });
    } catch (error) {
        next(error);
    }
});

// Duplicate resume
router.post('/:id/duplicate', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const resume = await resumeService.duplicate(req.params.id, req.user!.id);
        res.status(201).json({ data: resume });
    } catch (error) {
        next(error);
    }
});

// Delete resume
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
    try {
        await resumeService.delete(req.params.id, req.user!.id);
        res.json({ message: 'Resume deleted successfully' });
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
