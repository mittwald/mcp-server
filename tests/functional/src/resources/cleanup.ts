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
 * Find orphaned test resources (T033)
 * Resources matching test-* pattern but not in tracker
 */
export async function findOrphans(_tracker: ResourceTracker): Promise<string[]> {
  // This requires querying Mittwald API for all resources
  // and comparing against tracker state
  // For now, return empty - full implementation requires MCP queries

  // TODO: Query each resource type via mw CLI:
  // mw project list --output json
  // mw app list --output json
  // etc.

  // Then filter by isTestResource(name) and check against tracker

  console.warn('[cleanup] Orphan detection not yet implemented');
  return [];
}

/**
 * Cleanup orphaned resources by name pattern
 */
export async function cleanupOrphans(resourceNames: string[]): Promise<CleanupResult> {
  const orphanResources = resourceNames.filter(isTestResource);

  let cleaned = 0;
  let failed = 0;
  const failures: Array<{ resourceId: string; error: string }> = [];

  for (const name of orphanResources) {
    // Would need to look up resource ID by name
    // For now, just log
    console.log(`[cleanup] Would clean orphan: ${name}`);
    // In full implementation:
    // 1. Query resource by name
    // 2. Get resource ID
    // 3. Delete using deleteMittwaldResource
  }

  return {
    domain: 'orphans',
    total: orphanResources.length,
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
