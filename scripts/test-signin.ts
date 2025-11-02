import { supabase } from '../src/utils/supabase';
import { prisma } from '../src/utils/prisma';
import dotenv from 'dotenv';

dotenv.config();

async function testSignin() {
    const email = 'abhiramps776@gmail.com';
    const password = 'User@123';

    console.log('🔍 Testing signin flow...\n');
    console.log('Email:', email);
    console.log();

    try {
        // Step 1: Sign in with Supabase Auth
        console.log('Step 1: Authenticating with Supabase...');
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            console.error('❌ Supabase Auth error:', authError.message);
            console.error('   Error code:', authError.code);
            console.error('   Status:', authError.status);
            return;
        }

        console.log('✅ Authentication successful');
        console.log('   User ID:', authData.user?.id);
        console.log('   Email:', authData.user?.email);
        console.log('   Access Token:', authData.session?.access_token?.substring(0, 20) + '...');
        console.log();

        // Step 2: Update user in database
        console.log('Step 2: Updating user in database...');

        try {
            const user = await prisma.user.upsert({
                where: { id: authData.user.id },
                update: {
                    lastLoginAt: new Date(),
                },
                create: {
                    id: authData.user.id,
                    email: authData.user.email!,
                    fullName: authData.user.user_metadata?.full_name || authData.user.email!,
                    lastLoginAt: new Date(),
                },
            });

            console.log('✅ User updated in database');
            console.log('   Database ID:', user.id);
            console.log('   Last Login:', user.lastLoginAt);
        } catch (dbError: any) {
            console.error('❌ Database error:', dbError.message);
            console.error('   Error code:', dbError.code);
            console.error('   Full error:', dbError);
        }

        console.log();
        console.log('✅ Signin test complete!');
        console.log();
        console.log('Response that would be sent to client:');
        console.log(JSON.stringify({
            user: authData.user,
            session: authData.session,
        }, null, 2));
    } catch (error: any) {
        console.error('❌ Unexpected error:', error.message);
        console.error('   Full error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testSignin();
