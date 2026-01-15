import type { TriageStateType } from './graph.js';
import type { TriageResult } from './types.js';

/**
 * Parse owner/repo from a GitHub URL
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
    const match = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    if (match) {
        return { owner: match[1], repo: match[2] };
    }
    return null;
}

/**
 * Extract thinking time from reasoning trace (e.g., "Thought for 34s" or "Thought for 2m 15s")
 */
export function extractThinkingTime(reasoningTrace: string): number | null {
    const thinkingMatch = reasoningTrace.match(/Thought for (?:(\d+)m\s*)?(\d+)s/i);
    if (thinkingMatch) {
        const minutes = thinkingMatch[1] ? Number.parseInt(thinkingMatch[1], 10) : 0;
        const seconds = Number.parseInt(thinkingMatch[2], 10);
        return minutes * 60 + seconds;
    }
    return null;
}

/**
 * Build the final triage result object
 */
export function buildTriageResult(
    config: { issueNumber: number },
    issue: { html_url: string },
    result: TriageStateType,
    existingLabels: string[],
    labelsToAdd: string[],
): TriageResult {
    const modelLabel = existingLabels.find((l) => l.startsWith('model:'));
    const addonLabel = existingLabels.find((l) => l.startsWith('addon:'));

    // Extract thinking time from rawDumpContent (more reliable than parsed reasoningTrace)
    const thinkingTimeSeconds = extractThinkingTime(result.rawDumpContent ?? '');

    return {
        attachmentUrl: result.attachmentUrl,
        createdAt: new Date().toISOString(),
        detectedViolations: result.violations,
        issueNumber: config.issueNumber,
        issueUrl: issue.html_url,
        labelsApplied: [...existingLabels, ...labelsToAdd],
        metadata: {
            model: modelLabel?.replace('model:', '') ?? null,
            promptAddon: addonLabel?.replace('addon:', '') ?? null,
            thinkingTimeSeconds,
        },
        parsedContent: {
            inputArabic: result.parsedDump?.inputArabic ?? '',
            inputCharCount: result.parsedDump?.inputArabic.length ?? 0,
            output: result.parsedDump?.output ?? '',
            outputCharCount: result.parsedDump?.output.length ?? 0,
            promptStack: result.parsedDump?.promptStack ?? '',
            reasoningCharCount: result.parsedDump?.reasoningTrace.length ?? 0,
            reasoningTrace: result.parsedDump?.reasoningTrace ?? '',
        },
    };
}
