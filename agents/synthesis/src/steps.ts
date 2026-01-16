import { getModel, sanitizeJson } from '@wobble-bibble/agents-shared';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import type { IssueCluster, IssueSummary, SynthesisState } from './types.js';
import { fetchTriageData } from './data.js';

// Schema for summarization output
const SummarySchema = z.object({
    title: z.string(),
    violationType: z.string(),
    brief: z.string().describe("A 1-sentence summary of the core issue"),
});

// LangChain compatible model interface
interface RunnableLike {
    invoke: (input: any) => Promise<any>;
}

/**
 * MAP: Summarize a single issue into a lightweight format
 */
export async function summarizeIssue(issueId: number, model?: RunnableLike): Promise<IssueSummary> {
    const report = await fetchTriageData(issueId);
    
    const prompt = `
    Analyze this triage report and summarize it into a strict JSON format.
    
    Report:
    ${JSON.stringify(report, null, 2)}
    
    Output JSON with keys: title, violationType, brief.
    `;

    const llm = model || getModel();
    const result = await llm.invoke([
        new SystemMessage("You are a summarization assistant. Output only valid JSON."),
        new HumanMessage(prompt)
    ]);

    // Parse and validate output
    // In production, use structured output/function calling
    let parsed;
    try {
        const content = typeof result.content === 'string' ? result.content : String(result.content);
        // cleaning markdown code blocks if present
        const jsonStr = content.replace(/```json\n?|\n?```/g, '');
        parsed = JSON.parse(jsonStr);
    } catch (e) {
        // Fallback if LLM fails JSON
        console.error(`Failed to parse summary for issue ${issueId}`, e);
        return {
            issueId,
            title: report.title || `Issue ${issueId}`,
            violationType: 'unknown',
            brief: 'Failed to generate summary'
        };
    }

    const valid = SummarySchema.safeParse(parsed);
    if (!valid.success) {
         return {
            issueId,
            title: report.title || `Issue ${issueId}`,
            violationType: 'unknown',
            brief: 'Invalid summary schema'
        };
    }

    return {
        issueId,
        ...valid.data
    };
}

/**
 * REDUCE: Cluster summaries into patterns
 */
export async function clusterPatterns(state: SynthesisState): Promise<Partial<SynthesisState>> {
    const { summaries } = state;
    if (!summaries || summaries.length === 0) return { clusters: [] };

    // Simple clustering by violation type for Phase 1
    // Phase 2 will add embeddings
    const clusters: Record<string, IssueCluster> = {};

    for (const summary of summaries) {
        const key = summary.violationType.toLowerCase();
        
        if (!clusters[key]) {
            clusters[key] = {
                id: `cluster-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                pattern: `${summary.violationType} issues`,
                issueIds: [],
                representativeIssueId: summary.issueId,
                confidence: 1.0
            };
        }
        
        clusters[key].issueIds.push(summary.issueId);
    }

    return {
        clusters: Object.values(clusters)
    };
}
