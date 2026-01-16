/**
 * Synthesis Agent Graph
 */
import { StateGraph, END, START } from '@langchain/langgraph';
import { summarizeIssue, clusterPatterns } from './steps.js';
import type { SynthesisState } from './types.js';

// Define the graph state channels
const graphState = {
    issueIds: {
        value: (x: number[], y: number[]) => y ?? x,
        default: () => []
    },
    summaries: {
        value: (x: any[], y: any[]) => (x || []).concat(y || []),
        default: () => []
    },
    clusters: {
        value: (x: any[], y: any[]) => y ?? x,
        default: () => []
    }
};

// Map step wrapper to handle parallelism
async function mapStep(state: SynthesisState) {
    const { issueIds } = state;
    // Execute summaries in parallel
    const summaries = await Promise.all(
        issueIds.map(id => summarizeIssue(id))
    );
    return { summaries };
}

// Reduce step wrapper
async function reduceStep(state: SynthesisState) {
    return clusterPatterns(state);
}

// Build the graph
export function createSynthesisGraph() {
    const workflow = new StateGraph<SynthesisState>({
        channels: graphState
    })
    .addNode("map_summarize", mapStep)
    .addNode("reduce_cluster", reduceStep)
    .addEdge(START, "map_summarize")
    .addEdge("map_summarize", "reduce_cluster")
    .addEdge("reduce_cluster", END);

    return workflow.compile(); // No checkpointer for now, added later
}
