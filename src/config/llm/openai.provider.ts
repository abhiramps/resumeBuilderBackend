import OpenAI from 'openai';
import { LLMProviderInterface, LLMMessage, LLMResponse, LLMProvider } from './types';
import { logger } from '../../utils/logger';

export class OpenAIProvider implements LLMProviderInterface {
    private client: OpenAI;
    private model: string;
    private defaultTimeout: number;

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is not set');
        }

        this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
        this.defaultTimeout = parseInt(process.env.AI_TIMEOUT || '30000', 10);

        this.client = new OpenAI({
            apiKey,
            timeout: this.defaultTimeout,
        });

        logger.info('OpenAI provider initialized', { model: this.model });
    }

    async generateCompletion(
        messages: LLMMessage[],
        options?: {
            temperature?: number;
            maxTokens?: number;
            responseFormat?: 'json' | 'text';
        }
    ): Promise<LLMResponse> {
        try {
            const temperature = options?.temperature ?? 0.1;
            const maxTokens = options?.maxTokens ?? 4000;
            const responseFormat = options?.responseFormat || 'text';

            logger.debug('OpenAI completion request', {
                model: this.model,
                messageCount: messages.length,
                temperature,
                maxTokens,
                responseFormat,
            });

            const completion = await this.client.chat.completions.create({
                model: this.model,
                messages: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                })),
                temperature,
                max_tokens: maxTokens,
                ...(responseFormat === 'json' && {
                    response_format: { type: 'json_object' },
                }),
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) {
                throw new Error('OpenAI returned empty response');
            }

            logger.debug('OpenAI completion successful', {
                usage: completion.usage,
            });

            return {
                success: true,
                content,
                usage: {
                    promptTokens: completion.usage?.prompt_tokens || 0,
                    completionTokens: completion.usage?.completion_tokens || 0,
                    totalTokens: completion.usage?.total_tokens || 0,
                },
                provider: 'openai',
            };
        } catch (error) {
            logger.error('OpenAI completion failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : 'OpenAI completion failed',
                provider: 'openai',
            };
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 1,
            });

            return !!response.choices[0];
        } catch (error) {
            logger.error('OpenAI health check failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }

    getProviderName(): LLMProvider {
        return 'openai';
    }
}
