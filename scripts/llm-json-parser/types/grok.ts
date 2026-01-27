/**
 * Represents the author of a message in a Grok conversation.
 */
export type GrokAuthor = {
    /** The role of the author (e.g., 'user', 'assistant'). */
    role: 'user' | 'assistant' | 'system' | string;
    /** The name of the author. */
    name?: string | null;
    /** Author-specific metadata. */
    metadata?: any;
};

/**
 * Structure of the content payload for a Grok message.
 */
export type GrokMessageContent = {
    /** The content type (e.g., 'markdown'). */
    content_type?: string;
    /** Text parts found in the message. */
    parts?: string[];

    // Grok 4/Thinking specific
    /** Internal "thoughts" or reasoning steps. */
    thoughts?: {
        summary?: string;
        content?: string;
        chunks?: any[];
        finished?: boolean;
    }[];
};

/**
 * Detailed metadata associated with a Grok message.
 * @strict
 */
export type GrokMessageMetadata = {
    /** Overrides for the model configuration. */
    modelConfigOverride?: any;
    /** Details about the requested model. */
    requestModelDetails?: {
        modelId?: string;
    };
    /** The model name used. */
    model?: string;
    /** Raw request metadata. */
    requestMetadata?: any;
    /** Sender information. */
    sender?: string;
    /** Whether the response is partial. */
    partial?: boolean;

    // Assistant specific
    /** Preset used for deep searching. */
    deepsearchPreset?: string;
    /** Low-level LLM info. */
    llm_info?: any;
    /** Details of the generation request. */
    request_metadata?: {
        model?: string;
        effort?: string;
        mode?: string;
    };
    /** Trace identifier for the request. */
    request_trace_id?: string;
    /** UI layout configuration. */
    ui_layout?: any;

    // Additional fields found in samples
    reasoning_status?: string;
    reasoning_title?: string;
    classifier_response?: string;
    request_id?: string;
    message_type?: string;
    parent_id?: string;
    turn_exchange_id?: string;
    search_queries?: string[];
    search_display_string?: string;
    searched_display_string?: string;
    search_model_queries?: string[];
    search_result_groups?: any[];
    debug_sonic_thread_id?: string;
};

/**
 * Represents a single message in a Grok conversation history.
 */
export type GrokMessage = {
    /** Unique ID of the message. */
    id: string;
    /** The author of the message. */
    author: GrokAuthor;
    /** The content of the message. */
    content: GrokMessageContent;
    /** Unix timestamp (milliseconds) when created. */
    create_time?: number | null;
    /** Unix timestamp (milliseconds) when updated. */
    update_time?: number | null;
    /** The status of the message generation. */
    status?: string;
    /** Whether the message signals a turn completion. */
    end_turn?: boolean | null;
    /** Importance weight of the message. */
    weight?: number;
    /** Metadata provided in the dump. */
    metadata?: GrokMessageMetadata;
    /** The recipient of the message. */
    recipient?: string;
    /** Channel identifier. */
    channel?: any;
};

/**
 * A node in the Grok conversation mapping tree.
 */
export type GrokMappingNode = {
    /** Unique ID of the node. */
    id: string;
    /** The message data at this node. */
    message?: GrokMessage | null;
    /** The ID of the parent node. */
    parent?: string | null;
    /** List of child IDs. */
    children: string[];
};

/**
 * Structure of a full Grok conversation export.
 * @strict
 */
export type GrokMappingDump = {
    /** The conversation title. */
    title?: string;
    /** Creation timestamp. */
    create_time?: number;
    /** Last update timestamp. */
    update_time?: number;
    /** Unique conversation identifier. */
    conversation_id?: string;
    /** Default model used for the conversation. */
    default_model_slug?: string;
    /** Tree mapping of messages. */
    mapping: Record<string, GrokMappingNode>;
    /** The most recent node ID. */
    current_node?: string;
};
