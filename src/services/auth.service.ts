import { supabase } from '../utils/supabase';
import { prisma } from '../utils/prisma';
import { SignUpData, SignInData, AuthResponse } from '../types/auth.types';
import { config } from '../config';
import { User } from '@supabase/supabase-js';
import { serializeBigInt } from '../utils/serialization';
import { nanoid } from 'nanoid';

export class AuthService {
    async signUp(data: SignUpData): Promise<AuthResponse> {
        const { email, password, fullName } = data;

        // Ensure frontend URL doesn't have trailing slash
        const frontendUrl = config.frontend.url.replace(/\/$/, '');
        // We don't need Supabase redirect anymore for deferred flow, but keeping it harmless
        const redirectUrl = `${frontendUrl}/auth/confirm`;

        // Log redirect URL for debugging (remove in production if needed)
        console.log('[AuthService] SignUp - Using redirect URL:', redirectUrl);
        console.log('[AuthService] SignUp - FRONTEND_URL env:', process.env.FRONTEND_URL);

        // Sign up with Supabase Auth
        // Assumption: "Enable Email Confirmations" is DISABLED in Supabase
        const { data: authData, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
                emailRedirectTo: redirectUrl,
            },
        });

        if (error) throw error;

        // Generate verification token
        const verificationToken = nanoid(32);

        // Create user profile in database using Prisma with verification token
        if (authData.user) {
            await prisma.user.create({
                data: {
                    id: authData.user.id,
                    email: authData.user.email!,
                    fullName: fullName,
                    isEmailVerified: false, // Default to false
                    verificationToken: verificationToken,
                },
            });

            // Send custom verification email
            // MOCK EMAIL SENDING
            const verificationLink = `${frontendUrl}/verify?token=${verificationToken}`;
            console.log('---------------------------------------------------');
            console.log(`[Email Service] To: ${email}`);
            console.log(`[Email Service] Subject: Verify your email`);
            console.log(`[Email Service] Body: Click here to verify: ${verificationLink}`);
            console.log('---------------------------------------------------');
        }

        // Return session immediately (Deferred Verification)
        return {
            user: authData.user,
            session: authData.session,
            requiresEmailVerification: false, // We don't block login anymore
        };
    }

    async signIn(data: SignInData): Promise<AuthResponse> {
        const { email, password } = data;

        const { data: authData, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        // Update last login time in database
        await prisma.user.update({
            where: { id: authData.user.id },
            data: { lastLoginAt: new Date() },
        });

        return {
            user: authData.user,
            session: authData.session,
        };
    }

    async signOut(_accessToken: string): Promise<void> {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }

    async resetPassword(email: string): Promise<void> {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${config.frontend.url}/reset-password`,
        });

        if (error) throw error;
    }

    // New method for custom token verification
    async verifyEmailToken(token: string): Promise<void> {
        const user = await prisma.user.findFirst({
            where: { verificationToken: token },
        });

        if (!user) {
            throw new Error('Invalid or expired verification token');
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
                verificationToken: null, // Clear token after use
            },
        });
    }

    // New method to resend verification email
    async resendVerificationEmail(email: string): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (user.isEmailVerified) {
             // Already verified, do nothing or throw
             return;
        }

        const verificationToken = nanoid(32);
        await prisma.user.update({
            where: { id: user.id },
            data: { verificationToken },
        });

        const frontendUrl = config.frontend.url.replace(/\/$/, '');
        const verificationLink = `${frontendUrl}/verify?token=${verificationToken}`;
        
        console.log('---------------------------------------------------');
        console.log(`[Email Service] Resending to: ${email}`);
        console.log(`[Email Service] Subject: Verify your email`);
        console.log(`[Email Service] Body: Click here to verify: ${verificationLink}`);
        console.log('---------------------------------------------------');
    }

    // Deprecated method for Supabase native verification (kept for compatibility if needed)
    async verifyEmail(token: string): Promise<void> {
        const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email',
        });

        if (error) throw error;
    }

    async signInWithOAuth(provider: 'google' | 'github'): Promise<{ url: string }> {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${config.frontend.url}/auth/callback`,
            },
        });

        if (error) throw error;

        return { url: data.url };
    }

    async handleOAuthCallback(code: string): Promise<AuthResponse> {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) throw error;

        // Create or update user profile using Prisma
        // OAuth users might not have gone through our signup flow, so we use upsert
        if (data.user) {
            await prisma.user.upsert({
                where: { id: data.user.id },
                update: {
                    lastLoginAt: new Date(),
                    avatarUrl: data.user.user_metadata.avatar_url,
                    isEmailVerified: true, // OAuth users are verified by default
                },
                create: {
                    id: data.user.id,
                    email: data.user.email!,
                    fullName: data.user.user_metadata.full_name || data.user.email!,
                    avatarUrl: data.user.user_metadata.avatar_url,
                    lastLoginAt: new Date(),
                    isEmailVerified: true, // OAuth users are verified by default
                },
            });
        }

        return {
            user: data.user,
            session: data.session,
        };
    }

    async refreshSession(refreshToken: string): Promise<AuthResponse> {
        const { data, error } = await supabase.auth.refreshSession({
            refresh_token: refreshToken,
        });

        if (error) throw error;

        return {
            user: data.user,
            session: data.session,
        };
    }

    async getSessions(_userId: string): Promise<any[]> {
        // Note: Session listing is not directly available in Supabase Auth API
        // This would require custom implementation or using Supabase Admin API
        // For now, return empty array
        return [];
    }

    async revokeSession(_sessionId: string): Promise<void> {
        // Note: Session revocation is handled through signOut
        // Individual session management requires custom implementation
        throw new Error('Session revocation not implemented');
    }

    async ensureUserExists(authUser: User): Promise<any> {
        // Upsert user in database using data from Supabase Auth
        const user = await prisma.user.upsert({
            where: { id: authUser.id },
            update: {
                lastLoginAt: new Date(),
                avatarUrl: authUser.user_metadata?.avatar_url,
            },
            create: {
                id: authUser.id,
                email: authUser.email!,
                fullName: authUser.user_metadata?.full_name || authUser.email!,
                avatarUrl: authUser.user_metadata?.avatar_url,
                lastLoginAt: new Date(),
            },
        });

        // Convert BigInt fields to strings for JSON serialization
        return serializeBigInt(user);
    }
}
