import { describe, expect, it } from 'bun:test';
import type { ValidationErrorType } from './types';
import { validateTranslationResponse } from './validation';

const getErrorTypes = (result: ReturnType<typeof validateTranslationResponse>): ValidationErrorType[] =>
    result.errors.map((e) => e.type).sort();

const expectErrorTypes = (result: ReturnType<typeof validateTranslationResponse>, types: ValidationErrorType[]) => {
    expect(getErrorTypes(result)).toEqual([...types].sort());
};

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
        const segments = [{ id: 'P1', text: 'نعم' }];

        // invalid format like B12a34 -
        const invalidRef = validateTranslationResponse(segments, 'B12a34 - Invalid format\nP1 - Ok');
        expectErrorTypes(invalidRef, ['invalid_marker_format', 'invalid_marker_format']);

        // suspicious multi-letter suffix with space before
        const suspicious = validateTranslationResponse(segments, 'Some text P123ab - Translation\nP1 - Ok');
        expectErrorTypes(suspicious, ['invalid_marker_format']);

        // empty after dash
        const emptyAfterDash = validateTranslationResponse(segments, 'P1 -   ');
        expectErrorTypes(emptyAfterDash, ['invalid_marker_format', 'truncated_segment']);

        // dollar sign
        const dollar = validateTranslationResponse(segments, 'B1234$5 - Invalid\nP1 - Ok');
        expectErrorTypes(dollar, ['invalid_marker_format', 'invalid_marker_format']);
    });

    it('should return no_valid_markers when there are no markers at all', () => {
        const segments = [{ id: 'P1', text: 'نص عربي' }];
        const result = validateTranslationResponse(segments, 'Just some text without markers');
        expect(result.parsedIds).toEqual([]);
        expectErrorTypes(result, ['no_valid_markers']);
    });

    it('should detect invented IDs when response references IDs not present in the segment corpus', () => {
        const segments = [{ id: 'P1', text: 'نعم' }];
        const response = `P1 - Valid translation.\nP2 - Invented.`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, ['invented_id']);
    });

    it('should detect duplicate IDs', () => {
        const segments = [{ id: 'P1', text: 'نعم' }];
        const response = `P1 - First.\nP1 - Second.`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, ['duplicate_id']);
    });

    it('should detect newline after ID', () => {
        const segments = [{ id: 'P1', text: 'نعم' }];
        const response = `P1 -\nText`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, ['invalid_marker_format', 'newline_after_id']);
    });

    it('should detect truncated segment content markers (…/...[INCOMPLETE])', () => {
        const segments = [
            { id: 'P1', text: 'نعم' },
            { id: 'P2', text: 'نعم' },
            { id: 'P3', text: 'نعم' },
        ];
        const response = `P1 - …\nP2 - ...\nP3 - [INCOMPLETE]`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, ['truncated_segment', 'truncated_segment', 'truncated_segment']);
    });

    it('should detect Arabic leakage even inside quotes/brackets', () => {
        const segments = [{ id: 'P1', text: 'نعم' }];
        const response = `P1 - He quoted «واللاتي تخافون نشوزهن».`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, ['arabic_leak']);
    });

    it('should allow ﷺ without raising arabic_leak', () => {
        const segments = [{ id: 'P1', text: 'نعم' }];
        const response = `P1 - Muḥammad ﷺ said many things today.`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, []);
    });

    it('should emit one arabic_leak error per segment (longest Arabic run)', () => {
        const segments = [{ id: 'P1', text: 'نعم' }];
        const response = `P1 - الله الله الله الله الله.`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, ['arabic_leak']);
    });

    it('should detect too many empty parentheses () as failed transliteration markers', () => {
        const segments = [{ id: 'P1', text: 'نعم' }];
        const response = `P1 - One () two () three () four () five ().`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, [
            'empty_parentheses',
            'empty_parentheses',
            'empty_parentheses',
            'empty_parentheses',
            'empty_parentheses',
        ]);
    });

    it('should not flag empty parentheses when 3 or fewer occurrences', () => {
        const segments = [{ id: 'P1', text: 'نعم' }];
        const response = `P1 - One () two () three ().`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, []);
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
        expectErrorTypes(result, ['length_mismatch']);
    });

    it('should detect archaic register and ALL CAPS', () => {
        const segments = [{ id: 'P1', text: 'نعم' }];
        const response = `P1 - VERILY, thou shalt go forth. THIS IS VERY VERY LOUD.`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, ['all_caps']);
    });

    it('should not flag archaic register for words that contain archaic substrings (without)', () => {
        const segments = [{ id: 'P1', text: 'نعم' }];
        const response = `P1 - This is without any issue.`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, []);
    });

    it('should not flag ALL CAPS for short acronyms', () => {
        const segments = [{ id: 'P1', text: 'نعم' }];
        const response = `P1 - USA is fine.`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, []);
    });

    it('should not flag ALL CAPS for single acronyms like SABIC (caps report repro)', () => {
        const segments = [{ id: 'P1', text: 'نعم' }];
        const response = `P1 - A company called SABIC operates there.`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, []);
    });

    it('should honor configurable ALL CAPS run threshold', () => {
        const segments = [{ id: 'P1', text: 'نعم' }];
        const response = `P1 - THIS IS LOUD NOW`;
        const result = validateTranslationResponse(segments, response, { config: { allCapsWordRunThreshold: 4 } });
        expectErrorTypes(result, ['all_caps']);
    });

    it('should detect collapsed speaker labels when a line-start label exists in the segment', () => {
        const segments = [
            {
                id: 'P1',
                text: 'السائل: نعم\nالشيخ: نعم',
            },
        ];
        const response = `P1 - Questioner: Yes.\nThe Shaykh: Yes. Questioner: Yes.`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, ['collapsed_speakers']);
        const error = result.errors.find((e) => e.type === 'collapsed_speakers');
        expect(error?.message).toContain('Detected line-start labels: Questioner, The Shaykh');
    });

    it('should not flag collapsed_speakers when no line-start labels exist', () => {
        const segments = [
            {
                id: 'P1',
                text: 'نعم',
            },
        ];
        const response = `P1 - This is a sentence with The Shaykh: referenced in-line only.`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, []);
    });

    it('should not flag collapsed_speakers when labels start on their own lines only', () => {
        const segments = [
            {
                id: 'P1',
                text: 'السائل: نعم\nالشيخ: نعم',
            },
        ];
        const response = `P1 - Questioner: Yes.\nThe Shaykh: Yes.`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, []);
    });

    it('should ignore 3+ word prefixes even if they look like speaker labels (e.g. "Then he said:")', () => {
        const segments = [{ id: 'P1', text: 'قال ثم: نعم' }];
        // "Then he said:" is 3 words -> should be ignored
        const response = `P1 - Then he said: This is a sentence.\nAnd here also Then he said: it appears mid-line.`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, []);
    });

    it('should flag 1-word prefixes as speaker labels (e.g. "Shaykh:")', () => {
        const segments = [{ id: 'P1', text: 'الشيخ: نعم' }];
        const response = `P1 - Shaykh: Yes.\nThis is a sentence Shaykh: appears collapsed here.`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, ['collapsed_speakers']);
    });

    it('should flag 2-word prefixes as speaker labels (e.g. "The Shaykh:")', () => {
        const segments = [{ id: 'P1', text: 'الشيخ: نعم' }];
        const response = `P1 - The Shaykh: Yes.\nThis is a sentence The Shaykh: appears collapsed here.`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, ['collapsed_speakers']);
    });

    it('should ignore 3-word prefixes like "He said that:" regardless of line position', () => {
        const segments = [{ id: 'P1', text: 'قال ذلك: نعم' }];
        const response = `P1 - He said that: Start line.\nMid line usage of He said that: test.`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, []);
    });

    it('should not flag when extra narrative colons appear mid-line (no speaker drift)', () => {
        const segments = [
            {
                id: 'P1',
                text: 'السائل: نعم\nالشيخ: هذا صحيح',
            },
        ];
        const response = `P1 - Questioner: Yes.\nThe Shaykh: This is correct, firstly: it is sound.`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, []);
    });

    it('should not flag when narrative colons appear inside replies (P254944 repro)', () => {
        const segments = [
            {
                id: 'P1',
                text: 'السائل: نعم\nالشيخ: هذه أولاً مثل البيعات الجماعات والأحزاب كلها هي غير مشروعة.',
            },
        ];
        const response =
            'P1 - Questioner: Yes.\nThe Shaykh: This, firstly: pledges of groups and parties, all of them are illegitimate.';
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, []);
    });

    it('should not flag when label counts match even with extra mid-line colons (P251955a style)', () => {
        const segments = [
            {
                id: 'P1',
                text: 'الطالب: نعم\nالشيخ: أنا بقول دائما: تستدين إذا كنت تعرف أنك قادر على الوفاء',
            },
        ];
        const response =
            'P1 - Student: Yes.\nThe Shaykh: I always say: you borrow if you know that you are able to repay.';
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, []);
    });

    it('should not flag mismatched colons when colon counts match for the same segment', () => {
        const segments = [
            {
                id: 'P1',
                text: 'الشيخ: نعم\nالسائل: لماذا؟',
            },
        ];
        const response = `P1 - The Shaykh: Yes.\nQuestioner: Why?`; // 2 colons
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, []);
    });

    it('should detect multi-word transliteration without immediate gloss for common phrase shape (al-... fi al-...)', () => {
        const segments = [
            {
                id: 'P1',
                text: 'نص عربي',
            },
        ];
        const response = `P1 - He advised al-hajr fi al-madajīʿ.`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, ['multiword_translit_without_gloss']);
    });

    it('should not flag multi-word transliteration when a gloss follows quickly', () => {
        const segments = [{ id: 'P1', text: 'نص عربي' }];
        const response = `P1 - He advised al-hajr fi al-madajīʿ (marital bed abandonment).`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, []);
    });

    it('should detect missing ID gaps between translated IDs (P1 and P3 but missing P2)', () => {
        const segments = [
            { id: 'P1', text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
            { id: 'P2', text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
            { id: 'P3', text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
        ];
        const response = `P1 - A sufficiently long translation.\nP3 - A sufficiently long translation.`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, ['missing_id_gap']);
        expect(result.errors.find((e) => e.type === 'missing_id_gap')?.message).toBe(
            'Missing segment ID detected between translated IDs: "P2"',
        );
    });

    it('should not detect missing-ID gaps when response order resets (P3 then P1)', () => {
        const segments = [
            { id: 'P1', text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
            { id: 'P2', text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
            { id: 'P3', text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
        ];
        const response = `P3 - A sufficiently long translation.\nP1 - A sufficiently long translation.`;
        const result = validateTranslationResponse(segments, response);
        expectErrorTypes(result, []);
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
        expect(result.normalizedResponse).toBe('hello\nP1 - One[two]\nP2 - Two');
    });

    it('should include match ranges for arabic_leak', () => {
        const segments = [
            { id: 'P1', text: 'نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
        ];
        const response = 'P1 - Hello الله.';
        const result = validateTranslationResponse(segments, response);
        const err = result.errors.find((e) => e.type === 'arabic_leak');
        expect(err?.matchText).toBe('الله');
        expect(err ? response.slice(err.range.start, err.range.end) : undefined).toBe('الله');
    });

    it('should include match ranges for invalid_marker_format', () => {
        const segments = [
            { id: 'P1', text: 'نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
        ];
        const response = 'B12a34 - Invalid\nP1 - Ok';
        const result = validateTranslationResponse(segments, response);
        const err = result.errors.find((e) => e.type === 'invalid_marker_format');
        expect(err ? response.slice(err.range.start, err.range.end) : undefined).toBe(err?.matchText);
    });

    it('should include match ranges for length_mismatch translation chunks', () => {
        const segments = [
            {
                id: 'P1',
                text: 'هذا نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي مع كلمات إضافية لضمان الطول',
            },
        ];
        const response = 'P1 - Short.';
        const result = validateTranslationResponse(segments, response);
        const err = result.errors.find((e) => e.type === 'length_mismatch');
        expect(err ? response.slice(err.range.start, err.range.end) : undefined).toBe('Short.');
    });

    it('should associate IDs with global regex errors (archaic/all_caps/arabic_leak/etc)', () => {
        const segments = [
            { id: 'P1', text: 'نص عربي طويل' },
            { id: 'P2', text: 'نص عربي طويل' },
        ];
        const response = `P1 - Verily this is bad.
P2 - THIS IS VERY LOUD INDEED.
P1 - And this has الله inside.
P2 - kâfir diacritic.
`;
        const result = validateTranslationResponse(segments, response);

        // All Caps in P2
        const allCaps = result.errors.find((e) => e.type === 'all_caps');
        expect(allCaps?.id).toBe('P2');

        // Arabic in P1
        const arabic = result.errors.find((e) => e.type === 'arabic_leak');
        expect(arabic?.id).toBe('P1');
    });
});
