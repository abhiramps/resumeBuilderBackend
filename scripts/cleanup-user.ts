import { prisma } from '../src/utils/prisma';

async function cleanupUser() {
    const email = 'abhiramps776@gmail.com';

    console.log('🧹 Cleaning up user...\n');
    console.log('Email:', email);
    console.log();

    try {
        const result = await prisma.user.deleteMany({
            where: {
                email: email,
            },
        });

        console.log(`✅ Deleted ${result.count} user(s)`);
        console.log();
        console.log('Now you can sign in again and the user will be recreated with the correct ID from Supabase Auth.');
    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupUser();
