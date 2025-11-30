import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { config } from '../config';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient; pool: Pool };

// Create PostgreSQL connection pool
const pool = globalForPrisma.pool || new Pool({ connectionString: process.env.DATABASE_URL });
if (config.env !== 'production') globalForPrisma.pool = pool;

// Create Prisma adapter with the pool
const adapter = new PrismaPg(pool);

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
        log: config.env === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

if (config.env !== 'production') globalForPrisma.prisma = prisma;

// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
    await pool.end();
});
