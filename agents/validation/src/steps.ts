/**
 * Validation Agent Steps
 */
import { getModel } from '@wobble-bibble/agents-shared';
import fs from 'fs/promises';
import path from 'path';
import type { TestResult, ValidationState } from './types.js';

interface GoldenCase {
    id: string;
    input: string;
    expectedOutput: string;
    tags: string[];
}

async function loadGoldenCorpus(): Promise<GoldenCase[]> {
    try {
        const filePath = path.join(import.meta.dirname, '../data/golden_corpus.json');
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (e) {
        console.error('Failed to load golden corpus', e);
        return [];
    }
}

export async function runValidation(state: ValidationState): Promise<Partial<ValidationState>> {
    const cases = await loadGoldenCorpus();
    const results: TestResult[] = [];
    
    // In a real implementation, we would apply the diffs to a temp prompt file
    // and run the LLM with that prompt.
    // For Phase 2 skeleton, we'll mock the execution but structure the loop.
    
    // const model = getModel(); // Would be used here

    for (const testCase of cases) {
        // TODO: Execute prompt with testCase.input
        // Mock result for now assuming 95% pass rate
        const isPass = Math.random() > 0.05; 
        
        results.push({
            caseId: testCase.id,
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: isPass ? testCase.expectedOutput : "[Regressed Output]",
            status: isPass ? 'PASS' : 'FAIL',
            tags: testCase.tags
        });
    }

    // P1: Guard against empty results (division by zero)
    if (results.length === 0) {
        return {
            testResults: results,
            validationStatus: 'FAIL',
            failureReason: 'No test results — empty corpus or load failed'
        };
    }

    const failedCount = results.filter(r => r.status === 'FAIL').length;
    const passRate = (results.length - failedCount) / results.length;
    const status = passRate >= 0.95 ? 'PASS' : 'FAIL';

    return {
        testResults: results,
        validationStatus: status,
        failureReason: status === 'FAIL' ? `Pass rate ${(passRate * 100).toFixed(1)}% below threshold 95%` : undefined
    };
}
