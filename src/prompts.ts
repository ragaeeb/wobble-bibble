/**
 * Prompts API for consumers to access bundled translation prompts.
 */
import { MASTER_PROMPT, PROMPTS, type PromptId, type PromptMetadata } from './generated/prompts';

// Re-export types
export type { PromptId, PromptMetadata };

// =============================================================================
// TYPES
// =============================================================================

/**
 * A stacked prompt ready for use with an LLM.
 */
export type StackedPrompt = {
    /** Unique identifier */
    id: PromptId;
    /** Human-readable name */
    name: string;
    /** The full prompt content (master + addon if applicable) */
    content: string;
    /** Whether this is the master prompt (not stacked) */
    isMaster: boolean;
};

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Stacks a master prompt with a specialized addon prompt.
 * @param master - The master/base prompt
 * @param addon - The specialized addon prompt
 * @returns Combined prompt text
 */
export const stackPrompts = (master: string, addon: string): string => {
    if (!master) {
        return addon;
    }
    if (!addon) {
        return master;
    }
    return `${master}\n${addon}`;
};

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Gets all available prompts as stacked prompts (master + addon combined).
 * Master prompt is returned as-is, addon prompts are stacked with master.
 *
 * @returns Array of all stacked prompts
 */
export const getPrompts = (): StackedPrompt[] => {
    return PROMPTS.map((prompt) => ({
        content: prompt.id === 'master_prompt' ? prompt.content : stackPrompts(MASTER_PROMPT, prompt.content),
        id: prompt.id,
        isMaster: prompt.id === 'master_prompt',
        name: prompt.name,
    }));
};

/**
 * Gets a specific prompt by ID (strongly typed).
 * Returns the stacked version (master + addon) for addon prompts.
 *
 * @param id - The prompt ID to retrieve
 * @returns The stacked prompt
 */
export const getPrompt = (id: PromptId): StackedPrompt => {
    const prompt = PROMPTS.find((p) => p.id === id);
    if (!prompt) {
        // This should never happen with proper typing, but handle gracefully
        throw new Error(`Prompt not found: ${id}`);
    }

    return {
        content: prompt.id === 'master_prompt' ? prompt.content : stackPrompts(MASTER_PROMPT, prompt.content),
        id: prompt.id,
        isMaster: prompt.id === 'master_prompt',
        name: prompt.name,
    };
};

/**
 * Gets the raw stacked prompt text for a specific prompt ID.
 * Convenience method for when you just need the text.
 *
 * @param id - The prompt ID
 * @returns The stacked prompt content string
 */
export const getStackedPrompt = (id: PromptId): string => {
    return getPrompt(id).content;
};

/**
 * Gets the list of available prompt IDs.
 * Useful for UI dropdowns or validation.
 *
 * @returns Array of prompt IDs
 */
export const getPromptIds = (): PromptId[] => {
    return PROMPTS.map((p) => p.id);
};

/**
 * Gets just the master prompt content.
 * Useful when you need to use a custom addon.
 *
 * @returns The master prompt content
 */
export const getMasterPrompt = (): string => {
    return MASTER_PROMPT;
};
