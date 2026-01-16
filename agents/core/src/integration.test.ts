import { describe, expect, it, mock, spyOn, beforeEach, afterEach, afterAll } from 'bun:test';
import { createPipeline } from './pipeline.js';
import * as SynthesisSteps from '@wobble-bibble/agent-synthesis/src/steps.js';
import * as EngineerSteps from '@wobble-bibble/agent-engineer/src/steps.js';
import * as ValidationSteps from '@wobble-bibble/agent-validation/src/steps.js';
import * as ConsolidatorSteps from '@wobble-bibble/agent-consolidator/src/steps.js';
import * as ImplementationSteps from '@wobble-bibble/agent-implementation/src/steps.js';
import { getThreadConfig } from '@wobble-bibble/agents-shared';

describe('Pipeline Integration', () => {
    beforeEach(() => {
        // Mock all steps to test orchestration flow without calling LLMs
        spyOn(SynthesisSteps, 'summarizeIssue').mockResolvedValue({ 
            issueId: 1, title: 'T', violationType: 'V', brief: 'B' 
        });
        spyOn(SynthesisSteps, 'clusterPatterns').mockResolvedValue({ 
            clusters: [{ id: 'c1', pattern: 'P', issueIds: [1], representativeIssueId: 1, confidence: 1 }] 
        });

        spyOn(EngineerSteps, 'createPlan').mockResolvedValue([{ 
            patternId: 'c1', targetFile: 'f.md', proposedAction: 'MODIFY', rationale: 'R', riskAssessment: 'LOW', changes: 'C' 
        }]);
        spyOn(EngineerSteps, 'generateDiffs').mockResolvedValue([{ 
            file: 'f.md', originalContent: '', modifiedContent: 'mod', diff: 'diff', explanation: 'E' 
        }]);

        spyOn(ValidationSteps, 'runValidation').mockResolvedValue({ 
            validationStatus: 'PASS', testResults: [] 
        });

        spyOn(ConsolidatorSteps, 'consolidateFindings').mockResolvedValue({ 
            finalDecision: 'APPROVE', pullRequestDescription: 'PR' 
        });

        spyOn(ImplementationSteps, 'applyChanges').mockResolvedValue({ 
            status: 'SUCCESS', prUrl: 'http://pr', appliedChanges: ['f.md'] 
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
