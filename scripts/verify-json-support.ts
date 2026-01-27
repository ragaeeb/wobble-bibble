import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getPrompts } from '../src/prompts';
import { validateTranslationResponse } from '../src/validation';
import { parseLLMJson } from './llm-json-parser';

const BUGS_DIR = './bugs';
const GROK_DIR = './grok4';

async function run() {
    const bugFiles = readdirSync(BUGS_DIR).filter((f) => f.endsWith('.json'));
    // Grok dir might not exist or be empty, handle gracefully if needed, but assuming it exists based on previous steps
    let grokFiles: string[] = [];
    try {
        grokFiles = readdirSync(GROK_DIR).filter((f) => f.endsWith('.json'));
    } catch (e) {
        console.warn('Grok4 directory not found or empty, skipping.');
    }

    const segments = await getPrompts();

    console.log(`Verifying ${bugFiles.length} files in bugs/ and ${grokFiles.length} files in grok4/...\n`);

    const allFiles = [
        ...bugFiles.map((f) => ({ name: f, path: join(BUGS_DIR, f) })),
        ...grokFiles.map((f) => ({ name: f, path: join(GROK_DIR, f) })),
    ];

    for (const file of allFiles) {
        const content = JSON.parse(readFileSync(file.path, 'utf8'));

        try {
            const extracted = parseLLMJson(content);
            console.log(`[PASS] ${file.name}: Extracted ${extracted.response.length} chars of response.`);

            if (extracted.model) {
                console.log(`       Model: ${extracted.model}`);
            }

            const result = validateTranslationResponse(segments, extracted.response);
            if (result.errors.length > 0) {
                console.log(`       Found ${result.errors.length} validation errors.`);
            }

            if (extracted.thoughts) {
                console.log(`       Thoughts extracted (${extracted.thoughts.length} chars).`);
            }
        } catch (e: any) {
            console.error(`[FAIL] ${file.name}: ${e.message}`);
        }
    }
}

run().catch(console.error);
