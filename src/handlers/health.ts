import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import logger from '../utils/logger';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
    logger.debug('Health check requested');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export const handler = serverless(app);
