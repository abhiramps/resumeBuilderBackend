import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDatabase() {
    try {
        console.log('🔍 Verifying database connection and tables...\n');

        // Test connection
        await prisma.$connect();
        console.log('✅ Database connection successful\n');

        // Check tables
        const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `;

        console.log('📊 Tables in database:');
        tables.forEach((table) => {
            console.log(`   - ${table.table_name}`);
        });

        console.log(`\n✅ Total tables: ${tables.length}`);

        // Count records in each table
        console.log('\n📈 Record counts:');
        const userCount = await prisma.user.count();
        const resumeCount = await prisma.resume.count();
        const subscriptionCount = await prisma.subscription.count();
        const paymentCount = await prisma.payment.count();

        console.log(`   - users: ${userCount}`);
        console.log(`   - resumes: ${resumeCount}`);
        console.log(`   - subscriptions: ${subscriptionCount}`);
        console.log(`   - payments: ${paymentCount}`);

        console.log('\n✅ Database verification complete!');
    } catch (error) {
        console.error('❌ Database verification failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

verifyDatabase();
