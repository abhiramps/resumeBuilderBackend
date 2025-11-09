import { prisma } from './prisma';

const SUBSCRIPTION_LIMITS = {
    free: {
        max_resumes: 3,
        max_templates: 5,
        ai_generations_per_month: 10,
    },
    pro: {
        max_resumes: 20,
        max_templates: 50,
        ai_generations_per_month: 100,
    },
    enterprise: {
        max_resumes: -1, // unlimited
        max_templates: -1, // unlimited
        ai_generations_per_month: -1, // unlimited
    },
};

export const checkSubscriptionLimits = async (
    userId: string,
    limitType: keyof typeof SUBSCRIPTION_LIMITS.free
): Promise<boolean> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            subscriptionTier: true,
            resumeCount: true,
        },
    });

    if (!user) {
        throw new Error('User not found');
    }

    const tier = user.subscriptionTier || 'free';
    const limits = SUBSCRIPTION_LIMITS[tier as keyof typeof SUBSCRIPTION_LIMITS];

    if (!limits) {
        return false;
    }

    const limit = limits[limitType];

    // -1 means unlimited
    if (limit === -1) {
        return true;
    }

    // Check current usage based on limit type
    if (limitType === 'max_resumes') {
        return (user.resumeCount || 0) < limit;
    }

    // Add other limit checks as needed
    return true;
};
