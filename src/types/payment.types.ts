export enum PaymentStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED',
}

export interface PaymentData {
    id?: string;
    user_id: string;
    subscription_id?: string;
    stripe_payment_id: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    created_at?: string;
}

export interface CreatePaymentIntentData {
    amount: number;
    currency: string;
    subscriptionTier: string;
}

export interface PaymentIntentResponse {
    clientSecret: string;
    paymentIntentId: string;
}
