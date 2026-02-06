import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Environment (node for non-browser code)
    environment: 'node',

    // Globals (allows using `describe`, `it`, `expect` without imports)
    globals: true,

    // Test matching
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'src/**/__tests__/**/*.{ts,tsx}'],

    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        '**/__tests__/**',
        '**/*.test.*',
        '**/*.spec.*'
      ]
    },

    // Timeouts
    testTimeout: 5000,
    hookTimeout: 5000
  }
});
