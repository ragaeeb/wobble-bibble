/**
 * Implementation Agent State
 */
import type { AgentMetadata } from '@wobble-bibble/agents-shared';

export interface ImplementationState {
    // Input
    diffs: Array<{ file: string; modifiedContent: string }>;
    pullRequestDescription: string;
    
    // Output
    prUrl?: string;
    appliedChanges: string[];
    status: 'SUCCESS' | 'FAILED';
    error?: string;
    metadata?: AgentMetadata;
}
