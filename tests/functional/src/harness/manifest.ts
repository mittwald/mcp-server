/**
 * Manifest Manager - JSONL Test Result Storage
 *
 * Append-only manifest for test results with concurrent-safe writes.
 * Implements FR-005 (result recording) and FR-020 (coverage statistics).
 */

import { appendFileSync, readFileSync, existsSync, mkdirSync, openSync, closeSync } from 'node:fs';
import { dirname } from 'node:path';
import type { ManifestAppendOptions, CoverageReport, IManifestManager, ManifestEntry, TestDomain } from '../types/index.js';
import { HARNESS_VERSION } from './index.js';

/**
 * Default manifest file path
 */
const DEFAULT_MANIFEST_PATH = 'output/manifest.jsonl';

/**
 * Validate status value
 */
function isValidStatus(status: string): status is ManifestEntry['status'] {
  return ['passed', 'failed', 'timeout', 'interrupted'].includes(status);
}

/**
 * Manifest manager implementation (T021-T024, T026)
 */
export class ManifestManager implements IManifestManager {
  private readonly manifestPath: string;

  constructor(manifestPath: string = DEFAULT_MANIFEST_PATH) {
    this.manifestPath = manifestPath;
    this.ensureDirectory();
  }

  /**
   * Ensure output directory exists
   */
  private ensureDirectory(): void {
    const dir = dirname(this.manifestPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Append a test result to the manifest (T021, T022, T026)
   *
   * Uses atomic append pattern for concurrent safety.
   * POSIX guarantees atomic writes for data < PIPE_BUF (~4KB).
   * Our entries are ~500 bytes, so concurrent appends are safe.
   */
  async append(entry: ManifestAppendOptions): Promise<void> {
    // Validate status (T022)
    if (!isValidStatus(entry.status)) {
      throw new Error(`Invalid status: ${entry.status}`);
    }

    // Build full manifest entry (T022)
    const manifestEntry: ManifestEntry = {
      toolName: entry.toolName,
      sessionId: entry.sessionId,
      testId: entry.testId,
      status: entry.status,
      timestamp: new Date().toISOString(),
      durationMs: entry.durationMs,
      toolCallCount: entry.toolCallCount,
      domain: entry.domain as TestDomain,
      harnessVersion: HARNESS_VERSION,
    };

    if (entry.errorMessage) {
      manifestEntry.errorMessage = entry.errorMessage;
    }

    // Atomic append (T021, T026)
    const line = JSON.stringify(manifestEntry) + '\n';
    const fd = openSync(this.manifestPath, 'a');
    try {
      appendFileSync(fd, line, { encoding: 'utf-8' });
    } finally {
      closeSync(fd);
    }
  }

  /**
   * Get coverage statistics (T023)
   *
   * @param knownTools - Array of all known tool names for calculating untested
   */
  async getCoverage(knownTools?: string[]): Promise<CoverageReport> {
    const entries = await this.readAllEntries();

    // Build map of tool -> latest status (by timestamp)
    const toolStatus = new Map<string, { status: ManifestEntry['status']; timestamp: string }>();

    for (const entry of entries) {
      const existing = toolStatus.get(entry.toolName);
      if (!existing || entry.timestamp > existing.timestamp) {
        toolStatus.set(entry.toolName, { status: entry.status, timestamp: entry.timestamp });
      }
    }

    // Calculate statistics
    const testedTools = toolStatus.size;
    let passedTools = 0;
    let failedTools = 0;

    for (const { status } of toolStatus.values()) {
      if (status === 'passed') {
        passedTools++;
      } else {
        failedTools++;
      }
    }

    // Calculate untested tools
    const testedToolNames = new Set(toolStatus.keys());
    const untestedTools = knownTools ? knownTools.filter((t) => !testedToolNames.has(t)) : [];

    // Total tools = tested + untested (if known) or just tested
    const totalTools = knownTools ? knownTools.length : testedTools;

    // Calculate coverage percentage
    const coverage = totalTools > 0 ? (testedTools / totalTools) * 100 : 0;

    return {
      totalTools,
      testedTools,
      passedTools,
      failedTools,
      untestedTools,
      coverage,
    };
  }

  /**
   * Get all test entries for a specific tool (T024)
   */
  async getToolHistory(toolName: string): Promise<ManifestAppendOptions[]> {
    const entries = await this.readAllEntries();

    return entries
      .filter((e) => e.toolName === toolName)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map((e) => ({
        toolName: e.toolName,
        sessionId: e.sessionId,
        testId: e.testId,
        status: e.status,
        durationMs: e.durationMs,
        toolCallCount: e.toolCallCount,
        domain: e.domain,
        errorMessage: e.errorMessage,
      }));
  }

  /**
   * Read all entries from manifest file
   */
  private async readAllEntries(): Promise<ManifestEntry[]> {
    if (!existsSync(this.manifestPath)) {
      return [];
    }

    const content = readFileSync(this.manifestPath, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim());

    const entries: ManifestEntry[] = [];
    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as ManifestEntry;
        entries.push(entry);
      } catch {
        console.warn('[manifest] Skipping malformed line:', line.substring(0, 50));
      }
    }

    return entries;
  }

  /**
   * Get the manifest file path
   */
  getManifestPath(): string {
    return this.manifestPath;
  }

  /**
   * Check if manifest file exists
   */
  exists(): boolean {
    return existsSync(this.manifestPath);
  }

  /**
   * Get count of entries in manifest
   */
  async getEntryCount(): Promise<number> {
    const entries = await this.readAllEntries();
    return entries.length;
  }
}

/**
 * Create a manifest manager instance
 */
export function createManifestManager(manifestPath?: string): ManifestManager {
  return new ManifestManager(manifestPath);
}

/**
 * Concurrent append test utility (T026)
 * Tests that parallel writes don't corrupt the manifest
 */
export async function testConcurrentAppend(manager: ManifestManager, numEntries: number, numWorkers: number): Promise<{ success: boolean; entriesWritten: number; errors: string[] }> {
  const entriesPerWorker = Math.ceil(numEntries / numWorkers);
  const errors: string[] = [];

  const workers = Array.from({ length: numWorkers }, (_, workerIdx) => {
    return (async () => {
      const start = workerIdx * entriesPerWorker;
      const end = Math.min(start + entriesPerWorker, numEntries);

      for (let i = start; i < end; i++) {
        try {
          await manager.append({
            toolName: `test_tool_${i}`,
            sessionId: `session_${i}`,
            testId: `test_${i}`,
            status: 'passed',
            durationMs: 100 + i,
            toolCallCount: 1,
            domain: 'identity',
          });
        } catch (err) {
          errors.push(`Worker ${workerIdx}, entry ${i}: ${err instanceof Error ? err.message : 'unknown error'}`);
        }
      }
    })();
  });

  await Promise.all(workers);

  const count = await manager.getEntryCount();

  return {
    success: count === numEntries && errors.length === 0,
    entriesWritten: count,
    errors,
  };
}
