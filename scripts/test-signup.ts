import { supabase } from '../src/utils/supabase';
import { prisma } from '../src/utils/prisma';
import dotenv from 'dotenv';

dotenv.config();

async function testSignup() {
    const email = 'abhiramps776@gmail.com';
    const password = 'User@123';
    const fullName = 'Abhiram p s';

    console.log('🔍 Testing signup flow...\n');
    console.log('Email:', email);
    console.log();

    try {
        // Step 1: Sign up with Supabase Auth
        console.log('Step 1: Creating auth user in Supabase...');
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        if (authError) {
            console.error('❌ Supabase Auth error:', authError.message);
            console.error('   Error code:', authError.code);
            console.error('   Full error:', authError);
            return;
        }

        console.log('✅ Auth user created');
        console.log('   User ID:', authData.user?.id);
        console.log('   Email:', authData.user?.email);
        console.log('   Email confirmed:', authData.user?.email_confirmed_at ? 'Yes' : 'No');
        console.log();

        // Step 2: Create user profile in Prisma
        if (authData.user) {
            console.log('Step 2: Creating user profile in database...');

            try {
                const user = await prisma.user.create({
                    data: {
                        id: authData.user.id,
                        email: authData.user.email!,
                        fullName: fullName,
                    },
                });

                console.log('✅ User profile created');
                console.log('   Database ID:', user.id);
                console.log('   Email:', user.email);
                console.log('   Full Name:', user.fullName);
            } catch (dbError: any) {
                console.error('❌ Database error:', dbError.message);
                console.error('   Error code:', dbError.code);

                if (dbError.code === 'P2002') {
                    console.log('   → User already exists in database');
                }
            }
        }

        console.log();
        console.log('✅ Signup test complete!');
    } catch (error: any) {
        console.error('❌ Unexpected error:', error.message);
        console.error('   Full error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testSignup();
