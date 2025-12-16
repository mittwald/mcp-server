#!/usr/bin/env npx ts-node

/**
 * Tool Inventory Generator
 *
 * Scans tool handlers and generates complete inventory with domain/tier classification.
 *
 * Usage:
 *   npx ts-node generate-tool-inventory.ts [output-path]
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ============================================================================
// Type Definitions
// ============================================================================

interface ToolEntry {
  mcp_name: string;
  display_name: string;
  domain: string;
  tier: number;
  description: string;
  dependencies: string[];
  required_resources: string[];
  success_indicators: string[];
  is_destructive: boolean;
  is_interactive: boolean;
  parameters: Record<string, string>;
}

interface ToolInventory {
  generated_at: string;
  tool_count: number;
  source: string;
  domains: Record<string, number>;
  tools: ToolEntry[];
}

// ============================================================================
// Domain Classification
// ============================================================================

const DOMAIN_PATTERNS: Record<string, string[]> = {
  identity: ['user/', 'login/', 'context/'],
  organization: ['org/', 'extension/'],
  'project-foundation': ['project/', 'server/'],
  apps: ['app/'],
  containers: ['container/', 'stack/', 'volume/', 'registry/'],
  databases: ['database/'],
  'domains-mail': ['domain/', 'mail/', 'certificate/'],
  'access-users': ['sftp/', 'ssh/'],
  automation: ['cronjob/'],
  backups: ['backup/'],
  misc: ['conversation/', 'ddev/'],
};

/**
 * Map a display name to its domain
 */
export function mapToDomain(displayName: string): string {
  for (const [domain, patterns] of Object.entries(DOMAIN_PATTERNS)) {
    for (const pattern of patterns) {
      if (displayName.startsWith(pattern)) {
        return domain;
      }
    }
  }
  return 'misc';
}

// ============================================================================
// Tier Classification
// ============================================================================

const TIER_0_PATTERNS = [
  'user/',
  'login/status',
  'context/',
  'org/list',
  'org/membership-list-own',
  'server/list',
  'project/list',
];

const TIER_1_PREFIXES = ['org/', 'extension/'];
const TIER_2_TOOLS = ['server/get'];
const TIER_3_TOOLS = ['project/create'];

/**
 * Assign tier based on tool name
 */
export function assignTier(displayName: string): number {
  // Check Tier 0 patterns first
  for (const pattern of TIER_0_PATTERNS) {
    if (displayName === pattern.replace('/', '') || displayName.startsWith(pattern)) {
      return 0;
    }
  }

  // Check Tier 3 (project creation)
  if (TIER_3_TOOLS.includes(displayName)) {
    return 3;
  }

  // Check Tier 2 (server-level)
  if (TIER_2_TOOLS.includes(displayName)) {
    return 2;
  }

  // Check Tier 1 (org-level, but not already in Tier 0)
  for (const prefix of TIER_1_PREFIXES) {
    if (displayName.startsWith(prefix)) {
      return 1;
    }
  }

  // Default: Tier 4 (requires project)
  return 4;
}

// ============================================================================
// Dependencies Mapping
// ============================================================================

const EXPLICIT_DEPENDENCIES: Record<string, string[]> = {
  // Tier 4 - project dependent
  'app/list': ['project/list'],
  'app/get': ['app/list'],
  'app/create/node': ['project/list'],
  'app/create/php': ['project/list'],
  'app/create/python': ['project/list'],
  'app/create/static': ['project/list'],
  'app/create/php-worker': ['project/list'],
  'app/install/wordpress': ['project/list'],
  'app/install/typo3': ['project/list'],
  'app/install/joomla': ['project/list'],
  'app/install/contao': ['project/list'],
  'app/install/shopware5': ['project/list'],
  'app/install/shopware6': ['project/list'],
  'app/install/matomo': ['project/list'],
  'app/install/nextcloud': ['project/list'],
  'app/update': ['app/list'],
  'app/upgrade': ['app/list'],
  'app/uninstall': ['app/list'],
  'app/copy': ['app/list'],
  'app/download': ['app/list'],
  'app/upload': ['app/list'],
  'app/open': ['app/list'],
  'app/ssh': ['app/list'],
  'app/versions': ['app/list'],
  'app/list-upgrade-candidates': ['app/list'],
  'app/dependency-list': ['app/list'],
  'app/dependency-update': ['app/list'],
  'app/dependency-versions': ['app/list'],

  // Database dependencies
  'database/list': ['project/list'],
  'database/mysql/list': ['project/list'],
  'database/mysql/get': ['database/mysql/list'],
  'database/mysql/create': ['project/list'],
  'database/mysql/delete': ['database/mysql/list'],
  'database/mysql/dump': ['database/mysql/list'],
  'database/mysql/import': ['database/mysql/list'],
  'database/mysql/shell': ['database/mysql/list'],
  'database/mysql/port-forward': ['database/mysql/list'],
  'database/mysql/phpmyadmin': ['database/mysql/list'],
  'database/mysql/user-list': ['database/mysql/list'],
  'database/mysql/user-get': ['database/mysql/user-list'],
  'database/mysql/user-create': ['database/mysql/list'],
  'database/mysql/user-update': ['database/mysql/user-list'],
  'database/mysql/user-delete': ['database/mysql/user-list'],
  'database/redis/list': ['project/list'],
  'database/redis/get': ['database/redis/list'],
  'database/redis/create': ['project/list'],

  // Backup dependencies
  'backup/list': ['project/list'],
  'backup/get': ['backup/list'],
  'backup/create': ['project/list'],
  'backup/delete': ['backup/list'],
  'backup/download': ['backup/list'],
  'backup/schedule-list': ['project/list'],
  'backup/schedule-create': ['project/list'],
  'backup/schedule-update': ['backup/schedule-list'],
  'backup/schedule-delete': ['backup/schedule-list'],

  // Cronjob dependencies
  'cronjob/list': ['app/list'],
  'cronjob/get': ['cronjob/list'],
  'cronjob/create': ['app/list'],
  'cronjob/update': ['cronjob/list'],
  'cronjob/delete': ['cronjob/list'],
  'cronjob/execute': ['cronjob/list'],
  'cronjob/execution-list': ['cronjob/list'],
  'cronjob/execution-get': ['cronjob/execution-list'],
  'cronjob/execution-abort': ['cronjob/execution-list'],
  'cronjob/execution-logs': ['cronjob/execution-list'],

  // Container dependencies
  'container/list-services': ['project/list'],
  'container/run': ['project/list'],
  'container/logs': ['container/list-services'],
  'container/start': ['container/list-services'],
  'container/stop': ['container/list-services'],
  'container/restart': ['container/list-services'],
  'container/recreate': ['container/list-services'],
  'container/delete': ['container/list-services'],
  'container/update': ['container/list-services'],

  // Stack dependencies
  'stack/list': ['project/list'],
  'stack/deploy': ['project/list'],
  'stack/ps': ['stack/list'],
  'stack/delete': ['stack/list'],

  // Volume dependencies
  'volume/list': ['project/list'],
  'volume/create': ['project/list'],
  'volume/delete': ['volume/list'],

  // Registry dependencies
  'registry/list': ['project/list'],
  'registry/create': ['project/list'],
  'registry/update': ['registry/list'],
  'registry/delete': ['registry/list'],

  // Domain/mail dependencies
  'domain/list': ['project/list'],
  'domain/get': ['domain/list'],
  'domain/dnszone/list': ['domain/list'],
  'domain/dnszone/get': ['domain/dnszone/list'],
  'domain/dnszone/update': ['domain/dnszone/list'],
  'domain/virtualhost-list': ['domain/list'],
  'domain/virtualhost-get': ['domain/virtualhost-list'],
  'domain/virtualhost-create': ['domain/list'],
  'domain/virtualhost-delete': ['domain/virtualhost-list'],
  'mail/address/list': ['project/list'],
  'mail/address/get': ['mail/address/list'],
  'mail/address/create': ['project/list'],
  'mail/address/update': ['mail/address/list'],
  'mail/address/delete': ['mail/address/list'],
  'mail/deliverybox/list': ['project/list'],
  'mail/deliverybox/get': ['mail/deliverybox/list'],
  'mail/deliverybox/create': ['project/list'],
  'mail/deliverybox/update': ['mail/deliverybox/list'],
  'mail/deliverybox/delete': ['mail/deliverybox/list'],
  'certificate/list': ['project/list'],
  'certificate/request': ['domain/list'],

  // SFTP/SSH user dependencies
  'sftp/user-list': ['project/list'],
  'sftp/user-create': ['project/list'],
  'sftp/user-update': ['sftp/user-list'],
  'sftp/user-delete': ['sftp/user-list'],
  'ssh/user-list': ['project/list'],
  'ssh/user-create': ['project/list'],
  'ssh/user-update': ['ssh/user-list'],
  'ssh/user-delete': ['ssh/user-list'],

  // Project dependencies
  'project/get': ['project/list'],
  'project/update': ['project/list'],
  'project/delete': ['project/list'],
  'project/filesystem-usage': ['project/list'],
  'project/ssh': ['project/list'],
  'project/invite-list': ['project/list'],
  'project/invite-get': ['project/invite-list'],
  'project/membership-list': ['project/list'],
  'project/membership-get': ['project/membership-list'],
  'project/membership-get-own': ['project/list'],
  'project/membership-list-own': ['project/list'],
  'project/invite-list-own': [],

  // Org dependencies
  'org/get': ['org/list'],
  'org/delete': ['org/list'],
  'org/invite': ['org/list'],
  'org/invite-list': ['org/list'],
  'org/invite-revoke': ['org/invite-list'],
  'org/membership-list': ['org/list'],
  'org/membership-revoke': ['org/membership-list'],

  // Extension dependencies
  'extension/list': [],
  'extension/install': ['org/list'],
  'extension/list-installed': ['org/list'],
  'extension/uninstall': ['extension/list-installed'],

  // User dependencies
  'user/session/get': ['user/session/list'],
  'user/ssh-key/get': ['user/ssh-key/list'],
  'user/ssh-key/delete': ['user/ssh-key/list'],
  'user/api-token/get': ['user/api-token/list'],
  'user/api-token/revoke': ['user/api-token/list'],
};

/**
 * Get dependencies for a tool
 */
export function getDependencies(displayName: string): string[] {
  return EXPLICIT_DEPENDENCIES[displayName] || [];
}

/**
 * Get required resources based on tier and tool name
 */
export function getRequiredResources(displayName: string, tier: number): string[] {
  const resources: string[] = [];

  if (tier >= 4) {
    resources.push('project');
  }

  // Add specific resource requirements
  if (displayName.startsWith('app/') && !displayName.includes('create') && !displayName.includes('install') && !displayName.includes('list') && !displayName.includes('versions')) {
    resources.push('app');
  }
  if (displayName.startsWith('database/mysql/') && !displayName.includes('create') && !displayName.includes('list') && !displayName.includes('versions') && !displayName.includes('charsets')) {
    resources.push('database-mysql');
  }
  if (displayName.startsWith('database/redis/') && !displayName.includes('create') && !displayName.includes('list') && !displayName.includes('versions')) {
    resources.push('database-redis');
  }
  if (displayName.startsWith('backup/') && displayName !== 'backup/list' && displayName !== 'backup/create' && !displayName.includes('schedule')) {
    resources.push('backup');
  }
  if (displayName.startsWith('cronjob/') && !displayName.includes('create') && displayName !== 'cronjob/list') {
    resources.push('cronjob');
  }
  if (displayName.startsWith('container/') && displayName !== 'container/run' && displayName !== 'container/list-services') {
    resources.push('container');
  }

  return resources;
}

// ============================================================================
// Success Indicators
// ============================================================================

/**
 * Generate success indicators based on tool name
 */
export function generateSuccessIndicators(displayName: string): string[] {
  const indicators: string[] = [];

  // Operation-type based indicators
  if (displayName.includes('/list')) {
    indicators.push('Returns array of resources');
    indicators.push('No authentication errors');
  } else if (displayName.includes('/get')) {
    indicators.push('Returns resource details');
    indicators.push('Resource ID matches request');
  } else if (displayName.includes('/create')) {
    indicators.push('Returns new resource ID');
    indicators.push('Resource appears in list');
    indicators.push('No quota errors');
  } else if (displayName.includes('/delete') || displayName.includes('/uninstall') || displayName.includes('/revoke')) {
    indicators.push('Resource removed from list');
    indicators.push('Confirmation received');
  } else if (displayName.includes('/update')) {
    indicators.push('Updated fields reflected');
    indicators.push('No validation errors');
  } else if (displayName.includes('/install')) {
    indicators.push('Installation initiated');
    indicators.push('App appears in list');
    indicators.push('Installation status can be checked');
  } else if (displayName.includes('/execute')) {
    indicators.push('Execution initiated');
    indicators.push('Execution ID returned');
  }

  // Domain-specific indicators
  if (displayName.startsWith('user/')) {
    indicators.push('User data returned correctly');
  } else if (displayName.startsWith('context/')) {
    indicators.push('Context value updated/returned');
  } else if (displayName.startsWith('login/')) {
    indicators.push('Authentication state verified');
  }

  // Fallback
  if (indicators.length === 0) {
    indicators.push('Tool executes without errors');
    indicators.push('Response contains expected data');
  }

  return indicators;
}

// ============================================================================
// Handler Scanning
// ============================================================================

/**
 * Convert file path to display name
 */
export function filePathToDisplayName(filePath: string): string {
  // Extract relative path from handlers directory
  const handlersDir = 'src/handlers/tools/mittwald-cli/';
  let relativePath = filePath;
  if (filePath.includes(handlersDir)) {
    relativePath = filePath.split(handlersDir)[1];
  }

  // Remove -cli.ts suffix and convert path separators to /
  return relativePath
    .replace(/-cli\.ts$/, '')
    .replace(/\\/g, '/');
}

/**
 * Convert display name to MCP tool name
 */
export function displayNameToMcpName(displayName: string): string {
  // Convert slashes to underscores and add prefix
  const toolPart = displayName.replace(/\//g, '_');
  return `mcp__mittwald__mittwald_${toolPart}`;
}

/**
 * Check if tool is destructive
 */
export function isDestructive(displayName: string): boolean {
  return (
    displayName.includes('/delete') ||
    displayName.includes('/uninstall') ||
    displayName.includes('/revoke') ||
    displayName.includes('/abort')
  );
}

/**
 * Check if tool is interactive
 */
export function isInteractive(displayName: string): boolean {
  return (
    displayName.includes('/ssh') ||
    displayName.includes('/shell') ||
    displayName.includes('/port-forward') ||
    displayName.includes('/phpmyadmin') ||
    displayName.includes('/open')
  );
}

/**
 * Extract description from handler file (basic implementation)
 */
function extractDescription(displayName: string): string {
  // Generate descriptions based on tool name patterns
  const parts = displayName.split('/');
  const action = parts[parts.length - 1];
  const resource = parts.slice(0, -1).join(' ');

  const descriptions: Record<string, string> = {
    list: `List ${resource} resources`,
    get: `Get ${resource} details`,
    create: `Create a new ${resource}`,
    delete: `Delete a ${resource}`,
    update: `Update ${resource} settings`,
    install: `Install ${parts[parts.length - 1]} application`,
  };

  // Specific descriptions
  const specific: Record<string, string> = {
    'user/get': 'Get profile information for a user',
    'user/session/list': 'List all active user sessions',
    'user/session/get': 'Get details of a specific session',
    'user/ssh-key/list': 'List all SSH keys for the user',
    'user/ssh-key/get': 'Get details of a specific SSH key',
    'user/ssh-key/create': 'Create a new SSH key pair',
    'user/ssh-key/delete': 'Delete an SSH key',
    'user/ssh-key/import': 'Import an existing SSH public key',
    'user/api-token/list': 'List all API tokens',
    'user/api-token/get': 'Get details of a specific API token',
    'user/api-token/create': 'Create a new API token',
    'user/api-token/revoke': 'Revoke an API token',
    'context/get': 'Get current CLI context parameters',
    'context/set': 'Set context parameters (project, org, server)',
    'context/reset': 'Reset all context parameters',
    'context/accessible-projects': 'List projects accessible to current user',
    'login/status': 'Check authentication status',
    'login/token': 'Get current authentication token',
    'login/reset': 'Reset authentication state',
    'org/list': 'List all organizations',
    'org/get': 'Get organization details',
    'org/delete': 'Delete an organization',
    'org/invite': 'Invite a user to an organization',
    'org/invite-list': 'List pending organization invitations',
    'org/invite-list-own': 'List your pending organization invitations',
    'org/invite-revoke': 'Revoke an organization invitation',
    'org/membership-list': 'List organization members',
    'org/membership-list-own': 'List your organization memberships',
    'org/membership-revoke': 'Revoke organization membership',
    'project/create': 'Create a new project',
    'project/list': 'List all projects',
    'project/get': 'Get project details',
    'project/delete': 'Delete a project',
    'project/update': 'Update project settings',
    'project/filesystem-usage': 'Get filesystem usage for a project',
    'project/ssh': 'SSH into a project',
    'server/list': 'List all servers',
    'server/get': 'Get server details',
    'app/list': 'List all apps in a project',
    'app/get': 'Get app details',
    'app/copy': 'Copy an app',
    'app/download': 'Download app files',
    'app/upload': 'Upload files to an app',
    'app/open': 'Open app in browser',
    'app/ssh': 'SSH into an app',
    'app/versions': 'List available app versions',
    'app/update': 'Update app settings',
    'app/upgrade': 'Upgrade app to a newer version',
    'app/uninstall': 'Uninstall an app',
    'app/list-upgrade-candidates': 'List apps with available upgrades',
    'database/list': 'List all databases',
    'database/mysql/list': 'List MySQL databases',
    'database/mysql/get': 'Get MySQL database details',
    'database/mysql/create': 'Create a MySQL database',
    'database/mysql/delete': 'Delete a MySQL database',
    'database/mysql/charsets': 'List available MySQL character sets',
    'database/mysql/versions': 'List available MySQL versions',
    'database/mysql/dump': 'Dump MySQL database',
    'database/mysql/import': 'Import data into MySQL database',
    'database/mysql/shell': 'Open MySQL shell',
    'database/mysql/port-forward': 'Forward MySQL port for local access',
    'database/mysql/phpmyadmin': 'Open phpMyAdmin',
    'container/run': 'Run a container',
    'container/list-services': 'List container services',
    'container/logs': 'View container logs',
    'container/start': 'Start a container',
    'container/stop': 'Stop a container',
    'container/restart': 'Restart a container',
    'container/recreate': 'Recreate a container',
    'container/delete': 'Delete a container',
    'container/update': 'Update container settings',
    'backup/list': 'List all backups',
    'backup/get': 'Get backup details',
    'backup/create': 'Create a backup',
    'backup/delete': 'Delete a backup',
    'backup/download': 'Download a backup',
    'cronjob/list': 'List all cronjobs',
    'cronjob/get': 'Get cronjob details',
    'cronjob/create': 'Create a cronjob',
    'cronjob/update': 'Update cronjob settings',
    'cronjob/delete': 'Delete a cronjob',
    'cronjob/execute': 'Execute a cronjob immediately',
    'conversation/list': 'List support conversations',
    'conversation/show': 'Show conversation details',
    'conversation/create': 'Create a support conversation',
    'conversation/reply': 'Reply to a conversation',
    'conversation/close': 'Close a conversation',
    'conversation/categories': 'List conversation categories',
  };

  if (specific[displayName]) {
    return specific[displayName];
  }

  return descriptions[action] || `Execute ${displayName.replace(/\//g, ' ')} operation`;
}

/**
 * Find all handler files
 */
function findHandlerFiles(baseDir: string): string[] {
  const files: string[] = [];

  function scanDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith('-cli.ts')) {
        files.push(fullPath);
      }
    }
  }

  if (fs.existsSync(baseDir)) {
    scanDir(baseDir);
  }

  return files.sort();
}

// ============================================================================
// Main Generation Functions
// ============================================================================

/**
 * Generate complete tool inventory
 */
export async function generateInventory(handlersDir: string): Promise<ToolInventory> {
  const files = findHandlerFiles(handlersDir);
  console.log(`Found ${files.length} tool handlers`);

  const tools: ToolEntry[] = [];

  for (const file of files) {
    const displayName = filePathToDisplayName(file);
    const mcpName = displayNameToMcpName(displayName);
    const domain = mapToDomain(displayName);
    const tier = assignTier(displayName);

    tools.push({
      mcp_name: mcpName,
      display_name: displayName,
      domain,
      tier,
      description: extractDescription(displayName),
      dependencies: getDependencies(displayName),
      required_resources: getRequiredResources(displayName, tier),
      success_indicators: generateSuccessIndicators(displayName),
      is_destructive: isDestructive(displayName),
      is_interactive: isInteractive(displayName),
      parameters: {},
    });
  }

  // Sort by display name
  tools.sort((a, b) => a.display_name.localeCompare(b.display_name));

  // Count by domain
  const domains: Record<string, number> = {};
  for (const tool of tools) {
    domains[tool.domain] = (domains[tool.domain] || 0) + 1;
  }

  return {
    generated_at: new Date().toISOString(),
    tool_count: tools.length,
    source: 'mittwald-mcp-fly2.fly.dev',
    domains,
    tools,
  };
}

/**
 * Validate the generated inventory
 */
export function validateInventory(inventory: ToolInventory): string[] {
  const errors: string[] = [];

  // Check tool count
  if (inventory.tool_count !== 175) {
    errors.push(`Expected 175 tools, found ${inventory.tool_count}`);
  }

  // Check all expected domains are present
  const expectedDomains = [
    'identity',
    'organization',
    'project-foundation',
    'apps',
    'containers',
    'databases',
    'domains-mail',
    'access-users',
    'automation',
    'backups',
    'misc',
  ];

  for (const domain of expectedDomains) {
    if (!inventory.domains[domain]) {
      errors.push(`Missing domain: ${domain}`);
    }
  }

  // Check each tool has required fields
  const names = new Set<string>();
  for (const tool of inventory.tools) {
    if (!tool.mcp_name) {
      errors.push(`Tool missing mcp_name: ${tool.display_name}`);
    }
    if (!tool.description) {
      errors.push(`Tool missing description: ${tool.display_name}`);
    }
    if (tool.success_indicators.length === 0) {
      errors.push(`Tool has no success indicators: ${tool.display_name}`);
    }
    if (names.has(tool.mcp_name)) {
      errors.push(`Duplicate tool name: ${tool.mcp_name}`);
    }
    names.add(tool.mcp_name);
  }

  return errors;
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const outputPath = args[0] || 'evals/inventory/tools.json';
  const handlersDir = 'src/handlers/tools/mittwald-cli';

  if (!fs.existsSync(handlersDir)) {
    console.error(`Handlers directory not found: ${handlersDir}`);
    process.exit(1);
  }

  console.log('Generating tool inventory...');
  const inventory = await generateInventory(handlersDir);

  // Validate
  console.log('\nValidating inventory...');
  const errors = validateInventory(inventory);

  if (errors.length > 0) {
    console.warn('\nValidation warnings:');
    for (const error of errors) {
      console.warn(`  - ${error}`);
    }
  } else {
    console.log('Validation passed!');
  }

  // Write output
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(inventory, null, 2));
  console.log(`\nInventory written to: ${outputPath}`);

  // Summary
  console.log('\n--- Inventory Summary ---');
  console.log(`Total tools: ${inventory.tool_count}`);
  console.log('\nBy domain:');
  for (const [domain, count] of Object.entries(inventory.domains).sort()) {
    console.log(`  ${domain}: ${count}`);
  }

  // Tier distribution
  const tierCounts = new Map<number, number>();
  for (const tool of inventory.tools) {
    tierCounts.set(tool.tier, (tierCounts.get(tool.tier) || 0) + 1);
  }
  console.log('\nBy tier:');
  for (let tier = 0; tier <= 4; tier++) {
    console.log(`  Tier ${tier}: ${tierCounts.get(tier) || 0}`);
  }
}

// Run if executed directly
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename || process.argv[1]?.endsWith('generate-tool-inventory.ts')) {
  main().catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
}
