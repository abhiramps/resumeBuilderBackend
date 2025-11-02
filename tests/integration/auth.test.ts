import request from 'supertest';
import express from 'express';
import authRoutes from '../../src/handlers/auth';
import { errorHandler } from '../../src/middleware/error.middleware';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use(errorHandler);

describe('Authentication', () => {
    describe('POST /auth/signup', () => {
        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/auth/signup')
                .send({
                    email: 'invalid-email',
                    password: '123',
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /auth/signin', () => {
        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/auth/signin')
                .send({
                    email: 'invalid-email',
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /auth/reset-password', () => {
        it('should validate email format', async () => {
            const response = await request(app)
                .post('/auth/reset-password')
                .send({
                    email: 'invalid-email',
                });

            expect(response.status).toBe(400);
        });
    });
});
