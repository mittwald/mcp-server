import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { createProviderConfiguration } from '../../../packages/oauth-server/src/config/provider.js';
import { DEFAULT_SCOPES, DEFAULT_SCOPE_STRING } from '../../../packages/oauth-server/src/config/mittwald-scopes.js';
import { userAccountStore } from '../../../packages/oauth-server/src/services/user-account-store.js';

describe('loadExistingGrant', () => {
  const tokenTtls = {
    accessToken: 3600,
    idToken: 3600,
    refreshToken: 86400,
  };

  let tempDir: string;
  let providerConfig: Awaited<ReturnType<typeof createProviderConfiguration>>;

  beforeEach(async () => {
    userAccountStore.clear();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jwks-'));
    providerConfig = await createProviderConfiguration({
      issuer: 'http://localhost:3000',
      port: 3000,
      storageAdapter: 'memory',
      initialAccessToken: '',
      jwksKeystorePath: path.join(tempDir, 'jwks.json'),
      cookiesSecure: false,
      cookieKeys: ['test-cookie-key'],
      allowedRedirectUriPatterns: ['ALLOW_ALL'],
      tokenTtls,
    });
  });

  afterEach(async () => {
    userAccountStore.clear();
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('returns undefined when no session account is present', async () => {
    const GrantCtor = vi.fn();

    const ctx = {
      oidc: {
        provider: { Grant: GrantCtor },
        client: { clientId: 'mcp-client' },
        session: undefined,
        params: { scope: 'openid offline_access' },
      },
    };

    const result = await providerConfig.loadExistingGrant!(ctx as any);

    expect(result).toBeUndefined();
    expect(GrantCtor).not.toHaveBeenCalled();
  });

  it('creates a grant once Mittwald session account exists', async () => {
    const accountId = 'mittwald:user-123';

    userAccountStore.store(accountId, {
      accountId,
      mittwaldAccessToken: 'access-token',
      createdAt: Date.now(),
      mittwaldScope: DEFAULT_SCOPE_STRING,
      scopeSource: 'mittwald',
    });

    const addOIDCScope = vi.fn();
    const addResourceScope = vi.fn();
    const save = vi.fn(async () => {});
    const grantInstance = { addOIDCScope, addResourceScope, save, jti: 'grant-1' };

    const GrantCtor = vi.fn().mockImplementation(({ clientId, accountId: constructedAccountId }) => {
      expect(clientId).toBe('mcp-client');
      expect(constructedAccountId).toBe(accountId);
      return grantInstance;
    });

    const ctx = {
      oidc: {
        provider: { Grant: GrantCtor },
        client: { clientId: 'mcp-client' },
        session: { accountId },
        params: { scope: 'openid offline_access' },
      },
    };

    const result = await providerConfig.loadExistingGrant!(ctx as any);

    expect(result).toBe(grantInstance);
    expect(addOIDCScope).not.toHaveBeenCalled();
    for (const scope of DEFAULT_SCOPES) {
      expect(addResourceScope).toHaveBeenCalledWith('https://mittwald-mcp-fly2.fly.dev/mcp', scope);
    }
    expect(save).toHaveBeenCalledWith(3600);
  });
});
