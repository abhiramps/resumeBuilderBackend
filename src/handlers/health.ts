import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import logger from '../utils/logger';

const app = express();

// Middleware
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

// Health check
app.get('/health', (_req, res) => {
    logger.debug('Health check requested');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export const handler = serverless(app);
