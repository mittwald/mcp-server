/**
 * Guards the deployed environment against dropping configuration the running server needs.
 *
 * `MITTWALD_TOKEN_URL` was set on the oauth-server container but not on mcp-server, so the MCP
 * server could never refresh a Mittwald access token. Sessions worked until their token came up
 * for renewal and were then dropped, which reached users as the connection ending on its own.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const terraform = readFileSync(resolve(repoRoot, 'deploy/main.tf'), 'utf-8');

/**
 * Returns the `environment = { ... }` block of a container, matched by nesting depth so a nested
 * brace does not end the block early. Comments are stripped, so a variable mentioned in a comment
 * is never mistaken for one that is actually set.
 */
function environmentBlockFor(container: string): string {
  const containerStart = terraform.indexOf(`${container} = {`);
  expect(containerStart, `container "${container}" not found in deploy/main.tf`).toBeGreaterThan(-1);

  const envStart = terraform.indexOf('environment = {', containerStart);
  expect(envStart, `no environment block for "${container}"`).toBeGreaterThan(-1);

  let depth = 0;
  for (let i = terraform.indexOf('{', envStart); i < terraform.length; i++) {
    if (terraform[i] === '{') depth++;
    if (terraform[i] === '}') {
      depth--;
      if (depth === 0) {
        return terraform
          .slice(envStart, i + 1)
          .replace(/^\s*#.*$/gm, '');
      }
    }
  }

  throw new Error(`unterminated environment block for "${container}"`);
}

describe('deploy/main.tf', () => {
  it.each([
    // Without these the MCP server cannot refresh a session's Mittwald access token.
    ['mcp-server', 'MITTWALD_TOKEN_URL'],
    ['mcp-server', 'MITTWALD_CLIENT_ID'],
    ['oauth-server', 'MITTWALD_TOKEN_URL'],
    ['oauth-server', 'MITTWALD_CLIENT_ID'],
  ])('%s container sets %s', (container, envVar) => {
    expect(environmentBlockFor(container)).toMatch(new RegExp(`^\\s*${envVar}\\s*=\\s*"`, 'm'));
  });

  it('points both containers at the same Mittwald token endpoint', () => {
    const tokenUrl = /^\s*MITTWALD_TOKEN_URL\s*=\s*"([^"]+)"/gm;

    const urls = [...terraform.matchAll(tokenUrl)].map((match) => match[1]);

    expect(urls).toHaveLength(2);
    expect(new Set(urls).size).toBe(1);
  });

  describe('bridge access token lifetime', () => {
    // Sessions cannot be renewed upstream, so this value is how long a user stays connected.
    // Unset, the bridge falls back to 3600 and users are signed out every hour.
    const configured = /^\s*BRIDGE_ACCESS_TOKEN_TTL_SECONDS\s*=\s*"(\d+)"/m.exec(
      environmentBlockFor('oauth-server')
    );

    it('is set explicitly rather than left to the 3600 default', () => {
      expect(configured).not.toBeNull();
      expect(Number(configured?.[1])).toBeGreaterThan(3600);
    });

    it('does not exceed the Mittwald token lifetime it wraps', () => {
      // signup-service config/default.yaml: tokenLifetimeInSeconds 604800, not overridden in
      // values.prod.yaml. issueBridgeTokens clamps to it, so a larger value here would silently
      // do nothing rather than what the operator intended.
      const mittwaldAccessTokenLifetime = 7 * 24 * 60 * 60;

      expect(Number(configured?.[1])).toBeLessThanOrEqual(mittwaldAccessTokenLifetime);
    });
  });
});
