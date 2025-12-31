/**
 * LLM Provider Types
 * Defines interfaces for multi-provider LLM support
 */

export type LLMProvider = 'openai' | 'claude' | 'ollama' | 'gemini';

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMResponse {
    success: boolean;
    content?: string;
    error?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    provider?: LLMProvider;
}

export interface LLMConfig {
    provider: LLMProvider;
    model: string;
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
}

export interface LLMProviderInterface {
    /**
     * Generate completion from messages
     */
    generateCompletion(
        messages: LLMMessage[],
        options?: {
            temperature?: number;
            maxTokens?: number;
            responseFormat?: 'json' | 'text';
        }
    ): Promise<LLMResponse>;

    /**
     * Check if provider is available/healthy
     */
    healthCheck(): Promise<boolean>;

    /**
     * Get provider name
     */
    getProviderName(): LLMProvider;
}
