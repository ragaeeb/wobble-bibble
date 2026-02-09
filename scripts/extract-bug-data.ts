import fs from 'node:fs';
import path from 'node:path';
import { parseLLMJson } from './llm-json-parser/index';

const BUGS_DIR = path.resolve(process.cwd(), 'bugs');
const OUTPUT_DIR = path.resolve(process.cwd(), 'extracted_bugs');

/**
 * Script to extract core information from bug reports organized by category.
 * Dynamically scans subdirectories in bugs/ and mirrors the structure in extracted_bugs/.
 */
async function main() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    if (!fs.existsSync(BUGS_DIR)) {
        console.error(`Bugs directory not found at: ${BUGS_DIR}`);
        process.exit(1);
    }

    // Get all subdirectories in the bugs folder
    const entries = fs.readdirSync(BUGS_DIR, { withFileTypes: true });
    const categories = entries
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
        .map((entry) => entry.name);

    console.log(`Found ${categories.length} categories: ${categories.join(', ')}`);

    for (const category of categories) {
        const categoryDir = path.join(BUGS_DIR, category);
        const outputCategoryDir = path.join(OUTPUT_DIR, category);

        if (!fs.existsSync(outputCategoryDir)) {
            fs.mkdirSync(outputCategoryDir, { recursive: true });
        }

        const files = fs.readdirSync(categoryDir).filter((f) => f.endsWith('.json'));

        if (files.length === 0) {
            continue;
        }

        console.log(`Processing ${category} (${files.length} files)...`);

        for (const file of files) {
            const filePath = path.join(categoryDir, file);
            const outputFilePath = path.join(outputCategoryDir, file);

            try {
                const rawContent = fs.readFileSync(filePath, 'utf-8');
                if (!rawContent.trim()) {
                    console.warn(`Empty file: ${category}/${file}`);
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
                console.error(`Failed to process ${category}/${file}:`, error instanceof Error ? error.message : error);
            }
        }
    }
    console.log('Extraction complete. Files saved in extracted_bugs/');
}

main().catch(console.error);
