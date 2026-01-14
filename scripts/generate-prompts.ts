/**
 * Build script to generate src/generated/prompts.ts from prompts/*.md files.
 * Run with: bun run scripts/generate-prompts.ts
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const PROMPTS_DIR = 'prompts';
const OUTPUT_DIR = '.generated';
const OUTPUT_FILE = 'prompts.ts';

type PromptFile = {
    id: string;
    name: string;
    content: string;
};

function toConstantName(filename: string): string {
    // encyclopedia_mixed.md -> ENCYCLOPEDIA_MIXED
    return filename.replace('.md', '').toUpperCase().replace(/-/g, '_');
}

function toDisplayName(filename: string): string {
    // encyclopedia_mixed.md -> Encyclopedia Mixed
    return filename
        .replace('.md', '')
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function toId(filename: string): string {
    // encyclopedia_mixed.md -> encyclopedia_mixed
    return filename.replace('.md', '');
}

async function main() {
    console.log('📚 Generating prompts from', PROMPTS_DIR);

    // Read all .md files from prompts directory
    const files = await readdir(PROMPTS_DIR);
    const mdFiles = files.filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md');

    const prompts: PromptFile[] = [];

    for (const file of mdFiles) {
        const content = await readFile(join(PROMPTS_DIR, file), 'utf-8');
        prompts.push({
            content: content.trim(),
            id: toId(file),
            name: toDisplayName(file),
        });
    }

    // Sort: master_prompt first, then alphabetically
    prompts.sort((a, b) => {
        if (a.id === 'master_prompt') {
            return -1;
        }
        if (b.id === 'master_prompt') {
            return 1;
        }
        return a.name.localeCompare(b.name);
    });

    // Generate TypeScript file
    const typeUnion = prompts.map((p) => `'${p.id}'`).join(' | ');
    const constantsBlock = prompts
        .map((p) => `export const ${toConstantName(`${p.id}.md`)} = ${JSON.stringify(p.content)};`)
        .join('\n\n');

    const promptsArray = prompts
        .map(
            (p) => `    {
        id: '${p.id}' as const,
        name: '${p.name}',
        content: ${toConstantName(`${p.id}.md`)},
    }`,
        )
        .join(',\n');

    const output = `// AUTO-GENERATED FILE - DO NOT EDIT
// Generated from prompts/*.md by scripts/generate-prompts.ts

// =============================================================================
// PROMPT TYPE
// =============================================================================

export type PromptId = ${typeUnion};

// =============================================================================
// RAW PROMPT CONTENT
// =============================================================================

${constantsBlock}

// =============================================================================
// PROMPT METADATA
// =============================================================================

export const PROMPTS = [
${promptsArray},
] as const;

export type PromptMetadata = (typeof PROMPTS)[number];
`;

    // Ensure output directory exists
    await mkdir(OUTPUT_DIR, { recursive: true });

    // Write output file
    const outputPath = join(OUTPUT_DIR, OUTPUT_FILE);
    await writeFile(outputPath, output, 'utf-8');

    console.log(`✅ Generated ${outputPath} with ${prompts.length} prompts:`);
    for (const p of prompts) {
        console.log(`   - ${p.id} (${p.name})`);
    }
}

main().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
