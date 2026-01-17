import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsdown';

// ESM-friendly __dirname replacement
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    // Use alias at top level (tsdown native config)
    alias: {
        '@generated': path.resolve(__dirname, '.generated'),
    },
    clean: true,
    // dts: true,
    entry: ['src/index.ts'],
    // Prevent treating unresolved as external
    external: [],
    format: ['esm'],
    outDir: 'dist',
    platform: 'neutral',
    sourcemap: true,
    target: 'esnext',
});
