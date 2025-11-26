import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000, // 30 seconds for OAuth flows
    hookTimeout: 10000, // 10 seconds for setup
    teardownTimeout: 10000,
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.integration.test.ts',
      'tests/**/*.e2e.test.ts'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.worktrees/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'tests/**',
        'dist/**',
        'build/**'
      ]
    },
    env: {
      OAUTH_SERVER_URL: 'https://mittwald-oauth-server.fly.dev',
      MCP_SERVER_URL: 'https://mittwald-mcp-fly2.fly.dev',
      NODE_ENV: 'test'
    }
  }
});
