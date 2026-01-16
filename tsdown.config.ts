import { defineConfig } from 'tsdown';
import path from 'node:path';

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


