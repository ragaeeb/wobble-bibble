import { describe, expect, it } from 'bun:test';
import {
    detectArabicScript,
    detectDuplicateIds,
    detectImplicitContinuation,
    detectInventedIds,
    detectMetaTalk,
    detectNewlineAfterId,
    detectTruncatedSegments,
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

describe('detectArabicScript', () => {
    it('should return warning for Arabic text', () => {
        const text = 'P123 - This contains الله which is Arabic';
        const warnings = detectArabicScript(text);
        expect(warnings.length).toBeGreaterThan(0);
        expect(warnings[0].type).toBe('arabic_leak');
    });

    it('shouldallows ﷺ symbol', () => {
        const text = 'P123 - The Prophet ﷺ said...';
        const warnings = detectArabicScript(text);
        expect(warnings.length).toBe(0);
    });

    it('should return empty for clean English text', () => {
        const text = 'P123 - This is clean English translation';
        const warnings = detectArabicScript(text);
        expect(warnings.length).toBe(0);
    });

    it('shoulddetects multiple Arabic occurrences', () => {
        const text = 'P123 - رسول الله said something';
        const warnings = detectArabicScript(text);
        expect(warnings.length).toBeGreaterThan(0);
    });
});

describe('detectWrongDiacritics', () => {
    it('shoulddetects â instead of ā', () => {
        const text = 'P123 - The kâfir should be kāfir';
        const warnings = detectWrongDiacritics(text);
        expect(warnings.length).toBeGreaterThan(0);
        expect(warnings[0].type).toBe('wrong_diacritics');
    });

    it('shoulddetects ã instead of ā', () => {
        const text = 'P123 - Salãm instead of Salām';
        const warnings = detectWrongDiacritics(text);
        expect(warnings.length).toBeGreaterThan(0);
    });

    it('shoulddetects á instead of ā', () => {
        const text = 'P123 - Imám instead of Imām';
        const warnings = detectWrongDiacritics(text);
        expect(warnings.length).toBeGreaterThan(0);
    });

    it('shouldallows correct macrons', () => {
        const text = 'P123 - Correct: ā ī ū ḥ ʿ ḍ ṣ ṭ ẓ ʾ';
        const warnings = detectWrongDiacritics(text);
        expect(warnings.length).toBe(0);
    });
});

describe('detectNewlineAfterId', () => {
    it('shoulddetects newline after ID', () => {
        const text = 'P123\nTranslation text';
        const error = detectNewlineAfterId(text);
        expect(error).toContain('newline');
    });

    it('shouldallows proper format with dash separator', () => {
        const text = 'P123 - Translation text';
        const error = detectNewlineAfterId(text);
        expect(error).toBeUndefined();
    });

    it('shoulddetects ID followed by newline then speaker', () => {
        const text = 'P5456\nQuestioner: What is the ruling?';
        const error = detectNewlineAfterId(text);
        expect(error).toBeDefined();
    });
});

describe('detectImplicitContinuation', () => {
    it('shoulddetects "implicit continuation"', () => {
        const text = 'P123 - Translation\n(implicit continuation): more text';
        const error = detectImplicitContinuation(text);
        expect(error).toContain('implicit continuation');
    });

    it('shoulddetects "Continuation:"', () => {
        const text = 'P123 - Translation\nContinuation: more text';
        const error = detectImplicitContinuation(text);
        expect(error).toBeDefined();
    });

    it('shouldallows normal text', () => {
        const text = 'P123 - Normal translation without continuation markers';
        const error = detectImplicitContinuation(text);
        expect(error).toBeUndefined();
    });
});

describe('detectMetaTalk', () => {
    it('shoulddetects "(Note:"', () => {
        const text = 'P123 - Translation (Note: this is added by translator)';
        const error = detectMetaTalk(text);
        expect(error).toContain('meta');
    });

    it('shoulddetects "(Translator\'s note:"', () => {
        const text = "P123 - Translation (Translator's note: clarification)";
        const error = detectMetaTalk(text);
        expect(error).toBeDefined();
    });

    it('shoulddetects "[Editor:"', () => {
        const text = 'P123 - Translation [Editor: comment]';
        const error = detectMetaTalk(text);
        expect(error).toBeDefined();
    });

    it('shouldallows normal parenthetical definitions', () => {
        const text = 'P123 - The bidʿah (innovation) is forbidden';
        const error = detectMetaTalk(text);
        expect(error).toBeUndefined();
    });
});

describe('detectDuplicateIds', () => {
    it('shoulddetects duplicate IDs', () => {
        const ids = ['P123', 'P124', 'P123', 'P125'];
        const error = detectDuplicateIds(ids);
        expect(error).toContain('P123');
        expect(error).toContain('Duplicate');
    });

    it('shouldallows unique IDs', () => {
        const ids = ['P123', 'P124', 'P125'];
        const error = detectDuplicateIds(ids);
        expect(error).toBeUndefined();
    });

    it('should return undefined for empty list', () => {
        const error = detectDuplicateIds([]);
        expect(error).toBeUndefined();
    });
});

describe('detectInventedIds', () => {
    it('shoulddetects invented IDs not in source', () => {
        const outputIds = ['P5803', 'P5803a', 'P5803b', 'P5803c']; // P5803c was invented
        const sourceIds = ['P5803', 'P5803a', 'P5803b'];
        const error = detectInventedIds(outputIds, sourceIds);
        expect(error).toContain('P5803c');
        expect(error).toContain('Invented');
    });

    it('shouldallows all IDs that exist in source', () => {
        const outputIds = ['P5803', 'P5803a', 'P5803b'];
        const sourceIds = ['P5803', 'P5803a', 'P5803b'];
        const error = detectInventedIds(outputIds, sourceIds);
        expect(error).toBeUndefined();
    });

    it('shouldallows subset of source IDs', () => {
        const outputIds = ['P5803', 'P5803b']; // Missing P5803a is OK
        const sourceIds = ['P5803', 'P5803a', 'P5803b'];
        const error = detectInventedIds(outputIds, sourceIds);
        expect(error).toBeUndefined();
    });

    it('shoulddetects multiple invented IDs', () => {
        const outputIds = ['P100', 'P101', 'P102'];
        const sourceIds = ['P100'];
        const error = detectInventedIds(outputIds, sourceIds);
        expect(error).toContain('P101');
        expect(error).toContain('P102');
    });

    it('should return undefined for empty output', () => {
        const error = detectInventedIds([], ['P100', 'P101']);
        expect(error).toBeUndefined();
    });
});

describe('detectTruncatedSegments', () => {
    it('shoulddetects segment with just ellipsis', () => {
        const text = `P5741e - The subhah has developed over time...
P5741f - …`;
        const error = detectTruncatedSegments(text);
        expect(error).toContain('P5741f');
        expect(error).toContain('Truncated');
    });

    it('shoulddetects segment with three dots', () => {
        const text = `P100 - Normal content
P101 - ...`;
        const error = detectTruncatedSegments(text);
        expect(error).toContain('P101');
    });

    it('shoulddetects segment marked as incomplete', () => {
        const text = `P100 - Normal content
P101 - [INCOMPLETE]`;
        const error = detectTruncatedSegments(text);
        expect(error).toContain('P101');
    });

    it('shouldallows segments with real content', () => {
        const text = `P100 - This is a full translation
P101 - Another complete segment with content`;
        const error = detectTruncatedSegments(text);
        expect(error).toBeUndefined();
    });

    it('shoulddetects multiple truncated segments', () => {
        const text = `P100 - Normal content
P101 - …
P102 - More content
P103 - ...`;
        const error = detectTruncatedSegments(text);
        expect(error).toContain('P101');
        expect(error).toContain('P103');
    });

    it('shouldallows ellipsis within content', () => {
        const text = `P100 - He said "..." and then continued speaking about the topic`;
        const error = detectTruncatedSegments(text);
        expect(error).toBeUndefined();
    });
});

describe('Translation Validation Utilities', () => {
    describe('validateTranslationMarkers', () => {
        it('should return undefined for valid markers', () => {
            const text = `P11622a - Some translation
C123 - Another translation
B45b - Third one`;
            expect(validateTranslationMarkers(text)).toBeUndefined();
        });

        it('shoulddetects invalid reference format with characters in middle', () => {
            const text = 'B12a34 - Invalid format';
            const error = validateTranslationMarkers(text);
            expect(error).toContain('Invalid reference format');
            expect(error).toContain('B12a34');
        });

        it('shoulddetects dollar sign in reference', () => {
            const text = 'B1234$5 - Invalid with dollar';
            const error = validateTranslationMarkers(text);
            expect(error).toContain('$');
        });

        it('shoulddetects empty content after dash', () => {
            const text = 'P123 -';
            const error = validateTranslationMarkers(text);
            expect(error).toContain('no content after it');
        });

        it('shoulddetects empty content after dash with whitespace', () => {
            const text = 'P123 -   ';
            const error = validateTranslationMarkers(text);
            expect(error).toContain('no content after it');
        });

        it('shouldallows valid suffixes a-j', () => {
            const text = `P123a - Valid
P456b - Also valid
P789j - Still valid`;
            expect(validateTranslationMarkers(text)).toBeUndefined();
        });

        it('shoulddetects multi-letter suffix with space before', () => {
            const text = 'Some text P123ab - Translation';
            const error = validateTranslationMarkers(text);
            expect(error).toContain('Suspicious reference');
        });
    });

    describe('normalizeTranslationText', () => {
        it('shouldsplits merged markers onto separate lines', () => {
            const input = 'P123 - First translation P456 - Second translation';
            const result = normalizeTranslationText(input);
            expect(result).toContain('\nP456 -');
        });

        it('shouldhandles multiple merged markers', () => {
            const input = 'P1 - First P2 - Second P3 - Third';
            const result = normalizeTranslationText(input);
            const lines = result.split('\n');
            expect(lines.length).toBe(3);
        });

        it('shouldpreserves already-separated markers', () => {
            const input = `P123 - First
P456 - Second`;
            const result = normalizeTranslationText(input);
            expect(result).toBe(input);
        });

        it('shouldreplaces escaped brackets', () => {
            const input = 'P123 - Text with \\[brackets\\]';
            const result = normalizeTranslationText(input);
            expect(result).toContain('[brackets');
        });

        it('shouldhandles en dash and em dash', () => {
            const input = 'P1 – First P2 — Second';
            const result = normalizeTranslationText(input);
            expect(result.split('\n').length).toBe(2);
        });
    });

    describe('extractTranslationIds', () => {
        it('shouldextracts IDs in order', () => {
            const text = `P11622a - First
C11623 - Second
B100 - Third`;
            const ids = extractTranslationIds(text);
            expect(ids).toEqual(['P11622a', 'C11623', 'B100']);
        });

        it('shouldhandles mixed prefixes', () => {
            const text = `F1 - Footnote
T2 - Title
N3 - Note`;
            const ids = extractTranslationIds(text);
            expect(ids).toEqual(['F1', 'T2', 'N3']);
        });

        it('should return empty array for no markers', () => {
            const text = 'Just some random text without markers';
            const ids = extractTranslationIds(text);
            expect(ids).toEqual([]);
        });

        it('shouldhandles suffixes correctly', () => {
            const text = `P1a - With suffix
P2 - Without suffix
P3c - Another suffix`;
            const ids = extractTranslationIds(text);
            expect(ids).toEqual(['P1a', 'P2', 'P3c']);
        });
    });

    describe('extractIdNumber', () => {
        it('shouldextracts number from simple ID', () => {
            expect(extractIdNumber('P123')).toBe(123);
        });

        it('shouldextracts number from ID with suffix', () => {
            expect(extractIdNumber('P11622a')).toBe(11622);
        });

        it('shouldextracts number from various prefixes', () => {
            expect(extractIdNumber('C456')).toBe(456);
            expect(extractIdNumber('B789')).toBe(789);
            expect(extractIdNumber('F100b')).toBe(100);
        });

        it('should return 0 for invalid ID', () => {
            expect(extractIdNumber('Invalid')).toBe(0);
        });
    });

    describe('extractIdPrefix', () => {
        it('shouldextracts prefix from various IDs', () => {
            expect(extractIdPrefix('P123')).toBe('P');
            expect(extractIdPrefix('C456a')).toBe('C');
            expect(extractIdPrefix('B789')).toBe('B');
            expect(extractIdPrefix('F100b')).toBe('F');
        });
    });

    describe('validateNumericOrder', () => {
        it('should return undefined for correct numeric order', () => {
            const ids = ['P1', 'P2', 'P3'];
            expect(validateNumericOrder(ids)).toBeUndefined();
        });

        it('should return undefined for single ID', () => {
            expect(validateNumericOrder(['P1'])).toBeUndefined();
        });

        it('should return undefined for empty list', () => {
            expect(validateNumericOrder([])).toBeUndefined();
        });

        it('shoulddetects out of numeric order - user reported case', () => {
            // This is the exact case the user reported: P12659 before P12651
            const ids = ['P12659', 'P12651'];
            const error = validateNumericOrder(ids);
            expect(error).toContain('P12651');
            expect(error).toContain('12651');
            expect(error).toContain('P12659');
            expect(error).toContain('12659');
        });

        it('shoulddetects descending order', () => {
            const ids = ['P100', 'P50', 'P25'];
            const error = validateNumericOrder(ids);
            expect(error).toContain('P50');
            expect(error).toContain('appears after');
        });

        it('shouldallows different prefixes to have independent order', () => {
            // C500 can come after P100 even though 500 > 100 - different prefix
            const ids = ['P100', 'C500', 'P200'];
            expect(validateNumericOrder(ids)).toBeUndefined();
        });

        it('shoulddetects order issue within same prefix across mixed IDs', () => {
            // P200 comes after P100, but P50 after P200 is wrong
            const ids = ['P100', 'C500', 'P200', 'C600', 'P50'];
            const error = validateNumericOrder(ids);
            expect(error).toContain('P50');
        });
    });

    describe('validateTranslationOrder', () => {
        // Store order: P1, P2, P6, P8, P10, P20
        const expectedIds = ['P1', 'P2', 'P6', 'P8', 'P10', 'P20'];

        it('should return undefined for correct order', () => {
            const translationIds = ['P1', 'P2', 'P6'];
            expect(validateTranslationOrder(translationIds, expectedIds)).toBeUndefined();
        });

        it('should return undefined for empty expected list (no store data)', () => {
            const ids = ['P12659', 'P12651'];
            expect(validateTranslationOrder(ids, [])).toBeUndefined();
        });

        it('shouldallows one reset (two blocks)', () => {
            // P6->P8->P10->P20 valid, then reset to P1->P2 valid
            const translationIds = ['P6', 'P8', 'P10', 'P20', 'P1', 'P2'];
            expect(validateTranslationOrder(translationIds, expectedIds)).toBeUndefined();
        });

        it('shouldallows multiple resets (three blocks)', () => {
            // P8->P10 valid, reset to P6->P20, reset to P1->P2
            const translationIds = ['P8', 'P10', 'P6', 'P20', 'P1', 'P2'];
            expect(validateTranslationOrder(translationIds, expectedIds)).toBeUndefined();
        });

        it('shouldallows many blocks out of global order', () => {
            // P10->P20 valid, reset to P1->P2, reset to P6->P8
            const translationIds = ['P10', 'P20', 'P1', 'P2', 'P6', 'P8'];
            expect(validateTranslationOrder(translationIds, expectedIds)).toBeUndefined();
        });

        it('should return undefined for empty translation list', () => {
            expect(validateTranslationOrder([], expectedIds)).toBeUndefined();
        });

        it('shouldhandles IDs not in expected list gracefully', () => {
            const translationIds = ['P1', 'X999', 'P2'];
            expect(validateTranslationOrder(translationIds, expectedIds)).toBeUndefined();
        });

        it('shouldallows non-consecutive IDs that are in store order', () => {
            // P1, P6, P20 - skipping P2, P8, P10 is fine as long as order is maintained
            const translationIds = ['P1', 'P6', 'P20'];
            expect(validateTranslationOrder(translationIds, expectedIds)).toBeUndefined();
        });
    });

    describe('validateTranslations', () => {
        const expectedIds = ['P1', 'P2', 'P3', 'P4', 'P5'];

        it('should return valid result for correct translations', () => {
            const text = `P1 - First translation
P2 - Second translation
P3 - Third translation`;
            const result = validateTranslations(text, expectedIds);
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
            expect(result.parsedIds).toEqual(['P1', 'P2', 'P3']);
        });

        it('shouldnormalizes merged markers before validation', () => {
            const text = 'P1 - First P2 - Second P3 - Third';
            const result = validateTranslations(text, expectedIds);
            expect(result.normalizedText).toContain('\n');
            expect(result.parsedIds).toEqual(['P1', 'P2', 'P3']);
        });

        it('should return error for invalid marker format', () => {
            const text = 'P1$2 - Invalid marker';
            const result = validateTranslations(text, expectedIds);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('$');
        });

        it('should return error for no valid markers', () => {
            const text = 'Just some text without any markers';
            const result = validateTranslations(text, expectedIds);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('No valid translation markers');
        });

        it('shouldallows one reset in order - block pasting is valid', () => {
            // P4 then P1 is one reset, which is allowed
            const text = `P4 - Fourth
P5 - Fifth
P1 - First`;
            const result = validateTranslations(text, expectedIds);
            expect(result.isValid).toBe(true);
        });

        it('shouldallows multiple resets - user case', () => {
            // Multiple blocks are now allowed
            const text = `P4 - Fourth
P2 - Second
P5 - Fifth
P1 - First`;
            const result = validateTranslations(text, expectedIds);
            expect(result.isValid).toBe(true);
        });

        it('shouldhandles complex multi-line translations', () => {
            const text = `P1 - First translation
with multiple lines
still P1 content

P2 - Second translation

P3 - Third`;
            const result = validateTranslations(text, expectedIds);
            expect(result.isValid).toBe(true);
            expect(result.parsedIds).toEqual(['P1', 'P2', 'P3']);
        });
    });
});

describe('findUnmatchedTranslationIds', () => {
    const storeIds = ['P1', 'P2', 'P3', 'C10', 'C11', 'B100'];

    it('should return empty array when all IDs match', () => {
        const translationIds = ['P1', 'P2', 'C10'];
        expect(findUnmatchedTranslationIds(translationIds, storeIds)).toEqual([]);
    });

    it('should return unmatched IDs', () => {
        const translationIds = ['P1', 'P99', 'C11', 'X999'];
        const unmatched = findUnmatchedTranslationIds(translationIds, storeIds);
        expect(unmatched).toEqual(['P99', 'X999']);
    });

    it('should return all IDs when none match', () => {
        const translationIds = ['Z1', 'Z2', 'Z3'];
        expect(findUnmatchedTranslationIds(translationIds, storeIds)).toEqual(['Z1', 'Z2', 'Z3']);
    });

    it('should return empty array for empty translation IDs', () => {
        expect(findUnmatchedTranslationIds([], storeIds)).toEqual([]);
    });

    it('should return all IDs when store is empty', () => {
        const translationIds = ['P1', 'P2'];
        expect(findUnmatchedTranslationIds(translationIds, [])).toEqual(['P1', 'P2']);
    });
});
