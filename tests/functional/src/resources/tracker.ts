/**
 * Resource Tracker - Track Created Resources for Cleanup (T027, T031, T034)
 *
 * Records all resources created during testing to enable proper cleanup.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { ResourceCreateOptions, CleanupResult, IResourceTracker, TrackedResource, ResourceType, TestDomain, TrackedResourceStatus } from '../types/index.js';
import { getTempDirPath } from './naming.js';

/**
 * Default tracker state file path
 */
const DEFAULT_TRACKER_PATH = 'output/resources.json';

/**
 * Tracker state file format
 */
interface TrackerState {
  resources: TrackedResource[];
  tempDirectories: string[];
  lastUpdated: string;
}

/**
 * Test execution context for clean-room vs harness-assisted modes (T034)
 */
export interface TestContext {
  mode: 'clean-room' | 'harness-assisted';
  projectId?: string;
  serverId?: string;
  organizationId?: string;
  databaseId?: string;
  appId?: string;
}

/**
 * Resource tracker implementation
 */
export class ResourceTracker implements IResourceTracker {
  private readonly trackerPath: string;
  private state: TrackerState;

  constructor(trackerPath: string = DEFAULT_TRACKER_PATH) {
    this.trackerPath = trackerPath;
    this.state = this.loadState();
  }

  /**
   * Load tracker state from file
   */
  private loadState(): TrackerState {
    if (!existsSync(this.trackerPath)) {
      return {
        resources: [],
        tempDirectories: [],
        lastUpdated: new Date().toISOString(),
      };
    }

    try {
      const content = readFileSync(this.trackerPath, 'utf-8');
      return JSON.parse(content) as TrackerState;
    } catch {
      console.warn('[tracker] Failed to load state, starting fresh');
      return {
        resources: [],
        tempDirectories: [],
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Save tracker state to file (atomic write pattern)
   */
  private saveState(): void {
    this.state.lastUpdated = new Date().toISOString();

    // Ensure directory exists
    const dir = dirname(this.trackerPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Atomic write: write to temp file, then rename
    const tempPath = `${this.trackerPath}.tmp.${randomUUID()}`;
    writeFileSync(tempPath, JSON.stringify(this.state, null, 2), 'utf-8');
    renameSync(tempPath, this.trackerPath);
  }

  /**
   * Track a newly created resource (T027)
   */
  async track(resource: ResourceCreateOptions): Promise<void> {
    const trackedResource: TrackedResource = {
      resourceId: resource.resourceId,
      resourceType: resource.resourceType as ResourceType,
      name: resource.name,
      domain: resource.domain as TestDomain,
      createdBySession: resource.sessionId,
      createdByTest: resource.testId,
      createdAt: new Date(),
      parentResourceId: resource.parentResourceId,
      childResources: [],
      status: 'active',
    };

    // Update parent's child list if applicable
    if (resource.parentResourceId) {
      const parent = this.state.resources.find((r) => r.resourceId === resource.parentResourceId);
      if (parent) {
        parent.childResources.push(resource.resourceId);
      }
    }

    this.state.resources.push(trackedResource);
    this.saveState();
  }

  /**
   * Get all resources for a domain
   */
  async getByDomain(domain: string): Promise<ResourceCreateOptions[]> {
    return this.state.resources
      .filter((r) => r.domain === domain && r.status === 'active')
      .map((r) => ({
        resourceId: r.resourceId,
        resourceType: r.resourceType,
        name: r.name,
        domain: r.domain,
        sessionId: r.createdBySession,
        testId: r.createdByTest,
        parentResourceId: r.parentResourceId,
      }));
  }

  /**
   * Mark a resource as cleaned
   */
  async markCleaned(resourceId: string): Promise<void> {
    const resource = this.state.resources.find((r) => r.resourceId === resourceId);
    if (resource) {
      resource.status = 'cleaned';
      this.saveState();
    }
  }

  /**
   * Mark a resource cleanup as failed
   */
  async markCleanupFailed(resourceId: string): Promise<void> {
    const resource = this.state.resources.find((r) => r.resourceId === resourceId);
    if (resource) {
      resource.status = 'cleanup-failed';
      this.saveState();
    }
  }

  /**
   * Cleanup all resources for a domain (stub - actual cleanup in cleanup.ts)
   */
  async cleanupDomain(_domain: string): Promise<CleanupResult> {
    // This is a stub - actual cleanup logic is in cleanup.ts
    // This interface method exists for IResourceTracker compliance
    throw new Error('Use cleanupDomain from cleanup.ts instead');
  }

  /**
   * Create and track a temporary directory (T031)
   */
  async createTempDir(domain: string): Promise<string> {
    const tempDir = getTempDirPath(domain);
    await mkdir(tempDir, { recursive: true });

    if (!this.state.tempDirectories.includes(tempDir)) {
      this.state.tempDirectories.push(tempDir);
      this.saveState();
    }

    return tempDir;
  }

  /**
   * Get tracked temp directories
   */
  getTempDirectories(): string[] {
    return [...this.state.tempDirectories];
  }

  /**
   * Remove temp directory from tracking
   */
  removeTempDir(path: string): void {
    this.state.tempDirectories = this.state.tempDirectories.filter((d) => d !== path);
    this.saveState();
  }

  /**
   * Get all resources with a specific status
   */
  getByStatus(status: TrackedResourceStatus): TrackedResource[] {
    return this.state.resources.filter((r) => r.status === status);
  }

  /**
   * Get all tracked resource names (for collision detection)
   */
  getAllNames(): Set<string> {
    return new Set(this.state.resources.map((r) => r.name));
  }

  /**
   * Get tracker state (for debugging)
   */
  getState(): TrackerState {
    return { ...this.state };
  }

  /**
   * Create context for clean-room mode (T034)
   * No pre-existing resources provided
   */
  createCleanRoomContext(): TestContext {
    return {
      mode: 'clean-room',
    };
  }

  /**
   * Create context for harness-assisted mode (T034)
   * Provides pre-created resource IDs
   */
  createHarnessAssistedContext(resources: { projectId?: string; serverId?: string; organizationId?: string; databaseId?: string; appId?: string }): TestContext {
    return {
      mode: 'harness-assisted',
      ...resources,
    };
  }
}

/**
 * Create a resource tracker instance
 */
export function createResourceTracker(trackerPath?: string): ResourceTracker {
  return new ResourceTracker(trackerPath);
}
