import path from 'node:path';
import { defineConfig } from 'vitest/config';
import { createSharedVitestConfig } from '../../vitest.shared.config.ts';

const projectRoot = __dirname;

export default defineConfig(() =>
  createSharedVitestConfig({
    projectRoot,
    alias: {
      '@oauth-server': path.resolve(projectRoot, './src')
    },
    coverageExclude: ['dist/']
  })
);
