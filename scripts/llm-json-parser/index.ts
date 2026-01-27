/**
 * @description Core logic for detecting and parsing various LLM JSON export formats.
 */

import type { ExtractedLLMData, LLMMappingDump } from './types';
import type { GeminiFlatDump } from './types/gemini';
import type { GrokMappingDump } from './types/grok';

/**
 * Parses raw LLM JSON output from ChatGPT, Grok, or Gemini.
 * Detects the input format automatically and extracts content, prompt, model, and thoughts.
 *
 * @param {any} content - The raw JSON object to parse.
 * @returns {ExtractedLLMData} The extracted conversation data.
 * @throws {Error} If the content is invalid or the format is unrecognized.
 */
export const parseLLMJson = (content: any): ExtractedLLMData => {
    if (!content || typeof content !== 'object') {
        throw new Error('Invalid JSON content: expected an object');
    }

    // Detect format and Parse
    if (isGrokDump(content)) {
        return parseMappingDump(content as GrokMappingDump);
    }

    if (isGeminiFlatDump(content)) {
        return parseGeminiFlatDump(content as GeminiFlatDump);
    }

    if (isMappingDump(content)) {
        // Generic mapping dump (ChatGPT or Gemini Nested)
        // Note: For runtime performance and to avoid a Zod dependency,
        // we trust the format if it has a "mapping" field.
        return parseMappingDump(content as LLMMappingDump);
    }

    throw new Error('Unrecognized LLM JSON format: missing "mapping", "current_node", or "response"/"prompt" fields');
};

/**
 * Heuristically detects if the given content is a Grok 4 mapping dump.
 * Checks for specific model slugs or known root node IDs.
 *
 * @param {any} content - The raw JSON content.
 * @returns {boolean} True if it matches the Grok format.
 */
const isGrokDump = (content: any) => {
    return Boolean(
        'mapping' in content &&
            (content.default_model_slug?.startsWith('grok') ||
                Object.keys(content.mapping).some((k) => k.startsWith('grok-com-root'))),
    );
};

/**
 * Checks if the content contains a "mapping" field, characteristic of ChatGPT-style dumps.
 *
 * @param {any} content - The raw JSON content.
 * @returns {boolean}
 */
const isMappingDump = (content: any) => {
    return 'mapping' in content;
};

/**
 * Checks if the content represents a flattened Gemini "Bug" report.
 *
 * @param {any} content - The raw JSON content.
 * @returns {boolean}
 */
const isGeminiFlatDump = (content: any) => {
    return 'response' in content || 'prompt' in content;
};

/**
 * Parses a conversation mapping tree into flat extracted data.
 *
 * @param {LLMMappingDump} dump - The mapping dump to parse.
 * @param {'grok' | 'generic'} type - The provider type for specific logic (currently mostly generic).
 * @returns {ExtractedLLMData}
 * @throws {Error} If a current node cannot be determined.
 */
const parseMappingDump = (dump: LLMMappingDump): ExtractedLLMData => {
    const mapping = dump.mapping;
    const currentNodeId = findCurrentNodeId(dump);

    if (!currentNodeId) {
        throw new Error('Could not find current_node or any assistant message in mapping dump');
    }

    const chain = buildMessageChain(mapping, currentNodeId);
    return extractFromChain(chain);
};

/**
 * Finds the logical "current" or "leaf" node representing the latest message.
 * Priority:
 * 1. `current_node` field if present.
 * 2. The most recent leaf node (node with no children) based on `create_time`.
 * 3. The most recent 'assistant' message.
 *
 * @param {LLMMappingDump} dump - The mapping dump to analyze.
 * @returns {string | undefined} The ID of the current node.
 */
const findCurrentNodeId = (dump: LLMMappingDump): string => {
    const mapping = dump.mapping;

    // If current_node is provided and has an actual message, use it.
    // Sometimes (e.g. in some Grok exports) current_node might point to a message-less root.
    if (dump.current_node && mapping[dump.current_node]?.message) {
        return dump.current_node;
    }

    const nodes = Object.values(mapping);

    // Priority 1: The most recent assistant message
    const assistantNodes = nodes
        .filter((node: any) => node.message?.author?.role === 'assistant')
        .sort((a: any, b: any) => {
            const timeA = a.message?.create_time || 0;
            const timeB = b.message?.create_time || 0;
            return timeB - timeA;
        });

    if (assistantNodes.length > 0) {
        return assistantNodes[0].id;
    }

    // Priority 2: Any leaf node with a message
    const leafNodes = nodes
        .filter((node: any) => node.message && (node.children?.length === 0 || !node.children))
        .sort((a: any, b: any) => {
            const timeA = a.message?.create_time || 0;
            const timeB = b.message?.create_time || 0;
            return timeB - timeA;
        });

    return leafNodes[0]?.id || '';
};

/**
 * Reconstructs the conversation path from a leaf node back to the root.
 *
 * @param {Record<string, any>} mapping - The node mapping object.
 * @param {string} startId - The ID of the node to start backtracking from.
 * @returns {any[]} An ordered array of message objects.
 */
const buildMessageChain = (mapping: Record<string, any>, startId: string) => {
    const chain: any[] = [];
    let id: string | null | undefined = startId;

    while (id && mapping[id]) {
        const node: any = mapping[id];
        // Ensure consistent message structure access
        if (node.message) {
            chain.unshift(node.message);
        }
        id = node.parent;
    }
    return chain;
};

/**
 * Extracts human-readable data (prompt, response, model, thoughts) from a message chain.
 * Handles variations in content structure across ChatGPT, Gemini, and Grok.
 *
 * @param {any[]} chain - The ordered array of message objects.
 * @returns {ExtractedLLMData}
 */
const extractFromChain = (chain: any[]): ExtractedLLMData => {
    let response = '';
    let thoughts = '';
    let prompt = '';
    let model = '';

    for (const msg of chain) {
        const role = msg.author?.role;

        if (msg.metadata?.model) {
            model = msg.metadata.model;
        }
        if (role === 'user') {
            // Take the last user prompt before the final assistant turn
            if (msg.content?.parts) {
                prompt = msg.content.parts.join('\n');
            }
        } else if (role === 'assistant') {
            const parts = (msg.content?.parts || []).join('\n');
            let msgThoughts = '';

            // Handle Gemini/ChatGPT specific thoughts structure if present
            if (msg.content?.thoughts) {
                msgThoughts = msg.content.thoughts.map((t: any) => t.content || '').join('\n\n');
            }

            if (parts) {
                // Keep the last response found in the chain
                response = parts;
            }

            if (msgThoughts) {
                thoughts = thoughts ? `${thoughts}\n\n${msgThoughts}` : msgThoughts;
            }
        }
    }

    return {
        model: model || undefined,
        prompt,
        response,
        thoughts: thoughts || undefined,
    };
};

/**
 * Extracts data from a flattened Gemini JSON format.
 *
 * @param {GeminiFlatDump} dump - The flattened Gemini JSON.
 * @returns {ExtractedLLMData}
 */
const parseGeminiFlatDump = (dump: GeminiFlatDump): ExtractedLLMData => {
    return {
        model: dump.model,
        prompt: dump.prompt || '',
        response: dump.response || '',
        thoughts: dump.reasoning || undefined,
    };
};
