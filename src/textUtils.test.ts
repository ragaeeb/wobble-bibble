import { describe, expect, it } from 'bun:test';
import { extractTranslationIds, normalizeTranslationText } from './textUtils';

describe('textUtils', () => {
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

