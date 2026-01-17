import { ARCHAIC_WORDS, MARKER_ID_PATTERN, TRANSLATION_MARKER_PARTS } from './constants';
import { extractTranslationIds, normalizeTranslationText } from './textUtils';
import type { Segment, ValidationError, ValidationErrorType } from './types';

/**
 * Human-readable descriptions for each `ValidationErrorType`, intended for client UIs and logs.
 *
 * @example
 * VALIDATION_ERROR_TYPE_INFO.arabic_leak.description
 */
export const VALIDATION_ERROR_TYPE_INFO = {
    all_caps: {
        description: 'ALL CAPS “shouting” word detected (5+ letters).',
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
    forbidden_term: {
        description: 'A forbidden glossary “gravity well” spelling was detected (e.g., "Sheikh" instead of "Shaykh").',
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
            'Per-segment colon count mismatch between Arabic segment text and its translation chunk (counts ":" and "：").',
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

const MAX_EMPTY_PARENTHESES = 3;
const MIN_ARABIC_LENGTH_FOR_TRUNCATION_CHECK = 50;
const MIN_TRANSLATION_RATIO = 0.25;

const COLON_PATTERN = /[:：]/g;

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
 *   [{ id: 'P1', content: 'نص عربي طويل...' }],
 *   'P1 - A complete translation.'
 * ).errors.length === 0
 *
 * @example
 * // Fail (invented ID)
 * validateTranslationResponse(
 *   [{ id: 'P1', content: 'نص عربي طويل...' }],
 *   'P2 - This ID is not in the corpus.'
 * ).errors.some(e => e.type === 'invented_id') === true
 */
export const validateTranslationResponse = (segments: Segment[], response: string) => {
    const normalizedResponse = normalizeTranslationText(response);
    const parsedIds = extractTranslationIds(normalizedResponse);

    if (parsedIds.length === 0) {
        return {
            errors: [{ message: 'No valid translation markers found', type: 'no_valid_markers' }],
            normalizedResponse,
            parsedIds: [],
        };
    }

    const segmentById = new Map<string, Segment>();
    for (const s of segments) {
        segmentById.set(s.id, s);
    }

    const responseById = splitResponseById(normalizedResponse);

    const errors: ValidationError[] = [
        ...validateMarkerFormat(normalizedResponse),
        ...validateNewlineAfterId(normalizedResponse),
        ...validateTruncatedSegments(normalizedResponse),
        ...validateImplicitContinuation(normalizedResponse),
        ...validateMetaTalk(normalizedResponse),
        ...validateForbiddenTerms(normalizedResponse),
        ...validateDuplicateIds(parsedIds),
        ...validateInventedIds(parsedIds, segmentById),
        ...validateMissingIdGaps(parsedIds, segmentById, segments),
        ...validateArabicLeak(normalizedResponse),
        ...validateWrongDiacritics(normalizedResponse),
        ...validateEmptyParentheses(normalizedResponse),
        ...validateTranslationLengthsForResponse(parsedIds, segmentById, responseById),
        ...validateAllCaps(normalizedResponse),
        ...validateArchaicRegister(normalizedResponse),
        ...validateMismatchedColons(parsedIds, segmentById, responseById),
        ...validateMultiwordTranslitWithoutGloss(parsedIds, responseById),
    ];

    return { errors, normalizedResponse, parsedIds };
};

/**
 * Split the response into a per-ID map. Values contain translation content only (prefix removed).
 *
 * @example
 * splitResponseById('P1 - a\\nP2 - b').get('P1') === 'a'
 */
const splitResponseById = (text: string) => {
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

/**
 * Validate translation marker format (single-line errors).
 *
 * @example
 * // Fail: malformed marker
 * validateMarkerFormat('B1234$5 - x')[0]?.type === 'invalid_marker_format'
 */
const validateMarkerFormat = (text: string): ValidationError[] => {
    const { markers, digits, suffix, dashes, optionalSpace } = TRANSLATION_MARKER_PARTS;

    const invalidRefPattern = new RegExp(
        `^${markers}(?=${digits})(?=.*${dashes})(?!${digits}${suffix}*${optionalSpace}${dashes})[^\\s-–—]+${optionalSpace}${dashes}`,
        'm',
    );
    const invalidRef = text.match(invalidRefPattern);
    if (invalidRef) {
        return [
            {
                message: `Invalid reference format "${invalidRef[0].trim()}" - expected format is letter + numbers + optional suffix (a-j) + dash`,
                type: 'invalid_marker_format',
            },
        ];
    }

    const spaceBeforePattern = new RegExp(` ${markers}${digits}${suffix}+${optionalSpace}${dashes}`, 'm');
    const suffixNoDashPattern = new RegExp(`^${markers}${digits}${suffix}(?! ${dashes})`, 'm');
    const suspicious = text.match(spaceBeforePattern) || text.match(suffixNoDashPattern);
    if (suspicious) {
        return [
            {
                match: suspicious[0],
                message: `Suspicious reference found: "${suspicious[0]}"`,
                type: 'invalid_marker_format',
            },
        ];
    }

    const emptyAfterDashPattern = new RegExp(`^${MARKER_ID_PATTERN}${optionalSpace}${dashes}\\s*$`, 'm');
    const emptyAfterDash = text.match(emptyAfterDashPattern);
    if (emptyAfterDash) {
        return [
            {
                match: emptyAfterDash[0].trim(),
                message: `Reference "${emptyAfterDash[0].trim()}" has dash but no content after it`,
                type: 'invalid_marker_format',
            },
        ];
    }

    const dollarSignPattern = new RegExp(`^${markers}${digits}\\$${digits}`, 'm');
    const dollarSignRef = text.match(dollarSignPattern);
    if (dollarSignRef) {
        return [
            {
                match: dollarSignRef[0],
                message: `Invalid reference format "${dollarSignRef[0]}" - contains $ character`,
                type: 'invalid_marker_format',
            },
        ];
    }

    return [];
};

/**
 * Detect newline after an ID line (formatting bug).
 *
 * @example
 * // Fail: newline after "P1 -"
 * validateNewlineAfterId('P1 -\\nText')[0]?.type === 'newline_after_id'
 */
const validateNewlineAfterId = (text: string): ValidationError[] => {
    const pattern = new RegExp(
        `^${MARKER_ID_PATTERN}${TRANSLATION_MARKER_PARTS.optionalSpace}${TRANSLATION_MARKER_PARTS.dashes}\\s*\\n`,
        'm',
    );
    const match = text.match(pattern);
    return match
        ? [
              {
                  match: match[0].trim(),
                  message: `Invalid format: newline after ID "${match[0].trim()}" - use "ID - Text" format`,
                  type: 'newline_after_id',
              },
          ]
        : [];
};

/**
 * Detect duplicated IDs in the parsed ID list.
 *
 * @example
 * validateDuplicateIds(['P1','P1'])[0]?.type === 'duplicate_id'
 */
const validateDuplicateIds = (ids: string[]): ValidationError[] => {
    const seen = new Set<string>();
    for (const id of ids) {
        if (seen.has(id)) {
            return [
                {
                    id,
                    message: `Duplicate ID "${id}" detected - each segment should appear only once`,
                    type: 'duplicate_id',
                },
            ];
        }
        seen.add(id);
    }
    return [];
};

/**
 * Detect IDs in the response that do not exist in the passed segment corpus.
 *
 * @example
 * validateInventedIds(['P1','P2'], new Map([['P1',{id:'P1',text:'x'}]]) )[0]?.type === 'invented_id'
 */
const validateInventedIds = (outputIds: string[], segmentById: Map<string, Segment>): ValidationError[] => {
    const invented = outputIds.filter((id) => !segmentById.has(id));
    return invented.length > 0
        ? [
              {
                  match: invented.join(','),
                  message: `Invented ID(s) detected: ${invented.map((id) => `"${id}"`).join(', ')} - these IDs do not exist in the source`,
                  type: 'invented_id',
              },
          ]
        : [];
};

/**
 * Detect a “gap”: response contains IDs A and C, but the corpus order includes B between them.
 * This only checks for missing IDs between consecutive IDs within each response-ordered block.
 *
 * @example
 * // Corpus: P1, P2, P3. Response: P1, P3 => missing_id_gap includes P2
 */
const validateMissingIdGaps = (
    parsedIds: string[],
    segmentById: Map<string, Segment>,
    segments: Segment[],
): ValidationError[] => {
    const indexById = new Map<string, number>();
    for (let i = 0; i < segments.length; i++) {
        indexById.set(segments[i].id, i);
    }

    const parsedIdSet = new Set(parsedIds);
    const missing = new Set<string>();

    const collectMissingBetween = (startIdx: number, endIdx: number) => {
        for (let j = startIdx + 1; j < endIdx; j++) {
            const midId = segments[j]?.id;
            if (midId && segmentById.has(midId) && !parsedIdSet.has(midId)) {
                missing.add(midId);
            }
        }
    };

    for (let i = 0; i < parsedIds.length - 1; i++) {
        const a = parsedIds[i];
        const b = parsedIds[i + 1];
        if (!segmentById.has(a) || !segmentById.has(b)) {
            continue;
        }

        const ia = indexById.get(a);
        const ib = indexById.get(b);
        if (ia == null || ib == null) {
            continue;
        }

        // Reset blocks when order goes backwards (block pasting)
        if (ib < ia) {
            continue;
        }

        collectMissingBetween(ia, ib);
    }

    const uniqueMissing = [...missing];
    return uniqueMissing.length > 0
        ? [
              {
                  match: uniqueMissing.join(','),
                  message: `Missing segment ID(s) detected between translated IDs: ${uniqueMissing.map((id) => `"${id}"`).join(', ')}`,
                  type: 'missing_id_gap',
              },
          ]
        : [];
};

/**
 * Detect segments that appear truncated (just "…" / "..." / "[INCOMPLETE]").
 *
 * @example
 * validateTruncatedSegments('P1 - …')[0]?.type === 'truncated_segment'
 */
const validateTruncatedSegments = (text: string): ValidationError[] => {
    const segmentPattern = /^([A-Z]\d+[a-j]?)\s*[-–—]\s*(.*)$/gm;
    const truncated: string[] = [];
    for (const match of text.matchAll(segmentPattern)) {
        const id = match[1];
        const content = match[2].trim();
        if (!content || content === '…' || content === '...' || content === '[INCOMPLETE]') {
            truncated.push(id);
        }
    }
    return truncated.length > 0
        ? [
              {
                  match: truncated.join(','),
                  message: `Truncated segment(s) detected: ${truncated.map((id) => `"${id}"`).join(', ')} - segments must be fully translated`,
                  type: 'truncated_segment',
              },
          ]
        : [];
};

/**
 * Detect implicit continuation markers.
 *
 * @example
 * validateImplicitContinuation('P1 - continued: ...')[0]?.type === 'implicit_continuation'
 */
const validateImplicitContinuation = (text: string): ValidationError[] => {
    const patterns = [/implicit continuation/i, /\bcontinuation:/i, /\bcontinued:/i];
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return [
                {
                    match: match[0],
                    message: `Detected "${match[0]}" - do not add implicit continuation text`,
                    type: 'implicit_continuation',
                },
            ];
        }
    }
    return [];
};

/**
 * Detect meta-talk (translator/editor notes).
 *
 * @example
 * validateMetaTalk("P1 - (Translator's note: ...)")[0]?.type === 'meta_talk'
 */
const validateMetaTalk = (text: string): ValidationError[] => {
    const patterns = [/\(note:/i, /\(translator'?s? note:/i, /\[editor:/i, /\[note:/i, /\(ed\.:/i, /\(trans\.:/i];
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return [
                {
                    match: match[0],
                    message: `Detected meta-talk "${match[0]}" - output translation only, no translator/editor notes`,
                    type: 'meta_talk',
                },
            ];
        }
    }
    return [];
};

/**
 * Detect common “gravity well” spellings that violate locked glossary rules.
 *
 * @example
 * validateForbiddenTerms('P1 - Sheikh said...')[0]?.type === 'forbidden_term'
 */
const validateForbiddenTerms = (text: string): ValidationError[] => {
    const forbidden: Array<{ term: RegExp; correct: string }> = [
        { correct: 'Shaykh', term: /\bSheikh\b/i },
        { correct: 'Qurʾān', term: /\bKoran\b/i },
        { correct: 'ḥadīth', term: /\bHadith\b/ },
        { correct: 'Islām', term: /\bIslam\b/ },
        { correct: 'Salafīyyah', term: /\bSalafism\b/i },
    ];
    for (const { term, correct } of forbidden) {
        const match = text.match(term);
        if (match) {
            return [
                {
                    match: match[0],
                    message: `Forbidden term "${match[0]}" detected - use "${correct}" instead`,
                    type: 'forbidden_term',
                },
            ];
        }
    }
    return [];
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
const validateArabicLeak = (text: string): ValidationError[] => {
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDF9\uFDFB-\uFDFF\uFE70-\uFEFF]+/g;
    const matches = text.match(arabicPattern) ?? [];

    // Allow ﷺ (U+FDFD) as an explicit exception.
    const normalized = matches
        .map((m) => m.replace(/ﷺ/g, ''))
        .map((m) => m.trim())
        .filter((m) => m.length > 0);

    return normalized.map((match) => ({ match, message: `Arabic script detected: "${match}"`, type: 'arabic_leak' }));
};

/**
 * Detect wrong diacritics (â/ã/á) that indicate failed ALA-LC macrons.
 *
 * @example
 * validateWrongDiacritics('kâfir')[0]?.type === 'wrong_diacritics'
 */
const validateWrongDiacritics = (text: string): ValidationError[] => {
    const wrongPattern = /[âêîôûãñáéíóú]/gi;
    const matches = text.match(wrongPattern) ?? [];
    const unique = [...new Set(matches)];
    return unique.map((m) => ({
        match: m,
        message: `Wrong diacritic "${m}" detected - use macrons (ā, ī, ū) instead`,
        type: 'wrong_diacritics',
    }));
};

/**
 * Detect excessive empty parentheses "()" which often indicates failed transliterations.
 *
 * @example
 * // Fail: too many "()"
 * validateEmptyParentheses('() () () ()')[0]?.type === 'empty_parentheses'
 */
const validateEmptyParentheses = (text: string): ValidationError[] => {
    const count = text.match(/\(\)/g)?.length ?? 0;
    return count > MAX_EMPTY_PARENTHESES
        ? [
              {
                  message: `Found ${count} empty parentheses "()" - this usually indicates failed transliterations. Please check if the LLM omitted Arabic/transliterated terms.`,
                  type: 'empty_parentheses',
              },
          ]
        : [];
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
const validateTranslationLengthsForResponse = (
    parsedIds: string[],
    segmentById: Map<string, Segment>,
    responseById: Map<string, string>,
) => {
    for (const id of parsedIds) {
        const seg = segmentById.get(id);
        const translation = responseById.get(id);
        if (!seg || translation == null) {
            continue;
        }
        const error = detectTruncatedTranslation(seg.text, translation);
        if (error) {
            const e = {
                id,
                message: `Translation for "${id}" ${error.replace('Translation ', '').toLowerCase()}`,
                type: 'length_mismatch',
            } as const satisfies ValidationError;
            return [e];
        }
    }
    return [] as ValidationError[];
};

/**
 * Detect “shouting” ALL CAPS words.
 *
 * @example
 * validateAllCaps('THIS IS LOUD')[0]?.type === 'all_caps'
 */
const validateAllCaps = (text: string): ValidationError[] => {
    const matches = text.match(/\b[A-Z]{5,}\b/g) ?? [];
    const unique = [...new Set(matches)];
    return unique.map((m) => ({ match: m, message: `ALL CAPS detected: "${m}"`, type: 'all_caps' }));
};

/**
 * Detect archaic/Biblical register tokens.
 *
 * @example
 * validateArchaicRegister('verily thou shalt')[0]?.type === 'archaic_register'
 */
const validateArchaicRegister = (text: string): ValidationError[] => {
    const found: string[] = [];
    for (const w of ARCHAIC_WORDS) {
        const re = new RegExp(`\\b${w}\\b`, 'i');
        const m = text.match(re);
        if (m) {
            found.push(m[0]);
        }
    }
    return [...new Set(found)].map((m) => ({
        match: m,
        message: `Archaic/Biblical register word detected: "${m}"`,
        type: 'archaic_register',
    }));
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
const validateMismatchedColons = (
    parsedIds: string[],
    segmentById: Map<string, Segment>,
    responseById: Map<string, string>,
): ValidationError[] => {
    const errors: ValidationError[] = [];

    for (const id of parsedIds) {
        const seg = segmentById.get(id);
        const translation = responseById.get(id);
        if (!seg || !translation) {
            continue;
        }

        const arabicCount = seg.text.match(COLON_PATTERN)?.length ?? 0;
        const englishCount = translation.match(COLON_PATTERN)?.length ?? 0;

        if (arabicCount === englishCount) {
            continue;
        }

        errors.push({
            id,
            match: `${arabicCount} vs ${englishCount}`,
            message: `Colon count mismatch in "${id}": Arabic has ${arabicCount} ":" but translation has ${englishCount}. This may indicate dropped/moved speaker turns or formatting drift.`,
            type: 'mismatched_colons',
        });
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
const validateMultiwordTranslitWithoutGloss = (
    parsedIds: string[],
    responseById: Map<string, string>,
): ValidationError[] => {
    const errors: ValidationError[] = [];
    const phrasePattern = /\b(al-[a-zʿʾāīūḥṣḍṭẓ-]+)\s+fi\s+(al-[a-zʿʾāīūḥṣḍṭẓ-]+)\b/gi;

    for (const id of parsedIds) {
        const text = responseById.get(id);
        if (!text) {
            continue;
        }

        for (const m of text.matchAll(phrasePattern)) {
            const phrase = `${m[1]} fi ${m[2]}`;
            const idx = m.index ?? -1;
            if (idx >= 0) {
                const after = text.slice(idx, Math.min(text.length, idx + phrase.length + 25));
                if (!after.includes('(')) {
                    errors.push({
                        id,
                        match: phrase,
                        message: `Multi-word transliteration without immediate gloss in "${id}": "${phrase}"`,
                        type: 'multiword_translit_without_gloss',
                    });
                }
            }
        }
    }

    return errors;
};
