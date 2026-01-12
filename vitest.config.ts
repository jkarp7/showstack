import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment
    environment: 'jsdom',

    // Setup files
    setupFiles: ['./src/renderer/test/setup.ts'],

    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'out/**',
        'dist/**',
        'release/**',
        'proof-of-concept/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        '**/__tests__/**',
        '**/*.test.*',
        '**/*.spec.*',
        'src/preload/**',  // Preload is minimal glue code
      ],
      // Coverage thresholds (enforced in CI)
      thresholds: {
        global: {
          lines: 50,      // Alpha.2 minimum
          functions: 50,
          branches: 45,
          statements: 50
        },
        // Per-file thresholds for critical paths
        './src/renderer/src/utils/powerCalculations.ts': {
          lines: 80,
          functions: 80,
          branches: 75
        },
        './src/renderer/src/utils/circuitParser.ts': {
          lines: 80,
          functions: 80,
          branches: 75
        }
      }
    },

    // Globals (allows using `describe`, `it`, `expect` without imports)
    globals: true,

    // Test matching
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'src/**/__tests__/**/*.{ts,tsx}'
    ],

    // Mocking
    mockReset: true,
    restoreMocks: true,

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporters
    reporters: ['verbose', 'html'],

    // Resolve aliases (match electron.vite.config.ts)
    alias: {
      '@': resolve(__dirname, './src/renderer/src')
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src/renderer/src')
    }
  }
});
