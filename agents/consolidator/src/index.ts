/**
 * Consolidator Agent Graph
 */
import { StateGraph, END, START } from '@langchain/langgraph';
import { consolidateFindings } from './steps.js';
import type { ConsolidatorState } from './types.js';

const graphState = {
    validationStatus: {
        value: (x: any, y: any) => y ?? x,
        default: () => 'FAIL'
    },
    failureReason: {
        value: (x: any, y: any) => y ?? x,
        default: () => undefined
    },
    diffs: {
        value: (x: any, y: any) => y ?? x,
        default: () => []
    },
    finalDecision: {
        value: (x: any, y: any) => y ?? x,
        default: () => 'REJECT'
    },
    decisionReason: {
        value: (x: any, y: any) => y ?? x,
        default: () => ''
    },
    pullRequestDescription: {
        value: (x: any, y: any) => y ?? x,
        default: () => undefined
    }
};

async function consolidateStep(state: ConsolidatorState) {
    return consolidateFindings(state);
}

export function createConsolidatorGraph() {
    return new StateGraph<ConsolidatorState>({ channels: graphState })
        .addNode("consolidate", consolidateStep)
        .addEdge(START, "consolidate")
        .addEdge("consolidate", END)
        .compile();
}
