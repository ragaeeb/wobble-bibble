/**
 * Type definitions for the Triage Agent
 */

/**
 * Parsed content from the user's combined dump file
 */
export type ParsedDump = {
    /** The prompt stack section (master + addon) */
    promptStack: string;
    /** The Arabic input text sent to the model */
    inputArabic: string;
    /** The model's output */
    output: string;
    /** The model's reasoning trace (if available) */
    reasoningTrace: string;
};

/**
 * A detected rule violation
 */
export type Violation = {
    /** The rule ID (e.g., "NO_ARABIC_SCRIPT", "ALA_LC_SCHEME") */
    ruleId: string;
    /** Severity: high, medium, or low */
    severity: 'high' | 'medium' | 'low';
    /** Evidence: quote the problematic text */
    evidence: string;
    /** Segment ID where the violation occurred (if applicable) */
    segmentId?: string;
};

/**
 * LangGraph state for the triage workflow
 */
export type TriageState = {
    /** GitHub issue number */
    issueNumber: number;
    /** Issue title */
    issueTitle: string;
    /** Issue body */
    issueBody: string;
    /** User-provided hints (optional) */
    hints: string;
    /** URL to the attached dump file */
    attachmentUrl: string | null;
    /** Raw content of the dump file */
    rawDumpContent: string;
    /** Parsed sections from the dump */
    parsedDump: ParsedDump | null;
    /** Detected violations */
    violations: Violation[];
    /** Labels to apply */
    labelsToApply: string[];
    /** Summary comment to post */
    summaryComment: string;
    /** Error message if something went wrong */
    error: string | null;
};

/**
 * Final JSON output written to archive
 */
export type TriageResult = {
    issueNumber: number;
    issueUrl: string;
    createdAt: string;
    attachmentUrl: string | null;
    metadata: {
        /** The model used to generate the translation (from issue label) */
        model: string | null;
        /** The addon prompt used (from issue label) */
        promptAddon: string | null;
        /** Thinking time extracted from reasoning trace (e.g., "Thought for 34s") */
        thinkingTimeSeconds: number | null;
        /** The LLM used for triage analysis (e.g., "gemini/gemini-3-flash-preview") */
        analysisModel: string;
    };
    parsedContent: {
        promptStack: string;
        inputArabic: string;
        inputCharCount: number;
        output: string;
        outputCharCount: number;
        reasoningTrace: string;
        reasoningCharCount: number;
    };
    detectedViolations: Violation[];
    labelsApplied: string[];
};
