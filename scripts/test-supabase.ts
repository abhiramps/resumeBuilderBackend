import { supabase } from '../src/utils/supabase';
import dotenv from 'dotenv';

dotenv.config();

async function testSupabase() {
    console.log('🔍 Testing Supabase connection...\n');

    // Check environment variables
    console.log('Environment Variables:');
    console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('  SUPABASE_KEY:', process.env.SUPABASE_KEY ? '✅ Set' : '❌ Missing');
    console.log('  SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing');
    console.log();

    try {
        // Test 1: Try to sign up a test user
        console.log('Test 1: Sign up test user...');
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: `test-${Date.now()}@example.com`,
            password: 'TestPassword123!',
        });

        if (signupError) {
            console.error('❌ Signup failed:', signupError.message);
            console.error('   Error details:', signupError);
        } else {
            console.log('✅ Signup successful');
            console.log('   User ID:', signupData.user?.id);
            console.log('   Email:', signupData.user?.email);
        }
        console.log();

        // Test 2: Try to get session
        console.log('Test 2: Get session...');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            console.error('❌ Get session failed:', sessionError.message);
        } else {
            console.log('✅ Get session successful');
            console.log('   Session exists:', !!sessionData.session);
        }
        console.log();

        console.log('✅ Supabase connection test complete!');
    } catch (error: any) {
        console.error('❌ Test failed with error:', error.message);
        console.error('   Full error:', error);
    }
}

testSupabase();
