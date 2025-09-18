import path from 'node:path';
import { defineConfig } from 'vitest/config';
import { createSharedVitestConfig } from './vitest.shared.config.ts';

export default defineConfig(() =>
  createSharedVitestConfig({
    projectRoot: __dirname,
    setupFiles: ['./tests/setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  })
);
