import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, readdirSync, existsSync, cpSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  main: {
    watch: {
      // Also watch the shared package so the main process restarts on schema changes
      include: ['packages/shared/src/**'],
    },
    build: {
      lib: {
        entry: resolve(__dirname, 'apps/desktop/src/main/index.ts'),
        formats: ['cjs'],
      },
      rollupOptions: {
        external: [
          'sql.js',
          'puppeteer',
          'better-sqlite3',
          '@powersync/node',
          '@journeyapps/node-sqlite3',
        ],
        output: {
          entryFileNames: '[name].cjs',
        },
        plugins: [
          {
            name: 'copy-default-layouts',
            writeBundle() {
              // Copy defaultLayouts directory to build output
              const srcDir = resolve(__dirname, 'apps/desktop/src/main/database/defaultLayouts');
              const destDir = resolve(__dirname, 'out/main/database/defaultLayouts');

              if (!existsSync(destDir)) {
                mkdirSync(destDir, { recursive: true });
              }

              const files = readdirSync(srcDir).filter((f) => f.endsWith('.json'));
              files.forEach((file) => {
                copyFileSync(join(srcDir, file), join(destDir, file));
              });

              console.log(`✓ Copied ${files.length} layout files to build output`);
            },
          },
          {
            name: 'copy-gdtf-bundled',
            writeBundle() {
              const srcDir = resolve(__dirname, 'apps/desktop/src/main/gdtf-bundled');
              const destDir = resolve(__dirname, 'out/main/gdtf-bundled');
              if (existsSync(srcDir)) {
                cpSync(srcDir, destDir, { recursive: true });
                console.log('✓ Copied gdtf-bundled to build output');
              }
            },
          },
        ],
      },
    },
  },
  preload: {
    build: {
      lib: {
        entry: resolve(__dirname, 'apps/desktop/src/preload/index.ts'),
      },
      rollupOptions: {
        external: ['electron'],
      },
    },
  },
  renderer: {
    root: resolve(__dirname, 'apps/desktop/src/renderer'),
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'apps/desktop/src/renderer/index.html'),
      },
    },
    resolve: {
      alias: {
        '@': resolve('apps/desktop/src/renderer/src'),
      },
    },
    plugins: [react()],
  },
});
