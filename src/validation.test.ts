import { describe, expect, it } from 'bun:test';
import { validateTranslationResponse } from './validation';

describe('validateTranslationResponse', () => {
    it('should return no errors for a basic valid response and should only validate IDs present in the response', () => {
        const segments = [
            { id: 'P1', text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
            { id: 'P2', text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
            { id: 'P999', text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' }, // corpus noise
        ];

        const response = `P1 - This is a sufficiently long English translation to avoid truncation checks.
P2 - This is also a sufficiently long English translation to avoid truncation checks.`;

        const result = validateTranslationResponse(segments, response);
        expect(result.parsedIds).toEqual(['P1', 'P2']);
        expect(result.errors.length).toBe(0);
    });

    it('should detect marker format errors (invalid ref / suspicious ref / empty after dash / dollar sign)', () => {
        const segments = [
            { id: 'P1', text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
        ];

        // invalid format like B12a34 -
        const invalidRef = validateTranslationResponse(segments, 'B12a34 - Invalid format\nP1 - Ok');
        expect(invalidRef.errors.some((e) => e.type === 'invalid_marker_format')).toBeTrue();

        // suspicious multi-letter suffix with space before
        const suspicious = validateTranslationResponse(segments, 'Some text P123ab - Translation\nP1 - Ok');
        expect(suspicious.errors.some((e) => e.type === 'invalid_marker_format')).toBeTrue();

        // empty after dash
        const emptyAfterDash = validateTranslationResponse(segments, 'P1 -   ');
        expect(emptyAfterDash.errors.some((e) => e.type === 'invalid_marker_format')).toBeTrue();

        // dollar sign
        const dollar = validateTranslationResponse(segments, 'B1234$5 - Invalid\nP1 - Ok');
        expect(dollar.errors.some((e) => e.type === 'invalid_marker_format')).toBeTrue();
    });

    it('should return no_valid_markers when there are no markers at all', () => {
        const segments = [{ id: 'P1', text: 'نص عربي' }];
        const result = validateTranslationResponse(segments, 'Just some text without markers');
        expect(result.parsedIds).toEqual([]);
        expect(result.errors.some((e) => e.type === 'no_valid_markers')).toBeTrue();
    });

    it('should detect invented IDs when response references IDs not present in the segment corpus', () => {
        const segments = [
            { id: 'P1', text: 'نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
        ];
        const response = `P1 - Valid translation.\nP2 - Invented.`;
        const result = validateTranslationResponse(segments, response);
        expect(result.errors.some((e) => e.type === 'invented_id')).toBeTrue();
    });

    it('should detect duplicate IDs', () => {
        const segments = [
            { id: 'P1', text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
        ];
        const response = `P1 - First.\nP1 - Second.`;
        const result = validateTranslationResponse(segments, response);
        expect(result.errors.some((e) => e.type === 'duplicate_id')).toBeTrue();
    });

    it('should detect newline after ID', () => {
        const segments = [
            { id: 'P1', text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
        ];
        const response = `P1 -\nText`;
        const result = validateTranslationResponse(segments, response);
        expect(result.errors.some((e) => e.type === 'newline_after_id')).toBeTrue();
    });

    it('should detect truncated segment content markers (…/...[INCOMPLETE])', () => {
        const segments = [
            { id: 'P1', text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
            { id: 'P2', text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
            { id: 'P3', text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
        ];
        const response = `P1 - …\nP2 - ...\nP3 - [INCOMPLETE]`;
        const result = validateTranslationResponse(segments, response);
        expect(result.errors.some((e) => e.type === 'truncated_segment')).toBeTrue();
    });

    it('should detect implicit continuation and meta-talk', () => {
        const segments = [
            { id: 'P1', text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
        ];
        const response = `P1 - Continuation: (Translator's note: hi)`;
        const result = validateTranslationResponse(segments, response);
        expect(result.errors.some((e) => e.type === 'implicit_continuation')).toBeTrue();
        expect(result.errors.some((e) => e.type === 'meta_talk')).toBeTrue();
    });

    it('should detect Arabic leakage even inside quotes/brackets', () => {
        const segments = [
            { id: 'P1', text: 'نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
        ];
        const response = `P1 - He quoted: «واللاتي تخافون نشوزهن».`;
        const result = validateTranslationResponse(segments, response);
        expect(result.errors.some((e) => e.type === 'arabic_leak')).toBeTrue();
    });

    it('should allow ﷺ without raising arabic_leak', () => {
        const segments = [
            { id: 'P1', text: 'نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
        ];
        const response = `P1 - Muḥammad ﷺ said...`;
        const result = validateTranslationResponse(segments, response);
        expect(result.errors.some((e) => e.type === 'arabic_leak')).toBeFalse();
    });

    it('should detect wrong diacritics', () => {
        const segments = [
            { id: 'P1', text: 'نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
        ];
        const response = `P1 - kâfir and Salãm and Imám`;
        const result = validateTranslationResponse(segments, response);
        expect(result.errors.some((e) => e.type === 'wrong_diacritics')).toBeTrue();
    });

    it('should detect too many empty parentheses () as failed transliteration markers', () => {
        const segments = [
            { id: 'P1', text: 'نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
        ];
        const response = `P1 - One () two () three () four () five ().`;
        const result = validateTranslationResponse(segments, response);
        expect(result.errors.some((e) => e.type === 'empty_parentheses')).toBeTrue();
    });

    it('should not flag empty parentheses when 3 or fewer occurrences', () => {
        const segments = [
            { id: 'P1', text: 'نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
        ];
        const response = `P1 - One () two () three ().`;
        const result = validateTranslationResponse(segments, response);
        expect(result.errors.some((e) => e.type === 'empty_parentheses')).toBeFalse();
    });

    it('should detect length mismatch for long Arabic with too-short translation (and skip for short Arabic)', () => {
        const longArabic =
            'هو هذا الذي يسمونه بالمضاف المحذوف، أي أهل القرية، أهل العير هذا الذي يتبادر إلى الذهن، إذن هذا المعنى المتبادر الى الذهن هو المعنى الحقيقي، فليس هذا تأويلا وليس هذا مجازا، لأنه المعنى الحقيقي هو الذي يتبادر إلى ذهن الإنسان مباشرة، لكن يقوم هناك دليل في الشرع أو في العقل يمنعه من أن يفهم هذا المعنى، فيضطر إلى التأويل، ليس الأمر هكذا هنا، المعنى الذي يتبادر إلى الذهن هو هذا الذي يسمونه مجازا';
        const segments = [
            { id: 'P1', text: longArabic },
            { id: 'P2', text: 'نعم' }, // too short to check
        ];
        const response = `P1 - Short.\nP2 - Yes.`;
        const result = validateTranslationResponse(segments, response);
        expect(result.errors.some((e) => e.type === 'length_mismatch')).toBeTrue();
    });

    it('should detect archaic register and ALL CAPS', () => {
        const segments = [
            { id: 'P1', text: 'نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
        ];
        const response = `P1 - VERILY, thou shalt go forth.`;
        const result = validateTranslationResponse(segments, response);
        expect(result.errors.some((e) => e.type === 'all_caps')).toBeTrue();
        expect(result.errors.some((e) => e.type === 'archaic_register')).toBeTrue();
    });

    it('should not flag ALL CAPS for short acronyms', () => {
        const segments = [
            { id: 'P1', text: 'نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
        ];
        const response = `P1 - USA is fine.`;
        const result = validateTranslationResponse(segments, response);
        expect(result.errors.some((e) => e.type === 'all_caps')).toBeFalse();
    });

    it('should detect mismatched colons when Arabic has more ":" than translation for the same segment', () => {
        const segments = [
            {
                id: 'P1',
                text: 'الشيخ: نعم. السائل: لماذا؟',
            },
        ];
        const response = `P1 - The Shaykh: Yes.`; // only 1 colon in translation
        const result = validateTranslationResponse(segments, response);
        expect(result.errors.some((e) => e.type === 'mismatched_colons')).toBeTrue();
    });

    it('should not flag mismatched colons when colon counts match for the same segment', () => {
        const segments = [
            {
                id: 'P1',
                text: 'الشيخ: نعم. السائل: لماذا؟',
            },
        ];
        const response = `P1 - The Shaykh: Yes.\nQuestioner: Why?`; // 2 colons
        const result = validateTranslationResponse(segments, response);
        expect(result.errors.some((e) => e.type === 'mismatched_colons')).toBeFalse();
    });

    it('should detect multi-word transliteration without immediate gloss for common phrase shape (al-... fi al-...)', () => {
        const segments = [
            {
                id: 'P1',
                text: 'السائل: ...',
            },
        ];
        const response = `P1 - The Shaykh: He advised al-hajr fi al-madajīʿ.`;
        const result = validateTranslationResponse(segments, response);
        expect(result.errors.some((e) => e.type === 'multiword_translit_without_gloss')).toBeTrue();
    });

    it('should not flag multi-word transliteration when a gloss follows quickly', () => {
        const segments = [{ id: 'P1', text: 'السائل: ...' }];
        const response = `P1 - He advised al-hajr fi al-madajīʿ (marital bed abandonment).`;
        const result = validateTranslationResponse(segments, response);
        expect(result.errors.some((e) => e.type === 'multiword_translit_without_gloss')).toBeFalse();
    });

    it('should detect missing ID gaps between translated IDs (P1 and P3 but missing P2)', () => {
        const segments = [
            { id: 'P1', text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
            { id: 'P2', text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
            { id: 'P3', text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
        ];
        const response = `P1 - A sufficiently long translation.\nP3 - A sufficiently long translation.`;
        const result = validateTranslationResponse(segments, response);
        expect(result.errors.some((e) => e.type === 'missing_id_gap')).toBeTrue();
        expect(result.errors.find((e) => e.type === 'missing_id_gap')?.message).toContain('P2');
    });

    it('should not detect missing-ID gaps when response order resets (P3 then P1)', () => {
        const segments = [
            { id: 'P1', text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
            { id: 'P2', text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
            { id: 'P3', text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
        ];
        const response = `P3 - A sufficiently long translation.\nP1 - A sufficiently long translation.`;
        const result = validateTranslationResponse(segments, response);
        expect(result.errors.some((e) => e.type === 'missing_id_gap')).toBeFalse();
    });

    it('should normalize merged markers and remove escaped brackets', () => {
        const segments = [
            { id: 'P1', text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
            { id: 'P2', text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
        ];

        // marker is merged with previous word (no space): "helloP1 - ..."
        const response = `helloP1 - One\\[two]\nP2 - Two`;
        const result = validateTranslationResponse(segments, response);
        expect(result.parsedIds).toEqual(['P1', 'P2']);
        expect(result.normalizedResponse).toContain('One[two]');
    });
});
