import { describe, expect, it } from 'bun:test';
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
        expect(lib.validateTranslationResponse).toBeDefined();
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

    it('should successfully run the response validator from the built module', () => {
        const segments = [
            { id: 'P1', text: 'نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
            { id: 'P2', text: 'نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' },
        ];
        const response = 'P1 - Clean translation.\nP2 - Another clean translation.';
        const result = lib.validateTranslationResponse(segments, response);
        expect(result.parsedIds).toEqual(['P1', 'P2']);
        expect(Array.isArray(result.errors)).toBe(true);
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

    it('should detect arabic leak using the response validator', () => {
        const segments = [{ id: 'P1', text: 'نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' }];
        const response = 'P1 - Quote: الله';
        const result = lib.validateTranslationResponse(segments, response);
        expect(result.errors.some((e: any) => e.type === 'arabic_leak')).toBe(true);
    });

    it('should preserve semantic casing rules in the bundled master prompt', () => {
        const master = lib.getMasterPrompt();
        // The reviewer explicitly requested we keep this distinction
        expect(master).toContain('Sunnah (Capitalized)');
        expect(master).toContain('sunnah (lowercase)');
    });

    it('should allow valid Prophet salutations in text (no arabic leak detected)', () => {
        const segments = [{ id: 'P1', text: 'نص عربي طويل يحتوي على محتوى كافٍ للترجمة وهو يمثل فقرة كاملة من النص العربي' }];
        const response = 'P1 - Muḥammad ﷺ said...';
        const result = lib.validateTranslationResponse(segments, response);
        expect(result.errors.some((e: any) => e.type === 'arabic_leak')).toBe(false);
    });
});
