/**
 * Main Refinement Pipeline Graph
 * Orchestrates Triage -> Synthesis -> Engineer -> Validation -> Consolidator -> Implementation
 */
import { StateGraph, END, START } from '@langchain/langgraph';
import { createSynthesisGraph } from '@wobble-bibble/agent-synthesis';
import { createEngineerGraph } from '@wobble-bibble/agent-engineer';
import { createValidationGraph } from '@wobble-bibble/agent-validation';
import { createConsolidatorGraph } from '@wobble-bibble/agent-consolidator';
import { createImplementationGraph } from '@wobble-bibble/agent-implementation';
import { getCheckpointer, getThreadConfig } from '@wobble-bibble/agents-shared';

// Define Global State (Union of all agent states)
// In a real app we might want strict separation, but sharing state makes data flow easier here
const pipelineState = {
    // Pipeline Input
    issueIds: {
        // Merge incoming IDs instead of dropping them.
        value: (x: number[] | undefined, y: number[] | undefined) => [
            ...(x ?? []),
            ...(y ?? []),
        ],
        default: () => []
    },
    // Synthesis Output / Engineer Input
    synthesisReport: {
        value: (x: any, y: any) => y ?? x,
        default: () => undefined
    },
    // Engineer Output / Validation Input
    diffs: {
        value: (x: any[], y: any[]) => y ?? x,
        default: () => []
    },
    plans: {
        value: (x: any[], y: any[]) => y ?? x,
        default: () => []
    },
    // Validation Output / Consolidator Input
    validationStatus: {
        value: (x: any, y: any) => y ?? x,
        default: () => 'FAIL'
    },
    testResults: {
        value: (x: any, y: any) => y ?? x,
        default: () => []
    },
    failureReason: {
        value: (x: any, y: any) => y ?? x,
        default: () => undefined
    },
    // Consolidator Output / Implementation Input
    finalDecision: {
        value: (x: any, y: any) => y ?? x,
        default: () => 'REJECT'
    },
    pullRequestDescription: {
        value: (x: any, y: any) => y ?? x,
        default: () => undefined
    },
    // Implementation Output
    prUrl: {
        value: (x: any, y: any) => y ?? x,
        default: () => undefined
    },
    status: {
        value: (x: any, y: any) => y ?? x,
        default: () => undefined
    }
};

// Subgraph wrapping to strictly map state if needed, 
// using 'glue' functions as nodes or just direct compilation if state schema matches.
// Here we assume keys match reasonably well or we rely on LangGraph state merging.

export async function createPipeline() {
    const checkpointer = await getCheckpointer();

    const builder = new StateGraph({ channels: pipelineState })
        .addNode("synthesis", createSynthesisGraph())
        .addNode("engineer", createEngineerGraph())
        .addNode("validation", createValidationGraph())
        .addNode("consolidator", createConsolidatorGraph())
        .addNode("implementation", createImplementationGraph())
        
        // Define flow
        .addEdge(START, "synthesis")
        .addEdge("synthesis", "engineer")
        
        // HITL Interrupt after Engineer (Review Plan)
        // logic: validation runs automatically, but maybe we want human to see plan first?
        // Proposal says: "After Engineer (for change review)"
        .addEdge("engineer", "validation") 
        
        .addEdge("validation", "consolidator")
        
        // Conditional edge based on Consolidator decision
        .addConditionalEdges(
            "consolidator",
            (state: any) => {
                 if (state.finalDecision === 'APPROVE') {
                     return "implementation";
                 }
                 return END;
            },
            {
                implementation: "implementation",
                [END]: END
            }
        )
        .addEdge("implementation", END);

    // Compile with checkpointer and interrupts
    return builder.compile({
        checkpointer,
        interruptBefore: ["validation", "implementation"] 
        // Interrupt before validation to review Engineer plans
        // Interrupt before implementation to review Consolidator decision/PR text
    });
}
