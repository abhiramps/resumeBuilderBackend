import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './auth';
import userRoutes from './users';
import { errorHandler } from '../middleware/error.middleware';
import { requestLogger } from '../middleware/request-logger.middleware';
import logger from '../utils/logger';

const app = express();

// Request logging middleware (before other middleware)
app.use(requestLogger);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
    logger.debug('Health check requested');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Error handler (must be last)
app.use(errorHandler);

export const handler = serverless(app);
