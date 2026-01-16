import { defineConfig } from 'tsdown';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM-friendly __dirname replacement
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    clean: true,
    // dts: true,
    entry: ['src/index.ts'],
    format: ['esm'],
    outDir: 'dist',
    platform: 'neutral',
    sourcemap: true,
    target: 'esnext',
    // Use alias at top level (tsdown native config)
    alias: {
        '@generated': path.resolve(__dirname, '.generated'),
    },
    // Prevent treating unresolved as external
    external: [],
});


