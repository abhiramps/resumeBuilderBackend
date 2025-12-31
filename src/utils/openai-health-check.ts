import OpenAI from 'openai';
import { logger } from './logger';

/**
 * Health check for OpenAI API
 * Validates API key and checks quota on startup
 */
export async function checkOpenAIHealth(): Promise<{
    isHealthy: boolean;
    message: string;
    details?: any;
}> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return {
            isHealthy: false,
            message: 'OPENAI_API_KEY environment variable is not set',
        };
    }

    if (!apiKey.startsWith('sk-')) {
        return {
            isHealthy: false,
            message: 'OPENAI_API_KEY appears to be invalid (should start with "sk-")',
        };
    }

    try {
        const client = new OpenAI({
            apiKey,
            timeout: 5000, // 5 second timeout for health check
        });

        // Make a minimal API call to verify key and quota
        const response = await client.chat.completions.create({
            model: process.env.AI_MODEL || 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1,
        });

        logger.info('OpenAI API health check passed', {
            model: process.env.AI_MODEL || 'gpt-4o-mini',
            responseId: response.id,
        });

        return {
            isHealthy: true,
            message: 'OpenAI API is healthy and ready',
            details: {
                model: process.env.AI_MODEL || 'gpt-4o-mini',
            },
        };
    } catch (error) {
        if (error instanceof Error) {
            const message = error.message.toLowerCase();

            if (message.includes('insufficient_quota') || message.includes('quota')) {
                logger.error('OpenAI API health check failed: Insufficient quota', {
                    error: error.message,
                });
                return {
                    isHealthy: false,
                    message: 'OpenAI API key has insufficient quota. Please add credits at https://platform.openai.com/settings/organization/billing',
                    details: {
                        error: error.message,
                        billingUrl: 'https://platform.openai.com/settings/organization/billing',
                    },
                };
            }

            if (message.includes('invalid') || message.includes('authentication') || message.includes('401')) {
                logger.error('OpenAI API health check failed: Invalid API key', {
                    error: error.message,
                });
                return {
                    isHealthy: false,
                    message: 'OpenAI API key is invalid. Please check your OPENAI_API_KEY environment variable',
                    details: {
                        error: error.message,
                    },
                };
            }

            if (message.includes('rate_limit') || message.includes('429')) {
                logger.warn('OpenAI API health check: Rate limit hit', {
                    error: error.message,
                });
                return {
                    isHealthy: true, // Still healthy, just rate limited temporarily
                    message: 'OpenAI API is rate limited but will recover',
                    details: {
                        error: error.message,
                    },
                };
            }

            logger.error('OpenAI API health check failed', {
                error: error.message,
            });
            return {
                isHealthy: false,
                message: `OpenAI API health check failed: ${error.message}`,
                details: {
                    error: error.message,
                },
            };
        }

        return {
            isHealthy: false,
            message: 'OpenAI API health check failed with unknown error',
        };
    }
}

/**
 * Run health check on startup (optional)
 * Set SKIP_OPENAI_HEALTH_CHECK=true to skip
 */
export async function runStartupHealthCheck(): Promise<void> {
    if (process.env.SKIP_OPENAI_HEALTH_CHECK === 'true') {
        logger.info('OpenAI health check skipped (SKIP_OPENAI_HEALTH_CHECK=true)');
        return;
    }

    logger.info('Running OpenAI API health check...');
    const result = await checkOpenAIHealth();

    if (!result.isHealthy) {
        logger.error('⚠️  OpenAI API Health Check Failed', {
            message: result.message,
            details: result.details,
        });
        logger.error('Resume import feature will not work until this is resolved!');
        logger.error('See OPENAI_QUOTA_FIX.md for troubleshooting steps');
    } else {
        logger.info('✅ OpenAI API Health Check Passed', {
            message: result.message,
        });
    }
}
