import 'dotenv/config';
import { supabaseAdmin } from '../src/utils/supabase';
import { prisma } from '../src/utils/prisma';

/**
 * Sync users from Supabase Auth to Prisma database
 * Useful when users exist in Supabase Auth but not in our database
 */
async function syncUsers() {
    try {
        console.log('🔄 Starting user sync...\n');

        // Get all users from Supabase Auth
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

        if (error) {
            throw error;
        }

        console.log(`📊 Found ${users.length} users in Supabase Auth\n`);

        let synced = 0;
        let skipped = 0;
        let errors = 0;

        for (const authUser of users) {
            try {
                // Check if user exists in Prisma
                const existingUser = await prisma.user.findUnique({
                    where: { id: authUser.id },
                });

                if (existingUser) {
                    console.log(`⏭️  Skipping ${authUser.email} - already exists`);
                    skipped++;
                    continue;
                }

                // Create user in Prisma
                await prisma.user.create({
                    data: {
                        id: authUser.id,
                        email: authUser.email!,
                        fullName: authUser.user_metadata?.full_name || authUser.email!,
                        avatarUrl: authUser.user_metadata?.avatar_url,
                        lastLoginAt: authUser.last_sign_in_at ? new Date(authUser.last_sign_in_at) : null,
                    },
                });

                console.log(`✅ Synced ${authUser.email}`);
                synced++;
            } catch (err: any) {
                console.error(`❌ Error syncing ${authUser.email}:`, err.message);
                errors++;
            }
        }

        console.log('\n📈 Sync Summary:');
        console.log(`   ✅ Synced: ${synced}`);
        console.log(`   ⏭️  Skipped: ${skipped}`);
        console.log(`   ❌ Errors: ${errors}`);
        console.log('\n✅ User sync complete!');
    } catch (error: any) {
        console.error('❌ Sync failed:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

syncUsers();
