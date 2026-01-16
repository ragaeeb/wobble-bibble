/**
 * Implementation Agent Graph
 */
import { StateGraph, END, START } from '@langchain/langgraph';
import { applyChanges } from './steps.js';
import type { ImplementationState } from './types.js';

const graphState = {
    diffs: {
        value: (x: any, y: any) => y ?? x,
        default: () => []
    },
    pullRequestDescription: {
        value: (x: any, y: any) => y ?? x,
        default: () => ''
    },
    prUrl: {
        value: (x: any, y: any) => y ?? x,
        default: () => undefined
    },
    appliedChanges: {
        value: (x: any, y: any) => y ?? x,
        default: () => []
    },
    status: {
        value: (x: any, y: any) => y ?? x,
        default: () => 'FAILED'
    },
    error: {
        value: (x: any, y: any) => y ?? x,
        default: () => undefined
    }
};

async function implStep(state: ImplementationState) {
    return applyChanges(state);
}

export function createImplementationGraph() {
    return new StateGraph<ImplementationState>({ channels: graphState })
        .addNode("implement", implStep)
        .addEdge(START, "implement")
        .addEdge("implement", END)
        .compile();
}
