import fs from 'node:fs';
import path from 'node:path';
import { parseLLMJson } from './llm-json-parser/index';

const BUGS_DIR = path.resolve(process.cwd(), 'bugs');
const OUTPUT_DIR = path.resolve(process.cwd(), 'extracted_bugs');

/**
 * Script to extract core information from classified bug reports.
 * Reads from bugs/{platform} and writes to extracted_bugs/{platform}.
 */
async function main() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const platforms = ['chatgpt', 'gemini', 'grok'];

    for (const platform of platforms) {
        const platformDir = path.join(BUGS_DIR, platform);
        if (!fs.existsSync(platformDir)) {
            console.log(`Skipping ${platform}: directory not found.`);
            continue;
        }

        const outputPlatformDir = path.join(OUTPUT_DIR, platform);
        if (!fs.existsSync(outputPlatformDir)) {
            fs.mkdirSync(outputPlatformDir, { recursive: true });
        }

        const files = fs.readdirSync(platformDir).filter((f) => f.endsWith('.json'));

        console.log(`Processing ${platform} (${files.length} files)...`);

        for (const file of files) {
            const filePath = path.join(platformDir, file);
            const outputFilePath = path.join(outputPlatformDir, file);

            try {
                const rawContent = fs.readFileSync(filePath, 'utf-8');
                if (!rawContent.trim()) {
                    console.warn(`Empty file: ${platform}/${file}`);
                    continue;
                }

                const content = JSON.parse(rawContent);
                const extracted = parseLLMJson(content);

                const result = {
                    model: extracted.model,
                    prompt: extracted.prompt,
                    reasoning: extracted.thoughts,
                    response: extracted.response,
                };

                fs.writeFileSync(outputFilePath, JSON.stringify(result, null, 2));
            } catch (error) {
                console.error(`Failed to process ${platform}/${file}:`, error instanceof Error ? error.message : error);
            }
        }
    }
    console.log('Extraction complete. Files saved in extracted_bugs/');
}

main().catch(console.error);
