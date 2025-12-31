import { LLMProviderInterface, LLMProvider } from './types';
import { OpenAIProvider } from './openai.provider';
import { ClaudeProvider } from './claude.provider';
import { OllamaProvider } from './ollama.provider';
import { GeminiProvider } from './gemini.provider';
import { logger } from '../../utils/logger';

/**
 * LLM Factory
 * Creates and manages LLM provider instances based on configuration
 */
export class LLMFactory {
    private static instance: LLMFactory;
    private providers: Map<LLMProvider, LLMProviderInterface>;
    private currentProvider: LLMProvider;

    private constructor() {
        this.providers = new Map();
        this.currentProvider = this.getDefaultProvider();
        logger.info('LLM Factory initialized', { defaultProvider: this.currentProvider });
    }

    /**
     * Get singleton instance
     */
    static getInstance(): LLMFactory {
        if (!LLMFactory.instance) {
            LLMFactory.instance = new LLMFactory();
        }
        return LLMFactory.instance;
    }

    /**
     * Get default provider from environment
     */
    private getDefaultProvider(): LLMProvider {
        const provider = (process.env.LLM_PROVIDER || 'openai').toLowerCase();

        const validProviders: LLMProvider[] = ['openai', 'claude', 'ollama', 'gemini'];
        if (!validProviders.includes(provider as LLMProvider)) {
            logger.warn('Invalid LLM_PROVIDER, defaulting to openai', { provider });
            return 'openai';
        }

        return provider as LLMProvider;
    }

    /**
     * Get or create provider instance
     */
    private getProviderInstance(provider: LLMProvider): LLMProviderInterface {
        // Return cached instance if exists
        if (this.providers.has(provider)) {
            return this.providers.get(provider)!;
        }

        // Create new instance
        let instance: LLMProviderInterface;

        try {
            switch (provider) {
                case 'openai':
                    instance = new OpenAIProvider();
                    break;
                case 'claude':
                    instance = new ClaudeProvider();
                    break;
                case 'ollama':
                    instance = new OllamaProvider();
                    break;
                case 'gemini':
                    instance = new GeminiProvider();
                    break;
                default:
                    throw new Error(`Unsupported provider: ${provider}`);
            }

            // Cache the instance
            this.providers.set(provider, instance);
            logger.info('Provider instance created', { provider });

            return instance;
        } catch (error) {
            logger.error('Failed to create provider instance', {
                provider,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }

    /**
     * Get current provider instance
     */
    getProvider(provider?: LLMProvider): LLMProviderInterface {
        const targetProvider = provider || this.currentProvider;
        return this.getProviderInstance(targetProvider);
    }

    /**
     * Set current provider
     */
    setProvider(provider: LLMProvider): void {
        this.currentProvider = provider;
        logger.info('Provider switched', { provider });
    }

    /**
     * Get current provider name
     */
    getCurrentProvider(): LLMProvider {
        return this.currentProvider;
    }

    /**
     * Check if provider is available
     */
    async isProviderAvailable(provider: LLMProvider): Promise<boolean> {
        try {
            const instance = this.getProviderInstance(provider);
            return await instance.healthCheck();
        } catch (error) {
            logger.error('Provider availability check failed', {
                provider,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }

    /**
     * Get all available providers
     */
    async getAvailableProviders(): Promise<LLMProvider[]> {
        const providers: LLMProvider[] = ['openai', 'claude', 'ollama', 'gemini'];
        const available: LLMProvider[] = [];

        for (const provider of providers) {
            try {
                if (await this.isProviderAvailable(provider)) {
                    available.push(provider);
                }
            } catch (error) {
                // Skip providers that fail to initialize
                logger.debug('Provider not available', { provider });
            }
        }

        return available;
    }

    /**
     * Auto-select best available provider
     * Tries providers in order of preference
     */
    async autoSelectProvider(): Promise<LLMProvider> {
        const preferenceOrder: LLMProvider[] = [
            this.currentProvider, // Try current first
            'openai',
            'claude',
            'gemini',
            'ollama',
        ];

        for (const provider of preferenceOrder) {
            try {
                if (await this.isProviderAvailable(provider)) {
                    this.setProvider(provider);
                    logger.info('Auto-selected provider', { provider });
                    return provider;
                }
            } catch (error) {
                logger.debug('Provider not available during auto-select', { provider });
            }
        }

        throw new Error('No LLM providers available');
    }

    /**
     * Clear provider cache (useful for testing)
     */
    clearCache(): void {
        this.providers.clear();
        logger.info('Provider cache cleared');
    }
}

/**
 * Convenience function to get LLM provider
 */
export function getLLMProvider(provider?: LLMProvider): LLMProviderInterface {
    return LLMFactory.getInstance().getProvider(provider);
}

/**
 * Convenience function to get current provider name
 */
export function getCurrentProvider(): LLMProvider {
    return LLMFactory.getInstance().getCurrentProvider();
}
