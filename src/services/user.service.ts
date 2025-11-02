import { supabase } from '../utils/supabase';
import { UpdateUserData, UserProfile } from '../types/user.types';

export class UserService {
    async getProfile(userId: string): Promise<UserProfile> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    }

    async updateProfile(userId: string, updates: UpdateUserData): Promise<UserProfile> {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteAccount(userId: string): Promise<void> {
        // Soft delete - mark as inactive
        const { error } = await supabase
            .from('users')
            .update({ is_active: false, deleted_at: new Date().toISOString() })
            .eq('id', userId);

        if (error) throw error;
    }

    async updatePreferences(userId: string, preferences: any): Promise<void> {
        const { error } = await supabase
            .from('users')
            .update({ preferences })
            .eq('id', userId);

        if (error) throw error;
    }
}
