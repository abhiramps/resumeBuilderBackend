import { LLMProviderInterface, LLMMessage, LLMResponse, LLMProvider } from './types';
import { logger } from '../../utils/logger';

interface OllamaResponse {
    model: string;
    created_at: string;
    message: {
        role: string;
        content: string;
    };
    done: boolean;
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}

export class OllamaProvider implements LLMProviderInterface {
    private endpoint: string;
    private model: string;
    private defaultTimeout: number;

    constructor() {
        this.endpoint = process.env.OLLAMA_API_URL || 'http://localhost:11434/api/chat';
        this.model = process.env.OLLAMA_MODEL || 'llama3.2';
        this.defaultTimeout = parseInt(process.env.AI_TIMEOUT || '120000', 10); // 2 minutes for local models

        logger.info('Ollama provider initialized', {
            endpoint: this.endpoint,
            model: this.model,
            timeout: this.defaultTimeout,
        });
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

            // Extract system message
            const systemMessage = messages.find(m => m.role === 'system');
            const conversationMessages = messages.filter(m => m.role !== 'system');

            logger.debug('Ollama completion request', {
                endpoint: this.endpoint,
                model: this.model,
                messageCount: conversationMessages.length,
                hasSystemMessage: !!systemMessage,
                temperature,
                maxTokens,
                responseFormat,
            });

            const requestBody = {
                model: this.model,
                messages: conversationMessages.map(msg => ({
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content,
                })),
                stream: false,
                options: {
                    temperature,
                    num_predict: maxTokens,
                    ...(systemMessage && { system: systemMessage.content }),
                },
                ...(responseFormat === 'json' && { format: 'json' }),
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);

            try {
                const response = await fetch(this.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`Ollama API error (${response.status}): ${errorBody}`);
                }

                const data = (await response.json()) as OllamaResponse;

                logger.debug('Ollama completion successful', {
                    duration: data.total_duration,
                    evalCount: data.eval_count,
                });

                // Estimate token usage (Ollama doesn't provide exact counts)
                const estimatedPromptTokens = data.prompt_eval_count || 0;
                const estimatedCompletionTokens = data.eval_count || 0;

                return {
                    success: true,
                    content: data.message?.content || '',
                    usage: {
                        promptTokens: estimatedPromptTokens,
                        completionTokens: estimatedCompletionTokens,
                        totalTokens: estimatedPromptTokens + estimatedCompletionTokens,
                    },
                    provider: 'ollama',
                };
            } catch (fetchError: any) {
                clearTimeout(timeoutId);

                if (fetchError.name === 'AbortError') {
                    throw new Error(`Ollama request timed out after ${this.defaultTimeout}ms`);
                }

                if (fetchError.cause?.code === 'ECONNREFUSED') {
                    throw new Error(
                        `Cannot connect to Ollama at ${this.endpoint}. Ensure Ollama is running and accessible.`
                    );
                }

                throw fetchError;
            }
        } catch (error) {
            logger.error('Ollama completion failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                endpoint: this.endpoint,
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Ollama completion failed',
                provider: 'ollama',
            };
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(this.endpoint.replace('/api/chat', '/api/tags'), {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            });

            if (!response.ok) {
                return false;
            }

            const data = await response.json();
            const hasModel = (data as any).models?.some((m: any) => m.name.includes(this.model));

            if (!hasModel) {
                logger.warn('Ollama health check: model not found', {
                    requestedModel: this.model,
                    availableModels: (data as any).models?.map((m: any) => m.name),
                });
            }

            return true;
        } catch (error) {
            logger.error('Ollama health check failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                endpoint: this.endpoint,
            });
            return false;
        }
    }

    getProviderName(): LLMProvider {
        return 'ollama';
    }
}
