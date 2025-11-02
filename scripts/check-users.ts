import { prisma } from '../src/utils/prisma';

async function checkUsers() {
    console.log('🔍 Checking users in database...\n');

    try {
        const users = await prisma.user.findMany({
            where: {
                email: 'abhiramps776@gmail.com',
            },
        });

        console.log(`Found ${users.length} user(s) with email abhiramps776@gmail.com:\n`);

        users.forEach((user, index) => {
            console.log(`User ${index + 1}:`);
            console.log(`  ID: ${user.id}`);
            console.log(`  Email: ${user.email}`);
            console.log(`  Full Name: ${user.fullName}`);
            console.log(`  Created: ${user.createdAt}`);
            console.log(`  Last Login: ${user.lastLoginAt}`);
            console.log();
        });
    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
