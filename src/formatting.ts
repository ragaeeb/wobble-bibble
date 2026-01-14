/**
 * Internal segment type for formatting.
 */
type Segment = {
    /** The segment ID (e.g., P1) */
    id: string;
    /** The segment text */
    text: string;
};

/**
 * Formats excerpts for an LLM prompt by combining the prompt rules with the segment text.
 * Each segment is formatted as "ID - Text" and separated by double newlines.
 *
 * @param segments - Array of segments to format
 * @param prompt - The instruction/system prompt to prepend
 * @returns Combined prompt and formatted text
 */
export const formatExcerptsForPrompt = (segments: Segment[], prompt: string) => {
    const formatted = segments.map((e) => `${e.id} - ${e.text}`).join('\n\n');
    return [prompt, formatted].join('\n\n');
};
