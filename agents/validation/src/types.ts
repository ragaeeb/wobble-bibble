/**
 * Validation Agent State
 */
import type { AgentMetadata } from '@wobble-bibble/agents-shared';

export interface ValidationState {
    // Input from Engineer
    diffs: Array<{
        file: string;
        modifiedContent: string;
    }>;

    // Intermediate
    testResults: TestResult[];
    
    // Output
    validationStatus: 'PASS' | 'FAIL';
    failureReason?: string;
    metadata?: AgentMetadata;
}

export interface TestResult {
    caseId: string;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    status: 'PASS' | 'FAIL' | 'SKIPPED';
    tags: string[];
    /**
     * True when the test case was not executed (skeleton stub).
     * Keeps CI deterministic while execution wiring is incomplete.
     */
    stubbed?: boolean;
}
