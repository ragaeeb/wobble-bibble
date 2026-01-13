import { MARKER_ID_PATTERN, TRANSLATION_MARKER_PARTS } from './constants';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Warning types for soft validation issues
 */
export type ValidationWarningType = 'arabic_leak' | 'wrong_diacritics';

/**
 * A soft validation warning (not a hard error)
 */
export type ValidationWarning = {
    type: ValidationWarningType;
    message: string;
    match?: string;
};

/**
 * Result of translation validation
 */
export type TranslationValidationResult = {
    /** Whether validation passed */
    isValid: boolean;
    /** Error message if validation failed */
    error?: string;
    /** Normalized/fixed text (with merged markers split onto separate lines) */
    normalizedText: string;
    /** List of parsed translation IDs in order */
    parsedIds: string[];
    /** Soft warnings (issues that don't fail validation) */
    warnings?: ValidationWarning[];
};

// =============================================================================
// SOFT VALIDATORS (return warnings)
// =============================================================================

/**
 * Detects Arabic script in text (except allowed ﷺ symbol).
 * This is a SOFT warning - Arabic leak is bad but not a hard failure.
 */
export const detectArabicScript = (text: string): ValidationWarning[] => {
    const warnings: ValidationWarning[] = [];
    // Arabic Unicode range: \u0600-\u06FF, \u0750-\u077F, \uFB50-\uFDFF, \uFE70-\uFEFF
    // Exclude ﷺ (U+FDFA)
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDF9\uFDFB-\uFDFF\uFE70-\uFEFF]+/g;
    const matches = text.match(arabicPattern);

    if (matches) {
        for (const match of matches) {
            warnings.push({
                match,
                message: `Arabic script detected: "${match}"`,
                type: 'arabic_leak',
            });
        }
    }

    return warnings;
};

/**
 * Detects wrong diacritics (â/ã/á instead of correct macrons ā/ī/ū).
 * This is a SOFT warning - wrong diacritics are bad but not a hard failure.
 */
export const detectWrongDiacritics = (text: string): ValidationWarning[] => {
    const warnings: ValidationWarning[] = [];
    // Wrong diacritics: circumflex (â/ê/î/ô/û), tilde (ã/ñ), acute (á/é/í/ó/ú)
    const wrongPattern = /[âêîôûãñáéíóú]/gi;
    const matches = text.match(wrongPattern);

    if (matches) {
        const uniqueMatches = [...new Set(matches)];
        for (const match of uniqueMatches) {
            warnings.push({
                match,
                message: `Wrong diacritic "${match}" detected - use macrons (ā, ī, ū) instead`,
                type: 'wrong_diacritics',
            });
        }
    }

    return warnings;
};

// =============================================================================
// HARD VALIDATORS (return error strings)
// =============================================================================

/**
 * Detects newline immediately after segment ID (the "Gemini bug").
 * Format should be "P1234 - Text" not "P1234\nText".
 */
export const detectNewlineAfterId = (text: string): string | undefined => {
    const pattern = new RegExp(`^${MARKER_ID_PATTERN}\\n`, 'm');
    const match = text.match(pattern);

    if (match) {
        return `Invalid format: newline after ID "${match[0].trim()}" - use "ID - Text" format`;
    }
};

/**
 * Detects forbidden terms from the locked glossary.
 * These are common "gravity well" spellings that should be avoided.
 */
export const detectForbiddenTerms = (text: string): string | undefined => {
    const forbidden: Array<{ term: RegExp; correct: string }> = [
        { correct: 'Shaykh', term: /\bSheikh\b/i },
        { correct: 'Qurʾān', term: /\bKoran\b/i },
        { correct: 'ḥadīth', term: /\bHadith\b/ }, // Case-sensitive: Hadith without dots
        { correct: 'Islām', term: /\bIslam\b/ }, // Case-sensitive: Islam without macron
        { correct: 'Salafīyyah', term: /\bSalafism\b/i },
    ];

    for (const { term, correct } of forbidden) {
        const match = text.match(term);
        if (match) {
            return `Forbidden term "${match[0]}" detected - use "${correct}" instead`;
        }
    }
};

/**
 * Detects implicit continuation text that LLMs add when hallucinating.
 */
export const detectImplicitContinuation = (text: string): string | undefined => {
    const patterns = [/implicit continuation/i, /\bcontinuation:/i, /\bcontinued:/i];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return `Detected "${match[0]}" - do not add implicit continuation text`;
        }
    }
};

/**
 * Detects meta-talk (translator notes, editor comments) that violate NO META-TALK.
 */
export const detectMetaTalk = (text: string): string | undefined => {
    const patterns = [/\(note:/i, /\(translator'?s? note:/i, /\[editor:/i, /\[note:/i, /\(ed\.:/i, /\(trans\.:/i];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return `Detected meta-talk "${match[0]}" - output translation only, no translator/editor notes`;
        }
    }
};

/**
 * Detects duplicate segment IDs in the output.
 */
export const detectDuplicateIds = (ids: string[]): string | undefined => {
    const seen = new Set<string>();
    for (const id of ids) {
        if (seen.has(id)) {
            return `Duplicate ID "${id}" detected - each segment should appear only once`;
        }
        seen.add(id);
    }
};

/**
 * Validates translation marker format and returns error message if invalid.
 * Catches common AI hallucinations like malformed reference IDs.
 *
 * @param text - Raw translation text to validate
 * @returns Error message if invalid, undefined if valid
 */
export const validateTranslationMarkers = (text: string): string | undefined => {
    const { markers, digits, suffix, dashes, optionalSpace } = TRANSLATION_MARKER_PARTS;

    // Check for invalid reference format (with dash but wrong structure)
    // This catches cases like B12a34 -, P1x2y3 -, P2247$2 -, etc.
    // Requires at least one digit after the marker to be considered a potential reference
    const invalidRefPattern = new RegExp(
        `^${markers}(?=${digits})(?=.*${dashes})(?!${digits}${suffix}*${optionalSpace}${dashes})[^\\s-–—]+${optionalSpace}${dashes}`,
        'm',
    );
    const invalidRef = text.match(invalidRefPattern);

    if (invalidRef) {
        return `Invalid reference format "${invalidRef[0].trim()}" - expected format is letter + numbers + optional suffix (a-j) + dash`;
    }

    // Check for space before reference with multi-letter suffix (e.g., " P123ab -")
    const spaceBeforePattern = new RegExp(` ${markers}${digits}${suffix}+${optionalSpace}${dashes}`, 'm');

    // Check for reference with single letter suffix but no dash after (e.g., "P123a without")
    const suffixNoDashPattern = new RegExp(`^${markers}${digits}${suffix}(?! ${dashes})`, 'm');

    const match = text.match(spaceBeforePattern) || text.match(suffixNoDashPattern);

    if (match) {
        return `Suspicious reference found: "${match[0]}"`;
    }

    // Check for references with dash but no content after (e.g., "P123 -")
    const emptyAfterDashPattern = new RegExp(`^${MARKER_ID_PATTERN}${optionalSpace}${dashes}\\s*$`, 'm');
    const emptyAfterDash = text.match(emptyAfterDashPattern);

    if (emptyAfterDash) {
        return `Reference "${emptyAfterDash[0].trim()}" has dash but no content after it`;
    }

    // Check for $ character in references (invalid format like B1234$5)
    const dollarSignPattern = new RegExp(`^${markers}${digits}\\$${digits}`, 'm');
    const dollarSignRef = text.match(dollarSignPattern);

    if (dollarSignRef) {
        return `Invalid reference format "${dollarSignRef[0]}" - contains $ character`;
    }
};

/**
 * Normalizes translation text by splitting merged markers onto separate lines.
 * LLMs sometimes put multiple translations on the same line.
 *
 * @param content - Raw translation text
 * @returns Normalized text with each marker on its own line
 */
export const normalizeTranslationText = (content: string): string => {
    const mergedMarkerPattern = new RegExp(
        ` (${MARKER_ID_PATTERN}${TRANSLATION_MARKER_PARTS.optionalSpace}${TRANSLATION_MARKER_PARTS.dashes})`,
        'gm',
    );

    return content.replace(mergedMarkerPattern, '\n$1').replace(/\\\[/gm, '[');
};

/**
 * Extracts translation IDs from text in order of appearance.
 *
 * @param text - Translation text
 * @returns Array of IDs in order
 */
export const extractTranslationIds = (text: string): string[] => {
    const { dashes, optionalSpace } = TRANSLATION_MARKER_PARTS;
    const pattern = new RegExp(`^(${MARKER_ID_PATTERN})${optionalSpace}${dashes}`, 'gm');
    const ids: string[] = [];

    for (const match of text.matchAll(pattern)) {
        ids.push(match[1]);
    }

    return ids;
};

/**
 * Extracts the numeric portion from an excerpt ID.
 * E.g., "P11622a" -> 11622, "C123" -> 123, "B45b" -> 45
 *
 * @param id - Excerpt ID
 * @returns Numeric portion of the ID
 */
export const extractIdNumber = (id: string): number => {
    const match = id.match(/\d+/);
    return match ? Number.parseInt(match[0], 10) : 0;
};

/**
 * Extracts the prefix (type) from an excerpt ID.
 * E.g., "P11622a" -> "P", "C123" -> "C", "B45" -> "B"
 *
 * @param id - Excerpt ID
 * @returns Single character prefix
 */
export const extractIdPrefix = (id: string): string => {
    return id.charAt(0);
};

/**
 * Validates that translation IDs appear in ascending numeric order within the same prefix type.
 * This catches LLM errors where translations are output in wrong order (e.g., P12659 before P12651).
 *
 * @param translationIds - IDs from pasted translations
 * @returns Error message if order issue detected, undefined if valid
 */
export const validateNumericOrder = (translationIds: string[]): string | undefined => {
    if (translationIds.length < 2) {
        return;
    }

    // Track last seen number for each prefix type
    const lastNumberByPrefix = new Map<string, { id: string; num: number }>();

    for (const id of translationIds) {
        const prefix = extractIdPrefix(id);
        const num = extractIdNumber(id);

        const last = lastNumberByPrefix.get(prefix);

        if (last && num < last.num) {
            // Out of numeric order within the same prefix type
            return `Numeric order error: "${id}" (${num}) appears after "${last.id}" (${last.num}) but should come before it`;
        }

        lastNumberByPrefix.set(prefix, { id, num });
    }
};

/**
 * Validates translation order against expected excerpt order from the store.
 * Allows pasting in multiple blocks where each block is internally ordered.
 * Resets (position going backwards) are allowed between blocks.
 * Errors only when there's disorder WITHIN a block (going backwards then forwards).
 *
 * @param translationIds - IDs from pasted translations
 * @param expectedIds - IDs from store excerpts/headings/footnotes in order
 * @returns Error message if order issue detected, undefined if valid
 */
export const validateTranslationOrder = (translationIds: string[], expectedIds: string[]): string | undefined => {
    if (translationIds.length === 0 || expectedIds.length === 0) {
        return;
    }

    // Build a map of expected ID positions for O(1) lookup
    const expectedPositions = new Map<string, number>();
    for (let i = 0; i < expectedIds.length; i++) {
        expectedPositions.set(expectedIds[i], i);
    }

    // Track position within current block
    // When position goes backwards, we start a new block
    // Error only if we go backwards THEN forwards within the same conceptual sequence
    let lastExpectedPosition = -1;
    let blockStartPosition = -1;
    let lastFoundId: string | null = null;

    for (const translationId of translationIds) {
        const expectedPosition = expectedPositions.get(translationId);

        if (expectedPosition === undefined) {
            // ID not found in expected list - skip
            continue;
        }

        if (lastFoundId !== null) {
            if (expectedPosition < lastExpectedPosition) {
                // Reset detected - starting a new block
                // This is allowed, just track the new block's start
                blockStartPosition = expectedPosition;
            } else if (expectedPosition < blockStartPosition && blockStartPosition !== -1) {
                // Within the current block, we went backwards - this is an error
                // This catches: A, B, C (block 1), D, E, C (error: C < E but we're in block starting at D)
                return `Order error: "${translationId}" appears after "${lastFoundId}" but comes before it in the excerpts. This suggests a duplicate or misplaced translation.`;
            }
        } else {
            blockStartPosition = expectedPosition;
        }

        lastExpectedPosition = expectedPosition;
        lastFoundId = translationId;
    }
};

/**
 * Performs comprehensive validation on translation text.
 * Validates markers, normalizes text, and checks order against expected IDs.
 *
 * @param rawText - Raw translation text from user input
 * @param expectedIds - Expected IDs from store (excerpts + headings + footnotes)
 * @returns Validation result with normalized text and any errors
 */
export const validateTranslations = (rawText: string, expectedIds: string[]): TranslationValidationResult => {
    // First normalize the text (split merged markers)
    const normalizedText = normalizeTranslationText(rawText);

    // Validate marker formats
    const markerError = validateTranslationMarkers(normalizedText);
    if (markerError) {
        return { error: markerError, isValid: false, normalizedText, parsedIds: [] };
    }

    // Extract IDs from normalized text
    const parsedIds = extractTranslationIds(normalizedText);

    if (parsedIds.length === 0) {
        return { error: 'No valid translation markers found', isValid: false, normalizedText, parsedIds: [] };
    }

    // Validate order against expected IDs
    const orderError = validateTranslationOrder(parsedIds, expectedIds);
    if (orderError) {
        return { error: orderError, isValid: false, normalizedText, parsedIds };
    }

    return { isValid: true, normalizedText, parsedIds };
};

/**
 * Finds translation IDs that don't exist in the expected store IDs.
 * Used to validate that all pasted translations can be matched before committing.
 *
 * @param translationIds - IDs from parsed translations
 * @param expectedIds - IDs from store (excerpts + headings + footnotes)
 * @returns Array of IDs that exist in translations but not in the store
 */
export const findUnmatchedTranslationIds = (translationIds: string[], expectedIds: string[]): string[] => {
    const expectedSet = new Set(expectedIds);
    return translationIds.filter((id) => !expectedSet.has(id));
};
