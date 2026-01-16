/**
 * Shared model configuration for all agents
 *
 * Supports multiple LLM providers:
 * - Gemini (default): Uses Google's Gemini 3 Flash
 * - Nova: Uses Amazon Nova 2 Pro via nova.amazon.com API (OpenAI-compatible)
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import type { ModelConfig, ModelProvider } from './types.js';

export type { ModelConfig, ModelProvider };

/**
 * Default model configuration (Gemini 3 Flash)
 */
export const DEFAULT_MODEL: ModelConfig = {
    model: 'gemini-3-flash-preview',
    provider: 'gemini',
    temperature: 0.1,
};

/**
 * Amazon Nova model configuration (Nova 2 Pro via nova.amazon.com API)
 */
export const NOVA_MODEL: ModelConfig = {
    model: 'nova-2-pro',
    provider: 'nova',
    temperature: 0.1,
};

/**
 * Get model configuration from environment variables
 *
 * Uses LLM_PROVIDER env var to determine which model to use.
 * Defaults to Gemini if not set or invalid.
 */
export function getModelFromEnv(): ModelConfig {
    const provider = process.env.LLM_PROVIDER;
    if (provider === 'nova') {
        return NOVA_MODEL;
    }
    return DEFAULT_MODEL;
}

/**
 * Create a chat model instance from configuration
 *
 * For Nova, uses LangChain's OpenAI integration with custom base URL
 * since Amazon Nova API is OpenAI-compatible.
 */
export function createChatModel(config: ModelConfig) {
    if (config.provider === 'nova') {
        return new ChatOpenAI({
            configuration: {
                baseURL: 'https://api.nova.amazon.com/v1',
            },
            model: config.model,
            openAIApiKey: process.env.NOVA_API_KEY,
            temperature: config.temperature ?? 0.1,
        });
    }
    return new ChatGoogleGenerativeAI({
        model: config.model,
        temperature: config.temperature ?? 0.1,
    });
}

/**
 * Get a chat model instance based on environment configuration
 */
export function getModel() {
    const config = getModelFromEnv();
    return createChatModel(config);
}

/**
 * Format model info for metadata
 */
export function getModelInfo(config: ModelConfig): string {
    return `${config.provider}/${config.model}`;
}
