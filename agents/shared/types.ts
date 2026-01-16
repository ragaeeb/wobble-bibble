/**
 * Shared types for multi-agent pipeline
 */

/**
 * Standard result interface for all agents
 */
export interface AgentResult<T> {
    status: 'success' | 'partial' | 'failed';
    data?: T;
    error?: AgentError;
    report: string;
    reviewPrompt?: string;
    metadata: AgentMetadata;
}

export interface AgentError {
    code: string;
    message: string;
    recoverable: boolean;
    retryAfter?: number;
}

export interface AgentMetadata {
    agent: string;
    model: string;
    schemaVersion: string;
    timestamp: string;
    inputHash: string;
    tokensUsed?: number;
}

/**
 * Pipeline state with enhanced tracking
 */
export interface PipelineState {
    threadId: string;
    currentStep: string;
    completedSteps: string[];
    stepStates: Record<string, PipelineStepState>;
    startedAt: string;
    lastUpdatedAt: string;
}

export interface PipelineStepState {
    status: 'pending' | 'running' | 'completed' | 'failed';
    attempts: number;
    error?: string;
    artifactPath?: string;
    inputHash: string;
}

/**
 * Sanitized input wrapper
 */
export interface SanitizedInput {
    content: string;
    metadata: {
        source: string;
        originalLength: number;
        riskScore: number;
        flags: string[];
    };
}

/**
 * Model provider types
 */
export type ModelProvider = 'gemini' | 'nova';

export interface ModelConfig {
    provider: ModelProvider;
    model: string;
    temperature?: number;
    maxTokens?: number;
}
