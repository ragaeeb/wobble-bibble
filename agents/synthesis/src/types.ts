/**
 * Synthesis Agent State
 */
import type { AgentMetadata } from '@wobble-bibble/agents-shared';

export interface SynthesisState {
    // Input
    issueIds: number[];
    filters: {
        labels?: string[];
        since?: string;
    };

    // Intermediate (Map step)
    summaries: IssueSummary[];

    // Intermediate (Reduce step)
    clusters: IssueCluster[];

    // Output
    report?: SynthesisReport;
    metadata?: AgentMetadata;
}

export interface IssueSummary {
    issueId: number;
    title: string;
    violationType: string;
    brief: string; // 1-sentence summary
    embedding?: number[]; // Placeholder for vector
}

export interface IssueCluster {
    id: string;
    pattern: string;
    issueIds: number[];
    representativeIssueId: number;
    confidence: number;
}

export interface SynthesisReport {
    patterns: DetectedPattern[];
    issuesAnalyzed: number;
    clustersFound: number;
}

export interface DetectedPattern {
    id: string;
    hypothesis: string;
    affectedPrompts: string[];
    supportingEvidence: {
        issueId: number;
        context: string;
    }[];
    confidence: number;
}
