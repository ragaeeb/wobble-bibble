/**
 * Multi-Agent Pipeline Runner (CLI)
 * Usage: bun run agents/runner.ts <issue_id>
 */
import { createPipeline } from './pipeline.js';
import { getThreadConfig } from '@wobble-bibble/agents-shared';
import * as readline from 'readline';

/**
 * P0: Real Human-in-the-Loop prompt.
 * Blocks until user types 'yes' or 'y' to continue.
 */
async function waitForUserApproval(prompt: string): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise((resolve) => {
        rl.question(`${prompt} (yes/no): `, (answer) => {
            rl.close();
            const normalized = answer.toLowerCase().trim();
            resolve(normalized === 'yes' || normalized === 'y');
        });
    });
}

async function main() {
    const issueId = process.argv[2];
    if (!issueId) {
        console.error("Usage: bun run agents/runner.ts <issue_id>");
        process.exit(1);
    }
    
    // P1: Validate issueId is numeric
    const parsedId = parseInt(issueId, 10);
    if (Number.isNaN(parsedId)) {
        console.error("Error: issue_id must be a valid number");
        process.exit(1);
    }

    // 1. Initialize Pipeline
    console.log(`🚀 Initializing pipeline for issue #${parsedId}...`);
    const app = await createPipeline();
    const config = getThreadConfig(`thread-${parsedId}`);

    // 2. Start Execution (Synthesis)
    console.log("▶️ Starting Phase 2: Synthesis...");
    const input = { issueIds: [parsedId] };
    
    let state = await app.invoke(input, config);
    console.log("✅ Synthesis Complete. Report generated.");

    // 3. Check for Interrupts (Engineer -> Validation)
    const snapshot = await app.getState(config);
    if (snapshot.next.length > 0) {
        console.log(`\n⏸️ Paused before: ${snapshot.next.join(',')}`);
        console.log(`📋 Current state summary:`);
        console.log(`   - Plans: ${snapshot.values.plans?.length ?? 0}`);
        console.log(`   - Diffs: ${snapshot.values.diffs?.length ?? 0}`);
        
        // P0: Real HITL - wait for user input
        const approved = await waitForUserApproval('\n👉 Continue to validation?');
        if (!approved) {
            console.log("🛑 Pipeline halted by user.");
            process.exit(0);
        }
        
        state = await app.invoke(null, config);
    }

    // 4. Check for Interrupts (Consolidator -> Implementation)
    const snapshot2 = await app.getState(config);
    if (snapshot2.next.length > 0) {
        console.log(`\n⏸️ Paused before: ${snapshot2.next.join(',')}`);
        console.log(`📋 Consolidator decision: ${snapshot2.values.finalDecision}`);
        console.log(`📝 Reason: ${snapshot2.values.decisionReason ?? 'N/A'}`);
        
        if (snapshot2.values.finalDecision === 'APPROVE') {
            // P0: Real HITL - wait for user input
            const approved = await waitForUserApproval('\n👉 Proceed to implementation?');
            if (!approved) {
                console.log("🛑 Pipeline halted by user.");
                process.exit(0);
            }
            
            state = await app.invoke(null, config);
            console.log("✅ Implementation Complete.", state.prUrl ? `PR Created: ${state.prUrl}` : "No PR URL returned.");
        } else {
            console.log("🛑 Rejected by Consolidator.");
        }
    } else {
        console.log("🏁 Pipeline Finished.");
    }
}

main().catch(console.error);

