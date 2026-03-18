import { describe, expect, it } from 'bun:test';
import { fixAll, fixCollapsedSpeakerLines } from './fix';
import { validateTranslationResponse } from './validation';

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

    it('should infer speaker labels when none are provided', () => {
        const input = `P256151 - Questioner: Okay. The Shaykh: No. Questioner: Not valid? The Shaykh: Yes.`;
        const result = fixCollapsedSpeakerLines(input);
        expect(result.text).toBe(
            `P256151 - Questioner: Okay.\nThe Shaykh: No.\nQuestioner: Not valid?\nThe Shaykh: Yes.`,
        );
        expect(result.counts.fixCollapsedSpeakerLines).toBe(3);
    });

    it('should leave text unchanged when no repeated labels are found', () => {
        const input = `P1 - Intro: Text. The Shaykh: Hello.`;
        const result = fixCollapsedSpeakerLines(input);
        expect(result.text).toBe(input);
        expect(result.applied.length).toBe(0);
    });

    it('should preserve line-start labels while fixing mid-line repeats', () => {
        const input = `P1 - The Shaykh: One.\nQuestioner: Two. The Shaykh: Three.`;
        const result = fixCollapsedSpeakerLines(input);
        expect(result.text).toBe(`P1 - The Shaykh: One.\nQuestioner: Two.\nThe Shaykh: Three.`);
        expect(result.counts.fixCollapsedSpeakerLines).toBe(1);
    });

    it('should infer labels with apostrophes and split multiple mid-line labels', () => {
        const input = `P1 - Mu'adhdhin: Allahu akbar. The Shaykh: Reply. Mu'adhdhin: Again.`;
        const result = fixCollapsedSpeakerLines(input);
        expect(result.text).toBe(`P1 - Mu'adhdhin: Allahu akbar. The Shaykh: Reply.\nMu'adhdhin: Again.`);
        expect(result.counts.fixCollapsedSpeakerLines).toBe(1);
    });

    it('should infer mixed-case labels from line starts and fix collapsed inline labels', () => {
        const input =
            'P103099 - The questioner: The minor...\nThe Shaykh: No, if the minor performs hajj then it is supererogatory and it does not drop the obligation from him. The questioner: Shaykh what is the proof for that?';
        const result = fixCollapsedSpeakerLines(input);
        expect(result.text).toBe(
            'P103099 - The questioner: The minor...\nThe Shaykh: No, if the minor performs hajj then it is supererogatory and it does not drop the obligation from him.\nThe questioner: Shaykh what is the proof for that?',
        );
        expect(result.counts.fixCollapsedSpeakerLines).toBe(1);
    });
});

describe('fixAll', () => {
    it('should apply fixCollapsedSpeakerLines', () => {
        const input = `P1 - Questioner: Hi. The Shaykh: Hello.`;
        const result = fixAll(input, {
            config: { speakerLabels: ['Questioner', 'The Shaykh'] },
            types: ['collapsed_speakers'],
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

    it('should fix a collapsed "The questioner:" line from questioner sample text end-to-end', () => {
        const segments = [{ id: 'P103099', text: 'نص' }];
        const input =
            'P103099 - The questioner: The minor in the madhhab that if he performs ḥajj before his puberty then it is supererogatory.\nThe Shaykh: No, if the minor performs ḥajj before his puberty then it is supererogatory and it does not drop the obligation from him. The questioner: Shaykh what is the proof for that many of the acts of worship if the small one performs them before his puberty it suffices him?';

        const before = validateTranslationResponse(segments, input);
        expect(before.errors.some((e) => e.type === 'collapsed_speakers')).toBe(true);

        const fixed = fixAll(input, { types: ['collapsed_speakers'] });
        expect(fixed.text).toContain('\nThe questioner: Shaykh what is the proof for that');

        const after = validateTranslationResponse(segments, fixed.text);
        expect(after.errors.some((e) => e.type === 'collapsed_speakers')).toBe(false);
    });
});
