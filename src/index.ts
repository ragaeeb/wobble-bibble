// =============================================================================
// VALIDATION
// =============================================================================

// =============================================================================
// CONSTANTS
// =============================================================================
export { MARKER_ID_PATTERN, Markers, TRANSLATION_MARKER_PARTS } from './constants';
// =============================================================================
// FORMATTING
// =============================================================================
export { formatExcerptsForPrompt } from './formatting';
export type { PromptId, PromptMetadata, StackedPrompt } from './prompts';
// =============================================================================
// PROMPTS
// =============================================================================
export {
    getMasterPrompt,
    getPrompt,
    getPromptIds,
    getPrompts,
    getStackedPrompt,
    stackPrompts,
} from './prompts';
export type { TranslationValidationResult, ValidationWarning, ValidationWarningType } from './validation';
export {
    detectArabicScript,
    detectDuplicateIds,
    detectForbiddenTerms,
    detectImplicitContinuation,
    detectMetaTalk,
    detectNewlineAfterId,
    detectWrongDiacritics,
    extractIdNumber,
    extractIdPrefix,
    extractTranslationIds,
    findUnmatchedTranslationIds,
    normalizeTranslationText,
    validateNumericOrder,
    validateTranslationMarkers,
    validateTranslationOrder,
    validateTranslations,
} from './validation';
