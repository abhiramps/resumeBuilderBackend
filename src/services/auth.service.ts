import { supabase } from '../utils/supabase';
import { prisma } from '../utils/prisma';
import { SignUpData, SignInData, AuthResponse } from '../types/auth.types';
import { config } from '../config';
import { AppError } from '../utils/errors';

export class AuthService {
    async signUp(data: SignUpData): Promise<AuthResponse> {
        const { email, password, fullName } = data;

        // Ensure frontend URL doesn't have trailing slash
        const frontendUrl = config.frontend.url.replace(/\/$/, '');
        const redirectUrl = `${frontendUrl}/auth/confirm`;

        // Log redirect URL for debugging (remove in production if needed)
        console.log('[AuthService] SignUp - Using redirect URL:', redirectUrl);
        console.log('[AuthService] SignUp - FRONTEND_URL env:', process.env.FRONTEND_URL);

        // Sign up with Supabase Auth
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

        // Create user profile in database using Prisma
        if (authData.user) {
            try {
                await prisma.user.create({
                    data: {
                        id: authData.user.id,
                        email: authData.user.email!,
                        fullName: fullName,
                    },
                });
            } catch (error: any) {
                // Handle unique constraint violation (P2002)
                if (error.code === 'P2002') {
                    // Check if the user already exists in Supabase but not fully synced or verified?
                    // Actually, if we are here, Supabase signup succeeded.
                    // But if prisma.user.create fails with unique constraint on email, it means
                    // the user already exists in our Postgres DB (likely from OAuth sync or previous signup).
                    
                    // However, if Supabase signup SUCCEEDED, it means Supabase explicitly created a NEW auth user
                    // (or it was a "fake" success if email confirmation is on).
                    
                    // Wait, if Supabase signup succeeds, it returns a NEW user ID. 
                    // If the email was already taken in Supabase, Supabase would have thrown an error at step 29.
                    
                    // So if we get here, Supabase thinks it's a new user (or a new identity).
                    
                    // BUT, if our local DB has that email, it means there's a disconnect.
                    // E.g. User signed up with OAuth (exists in DB), now tries password signup with same email.
                    // Supabase *should* have flagged this if it's the same email.
                    
                    // UNLESS:
                    // 1. The previous user was deleted from Supabase but not our DB.
                    // 2. We are using a different unique key? No, email is unique.
                    
                    // Let's log specifically and throw a cleaner error.
                    console.warn('[AuthService] SignUp - User already exists in DB but Supabase created a new one?', error);
                    
                    // In the reported case, the user tried "normal signup with an email that is already signup with OAUTH".
                    // If they used Google OAuth, Supabase has that user.
                    // If they try to signup with password with same email, Supabase `signUp` usually returns an error "User already registered".
                    
                    // UNLESS Supabase is configured to allow multiple providers linking?
                    // But typically `signUp` throws if email exists.
                    
                    // Wait, looking at the error log from user:
                    // "Unique constraint failed on the fields: (`email`)"
                    // This confirms our DB has the email.
                    
                    // Why did Supabase `signUp` not fail? 
                    // Maybe Supabase didn't fail because the user in Supabase is "confirmed" via OAuth, 
                    // and `signUp` might just return the existing user if email confirmation is required? 
                    // Or maybe it created a user but we are hitting a race or sync issue.
                    
                    // Regardless of WHY Supabase let it through, our DB says NO.
                    // So we must handle it.
                    
                    throw new AppError(400, 'User with this email already exists');
                }
                throw error;
            }
        }

        // Check if email verification is required
        // Session will be null if email verification is required
        const requiresEmailVerification = !authData.session && !!authData.user && !authData.user.email_confirmed_at;

        return {
            user: authData.user,
            session: authData.session,
            requiresEmailVerification,
        };
    }

    async signIn(data: SignInData): Promise<AuthResponse> {
        const { email, password } = data;

        // Check if user exists in our database first to provide specific error
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new AppError(404, 'User not found');
        }

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

    async verifyEmail(token: string): Promise<void> {
        const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email',
        });

        if (error) throw error;
    }

    async signInWithOAuth(provider: 'google' | 'github', redirectUrl?: string): Promise<{ url: string }> {
        const redirectTo = redirectUrl || `${config.frontend.url}/auth/callback`;
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo,
            },
        });
        console.log("error",error);
        console.log("data",data);

        if (error) throw error;

        return { url: data.url };
    }

    async handleOAuthCallback(code: string): Promise<AuthResponse> {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) throw error;

        if (data.user) {
            await this.syncUser(data.user);
        }

        return {
            user: data.user,
            session: data.session,
        };
    }

    async syncUser(user: any): Promise<void> {
        try {
            console.log('Backend syncUser called for:', user.id, user.email);
            const dataToSync = {
                id: user.id,
                email: user.email!,
                fullName: user.user_metadata?.full_name || user.fullName || user.email!,
                avatarUrl: user.user_metadata?.avatar_url || user.avatarUrl,
            };
            // console.log('Syncing data:', dataToSync);

            await prisma.user.upsert({
                where: { id: user.id },
                update: {
                    lastLoginAt: new Date(),
                    avatarUrl: dataToSync.avatarUrl,
                },
                create: {
                    id: dataToSync.id,
                    email: dataToSync.email,
                    fullName: dataToSync.fullName,
                    avatarUrl: dataToSync.avatarUrl,
                    lastLoginAt: new Date(),
                },
            });
            console.log('User synced successfully');
        } catch (error) {
            console.error('Failed to sync user with Prisma:', error);
            // Don't throw, just log. This prevents the session endpoint from failing completely
            // if DB is down or schema mismatch.
        }
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
}
