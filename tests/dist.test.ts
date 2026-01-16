import { describe, expect, it } from 'bun:test';
// @ts-expect-error - Importing from dist which might not be typed yet in the IDE's view
import * as lib from '../dist/index.js';

describe('Distribution Integration Test', () => {
    it('should export all expected prompt functions', () => {
        expect(lib.getPrompt).toBeDefined();
        expect(lib.getPrompts).toBeDefined();
        expect(lib.getStackedPrompt).toBeDefined();
        expect(lib.getMasterPrompt).toBeDefined();
        expect(lib.getPromptIds).toBeDefined();
    });

    it('should export all expected validation functions', () => {
        expect(lib.validateTranslations).toBeDefined();
        expect(lib.detectArabicScript).toBeDefined();
        expect(lib.detectDuplicateIds).toBeDefined();
        expect(lib.detectInventedIds).toBeDefined();
        expect(lib.detectTruncatedSegments).toBeDefined();
    });

    it('should be able to retrieve the master prompt from the bundle', () => {
        const master = lib.getMasterPrompt();
        expect(master).toContain('ROLE: Expert academic translator');
        expect(master).toContain('NO INVENTED SEGMENTS');
    });

    it('should correctly stack an addon prompt with the master prompt', () => {
        const stacked = lib.getStackedPrompt('hadith');
        // Verify it contains master content
        expect(stacked).toContain('ROLE: Expert academic translator');
        // Verify it contains addon content
        expect(stacked).toContain('ISNAD VERBS:');
    });

    it('should successfully run a validation from the built module', () => {
        const textWithArabic = 'P100 - This is Arabic: الله';
        const warnings = lib.detectArabicScript(textWithArabic);
        expect(warnings.length).toBeGreaterThan(0);
        expect(warnings[0].message).toContain('Arabic script');
    });

    it('should recognize the new anti-hallucination rules in the bundle', () => {
        const master = lib.getMasterPrompt();
        expect(master).toContain('OUTPUT COMPLETENESS');
        expect(master).toContain('OUTPUT UNIQUENESS');
        expect(master).toContain('P5803c'); // Check for the specific example we added
    });

    it('should have all expected addon prompts stacked with master', () => {
        const ids = lib.getPromptIds();
        const expectedAddons = [
            'encyclopedia_mixed',
            'fatawa',
            'fiqh',
            'hadith',
            'jarh_wa_tadil',
            'tafsir',
            'usul_al_fiqh',
        ];

        for (const id of expectedAddons) {
            expect(ids).toContain(id as any);
            const content = lib.getStackedPrompt(id as any);
            expect(content).toContain('ROLE: Expert academic translator'); // From master
        }
    });

    it('should find invented IDs that are not in the source list', () => {
        const outputIds = ['P1', 'P1a', 'P2'];
        const sourceIds = ['P1', 'P2']; // P1a is invented
        const error = lib.detectInventedIds(outputIds, sourceIds);
        expect(error).toContain('P1a');
        expect(error).toContain('Invented');
    });

    it('should detect segments marked as [INCOMPLETE]', () => {
        const text = 'P1 - This is done.\nP2 - [INCOMPLETE]\nP3 - This is also done.';
        const error = lib.detectTruncatedSegments(text);
        expect(error).toContain('P2');
        expect(error).toContain('Truncated');
    });

    it('should find unmatched translation IDs between two lists', () => {
        const translationIds = ['P1', 'P99'];
        const storeIds = ['P1', 'P2', 'P3'];
        const unmatched = lib.findUnmatchedTranslationIds(translationIds, storeIds);
        expect(unmatched).toEqual(['P99']);
    });

    it('should detect out-of-order segments using the built-in validator', () => {
        const ids = ['P1', 'P3', 'P2'];
        const error = lib.validateNumericOrder(ids);
        expect(error).toContain('P2');
        expect(error).toContain('order');
    });

    it('should accurately extract IDs with complex suffixes from text', () => {
        const text = 'P11622a - Text\nB100j - More text';
        const ids = lib.extractTranslationIds(text);
        expect(ids).toEqual(['P11622a', 'B100j']);
    });

    it('should preserve semantic casing rules in the bundled master prompt', () => {
        const master = lib.getMasterPrompt();
        // The reviewer explicitly requested we keep this distinction
        expect(master).toContain('Sunnah (Capitalized)');
        expect(master).toContain('sunnah (lowercase)');
    });

    it('should allow valid Prophet salutations in the Arabic script detector', () => {
        const textWithSalutation = 'Muḥammad ﷺ said...';
        const warnings = lib.detectArabicScript(textWithSalutation);
        expect(warnings.length).toBe(0); // ﷺ is the only allowed Arabic character
    });
});
