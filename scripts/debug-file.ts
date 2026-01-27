import { readFileSync } from 'fs';
import { GeminiMappingDumpSchema } from '../src/schemas/llm-schemas';

const file = process.argv[2];
if (!file) {
    console.error('Usage: bun scripts/debug-file.ts <path>');
    process.exit(1);
}

const data = JSON.parse(readFileSync(file, 'utf-8'));
const result = GeminiMappingDumpSchema.safeParse(data);

if (result.success) {
    console.log('PASS');
} else {
    console.log('FAIL');
    console.log(JSON.stringify(result.error.issues, null, 2));
}
