import { DEFAULT_LEADING_PUNCTUATION } from './constants';
import {
    buildLineStartLabelPattern,
    buildPunctuationPattern,
    buildSpeakerLabelPattern,
    inferSpeakerLabels,
} from './textUtils';
import type { FixAllOptions, FixConfig, FixResult, ValidationErrorType } from './types';

/**
 * Fixes collapsed speaker lines by inserting newlines before mid-line labels.
 */
export const fixCollapsedSpeakerLines = (text: string, config?: FixConfig): FixResult => {
    const speakerLabels = config?.speakerLabels?.length ? config.speakerLabels : inferSpeakerLabels(text);
    if (speakerLabels.length === 0) {
        return {
            applied: [],
            counts: { fixCollapsedSpeakerLines: 0 },
            text,
        };
    }
    const leadingPunctuation = config?.leadingPunctuation ?? DEFAULT_LEADING_PUNCTUATION;
    const labelPattern = buildSpeakerLabelPattern(speakerLabels);
    let count = 0;
    const punctuationPattern = buildPunctuationPattern(leadingPunctuation);
    const trailingPunctPattern = punctuationPattern ? new RegExp(`(?:${punctuationPattern})+\\s*$`) : undefined;
    const lineStartPattern = buildLineStartLabelPattern(speakerLabels);
    const labelRegex = new RegExp(labelPattern, 'g');

    /**
     * Format a prefix + label insertion, preserving trailing punctuation.
     */
    const formatInsertion = (prefix: string, matchText: string) => {
        if (!trailingPunctPattern) {
            return `${prefix.replace(/\s+$/, '')}\n${matchText}`;
        }
        const punctMatch = prefix.match(trailingPunctPattern);
        if (!punctMatch) {
            return `${prefix.replace(/\s+$/, '')}\n${matchText}`;
        }
        const punct = punctMatch[0].replace(/\s+$/, '');
        const beforePunct = prefix.slice(0, -punctMatch[0].length);
        return `${beforePunct}${punct}\n${matchText}`;
    };

    /**
     * Apply collapsed-speaker fixes within a single line.
     */
    const updateLine = (line: string) => {
        const startMatch = line.match(lineStartPattern);
        const lineStartLabelIndex = startMatch ? startMatch[0].length - startMatch[1].length : -1;
        let lastIndex = 0;
        let updated = '';
        let lineCount = 0;

        for (const match of line.matchAll(labelRegex)) {
            const idx = match.index ?? 0;
            if (idx === lineStartLabelIndex || idx === 0) {
                continue;
            }
            const prefix = line.slice(lastIndex, idx);
            updated += formatInsertion(prefix, match[0]);
            lastIndex = idx + match[0].length;
            lineCount += 1;
        }

        if (lineCount === 0) {
            return { line, lineCount };
        }
        return { line: `${updated}${line.slice(lastIndex)}`, lineCount };
    };

    const fixed = text
        .split('\n')
        .map((line) => {
            const result = updateLine(line);
            count += result.lineCount;
            return result.line;
        })
        .join('\n');
    return {
        applied: count > 0 ? ['fixCollapsedSpeakerLines'] : [],
        counts: { fixCollapsedSpeakerLines: count },
        text: fixed,
    };
};

const FIXERS_BY_TYPE: Partial<Record<ValidationErrorType, (text: string, config?: FixConfig) => FixResult>> = {
    collapsed_speakers: fixCollapsedSpeakerLines,
};

/**
 * Apply all fixers requested by type, in order.
 */
export const fixAll = (text: string, options: FixAllOptions): FixResult => {
    const requested = options.types;
    const applied: string[] = [];
    const skipped: string[] = [];
    let currentText = text;
    const counts: Record<string, number> = {};

    for (const type of requested) {
        const fixer = FIXERS_BY_TYPE[type];
        if (!fixer) {
            skipped.push(type);
            continue;
        }
        const result = fixer(currentText, options.config);
        currentText = result.text;
        applied.push(type);
        for (const [key, value] of Object.entries(result.counts)) {
            counts[key] = (counts[key] ?? 0) + value;
        }
    }

    return {
        applied,
        counts,
        requested,
        skipped,
        text: currentText,
    };
};
