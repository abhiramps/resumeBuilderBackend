import { User, Session } from '@supabase/supabase-js';

export interface SignUpData {
    email: string;
    password: string;
    fullName: string;
}

export interface SignInData {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: User | null;
    session: Session | null;
}

export interface TokenPayload {
    userId: string;
    email: string;
    role?: string;
}
