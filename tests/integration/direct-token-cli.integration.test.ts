import express from 'express';
import request from 'supertest';
import { beforeAll, beforeEach, describe, it, expect, vi } from 'vitest';

import { resetRedisMock } from '../helpers/redis-mock.ts';

const TEST_TOKEN = process.env.TEST_CLI_TOKEN;

describe.skipIf(!TEST_TOKEN)('Direct bearer token end-to-end CLI flow', () => {
  let createOAuthMiddleware: typeof import('../../src/server/oauth-middleware.js').createOAuthMiddleware;
  let executeCli: typeof import('../../src/utils/cli-wrapper.js').executeCli;

  beforeAll(async () => {
    if (!TEST_TOKEN) {
      return;
    }

    process.env.ENABLE_DIRECT_BEARER_TOKENS = 'true';
    process.env.NODE_ENV = 'test';
    process.env.MCP_PUBLIC_BASE = 'http://localhost:3000';
    vi.resetModules();

    ({ createOAuthMiddleware } = await import('../../src/server/oauth-middleware.js'));
    ({ executeCli } = await import('../../src/utils/cli-wrapper.js'));
  });

  beforeEach(() => {
    resetRedisMock();
  });

  it('accepts bearer token, skips bridge, and executes mw CLI with same token', async () => {
    if (!TEST_TOKEN) {
      throw new Error('TEST_CLI_TOKEN not provided');
    }

    const app = express();
    app.use(express.json());
    app.use(createOAuthMiddleware());

    app.post('/cli-test', async (req, res) => {
      try {
        const authToken = req.auth?.extra?.mittwaldAccessToken;
        if (!authToken) {
          res.status(500).json({ error: 'mittwaldAccessToken missing' });
          return;
        }

        const result = await executeCli('mw', ['login', 'status', '--token', authToken], {
          timeout: 20_000,
        });

        res.json({
          exitCode: result.exitCode,
          stdout: result.stdout,
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    const response = await request(app)
      .post('/cli-test')
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.exitCode).toBe(0);
    expect(response.body.stdout).toContain('Login status');
  });
});
