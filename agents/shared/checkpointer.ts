/**
 * LangGraph Checkpointing Helper
 *
 * Provides a persistent checkpointer for LangGraph agents.
 * Uses SqliteSaver for local durable execution.
 */
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite';
import { MemorySaver } from '@langchain/langgraph';
import path from 'path';

const DB_PATH = path.join(process.cwd(), '.agent-store.db');

/**
 * Get a configured checkpointer instance
 *
 * Usage:
 * const checkpointer = await getCheckpointer();
 * const app = workflow.compile({ checkpointer });
 */
export async function getCheckpointer() {
    // Use MemorySaver for tests or if better-sqlite3 is unavailable in Bun
    if (process.env.NODE_ENV === 'test') {
        return new MemorySaver();
    }
    
    // Only use checkpointer if we are in a persistent environment
    return SqliteSaver.fromConnString(DB_PATH);
}

/**
 * Get configuration for a specific thread
 */
export function getThreadConfig(threadId: string) {
    return {
        configurable: {
            thread_id: threadId,
        },
    };
}
