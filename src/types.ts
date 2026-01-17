/**
 * A single segment (Arabic source excerpt) identified by an ID.
 *
 * Canonical shape (breaking change): `{ id, text }`.
 *
 * @example
 * const seg: Segment = { id: 'P1', text: 'نص عربي...' };
 */
export type Segment = { id: string; text: string };

/**
 * Machine-readable error types emitted by the validator.
 * Keep these stable: clients may map them to UI severities.
 */
export type ValidationErrorType =
    | 'invalid_marker_format'
    | 'no_valid_markers'
    | 'newline_after_id'
    | 'duplicate_id'
    | 'invented_id'
    | 'missing_id_gap'
    | 'mismatched_colons'
    | 'truncated_segment'
    | 'implicit_continuation'
    | 'meta_talk'
    | 'forbidden_term'
    | 'arabic_leak'
    | 'wrong_diacritics'
    | 'empty_parentheses'
    | 'length_mismatch'
    | 'all_caps'
    | 'archaic_register'
    | 'multiword_translit_without_gloss';

/**
 * A single validation error.
 */
export type ValidationError = { type: ValidationErrorType; message: string; id?: string; match?: string };

/**
 * Result of validating an LLM translation response against a set of source segments.
 */
export type ValidationResponseResult = { normalizedResponse: string; parsedIds: string[]; errors: ValidationError[] };

