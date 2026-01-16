/**
 * Data Access for Engineer Agent
 */
import fs from 'fs/promises';
import path from 'path';

/** Allowlist of valid prompt files to prevent path traversal */
const ALLOWED_PROMPT_FILES = [
    'master_prompt.md',
    'hadith.md',
    'fiqh.md',
    'tafsir.md',
    'fatawa.md',
    'encyclopedia_mixed.md',
    'aqeedah.md',
    'jarh_tadil.md',
];

export async function readPromptFile(filename: string): Promise<string> {
    // P0: Path traversal protection
    if (!ALLOWED_PROMPT_FILES.includes(filename)) {
        throw new Error(`Invalid prompt file: ${filename}. Must be one of: ${ALLOWED_PROMPT_FILES.join(', ')}`);
    }
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        throw new Error(`Path traversal detected in filename: ${filename}`);
    }
    
    const promptsDir = path.resolve(process.cwd(), 'prompts');
    const filePath = path.join(promptsDir, filename);
    
    // Double-check resolved path is within prompts directory
    if (!filePath.startsWith(promptsDir + path.sep)) {
        throw new Error(`Path escape attempt: ${filePath}`);
    }
    
    return await fs.readFile(filePath, 'utf-8');
}

