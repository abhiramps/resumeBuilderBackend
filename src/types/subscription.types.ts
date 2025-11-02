export enum SubscriptionTier {
    FREE = 'FREE',
    PREMIUM = 'PREMIUM',
    ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
    ACTIVE = 'ACTIVE',
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED',
    TRIAL = 'TRIAL',
}

export interface SubscriptionData {
    id?: string;
    user_id: string;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    stripe_subscription_id?: string;
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface SubscriptionFeatures {
    maxResumes: number;
    maxTemplates: number;
    aiAssistance: boolean;
    customBranding: boolean;
    prioritySupport: boolean;
    exportFormats: string[];
}
