/**
 * Segment type is shared across the library.
 */
import { MARKER_ID_PATTERN, TRANSLATION_MARKER_PARTS } from './constants';
import type { Segment } from './types';

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

/**
 * Normalize line endings and split merged markers onto separate lines.
 *
 * @example
 * // "helloP1 - ..." becomes split onto a new line before "P1 -"
 * normalizeTranslationText('helloP1 - x').includes('\\nP1 -') === true
 */
export const normalizeTranslationText = (content: string) => {
    const normalizedLineEndings = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    const mergedMarkerWithSpacePattern = new RegExp(
        ` (${MARKER_ID_PATTERN}${TRANSLATION_MARKER_PARTS.optionalSpace}${TRANSLATION_MARKER_PARTS.dashes})`,
        'gm',
    );

    const mergedMarkerNoSpacePattern = new RegExp(
        `([^\\s\\n])(${MARKER_ID_PATTERN}${TRANSLATION_MARKER_PARTS.optionalSpace}${TRANSLATION_MARKER_PARTS.dashes})`,
        'gm',
    );

    return normalizedLineEndings
        .replace(mergedMarkerWithSpacePattern, '\n$1')
        .replace(mergedMarkerNoSpacePattern, '$1\n$2')
        .replace(/\\\[/gm, '[');
};

/**
 * Extract translation IDs from normalized response, in order.
 *
 * @example
 * extractTranslationIds('P1 - a\\nP2b - b') // => ['P1', 'P2b']
 */
export const extractTranslationIds = (text: string) => {
    const { dashes, optionalSpace } = TRANSLATION_MARKER_PARTS;
    const pattern = new RegExp(`^(${MARKER_ID_PATTERN})${optionalSpace}${dashes}`, 'gm');
    const ids: string[] = [];
    for (const match of text.matchAll(pattern)) {
        ids.push(match[1]);
    }
    return ids;
};

/**
 * Split the response into a per-ID map. Values contain translation content only (prefix removed).
 *
 * @example
 * splitResponseById('P1 - a\\nP2 - b').get('P1') === 'a'
 */
export const splitResponseById = (text: string) => {
    const { dashes, optionalSpace } = TRANSLATION_MARKER_PARTS;
    const headerPattern = new RegExp(`^(${MARKER_ID_PATTERN})${optionalSpace}${dashes}\\s*`, 'gm');
    const matches = [...text.matchAll(headerPattern)];

    const map = new Map<string, string>();
    for (let i = 0; i < matches.length; i++) {
        const id = matches[i][1];
        const start = matches[i].index ?? 0;
        const nextStart = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length;
        const chunk = text.slice(start, nextStart).trimEnd();
        const prefixPattern = new RegExp(`^${id}${optionalSpace}${dashes}\\s*`);
        map.set(id, chunk.replace(prefixPattern, '').trim());
    }
    return map;
};

export const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
