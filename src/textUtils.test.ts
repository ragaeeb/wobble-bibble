import { describe, expect, it } from 'bun:test';
import {
    extractTranslationIds,
    formatExcerptsForPrompt,
    normalizeTranslationText,
    parseTranslationLine,
    parseTranslations,
    parseTranslationsInOrder,
} from './textUtils';

describe('normalizeTranslationText', () => {
    it('should normalize CRLF/CR to LF', () => {
        const input = 'P1 - a\r\nP2 - b\rP3 - c';
        const out = normalizeTranslationText(input);
        expect(out.includes('\r')).toBeFalse();
        expect(out.split('\n').length).toBeGreaterThan(1);
    });

    it('should split merged markers (no space) onto a new line', () => {
        const input = 'helloP1 - x';
        const out = normalizeTranslationText(input);
        expect(out).toContain('\nP1 -');
    });

    it('should split merged markers (with space) onto a new line', () => {
        const input = 'hello P1 - x';
        const out = normalizeTranslationText(input);
        expect(out).toContain('\nP1 -');
    });

    it('should unescape bracket opener', () => {
        const input = 'P1 - One\\[two]';
        const out = normalizeTranslationText(input);
        expect(out).toContain('One[two]');
    });

    it('should extract translation ids', () => {
        const ids = extractTranslationIds('P1 - a\nP2b - b\nB100j - c');
        expect(ids).toEqual(['P1', 'P2b', 'B100j']);
    });
});

describe('extractTranslationIds', () => {
    it('should format segments with prompt prefix', () => {
        const segments = [
            { id: 'P1', text: 'Arabic 1' },
            { id: 'P2', text: 'Arabic 2' },
        ];
        const result = formatExcerptsForPrompt(segments, 'Translate:');
        expect(result).toBe('Translate:\n\nP1 - Arabic 1\n\nP2 - Arabic 2');
    });
});

describe('parseTranslationLine', () => {
    it('should parse a valid "ID - text" line', () => {
        const parsed = parseTranslationLine('P12b - Hello world');
        expect(parsed).toEqual({ id: 'P12b', translation: 'Hello world' });
    });

    it('should return null for empty translation content', () => {
        expect(parseTranslationLine('P1 -')).toBeNull();
        expect(parseTranslationLine('P1 -   ')).toBeNull();
    });

    it('should return null for non-marker lines', () => {
        expect(parseTranslationLine('Not a marker')).toBeNull();
    });
});

describe('parseTranslations', () => {
    it('should build a map for O(1) lookup', () => {
        const { count, translationMap } = parseTranslations('P1 - a\nP2 - b');
        expect(count).toBe(2);
        expect(translationMap.get('P1')).toBe('a');
        expect(translationMap.get('P2')).toBe('b');
    });

    it('should associate multi-line content with the previous ID', () => {
        const input = ['P1 - Line 1', 'Line 2', 'P2 - Next'].join('\n');
        const { translationMap } = parseTranslations(input);
        expect(translationMap.get('P1')).toBe('Line 1\nLine 2');
        expect(translationMap.get('P2')).toBe('Next');
    });

    it('should ignore content before the first marker', () => {
        const input = ['preface', 'P1 - a'].join('\n');
        const { count, translationMap } = parseTranslations(input);
        expect(count).toBe(1);
        expect(translationMap.get('P1')).toBe('a');
    });
});

describe('parseTranslationsInOrder', () => {
    it('should preserve translated order', () => {
        const entries = parseTranslationsInOrder('P1 - a\nP2 - b\nP3 - c');
        expect(entries.map((e) => e.id)).toEqual(['P1', 'P2', 'P3']);
    });

    it('should preserve duplicates as separate entries', () => {
        const input = ['P1 - first', 'P2 - mid', 'P1 - second'].join('\n');
        const entries = parseTranslationsInOrder(input);
        expect(entries).toEqual([
            { id: 'P1', translation: 'first' },
            { id: 'P2', translation: 'mid' },
            { id: 'P1', translation: 'second' },
        ]);
    });
});
