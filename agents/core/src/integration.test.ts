import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import * as ConsolidatorSteps from '@wobble-bibble/agent-consolidator/src/steps.js';
import * as EngineerSteps from '@wobble-bibble/agent-engineer/src/steps.js';
import * as ImplementationSteps from '@wobble-bibble/agent-implementation/src/steps.js';
import * as SynthesisSteps from '@wobble-bibble/agent-synthesis/src/steps.js';
import * as ValidationSteps from '@wobble-bibble/agent-validation/src/steps.js';
import { getThreadConfig } from '@wobble-bibble/agents-shared';
import { createPipeline } from './pipeline.js';

describe('Pipeline Integration', () => {
    beforeEach(() => {
        // Mock all steps to test orchestration flow without calling LLMs
        spyOn(SynthesisSteps, 'summarizeIssue').mockResolvedValue({
            brief: 'B',
            issueId: 1,
            title: 'T',
            violationType: 'V',
        });
        spyOn(SynthesisSteps, 'clusterPatterns').mockResolvedValue({
            clusters: [{ confidence: 1, id: 'c1', issueIds: [1], pattern: 'P', representativeIssueId: 1 }],
        });

        spyOn(EngineerSteps, 'createPlan').mockResolvedValue([
            {
                changes: 'C',
                patternId: 'c1',
                proposedAction: 'MODIFY',
                rationale: 'R',
                riskAssessment: 'LOW',
                targetFile: 'f.md',
            },
        ]);
        spyOn(EngineerSteps, 'generateDiffs').mockResolvedValue([
            { diff: 'diff', explanation: 'E', file: 'f.md', modifiedContent: 'mod', originalContent: '' },
        ]);

        spyOn(ValidationSteps, 'runValidation').mockResolvedValue({ testResults: [], validationStatus: 'PASS' });

        spyOn(ConsolidatorSteps, 'consolidateFindings').mockResolvedValue({
            finalDecision: 'APPROVE',
            pullRequestDescription: 'PR',
        });

        spyOn(ImplementationSteps, 'applyChanges').mockResolvedValue({
            appliedChanges: ['f.md'],
            prUrl: 'http://pr',
            status: 'SUCCESS',
        });
    });

    afterEach(() => {
        mock.restore();
    });

    it('should run through the full happy path', async () => {
        const app = await createPipeline();
        const config = getThreadConfig('test-thread-1');

        // 1. Start Synthesis
        let state = await app.invoke({ issueIds: [1] }, config);

        // Should pause at Engineer (before Validation)
        const snapshot1 = await app.getState(config);
        expect(snapshot1.next).toContain('validation');

        // 2. Resume (Engineer -> Validation -> Consolidator)
        // Should pause before Implementation
        state = await app.invoke(null, config);
        const snapshot2 = await app.getState(config);
        expect(snapshot2.next).toContain('implementation');

        // 3. Resume (Implementation)
        state = await app.invoke(null, config);
        const snapshot3 = await app.getState(config);

        // Should be finished
        expect(snapshot3.next).toHaveLength(0);
        expect(state.prUrl).toBe('http://pr');
    });
});
