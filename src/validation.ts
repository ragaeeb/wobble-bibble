import {
    ARCHAIC_WORDS,
    MARKER_ID_PATTERN,
    MAX_EMPTY_PARENTHESES,
    MIN_ARABIC_LENGTH_FOR_TRUNCATION_CHECK,
    MIN_TRANSLATION_RATIO,
    TRANSLATION_MARKER_PARTS,
} from './constants';
import { escapeRegExp, normalizeTranslationTextWithMap } from './textUtils';
import type {
    Range,
    Segment,
    TranslationMarker,
    ValidationConfig,
    ValidationContext,
    ValidationError,
    ValidationErrorType,
    ValidationRule,
} from './types';

/**
 * Human-readable descriptions for each `ValidationErrorType`, intended for client UIs and logs.
 *
 * @example
 * VALIDATION_ERROR_TYPE_INFO.arabic_leak.description
 */
export const VALIDATION_ERROR_TYPE_INFO = {
    all_caps: {
        description: 'ALL CAPS “shouting” detected (run of N uppercase words).',
    },
    arabic_leak: {
        description: 'Arabic script was detected in output (except ﷺ).',
    },
    archaic_register: {
        description: 'Archaic/Biblical English detected (e.g., thou, verily, shalt).',
    },
    duplicate_id: {
        description: 'The same segment ID appears more than once in the response.',
    },
    empty_parentheses: {
        description: 'Excessive "()" patterns detected, often indicating failed/empty term-pairs.',
    },
    implicit_continuation: {
        description: 'The response includes continuation/meta phrasing (e.g., "continued:", "implicit continuation").',
    },
    invalid_marker_format: {
        description: 'A segment marker line is malformed (e.g., wrong ID shape or missing content after the dash).',
    },
    invented_id: {
        description: 'The response contains a segment ID that does not exist in the provided source corpus.',
    },
    length_mismatch: {
        description: 'Translation appears too short relative to Arabic source (heuristic truncation check).',
    },
    meta_talk: {
        description: 'The response includes translator/editor notes instead of pure translation.',
    },
    mismatched_colons: {
        description:
            'Per-segment mismatch between Arabic and translation line-start speaker labels (detected as line-start prefixes ending in ":").',
    },
    missing_id_gap: {
        description:
            'A gap was detected: the response includes two IDs whose corpus order implies one or more intermediate IDs are missing.',
    },
    multiword_translit_without_gloss: {
        description: 'A multi-word transliteration phrase was detected without an immediate parenthetical gloss.',
    },
    newline_after_id: {
        description: 'The response used "ID -\\nText" instead of "ID - Text" (newline immediately after the marker).',
    },
    no_valid_markers: {
        description: 'No valid "ID - ..." markers were found anywhere in the response.',
    },
    truncated_segment: {
        description: 'A segment appears truncated (e.g., only "…", "...", or "[INCOMPLETE]").',
    },
    wrong_diacritics: {
        description: 'Wrong diacritics like â/ã/á were detected (should use macrons like ā ī ū).',
    },
} as const satisfies Record<ValidationErrorType, { description: string }>;

const ARCHAIC_PATTERNS = ARCHAIC_WORDS.map((w) => new RegExp(`\\b${escapeRegExp(w)}\\b`, 'gi'));

const trimRange = (text: string, start: number, end: number) => {
    let s = start;
    let e = end;
    while (s < e && /\s/.test(text[s])) {
        s++;
    }
    while (e > s && /\s/.test(text[e - 1])) {
        e--;
    }
    return { end: e, start: s };
};

const toRawRange = (normalizedStart: number, normalizedEnd: number, indexMap: number[], rawLength: number): Range => {
    if (normalizedEnd <= normalizedStart) {
        const rawStart = indexMap[normalizedStart] ?? 0;
        return { end: rawStart, start: rawStart };
    }
    const rawStart = indexMap[normalizedStart] ?? 0;
    const rawEndBase = indexMap[Math.max(normalizedEnd - 1, normalizedStart)] ?? rawStart;
    const rawEnd = Math.min(rawLength, rawEndBase + 1);
    return { end: rawEnd, start: rawStart };
};

const buildMarkers = (normalized: string, indexMap: number[], rawLength: number): TranslationMarker[] => {
    const { dashes, optionalSpace } = TRANSLATION_MARKER_PARTS;
    const headerPattern = new RegExp(`^(${MARKER_ID_PATTERN})${optionalSpace}${dashes}\\s*`, 'gm');
    const matches = [...normalized.matchAll(headerPattern)];
    const markers: TranslationMarker[] = [];

    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const id = match[1];
        const normalizedStart = match.index ?? 0;
        const normalizedEnd = normalizedStart + match[0].length;
        const nextStart = i + 1 < matches.length ? (matches[i + 1].index ?? normalized.length) : normalized.length;
        const translationRange = trimRange(normalized, normalizedEnd, nextStart);
        const headerRange = toRawRange(normalizedStart, normalizedEnd, indexMap, rawLength);
        const translationRawRange = toRawRange(translationRange.start, translationRange.end, indexMap, rawLength);

        markers.push({
            headerText: match[0],
            id,
            normalizedEnd,
            normalizedStart,
            rawEnd: headerRange.end,
            rawStart: headerRange.start,
            rawTranslationEnd: translationRawRange.end,
            rawTranslationStart: translationRawRange.start,
            translationEnd: translationRange.end,
            translationStart: translationRange.start,
        });
    }

    return markers;
};

const buildResponseById = (markers: TranslationMarker[], normalized: string) => {
    const responseById = new Map<string, string>();
    for (const marker of markers) {
        const translationText = normalized.slice(marker.translationStart, marker.translationEnd).trim();
        responseById.set(marker.id, translationText);
    }
    return responseById;
};

const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
    allCapsWordRunThreshold: 5,
};

const buildValidationContext = (
    segments: Segment[],
    rawResponse: string,
    config: ValidationConfig,
): ValidationContext => {
    const { normalized, indexMap } = normalizeTranslationTextWithMap(rawResponse);
    const markers = buildMarkers(normalized, indexMap, rawResponse.length);
    const parsedIds = markers.map((m) => m.id);
    const segmentById = new Map<string, Segment>();
    for (const s of segments) {
        segmentById.set(s.id, s);
    }
    const responseById = buildResponseById(markers, normalized);
    return {
        config,
        indexMap,
        markers,
        normalizedResponse: normalized,
        parsedIds,
        rawResponse,
        responseById,
        segmentById,
        segments,
    };
};

const makeErrorFromNormalized = (
    context: ValidationContext,
    type: ValidationErrorType,
    message: string,
    matchText: string,
    normalizedStart: number,
    normalizedEnd: number,
    id?: string,
): ValidationError => {
    let resolvedId = id;
    if (!resolvedId) {
        // Try to find which marker contains this error range
        for (const marker of context.markers) {
            // Check if error falls within the translation content of a marker
            // We use loose bounds to catch errors at boundaries
            if (normalizedStart >= marker.translationStart && normalizedEnd <= marker.translationEnd) {
                resolvedId = marker.id;
                break;
            }
        }
    }

    return {
        id: resolvedId,
        matchText,
        message,
        range: toRawRange(normalizedStart, normalizedEnd, context.indexMap, context.rawResponse.length),
        type,
    };
};

const makeErrorFromRawRange = (
    type: ValidationErrorType,
    message: string,
    matchText: string,
    range: Range,
    id?: string,
): ValidationError => ({
    id,
    matchText,
    message,
    range,
    type,
});

/**
 * Validate an LLM translation response against a set of Arabic source segments.
 *
 * Rules are expressed as a list of typed errors. The caller decides severity.
 * The validator normalizes the response first (marker splitting + line endings).
 *
 * Important: `segments` may be the full corpus. The validator reduces to only
 * those IDs parsed from the response (plus detects missing-ID gaps between IDs).
 *
 * @example
 * // Pass (no errors)
 * validateTranslationResponse(
 *   [{ id: 'P1', text: 'نص عربي طويل...' }],
 *   'P1 - A complete translation.'
 * ).errors.length === 0
 *
 * @example
 * // Fail (invented ID)
 * validateTranslationResponse(
 *   [{ id: 'P1', text: 'نص عربي طويل...' }],
 *   'P2 - This ID is not in the corpus.'
 * ).errors.some(e => e.type === 'invented_id') === true
 */
export const validateTranslationResponse = (
    segments: Segment[],
    response: string,
    options?: { rules?: ValidationRule[]; config?: Partial<ValidationConfig> },
) => {
    const config = { ...DEFAULT_VALIDATION_CONFIG, ...options?.config };
    const context = buildValidationContext(segments, response, config);
    if (context.parsedIds.length === 0) {
        return {
            errors: [
                {
                    matchText: response,
                    message: 'No valid translation markers found',
                    range: { end: response.length, start: 0 },
                    ruleId: 'no_valid_markers',
                    type: 'no_valid_markers',
                },
            ],
            normalizedResponse: context.normalizedResponse,
            parsedIds: [],
        };
    }

    const rules = options?.rules ?? DEFAULT_RULES;
    const errors = rules.flatMap((rule) => rule.run(context).map((e) => ({ ...e, ruleId: e.ruleId ?? rule.id })));

    return { errors, normalizedResponse: context.normalizedResponse, parsedIds: context.parsedIds };
};

/**
 * Validate translation marker format (single-line errors).
 *
 * @example
 * // Fail: malformed marker
 * validateMarkerFormat('B1234$5 - x')[0]?.type === 'invalid_marker_format'
 */
const validateMarkerFormat = (context: ValidationContext): ValidationError[] => {
    const text = context.normalizedResponse;
    const { markers, digits, suffix, dashes, optionalSpace } = TRANSLATION_MARKER_PARTS;
    const errors: ValidationError[] = [];

    const invalidRefPattern = new RegExp(
        `^${markers}(?=${digits})(?=.*${dashes})(?!${digits}${suffix}*${optionalSpace}${dashes})[^\\s-–—]+${optionalSpace}${dashes}`,
        'gm',
    );
    for (const match of text.matchAll(invalidRefPattern)) {
        const matchText = match[0];
        const idx = match.index ?? 0;
        errors.push(
            makeErrorFromNormalized(
                context,
                'invalid_marker_format',
                `Invalid reference format "${matchText.trim()}" - expected format is letter + numbers + optional suffix (a-j) + dash`,
                matchText,
                idx,
                idx + matchText.length,
            ),
        );
    }

    const spaceBeforePattern = new RegExp(` ${markers}${digits}${suffix}+${optionalSpace}${dashes}`, 'gm');
    for (const match of text.matchAll(spaceBeforePattern)) {
        const matchText = match[0];
        const idx = match.index ?? 0;
        errors.push(
            makeErrorFromNormalized(
                context,
                'invalid_marker_format',
                `Suspicious reference found: "${matchText}"`,
                matchText,
                idx,
                idx + matchText.length,
            ),
        );
    }

    const suffixNoDashPattern = new RegExp(`^${markers}${digits}${suffix}(?! ${dashes})`, 'gm');
    for (const match of text.matchAll(suffixNoDashPattern)) {
        const matchText = match[0];
        const idx = match.index ?? 0;
        errors.push(
            makeErrorFromNormalized(
                context,
                'invalid_marker_format',
                `Suspicious reference found: "${matchText}"`,
                matchText,
                idx,
                idx + matchText.length,
            ),
        );
    }

    const emptyAfterDashPattern = new RegExp(`^${MARKER_ID_PATTERN}${optionalSpace}${dashes}\\s*$`, 'gm');
    for (const match of text.matchAll(emptyAfterDashPattern)) {
        const matchText = match[0];
        const idx = match.index ?? 0;
        errors.push(
            makeErrorFromNormalized(
                context,
                'invalid_marker_format',
                `Reference "${matchText.trim()}" has dash but no content after it`,
                matchText,
                idx,
                idx + matchText.length,
            ),
        );
    }

    const dollarSignPattern = new RegExp(`^${markers}${digits}\\$${digits}`, 'gm');
    for (const match of text.matchAll(dollarSignPattern)) {
        const matchText = match[0];
        const idx = match.index ?? 0;
        errors.push(
            makeErrorFromNormalized(
                context,
                'invalid_marker_format',
                `Invalid reference format "${matchText}" - contains $ character`,
                matchText,
                idx,
                idx + matchText.length,
            ),
        );
    }

    return errors;
};

/**
 * Detect newline after an ID line (formatting bug).
 *
 * @example
 * // Fail: newline after "P1 -"
 * validateNewlineAfterId('P1 -\\nText')[0]?.type === 'newline_after_id'
 */
const validateNewlineAfterId = (context: ValidationContext): ValidationError[] => {
    const pattern = new RegExp(
        `^${MARKER_ID_PATTERN}${TRANSLATION_MARKER_PARTS.optionalSpace}${TRANSLATION_MARKER_PARTS.dashes}\\s*\\n`,
        'gm',
    );
    const errors: ValidationError[] = [];
    for (const match of context.normalizedResponse.matchAll(pattern)) {
        const matchText = match[0];
        const idx = match.index ?? 0;
        errors.push(
            makeErrorFromNormalized(
                context,
                'newline_after_id',
                `Invalid format: newline after ID "${matchText.trim()}" - use "ID - Text" format`,
                matchText,
                idx,
                idx + matchText.length,
            ),
        );
    }
    return errors;
};

/**
 * Detect duplicated IDs in the parsed ID list.
 *
 * @example
 * validateDuplicateIds(['P1','P1'])[0]?.type === 'duplicate_id'
 */
const validateDuplicateIds = (context: ValidationContext): ValidationError[] => {
    const seen = new Set<string>();
    const errors: ValidationError[] = [];
    for (const marker of context.markers) {
        if (seen.has(marker.id)) {
            errors.push(
                makeErrorFromRawRange(
                    'duplicate_id',
                    `Duplicate ID "${marker.id}" detected - each segment should appear only once`,
                    marker.headerText,
                    { end: marker.rawEnd, start: marker.rawStart },
                    marker.id,
                ),
            );
        } else {
            seen.add(marker.id);
        }
    }
    return errors;
};

/**
 * Detect IDs in the response that do not exist in the passed segment corpus.
 *
 * @example
 * validateInventedIds(['P1','P2'], new Map([['P1',{id:'P1',text:'x'}]]) )[0]?.type === 'invented_id'
 */
const validateInventedIds = (context: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];
    for (const marker of context.markers) {
        if (!context.segmentById.has(marker.id)) {
            errors.push(
                makeErrorFromRawRange(
                    'invented_id',
                    `Invented ID detected: "${marker.id}" - this ID does not exist in the source`,
                    marker.headerText,
                    { end: marker.rawEnd, start: marker.rawStart },
                    marker.id,
                ),
            );
        }
    }
    return errors;
};

/**
 * Detect a “gap”: response contains IDs A and C, but the corpus order includes B between them.
 * This only checks for missing IDs between consecutive IDs within each response-ordered block.
 *
 * @example
 * // Corpus: P1, P2, P3. Response: P1, P3 => missing_id_gap includes P2
 */
const buildSegmentIndexById = (segments: Segment[]) => {
    const indexById = new Map<string, number>();
    for (let i = 0; i < segments.length; i++) {
        indexById.set(segments[i].id, i);
    }
    return indexById;
};

const getGapIndices = (context: ValidationContext, indexById: Map<string, number>, aId: string, bId: string) => {
    if (!context.segmentById.has(aId) || !context.segmentById.has(bId)) {
        return;
    }
    const ia = indexById.get(aId);
    const ib = indexById.get(bId);
    if (ia == null || ib == null || ib < ia) {
        return;
    }
    return { end: ib, start: ia };
};

const collectMissingIds = (
    context: ValidationContext,
    startIdx: number,
    endIdx: number,
    parsedIdSet: Set<string>,
    missing: Set<string>,
) => {
    const found: string[] = [];
    for (let j = startIdx + 1; j < endIdx; j++) {
        const midId = context.segments[j]?.id;
        if (!midId) {
            continue;
        }
        if (!context.segmentById.has(midId) || parsedIdSet.has(midId) || missing.has(midId)) {
            continue;
        }
        missing.add(midId);
        found.push(midId);
    }
    return found;
};

const validateMissingIdGaps = (context: ValidationContext): ValidationError[] => {
    const indexById = buildSegmentIndexById(context.segments);

    const parsedIdSet = new Set(context.parsedIds);
    const missing = new Set<string>();
    const errors: ValidationError[] = [];

    for (let i = 0; i < context.markers.length - 1; i++) {
        const a = context.markers[i];
        const b = context.markers[i + 1];
        const gap = getGapIndices(context, indexById, a.id, b.id);
        if (!gap) {
            continue;
        }
        const newlyMissing = collectMissingIds(context, gap.start, gap.end, parsedIdSet, missing);
        for (const midId of newlyMissing) {
            errors.push(
                makeErrorFromRawRange(
                    'missing_id_gap',
                    `Missing segment ID detected between translated IDs: "${midId}"`,
                    context.rawResponse.slice(b.rawStart, b.rawEnd),
                    { end: b.rawEnd, start: b.rawStart },
                    midId,
                ),
            );
        }
    }

    return errors;
};

/**
 * Detect segments that appear truncated (just "…" / "..." / "[INCOMPLETE]").
 *
 * @example
 * validateTruncatedSegments('P1 - …')[0]?.type === 'truncated_segment'
 */
const validateTruncatedSegments = (context: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];
    for (const marker of context.markers) {
        const content = context.normalizedResponse.slice(marker.translationStart, marker.translationEnd).trim();
        if (!content || content === '…' || content === '...' || content === '[INCOMPLETE]') {
            errors.push(
                makeErrorFromRawRange(
                    'truncated_segment',
                    `Truncated segment detected: "${marker.id}" - segments must be fully translated`,
                    context.rawResponse.slice(marker.rawTranslationStart, marker.rawTranslationEnd),
                    { end: marker.rawTranslationEnd, start: marker.rawTranslationStart },
                    marker.id,
                ),
            );
        }
    }
    return errors;
};

/**
 * Detect implicit continuation markers.
 *
 * @example
 * validateImplicitContinuation('P1 - continued: ...')[0]?.type === 'implicit_continuation'
 */
const validateImplicitContinuation = (context: ValidationContext): ValidationError[] => {
    const patterns = [/implicit continuation/gi, /\bcontinuation:/gi, /\bcontinued:/gi];
    const errors: ValidationError[] = [];
    for (const pattern of patterns) {
        for (const match of context.normalizedResponse.matchAll(pattern)) {
            const matchText = match[0];
            const idx = match.index ?? 0;
            errors.push(
                makeErrorFromNormalized(
                    context,
                    'implicit_continuation',
                    `Detected "${matchText}" - do not add implicit continuation text`,
                    matchText,
                    idx,
                    idx + matchText.length,
                ),
            );
        }
    }
    return errors;
};

/**
 * Detect meta-talk (translator/editor notes).
 *
 * @example
 * validateMetaTalk("P1 - (Translator's note: ...)")[0]?.type === 'meta_talk'
 */
const validateMetaTalk = (context: ValidationContext): ValidationError[] => {
    const patterns = [/\(note:/gi, /\(translator'?s? note:/gi, /\[editor:/gi, /\[note:/gi, /\(ed\.:/gi, /\(trans\.:/gi];
    const errors: ValidationError[] = [];
    for (const pattern of patterns) {
        for (const match of context.normalizedResponse.matchAll(pattern)) {
            const matchText = match[0];
            const idx = match.index ?? 0;
            errors.push(
                makeErrorFromNormalized(
                    context,
                    'meta_talk',
                    `Detected meta-talk "${matchText}" - output translation only, no translator/editor notes`,
                    matchText,
                    idx,
                    idx + matchText.length,
                ),
            );
        }
    }
    return errors;
};

/**
 * Detect Arabic script characters (except ﷺ).
 *
 * @example
 * validateArabicLeak('P1 - الله')[0]?.type === 'arabic_leak'
 *
 * @example
 * // Pass: ﷺ allowed
 * validateArabicLeak('P1 - Muḥammad ﷺ said...').length === 0
 */
const validateArabicLeak = (context: ValidationContext): ValidationError[] => {
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDF9\uFDFB-\uFDFF\uFE70-\uFEFF]+/g;
    const errors: ValidationError[] = [];

    for (const match of context.normalizedResponse.matchAll(arabicPattern)) {
        const matchText = match[0];
        const cleaned = matchText.replace(/ﷺ/g, '').trim();
        if (!cleaned) {
            continue;
        }
        const idx = match.index ?? 0;
        errors.push(
            makeErrorFromNormalized(
                context,
                'arabic_leak',
                `Arabic script detected: "${cleaned}"`,
                cleaned,
                idx,
                idx + matchText.length,
            ),
        );
    }

    return errors;
};

/**
 * Detect wrong diacritics (â/ã/á) that indicate failed ALA-LC macrons.
 *
 * @example
 * validateWrongDiacritics('kâfir')[0]?.type === 'wrong_diacritics'
 */
const validateWrongDiacritics = (context: ValidationContext): ValidationError[] => {
    const wrongPattern = /[âêîôûãñéíóú]/gi;
    const errors: ValidationError[] = [];
    for (const match of context.normalizedResponse.matchAll(wrongPattern)) {
        const matchText = match[0];
        const idx = match.index ?? 0;
        errors.push(
            makeErrorFromNormalized(
                context,
                'wrong_diacritics',
                `Wrong diacritic "${matchText}" detected - use macrons (ā, ī, ū) instead`,
                matchText,
                idx,
                idx + matchText.length,
            ),
        );
    }
    return errors;
};

/**
 * Detect excessive empty parentheses "()" which often indicates failed transliterations.
 *
 * @example
 * // Fail: too many "()"
 * validateEmptyParentheses('() () () ()')[0]?.type === 'empty_parentheses'
 */
const validateEmptyParentheses = (context: ValidationContext): ValidationError[] => {
    const matches = [...context.normalizedResponse.matchAll(/\(\)/g)];
    if (matches.length <= MAX_EMPTY_PARENTHESES) {
        return [];
    }
    return matches.map((match) => {
        const idx = match.index ?? 0;
        return makeErrorFromNormalized(
            context,
            'empty_parentheses',
            `Found ${matches.length} empty parentheses "()" - this usually indicates failed transliterations. Please check if the LLM omitted Arabic/transliterated terms.`,
            match[0],
            idx,
            idx + match[0].length,
        );
    });
};

/**
 * Detect truncated translation vs Arabic source (ratio-based).
 *
 * @example
 * // Fail: long Arabic + very short translation
 * detectTruncatedTranslation('نص عربي طويل ... (50+ chars)', 'Short') !== undefined
 */
const detectTruncatedTranslation = (arabicText: string, translationText: string) => {
    const arabic = (arabicText || '').trim();
    const translation = (translationText || '').trim();

    if (arabic.length < MIN_ARABIC_LENGTH_FOR_TRUNCATION_CHECK) {
        return;
    }
    if (translation.length === 0) {
        return `Translation appears empty but Arabic text has ${arabic.length} characters`;
    }

    const ratio = translation.length / arabic.length;
    if (ratio < MIN_TRANSLATION_RATIO) {
        const expectedMinLength = Math.round(arabic.length * MIN_TRANSLATION_RATIO);
        return `Translation appears truncated: ${translation.length} chars for ${arabic.length} char Arabic text (expected at least ~${expectedMinLength} chars)`;
    }
};

/**
 * Validate per-ID translation lengths (response subset only).
 *
 * @example
 * // Produces a length_mismatch error for the first truncated segment found
 */
const validateTranslationLengthsForResponse = (context: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];
    for (const marker of context.markers) {
        const seg = context.segmentById.get(marker.id);
        if (!seg) {
            continue;
        }
        const translation = context.normalizedResponse.slice(marker.translationStart, marker.translationEnd).trim();
        const error = detectTruncatedTranslation(seg.text, translation);
        if (error) {
            errors.push(
                makeErrorFromRawRange(
                    'length_mismatch',
                    `Translation for "${marker.id}" ${error.replace('Translation ', '').toLowerCase()}`,
                    translation,
                    { end: marker.rawTranslationEnd, start: marker.rawTranslationStart },
                    marker.id,
                ),
            );
        }
    }
    return errors;
};

/**
 * Detect “shouting” ALL CAPS words.
 *
 * @example
 * validateAllCaps('THIS IS LOUD')[0]?.type === 'all_caps'
 */
const validateAllCaps = (context: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];
    const runThreshold = context.config.allCapsWordRunThreshold;
    const runPattern = new RegExp(`\\b(?:[A-Z]{2,}\\b\\s+){${runThreshold - 1}}[A-Z]{2,}\\b`, 'g');
    for (const match of context.normalizedResponse.matchAll(runPattern)) {
        const matchText = match[0];
        const idx = match.index ?? 0;
        errors.push(
            makeErrorFromNormalized(
                context,
                'all_caps',
                `ALL CAPS detected: "${matchText.trim()}"`,
                matchText,
                idx,
                idx + matchText.length,
            ),
        );
    }
    return errors;
};

/**
 * Detect archaic/Biblical register tokens.
 *
 * @example
 * validateArchaicRegister('verily thou shalt')[0]?.type === 'archaic_register'
 */
const validateArchaicRegister = (context: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];
    for (const re of ARCHAIC_PATTERNS) {
        for (const match of context.normalizedResponse.matchAll(re)) {
            const matchText = match[0];
            const idx = match.index ?? 0;
            errors.push(
                makeErrorFromNormalized(
                    context,
                    'archaic_register',
                    `Archaic/Biblical register word detected: "${matchText}"`,
                    matchText,
                    idx,
                    idx + matchText.length,
                ),
            );
        }
    }
    return errors;
};

type LineStartLabelCounts = {
    total: number;
    prefixes: Map<string, number>;
};

const getLineStartLabelCounts = (text: string): LineStartLabelCounts => {
    const prefixes = new Map<string, number>();
    const lines = text.split(/\n/);
    const maxPrefixLength = 28;
    const maxWords = 3;

    for (const rawLine of lines) {
        const line = rawLine.trimStart();
        if (!line) {
            continue;
        }
        const colonIdx = line.search(/[:：]/);
        if (colonIdx <= 0) {
            continue;
        }
        const prefix = line.slice(0, colonIdx).trim();
        if (!prefix || prefix.length > maxPrefixLength) {
            continue;
        }
        const words = prefix.split(/\s+/);
        if (words.length > maxWords) {
            continue;
        }
        const count = prefixes.get(prefix) ?? 0;
        prefixes.set(prefix, count + 1);
    }

    let total = 0;
    for (const count of prefixes.values()) {
        total += count;
    }

    return { prefixes, total };
};

/**
 * Detect per-segment mismatch in colon counts between Arabic segment text and its translation chunk.
 *
 * This is intentionally heuristic and avoids hardcoding speaker label tokens.
 *
 * @example
 * // Arabic: "الشيخ: ... السائل: ..." => 2 colons
 * // Translation: "The Shaykh: ..." => 1 colon => mismatched_colons
 */
const validateMismatchedColons = (context: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];

    for (const marker of context.markers) {
        const seg = context.segmentById.get(marker.id);
        if (!seg) {
            continue;
        }

        const arabicLabels = getLineStartLabelCounts(seg.text);
        const translation = context.normalizedResponse.slice(marker.translationStart, marker.translationEnd);
        const englishLabels = getLineStartLabelCounts(translation);

        if (arabicLabels.total !== englishLabels.total && (arabicLabels.total > 0 || englishLabels.total > 0)) {
            errors.push(
                makeErrorFromRawRange(
                    'mismatched_colons',
                    `Speaker label count mismatch in "${marker.id}": Arabic has ${arabicLabels.total} line-start labels but translation has ${englishLabels.total}. This may indicate dropped/moved speaker turns or formatting drift.`,
                    translation.trim(),
                    { end: marker.rawTranslationEnd, start: marker.rawTranslationStart },
                    marker.id,
                ),
            );
        }
    }

    return errors;
};

/**
 * Detect multi-word transliteration patterns without immediate parenthetical gloss.
 *
 * @example
 * // Fail: "al-hajr fi al-madajīʿ" without "(English ...)" nearby
 * // => multiword_translit_without_gloss
 */
const validateMultiwordTranslitWithoutGloss = (context: ValidationContext): ValidationError[] => {
    const errors: ValidationError[] = [];
    const phrasePattern = /\b(al-[a-zʿʾāīūḥṣḍṭẓ-]+)\s+fi\s+(al-[a-zʿʾāīūḥṣḍṭẓ-]+)\b/gi;

    for (const marker of context.markers) {
        const text = context.normalizedResponse.slice(marker.translationStart, marker.translationEnd);
        if (!text) {
            continue;
        }

        for (const m of text.matchAll(phrasePattern)) {
            const phrase = `${m[1]} fi ${m[2]}`;
            const idx = m.index ?? -1;
            if (idx >= 0) {
                const after = text.slice(idx, Math.min(text.length, idx + phrase.length + 25));
                if (!after.includes('(')) {
                    const normalizedStart = marker.translationStart + idx;
                    const normalizedEnd = normalizedStart + phrase.length;
                    errors.push(
                        makeErrorFromNormalized(
                            context,
                            'multiword_translit_without_gloss',
                            `Multi-word transliteration without immediate gloss in "${marker.id}": "${phrase}"`,
                            phrase,
                            normalizedStart,
                            normalizedEnd,
                            marker.id,
                        ),
                    );
                }
            }
        }
    }

    return errors;
};

const DEFAULT_RULES: ValidationRule[] = [
    { id: 'invalid_marker_format', run: validateMarkerFormat, type: 'invalid_marker_format' },
    { id: 'newline_after_id', run: validateNewlineAfterId, type: 'newline_after_id' },
    { id: 'truncated_segment', run: validateTruncatedSegments, type: 'truncated_segment' },
    { id: 'implicit_continuation', run: validateImplicitContinuation, type: 'implicit_continuation' },
    { id: 'meta_talk', run: validateMetaTalk, type: 'meta_talk' },
    { id: 'duplicate_id', run: validateDuplicateIds, type: 'duplicate_id' },
    { id: 'invented_id', run: validateInventedIds, type: 'invented_id' },
    { id: 'missing_id_gap', run: validateMissingIdGaps, type: 'missing_id_gap' },
    { id: 'arabic_leak', run: validateArabicLeak, type: 'arabic_leak' },
    { id: 'wrong_diacritics', run: validateWrongDiacritics, type: 'wrong_diacritics' },
    { id: 'empty_parentheses', run: validateEmptyParentheses, type: 'empty_parentheses' },
    { id: 'length_mismatch', run: validateTranslationLengthsForResponse, type: 'length_mismatch' },
    { id: 'all_caps', run: validateAllCaps, type: 'all_caps' },
    { id: 'archaic_register', run: validateArchaicRegister, type: 'archaic_register' },
    { id: 'mismatched_colons', run: validateMismatchedColons, type: 'mismatched_colons' },
    {
        id: 'multiword_translit_without_gloss',
        run: validateMultiwordTranslitWithoutGloss,
        type: 'multiword_translit_without_gloss',
    },
];
