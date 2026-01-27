import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import type { ZodError } from 'zod';
import { chatGptMappingDumpSchema } from '../src/schemas/chatgpt.zod';
import { geminiFlatDumpSchema, geminiMappingDumpSchema } from '../src/schemas/gemini.zod';
import { grokMappingDumpSchema } from '../src/schemas/grok.zod';

const BUGS_DIR = join(process.cwd(), 'bugs');

function formatZodError(error: ZodError) {
    return error.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path.join('.'),
    }));
}

async function testValidation() {
    const files = readdirSync(BUGS_DIR).filter((f) => f.endsWith('.json'));
    let passCount = 0;
    let failCount = 0;

    for (const file of files) {
        const filePath = join(BUGS_DIR, file);
        const data = JSON.parse(readFileSync(filePath, 'utf-8'));

        console.log(`Testing [${file}]...`);

        let success = false;
        let lastError: any = null;

        if (data.mapping) {
            // Mapping dump
            const chatgptResult = chatGptMappingDumpSchema.safeParse(data);
            if (chatgptResult.success) {
                success = true;
            } else {
                const geminiResult = geminiMappingDumpSchema.safeParse(data);
                if (geminiResult.success) {
                    success = true;
                } else {
                    const grokResult = grokMappingDumpSchema.safeParse(data);
                    if (grokResult.success) {
                        success = true;
                    } else {
                        lastError = {
                            chatgpt: formatZodError(chatgptResult.error),
                            gemini: formatZodError(geminiResult.error),
                            grok: formatZodError(grokResult.error),
                        };
                    }
                }
            }
        } else {
            // Flat dump
            const result = geminiFlatDumpSchema.safeParse(data);
            if (result.success) {
                success = true;
            } else {
                lastError = formatZodError(result.error);
            }
        }

        if (success) {
            console.log(`[PASS] ${file}`);
            passCount++;
        } else {
            console.error(`[FAIL] ${file}`);
            console.error(JSON.stringify(lastError, null, 2));
            failCount++;
        }
    }

    console.log(`\nResults: ${passCount} PASSED, ${failCount} FAILED.`);
}

testValidation().catch(console.error);
