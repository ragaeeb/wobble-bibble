/**
 * Consolidator Agent Steps
 */
import { getModel } from '@wobble-bibble/agents-shared';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { ConsolidatorState } from './types.js';

interface RunnableLike {
    invoke: (input: any) => Promise<any>;
}

export async function consolidateFindings(
    state: ConsolidatorState,
    model?: RunnableLike
): Promise<Partial<ConsolidatorState>> {
    const { validationStatus, failureReason, diffs } = state;
    
    // 1. Hard gate on validation failure
    if (validationStatus === 'FAIL') {
        return {
            finalDecision: 'REJECT',
            decisionReason: `Validation failed: ${failureReason || 'Unknown error'}`
        };
    }

    // 2. If valid, generate PR description
    const llm = model || getModel();
    
    const prompt = `
    Review these proposed changes and generate a GitHub PR description.
    
    Changes:
    ${JSON.stringify(diffs.map(d => ({ file: d.file, diff: d.diff })), null, 2)}
    
    Output JSON:
    {
        "decision": "APPROVE",
        "description": "Markdow description...",
        "reason": "Brief summary"
    }
    `;

    try {
        const result = await llm.invoke([
            new SystemMessage("You are a senior engineer. Output valid JSON."),
            new HumanMessage(prompt)
        ]);

        const content = String(result.content).replace(/```json\n?|\n?```/g, '');
        const parsed = JSON.parse(content);
        
        return {
            finalDecision: 'APPROVE',
            decisionReason: parsed.reason || 'Changes approved by validation',
            pullRequestDescription: parsed.description
        };

    } catch (e) {
        return {
            finalDecision: 'NEEDS_REVISION',
            decisionReason: `Failed to generate PR description: ${e}`
        };
    }
}
