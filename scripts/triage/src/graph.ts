/**
 * LangGraph State Graph for Issue Triage
 *
 * Uses proper LangGraph.js Annotation patterns per docs.langchain.com
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { ANALYZE_PROMPT, loadPromptRules, PARSE_DUMP_PROMPT, SUMMARY_PROMPT, SYSTEM_PROMPT } from './prompts.js';
import type { ParsedDump, Violation } from './types.js';

// Regex to extract attachment URLs from GitHub issue body
const ATTACHMENT_URL_REGEX = /https:\/\/github\.com\/user-attachments\/files\/\d+\/[^\s)]+\.txt/gi;

// Simple reducer that replaces old value with new value
const replaceReducer = <T>(_old: T, newVal: T) => newVal;

// Define the state using proper Annotation pattern
const TriageState = Annotation.Root({
    attachmentUrl: Annotation<string | null>({
        default: () => null,
        reducer: replaceReducer,
    }),
    error: Annotation<string | null>({
        default: () => null,
        reducer: replaceReducer,
    }),
    hints: Annotation<string>({
        default: () => '',
        reducer: replaceReducer,
    }),
    issueBody: Annotation<string>({
        default: () => '',
        reducer: replaceReducer,
    }),
    issueNumber: Annotation<number>({
        default: () => 0,
        reducer: replaceReducer,
    }),
    issueTitle: Annotation<string>({
        default: () => '',
        reducer: replaceReducer,
    }),
    labelsToApply: Annotation<string[]>({
        default: () => [],
        reducer: replaceReducer,
    }),
    parsedDump: Annotation<ParsedDump | null>({
        default: () => null,
        reducer: replaceReducer,
    }),
    rawDumpContent: Annotation<string>({
        default: () => '',
        reducer: replaceReducer,
    }),
    summaryComment: Annotation<string>({
        default: () => '',
        reducer: replaceReducer,
    }),
    violations: Annotation<Violation[]>({
        default: () => [],
        reducer: replaceReducer,
    }),
});

// Extract the state type for function signatures
export type TriageStateType = typeof TriageState.State;

/**
 * Initialize the Gemini model
 */
function getModel(): ChatGoogleGenerativeAI {
    return new ChatGoogleGenerativeAI({
        model: 'gemini-2.5-flash',
        temperature: 0.1,
    });
}

/**
 * Node 1: Parse the combined dump file
 */
async function parseDump(state: TriageStateType): Promise<Partial<TriageStateType>> {
    // Extract attachment URL from issue body
    const matches = state.issueBody.match(ATTACHMENT_URL_REGEX);
    if (!matches || matches.length === 0) {
        return {
            attachmentUrl: null,
            error: 'No attachment URL found in issue body. Please attach a .txt file.',
        };
    }

    const attachmentUrl = matches[0];

    // Fetch the attachment content
    let rawDumpContent: string;
    try {
        const response = await fetch(attachmentUrl);
        if (!response.ok) {
            return {
                attachmentUrl,
                error: `Failed to fetch attachment: ${response.status} ${response.statusText}`,
            };
        }
        rawDumpContent = await response.text();
    } catch (error) {
        return {
            attachmentUrl,
            error: `Failed to fetch attachment: ${error}`,
        };
    }

    // Use Gemini to parse the dump into sections
    const model = getModel();
    const prompt = PARSE_DUMP_PROMPT.replace('{dumpContent}', rawDumpContent.slice(0, 50000));

    try {
        const response = await model.invoke([
            { content: SYSTEM_PROMPT, role: 'system' },
            { content: prompt, role: 'user' },
        ]);

        const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return {
                attachmentUrl,
                error: 'Failed to parse dump: no JSON in response',
                rawDumpContent,
            };
        }

        const parsed = JSON.parse(jsonMatch[0]) as ParsedDump;
        return {
            attachmentUrl,
            parsedDump: parsed,
            rawDumpContent,
        };
    } catch (error) {
        return {
            attachmentUrl,
            error: `Failed to parse dump with AI: ${error}`,
            rawDumpContent,
        };
    }
}

/**
 * Node 2: Analyze the output for rule violations
 */
async function analyzeError(state: TriageStateType): Promise<Partial<TriageStateType>> {
    if (state.error || !state.parsedDump) {
        return {};
    }

    const repoRoot = process.env.REPO_ROOT || process.cwd();
    const rules = loadPromptRules(repoRoot);

    const model = getModel();
    const prompt = ANALYZE_PROMPT.replace('{hints}', state.hints || 'No hints provided')
        .replace('{rules}', rules.slice(0, 30000))
        .replace('{input}', state.parsedDump.inputArabic.slice(0, 10000))
        .replace('{output}', state.parsedDump.output.slice(0, 10000))
        .replace('{reasoning}', state.parsedDump.reasoningTrace.slice(0, 10000));

    try {
        const response = await model.invoke([
            { content: SYSTEM_PROMPT, role: 'system' },
            { content: prompt, role: 'user' },
        ]);

        const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return {
                labelsToApply: ['triaged'],
                violations: [],
            };
        }

        const result = JSON.parse(jsonMatch[0]) as {
            violations: Violation[];
            failureTypes: string[];
        };

        const labelsToApply = new Set<string>();

        for (const ft of result.failureTypes || []) {
            labelsToApply.add(ft);
        }

        for (const v of result.violations || []) {
            labelsToApply.add(`rule:${v.ruleId}`);
        }

        labelsToApply.add('triaged');

        return {
            labelsToApply: Array.from(labelsToApply),
            violations: result.violations || [],
        };
    } catch (error) {
        console.error('Analysis error:', error);
        return {
            labelsToApply: ['triaged'],
            violations: [],
        };
    }
}

/**
 * Node 3: Generate summary comment
 */
async function generateSummary(state: TriageStateType): Promise<Partial<TriageStateType>> {
    if (state.error) {
        return {
            summaryComment: `⚠️ **Triage Error**\n\n${state.error}\n\nPlease ensure you've attached a valid .txt file with the combined dump.`,
        };
    }

    if (state.violations.length === 0) {
        return {
            summaryComment:
                '✅ **Triage Complete**\n\nNo rule violations were automatically detected. Manual review may still be needed.',
        };
    }

    const model = getModel();
    const failureTypes = state.labelsToApply.filter((l) => !l.startsWith('rule:') && l !== 'triaged');
    const prompt = SUMMARY_PROMPT.replace('{violations}', JSON.stringify(state.violations, null, 2)).replace(
        '{failureTypes}',
        failureTypes.join(', '),
    );

    try {
        const response = await model.invoke([
            { content: SYSTEM_PROMPT, role: 'system' },
            { content: prompt, role: 'user' },
        ]);

        const content = typeof response.content === 'string' ? response.content : String(response.content);
        return {
            summaryComment: `🤖 **AI Triage Summary**\n\n${content}`,
        };
    } catch {
        const violationList = state.violations
            .map((v) => `- **${v.ruleId}** (${v.severity}): ${v.evidence.slice(0, 50)}...`)
            .join('\n');

        return {
            summaryComment: `🤖 **AI Triage Summary**\n\nDetected ${state.violations.length} violation(s):\n${violationList}\n\nLabels applied: ${state.labelsToApply.join(', ')}`,
        };
    }
}

/**
 * Create the triage graph using proper LangGraph.js patterns
 */
export function createTriageGraph() {
    const graph = new StateGraph(TriageState)
        .addNode('parse_dump', parseDump)
        .addNode('analyze_error', analyzeError)
        .addNode('generate_summary', generateSummary)
        .addEdge(START, 'parse_dump')
        .addEdge('parse_dump', 'analyze_error')
        .addEdge('analyze_error', 'generate_summary')
        .addEdge('generate_summary', END);

    return graph.compile();
}
