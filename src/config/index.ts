import dotenv from 'dotenv';

dotenv.config();

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),

    database: {
        url: process.env.DATABASE_URL!,
    },

    supabase: {
        url: process.env.SUPABASE_URL!,
        key: process.env.SUPABASE_KEY!,
        serviceKey: process.env.SUPABASE_SERVICE_KEY!,
    },

    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY!,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    },

    jwt: {
        secret: process.env.JWT_SECRET!,
        expiresIn: '7d',
        refreshExpiresIn: '30d',
    },

    aws: {
        region: process.env.AWS_REGION || 'us-east-1',
    },

    frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:5173',
    },
};

// Validate required environment variables
const requiredEnvVars = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_KEY',
    'SUPABASE_SERVICE_KEY',
    'JWT_SECRET',
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}
