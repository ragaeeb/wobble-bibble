import fs from 'node:fs';
import path from 'node:path';
import { parseLLMJson } from './llm-json-parser/index';

const BUGS_DIR = path.resolve(process.cwd(), 'bugs');
const OUTPUT_DIR = path.resolve(process.cwd(), 'extracted_bugs');

function shellEscape(value: string): string {
    return `'${value.replace(/'/g, `'"'"'`)}'`;
}

function dirExists(dirPath: string): boolean {
    try {
        return fs.existsSync(dirPath);
    } catch {
        return false;
    }
}

function ensureDir(dirPath: string): void {
    fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * Script to extract core information from bug reports organized by category.
 * Dynamically scans subdirectories in bugs/ and mirrors the structure in extracted_bugs/.
 */
async function main() {
    if (!dirExists(BUGS_DIR)) {
        console.error(`Bugs directory not found at: ${BUGS_DIR}`);
        process.exit(1);
    }
    if (!dirExists(OUTPUT_DIR)) {
        ensureDir(OUTPUT_DIR);
    }

    // Get all subdirectories in the bugs folder
    const categories: string[] = [];
    try {
        const entries = fs.readdirSync(BUGS_DIR, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith('.')) {
                categories.push(entry.name);
            }
        }
    } catch (e) {
        console.error('Failed to read bugs directory', e);
        process.exit(1);
    }

    console.log(`Found ${categories.length} categories: ${categories.join(', ')}`);

    for (const category of categories) {
        const categoryDir = path.join(BUGS_DIR, category);
        const outputCategoryDir = path.join(OUTPUT_DIR, category);

        if (!dirExists(outputCategoryDir)) {
            ensureDir(outputCategoryDir);
        }

        const files: string[] = [];
        try {
            const entries = fs.readdirSync(categoryDir);
            for (const file of entries) {
                if (file.endsWith('.json')) {
                    files.push(file);
                }
            }
        } catch (e) {
            console.error(`Failed to read category directory: ${category}`, e);
            continue;
        }

        if (files.length === 0) {
            continue;
        }

        console.log(`Processing ${category} (${files.length} files)...`);

        for (const file of files) {
            const filePath = path.join(categoryDir, file);
            const outputFilePath = path.join(outputCategoryDir, file);

            try {
                const rawContent = await Bun.file(filePath).text();
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

                await Bun.write(outputFilePath, JSON.stringify(result, null, 2));
            } catch (error) {
                console.error(`Failed to process ${category}/${file}:`, error instanceof Error ? error.message : error);
            }
        }
    }
    console.log('Extraction complete. Files saved in extracted_bugs/');
}

main().catch(console.error);
