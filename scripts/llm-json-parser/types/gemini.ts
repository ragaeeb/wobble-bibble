/**
 * Represents the reasoning or "thought" process extracted from a Gemini message.
 */
export type GeminiThought = {
    /** Brief summary of the thought process. */
    summary?: string;
    /** The actual content of the thought. */
    content?: string;
    /** Raw chunks of the thought process. */
    chunks?: any[];
    /** Whether the reasoning process has finished. */
    finished?: boolean;
};

/**
 * Structure of the content within a Gemini message.
 */
export type GeminiMessageContent = {
    /** The type of content (e.g., 'text'). */
    content_type?: string;
    /** The text parts of the message. */
    parts?: string[];
    /** Internal reasoning steps if available. */
    thoughts?: GeminiThought[];
};

/**
 * Represents a single message in a Gemini conversation.
 */
export type GeminiMessage = {
    /** Unique identifier for the message. */
    id: string;
    /** The author of the message. */
    author: {
        /** The role of the author (e.g., 'user', 'assistant'). */
        role: string;
        /** The name of the author. */
        name?: string | null;
        /** Metadata about the author. */
        metadata?: any;
    };
    /** The content payload of the message. */
    content: GeminiMessageContent;
    /** Unix timestamp when the message was created. */
    create_time?: number | null;
    /** Unix timestamp when the message was last updated. */
    update_time?: number | null;
    /** The current status of the message generation. */
    status?: 'finished_successfully' | 'in_progress' | 'finished_partial' | 'error' | string;
    /** Whether this message ends the turn. */
    end_turn?: boolean | null;
    /** Priority/weight of the node. */
    weight?: number;
    /** Message-specific metadata. */
    metadata?: any;
    /** The intended recipient. */
    recipient?: string;
    /** The communication channel. */
    channel?: string | null;
};

/**
 * A node in the Gemini conversation mapping tree.
 */
export type GeminiMappingNode = {
    /** Unique ID of the node. */
    id: string;
    /** The message data at this node. */
    message?: GeminiMessage | null;
    /** The ID of the parent node. */
    parent?: string | null;
    /** List of child IDs. */
    children: string[];
};

/**
 * Structure of a complex Gemini conversation dump using mapping.
 * @strict
 */
export type GeminiMappingDump = {
    /** The conversation title. */
    title?: string;
    /** Creation timestamp. */
    create_time?: number;
    /** Last update timestamp. */
    update_time?: number;
    /** Unique ID of the conversation. */
    conversation_id?: string;
    /** Map of all message nodes. */
    mapping: Record<string, GeminiMappingNode>;
    /** The ID of the leaf message being viewed. */
    current_node?: string | null;

    // Additional fields found in audit
    /** Whether the conversation is archived. */
    is_archived?: boolean;
    /** List of safe URLs. */
    safe_urls?: string[];
    /** List of blocked URLs. */
    blocked_urls?: string[];
    /** Safety/moderation results. */
    moderation_results?: any[];
    /** Active plugin IDs. */
    plugin_ids?: string[] | null;
    /** ID of the custom GPT/Gizmo. */
    gizmo_id?: string | null;
    /** Type of custom GPT. */
    gizmo_type?: string | null;
    /** Default model used for the conversation. */
    default_model_slug?: string;

    // UI/State fields
    async_status?: string | null;
    context_scopes?: string[] | null;
    conversation_origin?: string | null;
    conversation_template_id?: string | null;
    disabled_tool_ids?: any[];
    is_do_not_remember?: boolean;
    is_read_only?: boolean | null;
    is_starred?: boolean | null;
    is_study_mode?: boolean;
    memory_scope?: string;
    owner?: any | null;
    pinned_time?: number | null;
    sugar_item_id?: string | null;
    sugar_item_visible?: boolean;
    voice?: string | null;
};

/**
 * A simple, flattened structure for Gemini responses, often found in simpler exports.
 * @strict
 */
export type GeminiFlatDump = {
    /** The assistant's response text. */
    response?: string;
    /** The user's input prompt. */
    prompt?: string;
    /** Internal reasoning. */
    reasoning?: string;
    /** Model version name. */
    model?: string;
    /** Error messages. */
    errors?: string;
    /** User notes. */
    notes?: string;
    /** Conversation title. */
    title?: string;
    /** Unique ID. */
    id?: string;
    /** ISO timestamp string. */
    timestamp?: string;
};
