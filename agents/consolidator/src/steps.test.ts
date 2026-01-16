import { describe, expect, it, mock } from 'bun:test';
import { consolidateFindings } from './steps.js';

describe('Consolidator Steps', () => {
    it('should reject if validation fails', async () => {
        const state: any = {
            validationStatus: 'FAIL',
            failureReason: 'Tests failed'
        };
        const result = await consolidateFindings(state);
        expect(result.finalDecision).toBe('REJECT');
        expect(result.decisionReason).toContain('Validation failed');
    });

    it('should approve and generate PR description if validation passes', async () => {
        const state: any = {
            validationStatus: 'PASS',
            diffs: [{ file: 'test.md', diff: '+ changes' }]
        };

        const mockModel = {
            invoke: mock(async () => ({
                content: JSON.stringify({
                    decision: 'APPROVE',
                    description: 'PR Description',
                    reason: 'LGTM'
                })
            }))
        };

        const result = await consolidateFindings(state, mockModel);
        expect(result.finalDecision).toBe('APPROVE');
        expect(result.pullRequestDescription).toBe('PR Description');
    });
});
