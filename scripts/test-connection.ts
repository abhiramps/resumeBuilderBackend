import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
    try {
        console.log('Testing database connection...');

        // Simple query to test connection
        const result = await prisma.$queryRaw`SELECT 1 as test`;
        console.log('✅ Connection successful!');
        console.log('Result:', result);

    } catch (error: any) {
        console.error('❌ Connection failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
