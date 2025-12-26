import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        external: ['sql.js'],
        plugins: [
          {
            name: 'copy-default-layouts',
            writeBundle() {
              // Copy defaultLayouts directory to build output
              const srcDir = resolve(__dirname, 'src/main/database/defaultLayouts');
              const destDir = resolve(__dirname, 'out/main/database/defaultLayouts');

              if (!existsSync(destDir)) {
                mkdirSync(destDir, { recursive: true });
              }

              const files = readdirSync(srcDir).filter(f => f.endsWith('.json'));
              files.forEach(file => {
                copyFileSync(join(srcDir, file), join(destDir, file));
              });

              console.log(`✓ Copied ${files.length} layout files to build output`);
            }
          }
        ]
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        external: ['electron']
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
});
