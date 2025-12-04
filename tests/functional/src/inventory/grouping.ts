/**
 * Grouping - Domain Mapping & Tier Assignment (T037, T039)
 *
 * Maps tools to test domains and assigns dependency tiers.
 */

import type { TestDomain } from '../types/index.js';
import { parseToolName } from './discovery.js';

/**
 * Domain pattern mapping (T037)
 * Maps tool name prefixes to test domains
 */
const DOMAIN_PATTERNS: Record<TestDomain, string[]> = {
  identity: ['user/', 'login/', 'context/'],
  organization: ['org/', 'extension/'],
  'project-foundation': ['project/', 'server/'],
  apps: ['app/'],
  containers: ['container/', 'stack/', 'volume/', 'registry/'],
  databases: ['database/'],
  'domains-mail': ['domain/', 'mail/'],
  'access-users': ['sftp/', 'ssh/'],
  automation: ['cronjob/'],
  backups: ['backup/'],
};

/**
 * Tier 0: Foundational tools with no prerequisites
 */
const TIER_0_PATTERNS = [
  'user/',
  'login/status',
  'context/',
  'org/list',
  'org/membership/list/own',
  'server/list',
];

/**
 * Tier 1: Organization-level tools
 */
const TIER_1_PATTERNS = ['org/', 'extension/'];

/**
 * Tier 2: Server-level tools
 */
const TIER_2_PATTERNS = ['server/get'];

/**
 * Tier 3: Project creation tools (clean-room)
 */
const TIER_3_PATTERNS = ['project/create', 'project/list'];

/**
 * Map a tool name to its test domain (T037)
 *
 * @param mcpToolName The MCP tool name (e.g., "mcp__mittwald__mittwald_project_create")
 * @returns The test domain for this tool
 */
export function mapToolToDomain(mcpToolName: string): TestDomain {
  const displayName = parseToolName(mcpToolName);

  for (const [domain, patterns] of Object.entries(DOMAIN_PATTERNS)) {
    for (const pattern of patterns) {
      if (displayName.startsWith(pattern)) {
        return domain as TestDomain;
      }
    }
  }

  // Default to project-foundation for unknown tools
  console.warn(`[grouping] Unknown tool domain for: ${displayName}, defaulting to project-foundation`);
  return 'project-foundation';
}

/**
 * Assign dependency tier to a tool (T039)
 *
 * Tiers:
 * - 0: No prerequisites (user, login/status, context, org/list, server/list)
 * - 1: Requires organization access
 * - 2: Requires server access
 * - 3: Project creation (clean-room only)
 * - 4: Requires project context (everything else)
 *
 * @param mcpToolName The MCP tool name
 * @returns Dependency tier (0-4)
 */
export function assignTier(mcpToolName: string): 0 | 1 | 2 | 3 | 4 {
  const displayName = parseToolName(mcpToolName);

  // Check Tier 0 first (most specific)
  for (const pattern of TIER_0_PATTERNS) {
    if (displayName.startsWith(pattern) || displayName === pattern.replace('/', '')) {
      return 0;
    }
  }

  // Check Tier 3 (project creation - special case)
  for (const pattern of TIER_3_PATTERNS) {
    if (displayName.startsWith(pattern)) {
      return 3;
    }
  }

  // Check Tier 2 (server-level)
  for (const pattern of TIER_2_PATTERNS) {
    if (displayName.startsWith(pattern)) {
      return 2;
    }
  }

  // Check Tier 1 (org-level, but not already matched in Tier 0)
  for (const pattern of TIER_1_PATTERNS) {
    if (displayName.startsWith(pattern)) {
      return 1;
    }
  }

  // Default: Tier 4 (requires project)
  return 4;
}

/**
 * Check if a tool requires clean-room mode (no harness setup)
 *
 * @param mcpToolName The MCP tool name
 * @returns True if tool requires clean-room testing
 */
export function requiresCleanRoom(mcpToolName: string): boolean {
  const displayName = parseToolName(mcpToolName);
  return displayName === 'project/create';
}

/**
 * Get all test domains in execution order
 */
export function getDomainsInOrder(): TestDomain[] {
  return [
    'identity', // Tier 0 - no dependencies
    'organization', // Tier 1 - org access
    'project-foundation', // Tier 3 - creates project
    'apps', // Tier 4 - requires project
    'containers', // Tier 4
    'databases', // Tier 4
    'domains-mail', // Tier 4
    'access-users', // Tier 4
    'automation', // Tier 4
    'backups', // Tier 4
  ];
}

/**
 * Export domain patterns for testing
 */
export { DOMAIN_PATTERNS };
