/**
 * Consolidator Agent State
 */
import type { AgentMetadata } from '@wobble-bibble/agents-shared';

export interface ConsolidatorState {
    // Input
    validationStatus: 'PASS' | 'FAIL';
    failureReason?: string;
    diffs: Array<{ file: string; diff: string }>;
    
    // Output
    finalDecision: 'APPROVE' | 'REJECT' | 'NEEDS_REVISION';
    decisionReason: string;
    pullRequestDescription?: string;
    metadata?: AgentMetadata;
}
