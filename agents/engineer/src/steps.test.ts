import { describe, expect, it, mock, spyOn } from 'bun:test';
import * as DataModule from './data.js';
import { createPlan, generateDiffs } from './steps.js';

// Mock file reading
spyOn(DataModule, 'readPromptFile').mockImplementation(async (filename) => {
    if (filename === 'master.md') {
        return '# Master Prompt\n\nExisting rules...';
    }
    return '';
});

describe('Engineer Steps', () => {
    describe('createPlan', () => {
        it('should propose modifications for known patterns', async () => {
            const report = {
                patterns: [
                    {
                        affectedPrompts: ['master.md'],
                        hypothesis: 'Add rule to avoid formatting leaks',
                        id: 'p1',
                    },
                ],
            };

            // Mock LLM
            const mockModel = {
                invoke: mock(async () => ({
                    content: JSON.stringify({
                        changes: 'Add negative constraint for Arabic formatting',
                        patternId: 'p1',
                        proposedAction: 'MODIFY',
                        rationale: 'Fix formatting leak',
                        riskAssessment: 'LOW',
                        targetFile: 'master.md',
                    }),
                })),
            };

            const plans = await createPlan(report, mockModel);

            expect(plans).toHaveLength(1);
            expect(plans[0].targetFile).toBe('master.md');
            expect(plans[0].proposedAction).toBe('MODIFY');
        });
    });

    describe('generateDiffs', () => {
        it('should generate a diff for a modification plan', async () => {
            const plans = [
                {
                    changes: 'Add rule',
                    patternId: 'p1',
                    proposedAction: 'MODIFY' as const,
                    rationale: 'Fix leak',
                    riskAssessment: 'LOW' as const,
                    targetFile: 'master.md',
                },
            ];

            const mockModel = {
                invoke: mock(async () => ({
                    content: JSON.stringify({
                        diff: '@@ -1,3 +1,4 @@\n Existing rules...\n+- No Arabic leaks',
                        explanation: 'Added rule',
                        file: 'master.md',
                        modifiedContent: '# Master Prompt\n\nExisting rules...\n- No Arabic leaks',
                        originalContent: '# Master Prompt\n\nExisting rules...',
                    }),
                })),
            };

            const diffs = await generateDiffs(plans, mockModel);

            expect(diffs).toHaveLength(1);
            expect(diffs[0].file).toBe('master.md');
            expect(diffs[0].diff).toContain('No Arabic leaks');
        });
    });
});
