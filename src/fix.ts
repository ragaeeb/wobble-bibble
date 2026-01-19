import { MARKER_ID_PATTERN, TRANSLATION_MARKER_PARTS } from './constants';
import { escapeRegExp } from './textUtils';
import type { FixAllOptions, FixConfig, FixResult, ValidationErrorType } from './types';

const DEFAULT_LEADING_PUNCTUATION = ['.', '?', '!', '…', '،', '؛', ':', '：', '-', '–', '—'];

const buildLabelPattern = (labels: string[]) => {
    const parts = labels.map((label) => `${escapeRegExp(label)}\\s*:`).join('|');
    return `(?:${parts})`;
};

const buildPunctuationPattern = (punctuation: string[]) => punctuation.map((token) => escapeRegExp(token)).join('|');

const buildLineStartLabelPattern = (labels: string[]) => {
    const labelPattern = buildLabelPattern(labels);
    const { dashes, optionalSpace } = TRANSLATION_MARKER_PARTS;
    return new RegExp(`^(?:${MARKER_ID_PATTERN}${optionalSpace}${dashes}\\s*)?(${labelPattern})`);
};

export const fixCollapsedSpeakerLines = (text: string, config?: FixConfig): FixResult => {
    if (!config?.speakerLabels?.length) {
        throw new Error('fixCollapsedSpeakerLines requires speakerLabels in FixConfig');
    }
    const speakerLabels = config.speakerLabels;
    const leadingPunctuation = config?.leadingPunctuation ?? DEFAULT_LEADING_PUNCTUATION;
    const labelPattern = buildLabelPattern(speakerLabels);
    let count = 0;
    const punctuationPattern = buildPunctuationPattern(leadingPunctuation);
    const trailingPunctPattern = punctuationPattern ? new RegExp(`(?:${punctuationPattern})+\\s*$`) : undefined;
    const lineStartPattern = buildLineStartLabelPattern(speakerLabels);
    const labelRegex = new RegExp(labelPattern, 'g');

    const fixed = text
        .split('\n')
        .map((line) => {
            const startMatch = line.match(lineStartPattern);
            const lineStartLabelIndex = startMatch ? startMatch[0].length - startMatch[1].length : -1;
            let lastIndex = 0;
            let updated = '';

            for (const match of line.matchAll(labelRegex)) {
                const idx = match.index ?? 0;
                if (idx === lineStartLabelIndex) {
                    continue;
                }
                if (idx === 0) {
                    continue;
                }
                const prefix = line.slice(lastIndex, idx);
                if (trailingPunctPattern) {
                    const punctMatch = prefix.match(trailingPunctPattern);
                    if (punctMatch) {
                        const punct = punctMatch[0].replace(/\s+$/, '');
                        const beforePunct = prefix.slice(0, -punctMatch[0].length);
                        updated += beforePunct + punct + '\n' + match[0];
                        lastIndex = idx + match[0].length;
                        count += 1;
                        continue;
                    }
                }
                updated += prefix.replace(/\s+$/, '') + '\n' + match[0];
                lastIndex = idx + match[0].length;
                count += 1;
            }

            if (count === 0) {
                return line;
            }
            return updated + line.slice(lastIndex);
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
    mismatched_colons: fixCollapsedSpeakerLines,
};

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
