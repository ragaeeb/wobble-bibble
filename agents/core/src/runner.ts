/**
 * Multi-Agent Pipeline Runner (CLI)
 * Usage: bun run agents/runner.ts <issue_id>
 */
import { createPipeline } from './pipeline.js';
import { getThreadConfig } from '@wobble-bibble/agents-shared';

async function main() {
    const issueId = process.argv[2];
    if (!issueId) {
        console.error("Usage: bun run agents/runner.ts <issue_id>");
        process.exit(1);
    }

    // 1. Initialize Pipeline
    console.log(`🚀 Initializing pipeline for issue #${issueId}...`);
    const app = await createPipeline();
    const config = getThreadConfig(`thread-${issueId}`);

    // 2. Start Execution (Synthesis)
    console.log("▶️ Starting Phase 2: Synthesis...");
    const input = { issueIds: [parseInt(issueId)] };
    
    let state = await app.invoke(input, config);
    console.log("✅ Synthesis Complete. Report generated.");

    // 3. Check for Interrupts (Engineer)
    // The graph pauses BEFORE validation (after Engineer)
    // We resume to run validation
    
    // In a real CLI loop, we would check app.get_state(config).next
    // and prompt user. For this prototype, we'll auto-resume.
    
    const snapshot = await app.getState(config);
    if (snapshot.next.length > 0) {
        console.log(`⏸️ Paused at step: ${snapshot.next.join(',')}`);
        console.log("Resume? (y/n)"); 
        // Mock user input "y"
        console.log(">> y (Auto-resume)");
        
        // Resume execution
        state = await app.invoke(null, config);
    }

    // 4. Check for Interrupts (Consolidator -> Implementation)
    const snapshot2 = await app.getState(config);
    if (snapshot2.next.length > 0) {
        console.log(`⏸️ Paused at step: ${snapshot2.next.join(',')}`);
        console.log("Decision: ", snapshot2.values.finalDecision);
        
        if (snapshot2.values.finalDecision === 'APPROVE') {
            console.log("Proceeding to Implementation...");
            state = await app.invoke(null, config);
            console.log("✅ Implementation Complete. PR Created:", state.prUrl);
        } else {
            console.log("🛑 Rejected by Consolidator.");
        }
    } else {
        console.log("🏁 Pipeline Finished.");
    }
}

main().catch(console.error);
