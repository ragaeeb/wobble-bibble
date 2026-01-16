import { describe, expect, it } from 'bun:test';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadPromptRules } from './prompts.js';

describe('prompts', () => {
    describe('loadPromptRules', () => {
        it('should load multiple prompt files from the directory', () => {
            const tempDir = join(import.meta.dir, '../temp_test_prompts');
            if (!existsSync(tempDir)) {
                mkdirSync(tempDir);
            }

            try {
                writeFileSync(join(tempDir, 'master_prompt.md'), 'Master rules');
                writeFileSync(join(tempDir, 'hadith.md'), 'Hadith rules');

                // We point the root to the parent of temp_test_prompts
                // because loadPromptRules expects join(repoRoot, 'prompts')
                // So we'll rename temp_test_prompts to 'prompts' inside a subfolder
                const fakeRoot = join(import.meta.dir, '../fake_repo');
                const fakePrompts = join(fakeRoot, 'prompts');
                if (!existsSync(fakePrompts)) {
                    mkdirSync(fakePrompts, { recursive: true });
                }

                writeFileSync(join(fakePrompts, 'master_prompt.md'), 'Master content');
                writeFileSync(join(fakePrompts, 'hadith.md'), 'Hadith content');

                const rules = loadPromptRules(fakeRoot);
                const expected = '## master_prompt.md\nMaster content\n\n---\n\n## hadith.md\nHadith content';
                expect(rules).toEqual(expected);

                rmSync(fakeRoot, { force: true, recursive: true });
            } finally {
                if (existsSync(tempDir)) {
                    rmSync(tempDir, { force: true, recursive: true });
                }
            }
        });

        it('should return empty string if no prompt files exist', () => {
            const fakeRoot = join(import.meta.dir, '../empty_repo');
            const rules = loadPromptRules(fakeRoot);
            expect(rules).toBe('');
        });
    });
});
