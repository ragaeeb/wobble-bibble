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
export const ATTACHMENT_URL_REGEX = /https:\/\/github\.com\/user-attachments\/files\/\d+\/[^\s)]+\.txt/gi;

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
        model: 'gemini-3-flash-preview',
        temperature: 0.1,
    });
}

/**
 * Node 1: Parse the combined dump file
 */
async function parseDump(state: TriageStateType): Promise<Partial<TriageStateType>> {
    let rawDumpContent: string;
    let attachmentUrl: string | null = null;

    console.log('📎 Parsing dump from issue body...');
    console.log(`📄 Issue body length: ${state.issueBody.length} chars`);

    // Try to extract attachment URL from issue body first
    const matches = state.issueBody.match(ATTACHMENT_URL_REGEX);
    console.log(`🔍 Attachment URL matches: ${JSON.stringify(matches)}`);

    if (matches && matches.length > 0) {
        attachmentUrl = matches[0];
        console.log(`📥 Fetching attachment: ${attachmentUrl}`);

        // Fetch the attachment content
        try {
            const response = await fetch(attachmentUrl);
            console.log(`📡 Fetch response: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                console.error(`❌ Fetch failed: ${response.status}`);
                return {
                    attachmentUrl,
                    error: `Failed to fetch attachment: ${response.status} ${response.statusText}`,
                };
            }
            rawDumpContent = await response.text();
            console.log(`📝 Fetched content length: ${rawDumpContent.length} chars`);
            console.log(`📝 First 200 chars: ${rawDumpContent.slice(0, 200)}`);
        } catch (error) {
            console.error(`❌ Fetch error: ${error}`);
            return {
                attachmentUrl,
                error: `Failed to fetch attachment: ${error}`,
            };
        }
    } else {
        // No attachment - try to extract pasted content from Combined Dump section
        console.log('📋 No attachment URL found, looking for pasted content...');
        const [, combinedDumpMatch] =
            state.issueBody.match(/### Combined Dump[\s\S]*?\n\n([\s\S]*?)(?=\n###|$)/i) || [];
        if (combinedDumpMatch?.trim()) {
            rawDumpContent = combinedDumpMatch.trim();
            console.log(`📝 Found pasted content: ${rawDumpContent.length} chars`);
        } else {
            console.error('❌ No combined dump content found');
            return {
                attachmentUrl: null,
                error: 'No combined dump content found. Please paste content or attach a .txt file.',
            };
        }
    }

    // Use Gemini to parse the dump into sections
    console.log('🤖 Sending to Gemini for parsing...');
    const model = getModel();
    const prompt = PARSE_DUMP_PROMPT.replace('{dumpContent}', rawDumpContent.slice(0, 50000));

    try {
        const response = await model.invoke([
            { content: SYSTEM_PROMPT, role: 'system' },
            { content: prompt, role: 'user' },
        ]);

        const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
        console.log(`🤖 Gemini response length: ${content.length} chars`);
        console.log(`🤖 Gemini response (first 500): ${content.slice(0, 500)}`);

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('❌ No JSON found in Gemini response');
            return {
                attachmentUrl,
                error: 'Failed to parse dump: no JSON in response',
                rawDumpContent,
            };
        }

        const parsed = JSON.parse(jsonMatch[0]) as ParsedDump;
        console.log(
            `✅ Parsed dump - promptStack: ${parsed.promptStack?.length ?? 0}, inputArabic: ${parsed.inputArabic?.length ?? 0}, output: ${parsed.output?.length ?? 0}`,
        );

        // Validate required fields exist and are strings
        if (typeof parsed.promptStack !== 'string') {
            parsed.promptStack = '';
        }
        if (typeof parsed.inputArabic !== 'string') {
            parsed.inputArabic = '';
        }
        if (typeof parsed.output !== 'string') {
            parsed.output = '';
        }
        if (typeof parsed.reasoningTrace !== 'string') {
            parsed.reasoningTrace = '';
        }

        return {
            attachmentUrl,
            parsedDump: parsed,
            rawDumpContent,
        };
    } catch (error) {
        console.error(`❌ Gemini parsing error: ${error}`);
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
        console.log('⏭️ Skipping analysis (error or no parsed dump)');
        return {};
    }

    console.log('🔬 Starting violation analysis...');

    const repoRoot = process.env.REPO_ROOT || process.cwd();
    const rules = loadPromptRules(repoRoot);
    console.log(`📚 Loaded ${rules.length} chars of prompt rules`);

    const model = getModel();

    // Reduce content limits for faster processing
    const inputSlice = state.parsedDump.inputArabic.slice(0, 5000);
    const outputSlice = state.parsedDump.output.slice(0, 5000);
    const reasoningSlice = state.parsedDump.reasoningTrace.slice(0, 5000);

    console.log(
        `📊 Analyzing: input=${inputSlice.length}, output=${outputSlice.length}, reasoning=${reasoningSlice.length} chars`,
    );

    const prompt = ANALYZE_PROMPT.replace('{hints}', state.hints || 'No hints provided')
        .replace('{rules}', rules.slice(0, 15000))
        .replace('{input}', inputSlice)
        .replace('{output}', outputSlice)
        .replace('{reasoning}', reasoningSlice);

    console.log(`📤 Sending ${prompt.length} chars to Gemini for analysis...`);

    try {
        const response = await model.invoke([
            { content: SYSTEM_PROMPT, role: 'system' },
            { content: prompt, role: 'user' },
        ]);

        console.log('📥 Received Gemini analysis response');

        const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
        console.log(`🤖 Analysis response length: ${content.length} chars`);

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.log('⚠️ No JSON found in analysis response');
            return {
                labelsToApply: ['triaged'],
                violations: [],
            };
        }

        const result = JSON.parse(jsonMatch[0]) as {
            violations: Violation[];
            failureTypes: string[];
        };
        // Ensure arrays exist
        if (!Array.isArray(result.violations)) {
            result.violations = [];
        }
        if (!Array.isArray(result.failureTypes)) {
            result.failureTypes = [];
        }

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
    console.log(`📝 Generating summary (violations: ${state.violations.length})...`);

    if (state.error) {
        console.log('⚠️ Error state detected, returning error comment');
        return {
            summaryComment: `⚠️ **Triage Error**\n\n${state.error}\n\nPlease ensure you've attached a valid .txt file with the combined dump.`,
        };
    }

    if (state.violations.length === 0) {
        console.log('✅ No violations detected');
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
            .map(
                (v) =>
                    `- **${v.ruleId ?? 'unknown'}** (${v.severity ?? 'unknown'}): ${(v.evidence ?? '').slice(0, 50)}...`,
            )
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
