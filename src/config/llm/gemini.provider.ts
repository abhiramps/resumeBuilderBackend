import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProviderInterface, LLMMessage, LLMResponse, LLMProvider } from './types';
import { logger } from '../../utils/logger';

export class GeminiProvider implements LLMProviderInterface {
    private client: GoogleGenerativeAI;
    private model: string;

    constructor() {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new Error('GOOGLE_API_KEY environment variable is not set');
        }

        this.model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
        this.client = new GoogleGenerativeAI(apiKey);

        logger.info('Gemini provider initialized', { model: this.model });
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

            logger.debug('Gemini completion request', {
                model: this.model,
                messageCount: messages.length,
                temperature,
                maxTokens,
                responseFormat,
            });

            const model = this.client.getGenerativeModel({
                model: this.model,
                generationConfig: {
                    temperature,
                    maxOutputTokens: maxTokens,
                    ...(responseFormat === 'json' && { responseMimeType: 'application/json' }),
                },
            });

            // Convert messages to Gemini format
            const systemMessage = messages.find(m => m.role === 'system');
            const conversationMessages = messages.filter(m => m.role !== 'system');

            // Build chat history (all messages except the last user message)
            const history = conversationMessages.slice(0, -1).map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }],
            }));

            // Last message is the current prompt
            const currentMessage = conversationMessages[conversationMessages.length - 1]?.content || '';

            // Prepend system message to the first user message if exists
            const prompt = systemMessage
                ? `${systemMessage.content}\n\n${currentMessage}`
                : currentMessage;

            const chat = model.startChat({ history });
            const result = await chat.sendMessage(prompt);
            const response = result.response;
            const content = response.text();

            if (!content) {
                throw new Error('Gemini returned empty response');
            }

            logger.debug('Gemini completion successful', {
                candidatesCount: response.candidates?.length,
            });

            // Gemini doesn't provide token counts in the same way
            // Estimate based on text length (rough approximation)
            const estimatedPromptTokens = Math.ceil(prompt.length / 4);
            const estimatedCompletionTokens = Math.ceil(content.length / 4);

            return {
                success: true,
                content,
                usage: {
                    promptTokens: estimatedPromptTokens,
                    completionTokens: estimatedCompletionTokens,
                    totalTokens: estimatedPromptTokens + estimatedCompletionTokens,
                },
                provider: 'gemini',
            };
        } catch (error) {
            logger.error('Gemini completion failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Gemini completion failed',
                provider: 'gemini',
            };
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            const model = this.client.getGenerativeModel({ model: this.model });
            const result = await model.generateContent('test');
            return !!result.response.text();
        } catch (error) {
            logger.error('Gemini health check failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }

    getProviderName(): LLMProvider {
        return 'gemini';
    }
}
