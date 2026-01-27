/**
 * Common interfaces for extracted LLM data.
 */

import type { ChatGPTMappingDump } from './chatgpt';
import type { GeminiFlatDump, GeminiMappingDump } from './gemini';
import type { GrokMappingDump } from './grok';

/**
 * Represents the normalized data extracted from various LLM JSON formats.
 */
export type ExtractedLLMData = {
    /** The main response text from the assistant. */
    response: string;
    /** The user's input prompt that triggered the response. */
    prompt?: string;
    /** Any internal "thought" or reasoning process provided by the model. */
    thoughts?: string;
    /** The specific model name or version used. */
    model?: string;
};

/**
 * Union type representing all supported LLM mapping dump formats (ChatGPT, Gemini Nested, or Grok).
 */
export type LLMMappingDump = ChatGPTMappingDump | GeminiMappingDump | GrokMappingDump;

/**
 * Union type representing any supported LLM JSON dump, including mapping dumps and flattened bug reports.
 */
export type LLMJsonDump = LLMMappingDump | GeminiFlatDump;

/**
 * Author information for a message in a ChatGPT conversation
 */
export type Author = {
    role: 'system' | 'user' | 'assistant' | 'tool';
    name: string | null;
    metadata: Record<string, unknown>;
};

/**
 * Content of a message - can be text, thoughts, or other content types
 */
export type MessageContent = {
    content_type: 'text' | 'thoughts' | 'reasoning_recap' | 'code' | 'execution_output';
    parts?: string[];
    thoughts?: Array<{
        summary: string;
        content: string;
        chunks: string[];
        finished: boolean;
    }>;
    content?: string;
};

/**
 * A single message in a conversation
 */
export type Message = {
    id: string;
    author: Author;
    create_time: number | null;
    update_time: number | null;
    content: MessageContent;
    status: 'finished_successfully' | 'in_progress' | 'error';
    end_turn: boolean | null;
    weight: number;
    metadata: Record<string, unknown>;
    recipient: string;
    channel: string | null;
};

/**
 * A node in the conversation message tree
 */
export type MessageNode = {
    id: string;
    message: Message | null;
    parent: string | null;
    children: string[];
};

/**
 * Full conversation data structure from ChatGPT API
 */
export type ConversationData = {
    title: string;
    create_time: number;
    update_time: number;
    mapping: Record<string, MessageNode>;
    conversation_id: string;
    current_node: string;
    moderation_results: unknown[];
    plugin_ids: string[] | null;
    gizmo_id: string | null;
    gizmo_type: string | null;
    is_archived: boolean;
    default_model_slug: string;
    safe_urls: string[];
    blocked_urls: string[];
};
