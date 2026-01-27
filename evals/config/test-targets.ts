/**
 * Test target configuration for multi-target scenario testing.
 *
 * Feature 018 tests against three MCP server deployments:
 * - Local: Fast development feedback
 * - Fly.io: Production environment validation
 * - mittwald.de: Official deployment validation
 *
 * @see kitty-specs/018-documentation-driven-mcp-tool-testing/plan.md
 */

export interface TestTarget {
  /** Target identifier */
  name: 'local' | 'flyio' | 'mittwald';

  /** Human-readable display name */
  displayName: string;

  /** How to retrieve tool call logs for coverage tracking */
  logSource: 'local' | 'flyctl' | 'outcome-validation';

  /** Whether this target requires OAuth authentication */
  requiresAuth: boolean;

  /** Whether user must manually configure Claude Code CLI MCP server */
  requiresUserMcpConfig: boolean;
}

/**
 * Available test targets.
 *
 * Users select target via `--target` flag:
 * ```bash
 * npm run test:scenarios --target=local    # Default
 * npm run test:scenarios --target=flyio
 * npm run test:scenarios --target=mittwald
 * ```
 */
export const TEST_TARGETS: Record<string, TestTarget> = {
  local: {
    name: 'local',
    displayName: 'Local (build/index.js)',
    logSource: 'local',
    requiresAuth: false,
    requiresUserMcpConfig: false,
  },

  flyio: {
    name: 'flyio',
    displayName: 'Fly.io (mittwald-mcp-fly2.fly.dev)',
    logSource: 'flyctl',
    requiresAuth: true,
    requiresUserMcpConfig: true,
  },

  mittwald: {
    name: 'mittwald',
    displayName: 'Mittwald (mcp.mittwald.de)',
    logSource: 'outcome-validation',
    requiresAuth: true,
    requiresUserMcpConfig: true,
  },
};

/**
 * Get test target by name.
 * @throws Error if target name is invalid
 */
export function getTestTarget(name: string): TestTarget {
  const target = TEST_TARGETS[name];
  if (!target) {
    throw new Error(
      `Invalid target: ${name}. Valid targets: ${Object.keys(TEST_TARGETS).join(', ')}`
    );
  }
  return target;
}

/**
 * Default test target (local).
 */
export const DEFAULT_TARGET = TEST_TARGETS.local;
