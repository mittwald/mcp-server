import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: {
      MITTWALD_SCOPE_CONFIG_PATH: path.resolve(__dirname, '../../config/mittwald-scopes.json'),
    }
  }
});
