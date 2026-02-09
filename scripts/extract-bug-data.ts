import path from 'node:path';
import { parseLLMJson } from './llm-json-parser/index';

const BUGS_DIR = path.resolve(process.cwd(), 'bugs');
const OUTPUT_DIR = path.resolve(process.cwd(), 'extracted_bugs');

function shellEscape(value: string): string {
    return `'${value.replace(/'/g, `'"'"'`)}'`;
}

function dirExists(dirPath: string): boolean {
    const result = Bun.spawnSync({
        cmd: ['/bin/sh', '-c', `[ -d ${shellEscape(dirPath)} ]`],
        stderr: 'ignore',
        stdout: 'ignore',
    });
    return result.exitCode === 0;
}

function ensureDir(dirPath: string): void {
    const result = Bun.spawnSync({
        cmd: ['mkdir', '-p', dirPath],
        stderr: 'ignore',
        stdout: 'ignore',
    });
    if (result.exitCode !== 0) {
        throw new Error(`Failed to create directory: ${dirPath}`);
    }
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
    for await (const entry of new Bun.Glob('*/').scan(BUGS_DIR)) {
        const name = entry.replace(/\/$/, '');
        if (!name.startsWith('.')) {
            categories.push(name);
        }
    }

    console.log(`Found ${categories.length} categories: ${categories.join(', ')}`);

    for (const category of categories) {
        const categoryDir = path.join(BUGS_DIR, category);
        const outputCategoryDir = path.join(OUTPUT_DIR, category);

        if (!dirExists(outputCategoryDir)) {
            ensureDir(outputCategoryDir);
        }

        const files: string[] = [];
        for await (const entry of new Bun.Glob('*.json').scan(categoryDir)) {
            files.push(entry);
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
