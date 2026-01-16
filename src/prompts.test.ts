import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';
import type { PromptId, StackedPrompt } from './prompts';
import { getMasterPrompt, getPrompt, getPromptIds, getPrompts, getStackedPrompt, stackPrompts } from './prompts';

describe('stackPrompts', () => {
    test('should combine master and specific prompt with a newline', () => {
        const master = 'Master Prompt';
        const specific = 'Specific Prompt';
        const expected = 'Master Prompt\nSpecific Prompt';
        expect(stackPrompts(master, specific)).toBe(expected);
    });

    test('should return only master if specific is empty', () => {
        const master = 'Master Prompt';
        expect(stackPrompts(master, '')).toBe(master);
    });

    test('should return only specific if master is empty', () => {
        const specific = 'Specific Prompt';
        expect(stackPrompts('', specific)).toBe(specific);
    });
});

describe('getPrompts', () => {
    test('returns all prompts', () => {
        const prompts = getPrompts();
        expect(prompts.length).toBeGreaterThan(0);
    });

    test('master prompt is not stacked', () => {
        const prompts = getPrompts();
        const master = prompts.find((p) => p.id === 'master_prompt');
        expect(master).toBeDefined();
        expect(master?.isMaster).toBe(true);
        expect(master?.content).not.toContain('\n\n'); // Should be raw content
    });

    test('addon prompts are stacked with master', () => {
        const prompts = getPrompts();
        const hadith = prompts.find((p) => p.id === 'hadith');
        expect(hadith).toBeDefined();
        expect(hadith?.isMaster).toBe(false);
        // Should contain both master and hadith content
        expect(hadith?.content).toContain('ROLE:'); // From master
        expect(hadith?.content).toContain('ISNAD VERBS:'); // From hadith addon
    });
});

describe('getPrompt', () => {
    test('returns master prompt by ID', () => {
        const prompt = getPrompt('master_prompt');
        expect(prompt.id).toBe('master_prompt');
        expect(prompt.isMaster).toBe(true);
    });

    test('returns stacked addon prompt by ID', () => {
        const prompt = getPrompt('fiqh');
        expect(prompt.id).toBe('fiqh');
        expect(prompt.isMaster).toBe(false);
        expect(prompt.content).toContain('ROLE:'); // From master
        expect(prompt.content).toContain('STRUCTURE:'); // From fiqh addon
    });

    test('is strongly typed - TypeScript should catch invalid IDs', () => {
        // This test just verifies the function exists and returns correctly
        // TypeScript will catch invalid IDs at compile time
        const validIds: PromptId[] = ['master_prompt', 'hadith', 'fiqh', 'tafsir'];
        for (const id of validIds) {
            const prompt = getPrompt(id);
            expect(prompt.id).toBe(id);
        }
    });
});

describe('getStackedPrompt', () => {
    test('returns prompt content as string', () => {
        const content = getStackedPrompt('encyclopedia_mixed');
        expect(typeof content).toBe('string');
        expect(content).toContain('ROLE:'); // From master
        expect(content).toContain('NO MODE TAGS:'); // From encyclopedia_mixed
    });
});

describe('getPromptIds', () => {
    test('returns array of all prompt IDs', () => {
        const ids = getPromptIds();
        expect(ids).toContain('master_prompt');
        expect(ids).toContain('hadith');
        expect(ids).toContain('fiqh');
        expect(ids).toContain('tafsir');
        expect(ids).toContain('encyclopedia_mixed');
    });
});

describe('getMasterPrompt', () => {
    test('returns master prompt content', () => {
        const content = getMasterPrompt();
        expect(content).toContain('ROLE:');
        expect(content).toContain('CRITICAL NEGATIONS:');
    });

    test('should include the LOCKED FORMULAE section', () => {
        const masterPromptPath = join(process.cwd(), 'prompts', 'master_prompt.md');
        const content = readFileSync(masterPromptPath, 'utf8');
        expect(content).toContain('LOCKED FORMULAE (Do NOT translate):');
        expect(content).toContain('al-salāmu ʿalaykum');
        expect(content).toContain('in shāʾ Allah');
    });

    test('should include the ID INTEGRITY block', () => {
        const masterPromptPath = join(process.cwd(), 'prompts', 'master_prompt.md');
        const content = readFileSync(masterPromptPath, 'utf8');
        expect(content).toContain('ID INTEGRITY (Check First):');
        expect(content).toContain('PREPASS (Silent closed set):');
        expect(content).toContain('BOUNDARY (No bleed):');
    });
});
