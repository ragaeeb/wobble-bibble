/**
 * Engineer Agent Graph
 */
import { StateGraph, END, START } from '@langchain/langgraph';
import { createPlan, generateDiffs } from './steps.js';
import type { EngineerState } from './types.js';

// Define state channels
const graphState = {
    synthesisReport: {
        value: (x: any, y: any) => y ?? x,
        default: () => ({ patterns: [] })
    },
    plans: {
        value: (x: any[], y: any[]) => y ?? x,
        default: () => []
    },
    diffs: {
        value: (x: any[], y: any[]) => y ?? x,
        default: () => []
    },
    needsReview: {
        value: (x: boolean, y: boolean) => y ?? x,
        default: () => false
    }
};

// Nodes
async function planStep(state: EngineerState) {
    const plans = await createPlan(state.synthesisReport);
    return { plans };
}

async function diffStep(state: EngineerState) {
    const diffs = await generateDiffs(state.plans);
    return { diffs, needsReview: diffs.length > 0 };
}

// Graph
export function createEngineerGraph() {
    return new StateGraph<EngineerState>({ channels: graphState })
        .addNode("plan", planStep)
        .addNode("diff", diffStep)
        .addEdge(START, "plan")
        .addEdge("plan", "diff")
        .addEdge("diff", END)
        .compile();
}
