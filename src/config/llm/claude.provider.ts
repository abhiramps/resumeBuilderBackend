import Anthropic from '@anthropic-ai/sdk';
import { LLMProviderInterface, LLMMessage, LLMResponse, LLMProvider } from './types';
import { logger } from '../../utils/logger';

export class ClaudeProvider implements LLMProviderInterface {
    private client: Anthropic;
    private model: string;
    private defaultTimeout: number;

    constructor() {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY environment variable is not set');
        }

        this.model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
        this.defaultTimeout = parseInt(process.env.AI_TIMEOUT || '30000', 10);

        this.client = new Anthropic({
            apiKey,
            timeout: this.defaultTimeout,
        });

        logger.info('Claude provider initialized', { model: this.model });
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

            // Claude requires system message to be separate
            const systemMessage = messages.find(m => m.role === 'system');
            const conversationMessages = messages.filter(m => m.role !== 'system');

            logger.debug('Claude completion request', {
                model: this.model,
                messageCount: conversationMessages.length,
                hasSystemMessage: !!systemMessage,
                temperature,
                maxTokens,
            });

            const completion = await this.client.messages.create({
                model: this.model,
                max_tokens: maxTokens,
                temperature,
                system: systemMessage?.content,
                messages: conversationMessages.map(msg => ({
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content,
                })),
            });

            const content = completion.content[0];
            if (!content || content.type !== 'text') {
                throw new Error('Claude returned empty or invalid response');
            }

            logger.debug('Claude completion successful', {
                usage: completion.usage,
            });

            return {
                success: true,
                content: content.text,
                usage: {
                    promptTokens: completion.usage.input_tokens,
                    completionTokens: completion.usage.output_tokens,
                    totalTokens: completion.usage.input_tokens + completion.usage.output_tokens,
                },
                provider: 'claude',
            };
        } catch (error) {
            logger.error('Claude completion failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Claude completion failed',
                provider: 'claude',
            };
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 1,
                messages: [{ role: 'user', content: 'test' }],
            });

            return !!response.content[0];
        } catch (error) {
            logger.error('Claude health check failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }

    getProviderName(): LLMProvider {
        return 'claude';
    }
}
