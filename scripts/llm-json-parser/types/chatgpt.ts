/**
 * Represents the author of a message in a ChatGPT conversation.
 */
export type ChatGPTAuthor = {
    /** The role of the author (e.g., 'user', 'assistant', 'system'). */
    role: 'user' | 'assistant' | 'system' | 'tool' | string;
    /** The display name of the author, if available. */
    name?: string | null;
    /** Additional metadata about the author. */
    metadata?: any;
};

/**
 * Represents the content of a ChatGPT message, supporting various media types.
 */
export type ChatGPTContent = {
    /** The type of content (e.g., 'text', 'multimodal_text', 'code'). */
    content_type:
        | 'text'
        | 'multimodal_text'
        | 'code'
        | 'execution_output'
        | 'tether_browsing_display'
        | 'tether_quote'
        | 'system_error'
        | 'thoughts'
        | 'reasoning_recap'
        | string;
    /** The text parts of the message. */
    parts?: string[];
    /** The full text content (alternative to parts). */
    text?: string;
    /** The programming language if content_type is 'code'. */
    language?: string;
    /** The content string, used in some content types like 'reasoning_recap'. */
    content?: string;
    /** Internal "thoughts" or reasoning steps. */
    thoughts?: {
        summary?: string;
        content?: string;
        chunks?: any[];
        finished?: boolean;
    }[];
};

/**
 * Detailed metadata associated with a ChatGPT message.
 * @strict
 */
export type ChatGPTMessageMetadata = {
    /** Whether the message is hidden from the UI. */
    is_visually_hidden_from_conversation?: boolean;
    /** Developer-specific rebase flag. */
    rebase_developer_message?: boolean;
    /** Selected GitHub repositories for context. */
    selected_github_repos?: any[];
    /** System-provided hints. */
    system_hints?: string[];
    /** Serialization offsets. */
    serialization_metadata?: {
        custom_symbol_offsets?: any[];
    };
    /** Unique request identifier. */
    request_id?: string;
    /** Source of the message. */
    message_source?: string | null;
    /** Unique ID for the turn exchange. */
    turn_exchange_id?: string;
    /** Current status of reasoning process. */
    reasoning_status?: string;
    /** Citations retrieved from external sources. */
    citations?: any[];
    /** References to other content items. */
    content_references?: any[];
    /** Response from an internal classifier. */
    classifier_response?: string;
    /** Title for skipped reasoning sections. */
    skip_reasoning_title?: string;
    /** Internal message type. */
    message_type?: string;
    /** The model slug used for this message. */
    model_slug?: string;
    /** The default model slug for the conversation. */
    default_model_slug?: string;
    /** Parent message ID. */
    parent_id?: string;
    /** Models that were denied by the switcher. */
    model_switcher_deny?: any[];
    /** Details about why the generation finished. */
    finish_details?: {
        type?: string;
        stop_tokens?: number[];
    };
    /** Whether the response is complete. */
    is_complete?: boolean;
    /** Duration of the generation in seconds. */
    finished_duration_sec?: number;

    // Search/Thinking fields
    search_queries?: any[];
    search_display_string?: string;
    searched_display_string?: string;
    reasoning_title?: string;
    search_model_queries?: any;
    search_result_groups?: any[];
    debug_sonic_thread_id?: string;
    search_model_message_id?: string;
    search_model_request_id?: string;
    search_url_queries?: any[];
    search_url_results?: any[];
    search_result_ids?: string[];
    search_model_thread_id?: string;
    search_model_queries_v2?: any;
    search_result_groups_v2?: any[];
    search_queries_v2?: any[];
    search_model_request_id_v2?: string;
    search_model_message_id_v2?: string;
};

/**
 * A single message node in a ChatGPT conversation tree.
 */
export type ChatGPTMessage = {
    /** Unique identifier for the message. */
    id: string;
    /** The author of the message. */
    author: ChatGPTAuthor;
    /** Unix timestamp (seconds) when the message was created. */
    create_time?: number | null;
    /** Unix timestamp (seconds) when the message was last updated. */
    update_time?: number | null;
    /** The content of the message. */
    content: ChatGPTContent | null;
    /** The status of the message generation. */
    status: 'finished_successfully' | 'in_progress' | 'finished_partial' | 'error' | string;
    /** Whether this message marks the end of a turn. */
    end_turn?: boolean | null;
    /** Priority weight of the node. */
    weight?: number;
    /** Metadata associated with the message. */
    metadata?: ChatGPTMessageMetadata;
    /** Recipient of the message. */
    recipient?: string;
    /** Channel used for the message (e.g., 'secret'). */
    channel?: string | null;
};

/**
 * A node in the conversation mapping tree.
 */
export type ChatGPTMappingNode = {
    /** Unique ID of the node (matches message ID if present). */
    id: string;
    /** The message data at this node. */
    message?: ChatGPTMessage | null;
    /** The parent node ID in the conversation tree. */
    parent?: string | null;
    /** Array of child node IDs. */
    children: string[];
};

/**
 * Structure of a full ChatGPT conversation export/dump.
 * @strict
 */
export type ChatGPTMappingDump = {
    /** Title of the conversation. */
    title?: string;
    /** Unix timestamp when the conversation was created. */
    create_time?: number;
    /** Unix timestamp when the conversation was last updated. */
    update_time?: number;
    /** Map of node IDs to conversation nodes. */
    mapping: Record<string, ChatGPTMappingNode>;
    /** Moderation flags and results. */
    moderation_results?: any[];
    /** The ID of the currently active/selected message node. */
    current_node?: string | null;
    /** IDs of active plugins. */
    plugin_ids?: string[] | null;
    /** Unique conversation identifier. */
    conversation_id?: string;
    /** Template ID used for the conversation. */
    conversation_template_id?: string | null;
    /** Database identifier for the conversation. */
    id?: string;

    // Gizmo/Custom GPT fields
    /** ID of the custom GPT (Gizmo) used. */
    gizmo_id?: string | null;
    /** Type of Gizmo used. */
    gizmo_type?: string | null;

    // UI/State fields
    /** Whether the conversation is archived. */
    is_archived?: boolean;
    /** Whether the conversation is starred. */
    is_starred?: boolean | null;
    /** List of safe URLs mentioned. */
    safe_urls?: string[];
    /** List of blocked URLs. */
    blocked_urls?: string[];
    /** Default model configuration for this conversation. */
    default_model_slug?: string;
    /** Origin of the conversation (e.g., 'web'). */
    conversation_origin?: string | null;
    /** Whether the conversation is in read-only mode. */
    is_read_only?: boolean | null;
    /** Voice configuration for the conversation. */
    voice?: string | null;
    /** Status of asynchronous processing. */
    async_status?: string | null;
    /** IDs of tools that have been disabled. */
    disabled_tool_ids?: any[];
    /** Whether to skip saving this to memory. */
    is_do_not_remember?: boolean;
    /** Scope of the memory state. */
    memory_scope?: string;
    /** Context scopes for the conversation. */
    context_scopes?: string[] | null;
    /** ID for user interface items. */
    sugar_item_id?: string | null;
    /** Visibility of the sugar item. */
    sugar_item_visible?: boolean;
    /** Timestamp when the conversation was pinned. */
    pinned_time?: number | null;
    /** Whether study mode is active. */
    is_study_mode?: boolean;
    /** Owner information. */
    owner?: any | null;

    // Fields for "Bug" report/Flattened dumps
    /** The model name. */
    model?: string;
    /** Any error messages encountered. */
    errors?: string;
    /** User-provided notes. */
    notes?: string;
    /** The user's input prompt. */
    prompt?: string;
    /** The assistant's response text. */
    response?: string;
    /** Reasoning or thought process. */
    reasoning?: string;
    /** Timestamp of the dump. */
    timestamp?: string;
};
