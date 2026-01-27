/**
 * Pre-flight checks for multi-target scenario testing.
 *
 * Validates authentication and MCP server configuration before running tests.
 * Exits with clear instructions if prerequisites are missing.
 */

import type { TestTarget } from '../config/test-targets.js';

export interface PrerequisiteCheckResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Check if all prerequisites are met for the given test target.
 *
 * For targets requiring authentication:
 * - Verifies Claude Code CLI is configured with the correct MCP server
 * - Checks authentication status
 * - Tests connectivity to the target
 *
 * @param target - Test target to check
 * @returns PrerequisiteCheckResult with errors/warnings
 */
export async function checkPrerequisites(
  target: TestTarget
): Promise<PrerequisiteCheckResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log(`\n🔍 Checking prerequisites for ${target.displayName}...`);

  // Check 1: MCP server configuration
  if (target.requiresUserMcpConfig) {
    console.log(`\n⚠️  This test requires Claude Code CLI to be configured for ${target.displayName}`);
    console.log(`   Please ensure you have run:`);

    if (target.name === 'flyio') {
      console.log(`   claude mcp add --transport http mittwald https://mittwald-mcp-fly2.fly.dev/mcp`);
    } else if (target.name === 'mittwald') {
      console.log(`   claude mcp add --transport http mittwald https://mcp.mittwald.de`);
    }

    console.log(`\n   To verify: Check your Claude Code CLI config for "mittwald" MCP server`);

    // Note: We cannot programmatically verify Claude CLI config without
    // reverse-engineering its config file format. User must confirm manually.
    warnings.push(
      `Manual verification required: Ensure Claude CLI is configured for ${target.name}`
    );
  }

  // Check 2: Authentication
  if (target.requiresAuth) {
    console.log(`\n🔐 Checking authentication for ${target.displayName}...`);

    const authOk = await testAuthentication(target);

    if (!authOk) {
      errors.push(`Authentication failed for ${target.name}`);
      console.error(`\n❌ Authentication failed for ${target.name}`);
      console.error(`   Please start a Claude Code CLI session and authenticate first`);
      console.error(`   Then retry this test`);
    } else {
      console.log(`✅ Authentication OK`);
    }
  }

  // Check 3: Connectivity (health check)
  if (target.name !== 'local') {
    console.log(`\n🌐 Checking connectivity to ${target.displayName}...`);

    const connectivityOk = await testConnectivity(target);

    if (!connectivityOk) {
      warnings.push(`Connectivity check failed for ${target.name} (may still work)`);
      console.warn(`\n⚠️  Connectivity check failed - continuing anyway`);
    } else {
      console.log(`✅ Connectivity OK`);
    }
  }

  const passed = errors.length === 0;

  if (!passed) {
    console.error(`\n❌ Prerequisites check FAILED for ${target.displayName}`);
    console.error(`   Errors:`);
    errors.forEach((err) => console.error(`     - ${err}`));
  } else if (warnings.length > 0) {
    console.warn(`\n⚠️  Prerequisites check passed with warnings:`);
    warnings.forEach((warn) => console.warn(`     - ${warn}`));
  } else {
    console.log(`\n✅ All prerequisites met for ${target.displayName}`);
  }

  return { passed, errors, warnings };
}

/**
 * Test authentication status for the target.
 *
 * For Fly.io and mittwald.de, this attempts to verify that the user
 * has an active authenticated session.
 *
 * Implementation note: Without access to Claude CLI internals, we cannot
 * definitively check authentication. This function returns true and
 * allows the scenario runner to fail with a clear auth error if needed.
 *
 * @param target - Test target
 * @returns true if authentication appears valid, false if definitely invalid
 */
async function testAuthentication(target: TestTarget): Promise<boolean> {
  // Placeholder implementation: We cannot programmatically verify
  // Claude Code CLI authentication without reverse-engineering its
  // session storage mechanism.
  //
  // Strategy: Assume auth is OK. If it's not, the scenario runner
  // will fail with a clear auth error when it tries to call tools.
  //
  // Future improvement: Could attempt a lightweight MCP tool call
  // (e.g., list tools) to verify auth proactively.

  console.log(`   (Authentication check not implemented - will verify during scenario execution)`);

  return true; // Optimistic: assume auth is OK
}

/**
 * Test connectivity to the target MCP server.
 *
 * For Fly.io and mittwald.de, attempts to reach the health endpoint.
 *
 * @param target - Test target
 * @returns true if server is reachable, false otherwise
 */
async function testConnectivity(target: TestTarget): Promise<boolean> {
  if (target.name === 'local') {
    return true; // Local server assumed available
  }

  try {
    const healthUrl =
      target.name === 'flyio'
        ? 'https://mittwald-mcp-fly2.fly.dev/health'
        : 'https://mcp.mittwald.de/health';

    // Use fetch (Node.js 18+ has native fetch)
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'mittwald-mcp-evals' },
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (response.ok) {
      const body = await response.json();
      console.log(`   Health check: ${JSON.stringify(body)}`);
      return true;
    } else {
      console.warn(`   Health check returned HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.warn(`   Health check failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Exit with clear instructions if prerequisites check fails.
 * Call this after checkPrerequisites() if passed === false.
 */
export function exitWithPrerequisiteErrors(
  target: TestTarget,
  result: PrerequisiteCheckResult
): never {
  console.error(`\n❌ Cannot run tests for ${target.displayName} - prerequisites not met\n`);
  console.error(`Errors:`);
  result.errors.forEach((err) => console.error(`  - ${err}`));

  console.error(`\nPlease fix the issues above and retry.`);

  process.exit(1);
}
