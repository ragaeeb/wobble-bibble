/**
 * Engineer Agent State
 */
import type { AgentMetadata } from '@wobble-bibble/agents-shared';

export interface EngineerState {
    // Input from Synthesis
    synthesisReport: {
        patterns: Array<{
            id: string;
            hypothesis: string;
            affectedPrompts: string[];
        }>;
    };

    // Intermediate
    plans: EngineeringPlan[];
    
    // Output
    diffs: PromptDiff[];
    needsReview: boolean;
    metadata?: AgentMetadata;
}

export interface EngineeringPlan {
    patternId: string;
    targetFile: string;
    proposedAction: 'MODIFY' | 'ADD' | 'DELETE' | 'NO_OP';
    rationale: string;
    riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH';
    changes: string; // Description of changes
}

export interface PromptDiff {
    file: string;
    originalContent: string;
    modifiedContent: string;
    diff: string; // Unified diff format
    explanation: string;
}
