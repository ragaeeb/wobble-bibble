/**
 * Validation Agent Graph
 */
import { StateGraph, END, START } from '@langchain/langgraph';
import { runValidation } from './steps.js';
import type { ValidationState } from './types.js';

const graphState = {
    diffs: {
        value: (x: any, y: any) => y ?? x,
        default: () => []
    },
    testResults: {
        value: (x: any, y: any) => y ?? x,
        default: () => []
    },
    validationStatus: {
        value: (x: any, y: any) => y ?? x,
        default: () => 'FAIL'
    }
};

export function createValidationGraph() {
    return new StateGraph<ValidationState>({ channels: graphState })
        .addNode("validate", runValidation)
        .addEdge(START, "validate")
        .addEdge("validate", END)
        .compile();
}
