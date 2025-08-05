import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 15000, // Reduced timeout
    hookTimeout: 5000, // Reduced hook timeout
    // Reduce output verbosity to prevent CLI crashes
    silent: process.env.CI ? true : false,
    reporter: process.env.CI ? 'basic' : 'default',
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'build/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts'
      ]
    },
    // Separate pools for different test types
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // Prevent Redis connection conflicts
        maxThreads: 1,
        minThreads: 1
      }
    },
    // Limit console output to prevent string length issues
    onConsoleLog: () => false,
    maxConcurrency: 1
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
});