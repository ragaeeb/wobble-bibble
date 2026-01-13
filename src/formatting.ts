type Segment = { id: string; text: string };

/**
 * Format excerpts for LLM prompt (matches handleExportToTxt format)
 */
export const formatExcerptsForPrompt = (segments: Segment[], prompt: string) => {
    const formatted = segments.map((e) => `${e.id} - ${e.text}`).join('\n\n');
    return [prompt, formatted].join('\n\n');
};
