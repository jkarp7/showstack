import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, readdirSync, existsSync, cpSync } from 'fs';
import { join } from 'path';
import { config as loadDotenv } from 'dotenv';

// Load .env at build time so values can be baked into the packaged binary.
// In development, dotenvx handles this via `npm run dev`; this covers prod builds.
loadDotenv({ path: resolve(__dirname, '.env') });

// Build-time env vars for the main process. These are inlined as string literals
// by Vite's define so the packaged app doesn't need a .env file at runtime.
const mainDefine: Record<string, string> = {
  'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL ?? ''),
  'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY ?? ''),
  'process.env.SUPABASE_SERVICE_ROLE_KEY': JSON.stringify(
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  ),
  'process.env.POWERSYNC_URL': JSON.stringify(process.env.POWERSYNC_URL ?? ''),
  'process.env.SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN ?? ''),
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
  'process.env.BUILD_DATE': JSON.stringify(process.env.BUILD_DATE ?? new Date().toISOString()),
};

export default defineConfig({
  main: {
    define: mainDefine,
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
