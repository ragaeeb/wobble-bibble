import { describe, expect, it, mock, spyOn } from 'bun:test';
import { createPlan, generateDiffs } from './steps.js';
import * as DataModule from './data.js';

// Mock file reading
spyOn(DataModule, 'readPromptFile').mockImplementation(async (filename) => {
    if (filename === 'master.md') return '# Master Prompt\n\nExisting rules...';
    return '';
});

describe('Engineer Steps', () => {
    describe('createPlan', () => {
        it('should propose modifications for known patterns', async () => {
            const report = {
                patterns: [
                    {
                        id: 'p1',
                        hypothesis: 'Add rule to avoid formatting leaks',
                        affectedPrompts: ['master.md']
                    }
                ]
            };

            // Mock LLM
            const mockModel = {
                invoke: mock(async () => ({
                    content: JSON.stringify({
                        patternId: 'p1',
                        targetFile: 'master.md',
                        proposedAction: 'MODIFY',
                        rationale: 'Fix formatting leak',
                        riskAssessment: 'LOW',
                        changes: 'Add negative constraint for Arabic formatting'
                    })
                }))
            };

            const plans = await createPlan(report, mockModel);
            
            expect(plans).toHaveLength(1);
            expect(plans[0].targetFile).toBe('master.md');
            expect(plans[0].proposedAction).toBe('MODIFY');
        });
    });

    describe('generateDiffs', () => {
        it('should generate a diff for a modification plan', async () => {
            const plans = [{
                patternId: 'p1',
                targetFile: 'master.md',
                proposedAction: 'MODIFY' as const,
                rationale: 'Fix leak',
                riskAssessment: 'LOW' as const,
                changes: 'Add rule'
            }];

            const mockModel = {
                invoke: mock(async () => ({
                    content: JSON.stringify({
                        file: 'master.md',
                        originalContent: '# Master Prompt\n\nExisting rules...',
                        modifiedContent: '# Master Prompt\n\nExisting rules...\n- No Arabic leaks',
                        diff: '@@ -1,3 +1,4 @@\n Existing rules...\n+- No Arabic leaks',
                        explanation: 'Added rule'
                    })
                }))
            };

            const diffs = await generateDiffs(plans, mockModel);
            
            expect(diffs).toHaveLength(1);
            expect(diffs[0].file).toBe('master.md');
            expect(diffs[0].diff).toContain('No Arabic leaks');
        });
    });
});
