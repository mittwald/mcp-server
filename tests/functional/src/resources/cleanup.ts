/**
 * Cleanup - Domain-Grouped Resource Deletion (T029, T030, T032, T033)
 *
 * Deletes resources in dependency order to avoid orphan errors.
 */

import { rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { CleanupResult, ResourceType, TestDomain, TrackedResource } from '../types/index.js';
import { ResourceTracker } from './tracker.js';
import { isTestResource } from './naming.js';

const execAsync = promisify(exec);

/**
 * Cleanup order: delete children before parents (T030)
 * Lower index = higher priority (delete first)
 */
const CLEANUP_ORDER: ResourceType[] = [
  // Tier 1: Leaf resources with no children
  'mail-address',
  'mail-deliverybox',
  // Tier 2: Domain-related
  'virtualhost',
  'domain',
  // Tier 3: Scheduled resources
  'cronjob',
  'backup',
  'backup-schedule',
  // Tier 4: Access resources
  'ssh-user',
  'sftp-user',
  // Tier 5: Database resources
  'database-mysql',
  'database-redis',
  // Tier 6: Container/stack resources
  'container',
  'stack',
  'registry',
  'volume',
  // Tier 7: Apps
  'app',
  // Tier 8: Projects (last - parent of all)
  'project',
];

/**
 * Get cleanup priority (lower = delete first)
 */
function getCleanupPriority(resourceType: ResourceType): number {
  const index = CLEANUP_ORDER.indexOf(resourceType);
  return index >= 0 ? index : 100; // Unknown types last
}

/**
 * Sort resources by cleanup order
 */
function sortByCleanupOrder(resources: TrackedResource[]): TrackedResource[] {
  return [...resources].sort((a, b) => {
    // First sort by type (cleanup order)
    const typeDiff = getCleanupPriority(a.resourceType) - getCleanupPriority(b.resourceType);
    if (typeDiff !== 0) return typeDiff;

    // Then by child count (resources with children should be deleted later)
    return a.childResources.length - b.childResources.length;
  });
}

/**
 * Delete a Mittwald resource using the mw CLI
 * NOTE: This uses the mw CLI directly (harness privilege, not test agent)
 */
async function deleteMittwaldResource(resource: TrackedResource): Promise<{ success: boolean; error?: string }> {
  const typeCommands: Record<ResourceType, string | null> = {
    project: 'project delete',
    app: 'app uninstall',
    container: 'container delete',
    stack: 'stack delete',
    volume: 'volume delete',
    registry: 'registry delete',
    'database-mysql': 'database mysql delete',
    'database-redis': null, // Redis deletion via project
    cronjob: 'cronjob delete',
    backup: 'backup delete',
    'backup-schedule': 'backup schedule delete',
    domain: null, // Domain deletion is complex
    virtualhost: 'domain virtualhost delete',
    'mail-address': 'mail address delete',
    'mail-deliverybox': 'mail deliverybox delete',
    'sftp-user': 'sftp-user delete',
    'ssh-user': 'ssh-user delete',
  };

  const command = typeCommands[resource.resourceType];
  if (!command) {
    return { success: true }; // Skip unsupported types
  }

  try {
    // Use mw CLI with force flag to avoid prompts
    await execAsync(`mw ${command} ${resource.resourceId} --force --quiet`);
    return { success: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error };
  }
}

/**
 * Cleanup all resources for a domain (T029, T030)
 */
export async function cleanupDomain(tracker: ResourceTracker, domain: string): Promise<CleanupResult> {
  const resources = await tracker.getByDomain(domain);
  const trackedResources = resources.map((r) => ({
    resourceId: r.resourceId,
    resourceType: r.resourceType as ResourceType,
    name: r.name,
    domain: r.domain as TestDomain,
    createdBySession: r.sessionId,
    createdByTest: r.testId,
    parentResourceId: r.parentResourceId,
    createdAt: new Date(),
    childResources: [] as string[],
    status: 'active' as const,
  })) as TrackedResource[];

  // Sort by cleanup order
  const sorted = sortByCleanupOrder(trackedResources);

  let cleaned = 0;
  let failed = 0;
  const failures: Array<{ resourceId: string; error: string }> = [];

  for (const resource of sorted) {
    const result = await deleteMittwaldResource(resource);

    if (result.success) {
      await tracker.markCleaned(resource.resourceId);
      cleaned++;
    } else {
      await tracker.markCleanupFailed(resource.resourceId);
      failed++;
      failures.push({
        resourceId: resource.resourceId,
        error: result.error || 'Unknown error',
      });
    }
  }

  // Cleanup temp directory for this domain (T032)
  const tempDirs = tracker.getTempDirectories();
  for (const dir of tempDirs) {
    if (dir.includes(domain)) {
      try {
        if (existsSync(dir)) {
          await rm(dir, { recursive: true, force: true });
        }
        tracker.removeTempDir(dir);
      } catch (err) {
        console.warn(`[cleanup] Failed to remove temp dir ${dir}:`, err);
      }
    }
  }

  return {
    domain,
    total: sorted.length,
    cleaned,
    failed,
    failures,
  };
}

/**
 * Orphan detection result with resource details
 */
export interface OrphanResource {
  name: string;
  resourceId: string;
  resourceType: ResourceType;
}

/**
 * Query mw CLI and parse JSON output
 */
async function queryMwList(
  command: string,
  resourceType: ResourceType
): Promise<Array<{ name: string; id: string }>> {
  try {
    const { stdout } = await execAsync(`mw ${command} --output json`);
    const parsed = JSON.parse(stdout.trim());

    // Handle different response formats
    if (Array.isArray(parsed)) {
      return parsed.map((item: { shortId?: string; id?: string; description?: string; hostname?: string; address?: string }) => ({
        name: item.description || item.hostname || item.address || item.shortId || item.id || '',
        id: item.shortId || item.id || '',
      }));
    }

    return [];
  } catch (err) {
    // Command may fail if no access or empty list
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (!msg.includes('not found') && !msg.includes('No ')) {
      console.warn(`[cleanup] Failed to query ${resourceType}: ${msg}`);
    }
    return [];
  }
}

/**
 * Find orphaned test resources (T033)
 * Resources matching test-* pattern but not in tracker
 */
export async function findOrphans(tracker: ResourceTracker): Promise<OrphanResource[]> {
  console.log('[cleanup] Scanning for orphaned test resources...');

  // Get tracked resource IDs
  const trackedIds = new Set(tracker.getAllResources().map((r) => r.resourceId));
  const trackedNames = tracker.getAllNames();

  const orphans: OrphanResource[] = [];

  // Resource types to scan with their mw CLI commands
  const scanCommands: Array<{ command: string; type: ResourceType }> = [
    { command: 'project list', type: 'project' },
    // Apps need project context, skip global scan
    // { command: 'app list', type: 'app' },
    // { command: 'database mysql list', type: 'database-mysql' },
    // { command: 'container list', type: 'container' },
  ];

  for (const { command, type } of scanCommands) {
    console.log(`[cleanup] Scanning ${type}...`);
    const resources = await queryMwList(command, type);

    for (const resource of resources) {
      // Check if this is a test resource based on name pattern
      if (isTestResource(resource.name)) {
        // Check if it's tracked
        const isTracked = trackedIds.has(resource.id) || trackedNames.has(resource.name);

        if (!isTracked) {
          orphans.push({
            name: resource.name,
            resourceId: resource.id,
            resourceType: type,
          });
        }
      }
    }
  }

  console.log(`[cleanup] Found ${orphans.length} orphaned test resources`);
  return orphans;
}

/**
 * Cleanup orphaned resources
 */
export async function cleanupOrphans(orphans: OrphanResource[]): Promise<CleanupResult> {
  let cleaned = 0;
  let failed = 0;
  const failures: Array<{ resourceId: string; error: string }> = [];

  // Sort by cleanup order (children before parents)
  const sorted = orphans.sort(
    (a, b) => getCleanupPriority(a.resourceType) - getCleanupPriority(b.resourceType)
  );

  for (const orphan of sorted) {
    console.log(`[cleanup] Deleting orphan: ${orphan.name} (${orphan.resourceType})`);

    const resource: TrackedResource = {
      resourceId: orphan.resourceId,
      resourceType: orphan.resourceType,
      name: orphan.name,
      domain: 'orphans' as TestDomain,
      createdBySession: 'unknown',
      createdByTest: 'unknown',
      createdAt: new Date(),
      parentResourceId: undefined,
      childResources: [],
      status: 'active',
    };

    const result = await deleteMittwaldResource(resource);

    if (result.success) {
      cleaned++;
      console.log(`[cleanup] ✓ Deleted ${orphan.name}`);
    } else {
      failed++;
      failures.push({
        resourceId: orphan.resourceId,
        error: result.error || 'Unknown error',
      });
      console.warn(`[cleanup] ✗ Failed to delete ${orphan.name}: ${result.error}`);
    }
  }

  return {
    domain: 'orphans',
    total: orphans.length,
    cleaned,
    failed,
    failures,
  };
}

/**
 * Cleanup all temp directories
 */
export async function cleanupAllTempDirs(tracker: ResourceTracker): Promise<number> {
  const tempDirs = tracker.getTempDirectories();
  let cleaned = 0;

  for (const dir of tempDirs) {
    try {
      if (existsSync(dir)) {
        await rm(dir, { recursive: true, force: true });
        cleaned++;
      }
      tracker.removeTempDir(dir);
    } catch (err) {
      console.warn(`[cleanup] Failed to remove temp dir ${dir}:`, err);
    }
  }

  return cleaned;
}

/**
 * Export cleanup order for testing
 */
export { CLEANUP_ORDER };
