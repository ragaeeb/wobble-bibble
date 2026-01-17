/**
 * Engineer Agent Steps
 */

import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { getModel } from '@wobble-bibble/agents-shared';
import { readPromptFile } from './data.js';
import type { EngineeringPlan, EngineerState, PromptDiff } from './types.js';

interface RunnableLike {
    invoke: (input: any) => Promise<any>;
}

export async function createPlan(
    synthesisReport: EngineerState['synthesisReport'],
    model?: RunnableLike,
): Promise<EngineeringPlan[]> {
    const plans: EngineeringPlan[] = [];
    const llm = model || getModel();

    for (const pattern of synthesisReport.patterns) {
        const prompt = `
        Review this issue pattern and propose changes to the affected prompts.
        
        Pattern: "${pattern.hypothesis}"
        Affected files: ${pattern.affectedPrompts.join(', ')}
        
        Output only valid JSON:
        {
            "patternId": "${pattern.id}",
            "targetFile": "filename",
            "proposedAction": "MODIFY" | "ADD" | "DELETE" | "NO_OP",
            "rationale": "reason",
            "riskAssessment": "LOW" | "MEDIUM" | "HIGH",
            "changes": "description of changes"
        }
        `;

        // In production, use structured output mode
        const result = await llm.invoke([
            new SystemMessage('You are a prompt engineer. Output valid JSON only.'),
            new HumanMessage(prompt),
        ]);

        try {
            const content = String(result.content).replace(/```json\n?|\n?```/g, '');
            const plan = JSON.parse(content);
            plans.push(plan);
        } catch (e) {
            console.error('Failed to parse plan', e);
        }
    }

    return plans;
}

export async function generateDiffs(plans: EngineeringPlan[], model?: RunnableLike) {
    const diffs: PromptDiff[] = [];
    const llm = model || getModel();

    for (const plan of plans) {
        if (plan.proposedAction === 'NO_OP') {
            continue;
        }

        const content = await readPromptFile(plan.targetFile);

        const prompt = `
        Apply the following changes to the file.
        
        File: ${plan.targetFile}
        Current Content:
        ${content}
        
        Action: ${plan.proposedAction}
        Plan: ${plan.changes}
        Rationale: ${plan.rationale}
        
        Output valid JSON:
        {
            "file": "${plan.targetFile}",
            "originalContent": "...",
            "modifiedContent": "...",
            "diff": "unified diff string",
            "explanation": "brief explanation"
        }
        `;

        const result = await llm.invoke([
            new SystemMessage('You are a code generation assistant. Output valid JSON.'),
            new HumanMessage(prompt),
        ]);

        try {
            const response = String(result.content).replace(/```json\n?|\n?```/g, '');
            diffs.push(JSON.parse(response));
        } catch (e) {
            console.error('Failed to parse diff', e);
        }
    }

    return diffs;
}
