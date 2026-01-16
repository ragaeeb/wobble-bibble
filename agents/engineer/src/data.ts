/**
 * Data Access for Engineer Agent
 */
import fs from 'fs/promises';
import path from 'path';

export async function readPromptFile(filename: string): Promise<string> {
    try {
        // Assume prompts are in repo root /prompts
        // Adjust path relative to this file: agents/engineer/src/data.ts -> ../../../prompts
        const filePath = path.resolve(process.cwd(), 'prompts', filename);
        return await fs.readFile(filePath, 'utf-8');
    } catch {
        return '';
    }
}
