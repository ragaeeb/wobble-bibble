import { describe, expect, it } from 'bun:test';
import { fixAll, fixCollapsedSpeakerLines } from './fix';

describe('fixCollapsedSpeakerLines', () => {
    it('should insert a newline before a collapsed speaker label', () => {
        const input = `P1 - Questioner: Hi. The Shaykh: Hello.`;
        const result = fixCollapsedSpeakerLines(input, { speakerLabels: ['Questioner', 'The Shaykh'] });
        expect(result.text).toBe(`P1 - Questioner: Hi.\nThe Shaykh: Hello.`);
        expect(result.counts.fixCollapsedSpeakerLines).toBe(1);
    });

    it('should handle punctuation variants before the label', () => {
        const input = `P1 - Something؟ The Shaykh: Reply.`;
        const result = fixCollapsedSpeakerLines(input, { speakerLabels: ['The Shaykh'] });
        expect(result.text).toBe(`P1 - Something؟\nThe Shaykh: Reply.`);
    });

    it('should not change already separated speaker lines', () => {
        const input = `P1 - Questioner: Hi.\nThe Shaykh: Hello.`;
        const result = fixCollapsedSpeakerLines(input, { speakerLabels: ['Questioner', 'The Shaykh'] });
        expect(result.text).toBe(input);
        expect(result.applied.length).toBe(0);
    });

    it('should honor custom speaker labels', () => {
        const input = `P1 - Mu'adhdhin: Allahu akbar. The Shaykh: Allahu akbar.`;
        const result = fixCollapsedSpeakerLines(input, { speakerLabels: ["Mu'adhdhin", 'The Shaykh'] });
        expect(result.text).toBe(`P1 - Mu'adhdhin: Allahu akbar.\nThe Shaykh: Allahu akbar.`);
    });

    it('should throw if speaker labels are missing', () => {
        const input = `P1 - Questioner: Hi. The Shaykh: Hello.`;
        expect(() => fixCollapsedSpeakerLines(input)).toThrow();
    });
});

describe('fixAll', () => {
    it('should apply fixCollapsedSpeakerLines', () => {
        const input = `P1 - Questioner: Hi. The Shaykh: Hello.`;
        const result = fixAll(input, {
            config: { speakerLabels: ['Questioner', 'The Shaykh'] },
            types: ['mismatched_colons'],
        });
        expect(result.text).toBe(`P1 - Questioner: Hi.\nThe Shaykh: Hello.`);
        expect(result.counts.fixCollapsedSpeakerLines).toBe(1);
    });

    it('should skip unknown fix types', () => {
        const input = `P1 - Questioner: Hi. The Shaykh: Hello.`;
        const result = fixAll(input, {
            config: { speakerLabels: ['Questioner', 'The Shaykh'] },
            types: ['arabic_leak'],
        });
        expect(result.text).toBe(input);
        expect(result.skipped).toEqual(['arabic_leak']);
    });
});
