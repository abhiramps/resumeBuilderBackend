export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    is_active: boolean;
    last_login_at?: string;
    deleted_at?: string;
    preferences?: any;
    created_at: string;
    updated_at: string;
}

export interface UpdateUserData {
    full_name?: string;
    avatar_url?: string;
    preferences?: any;
}
