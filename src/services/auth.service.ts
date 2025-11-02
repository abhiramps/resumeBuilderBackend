import { supabase } from '../utils/supabase';
import { prisma } from '../utils/prisma';
import { SignUpData, SignInData, AuthResponse } from '../types/auth.types';

export class AuthService {
    async signUp(data: SignUpData): Promise<AuthResponse> {
        const { email, password, fullName } = data;

        // Sign up with Supabase Auth
        const { data: authData, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        if (error) throw error;

        // Create user profile in database using Prisma
        if (authData.user) {
            await prisma.user.create({
                data: {
                    id: authData.user.id,
                    email: authData.user.email!,
                    fullName: fullName,
                },
            });
        }

        return {
            user: authData.user,
            session: authData.session,
        };
    }

    async signIn(data: SignInData): Promise<AuthResponse> {
        const { email, password } = data;

        const { data: authData, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        // Update last login using Prisma
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
            redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
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

    async signInWithOAuth(provider: 'google' | 'github'): Promise<{ url: string }> {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${process.env.FRONTEND_URL}/auth/callback`,
            },
        });

        if (error) throw error;

        return { url: data.url };
    }

    async handleOAuthCallback(code: string): Promise<AuthResponse> {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) throw error;

        // Create or update user profile using Prisma
        if (data.user) {
            await prisma.user.upsert({
                where: { id: data.user.id },
                update: {
                    lastLoginAt: new Date(),
                    avatarUrl: data.user.user_metadata.avatar_url,
                },
                create: {
                    id: data.user.id,
                    email: data.user.email!,
                    fullName: data.user.user_metadata.full_name || data.user.email!,
                    avatarUrl: data.user.user_metadata.avatar_url,
                    lastLoginAt: new Date(),
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
}
