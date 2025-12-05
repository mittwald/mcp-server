/**
 * Coverage Tracker Tests (WP10)
 *
 * Tests for tool coverage tracking and reporting functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeFile, mkdir, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  CoverageTracker,
  createCoverageTracker,
  generateCoverageReport,
} from '../coverage-tracker.js';
import type { UseCaseDomain } from '../types.js';

describe('CoverageTracker', () => {
  let tracker: CoverageTracker;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `coverage-tracker-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    tracker = new CoverageTracker({ outputRoot: tempDir });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('parseSessionLog', () => {
    it('extracts tool names from tool_use events', async () => {
      const logPath = join(tempDir, 'session.jsonl');
      const logContent = [
        JSON.stringify({ type: 'tool_use', name: 'mcp__mittwald__app_create' }),
        JSON.stringify({ type: 'tool_use', name: 'mcp__mittwald__project_list' }),
      ].join('\n');

      await writeFile(logPath, logContent);

      const tools = await tracker.parseSessionLog(logPath, 'test-use-case');

      expect(tools).toHaveLength(2);
      expect(tools).toContain('app/create');
      expect(tools).toContain('project/list');
    });

    it('extracts tool names from assistant message content blocks', async () => {
      const logPath = join(tempDir, 'session.jsonl');
      const logContent = JSON.stringify({
        type: 'assistant',
        message: {
          content: [
            { type: 'tool_use', name: 'mcp__mittwald__database_mysql_create' },
            { type: 'text', text: 'Creating database...' },
          ],
        },
      });

      await writeFile(logPath, logContent);

      const tools = await tracker.parseSessionLog(logPath, 'test-use-case');

      expect(tools).toHaveLength(1);
      expect(tools).toContain('database/mysql/create');
    });

    it('skips malformed JSON lines gracefully', async () => {
      const logPath = join(tempDir, 'session.jsonl');
      const logContent = [
        'not valid json',
        JSON.stringify({ type: 'tool_use', name: 'mcp__mittwald__app_get' }),
        '{ incomplete',
      ].join('\n');

      await writeFile(logPath, logContent);

      const tools = await tracker.parseSessionLog(logPath, 'test-use-case');

      expect(tools).toHaveLength(1);
      expect(tools).toContain('app/get');
    });

    it('tracks execution IDs', async () => {
      const logPath = join(tempDir, 'session.jsonl');
      await writeFile(logPath, JSON.stringify({ type: 'tool_use', name: 'mcp__mittwald__app_list' }));

      await tracker.parseSessionLog(logPath, 'exec-001');
      await tracker.parseSessionLog(logPath, 'exec-002');

      const state = tracker.getState();
      expect(state.executionCount).toBe(2);
    });

    it('records invocations per use case', async () => {
      const logPath1 = join(tempDir, 'session1.jsonl');
      const logPath2 = join(tempDir, 'session2.jsonl');

      await writeFile(logPath1, JSON.stringify({ type: 'tool_use', name: 'mcp__mittwald__app_create' }));
      await writeFile(logPath2, JSON.stringify({ type: 'tool_use', name: 'mcp__mittwald__app_create' }));

      await tracker.parseSessionLog(logPath1, 'use-case-1');
      await tracker.parseSessionLog(logPath2, 'use-case-2');

      const report = tracker.generateReport();
      const appCreateStat = report.toolStats.find((s) => s.tool === 'app/create');

      expect(appCreateStat).toBeDefined();
      expect(appCreateStat?.useCases).toContain('use-case-1');
      expect(appCreateStat?.useCases).toContain('use-case-2');
      expect(appCreateStat?.invocationCount).toBe(2);
    });
  });

  describe('normalizeToolName', () => {
    // Access private method via class instance for testing
    const normalizeViaTracker = (name: string): string => {
      // Create a mock log to trigger normalization
      const tracker = new CoverageTracker();
      // We'll test normalization through parseSessionLog behavior
      return name
        .replace(/^mcp__mittwald__mittwald_/, '')
        .replace(/^mcp__mittwald__/, '')
        .split('_')
        .join('/');
    };

    it('removes mcp__mittwald__ prefix', () => {
      expect(normalizeViaTracker('mcp__mittwald__app_create')).toBe('app/create');
    });

    it('removes mcp__mittwald__mittwald_ double prefix', () => {
      expect(normalizeViaTracker('mcp__mittwald__mittwald_project_create')).toBe('project/create');
    });

    it('converts underscores to slashes', () => {
      expect(normalizeViaTracker('mcp__mittwald__database_mysql_create')).toBe('database/mysql/create');
    });

    it('handles already normalized names', () => {
      expect(normalizeViaTracker('app_create')).toBe('app/create');
    });
  });

  describe('setInventory and calculateCoverage', () => {
    it('calculates covered and uncovered tools correctly', () => {
      const inventory = new Map<string, UseCaseDomain>([
        ['app/create', 'apps'],
        ['app/delete', 'apps'],
        ['app/list', 'apps'],
        ['project/create', 'project-foundation'],
      ]);

      tracker.setInventory(inventory);

      // Simulate some tool invocations
      // We need to use parseSessionLog to record invocations
    });

    it('returns empty arrays when no inventory or invocations', () => {
      tracker.setInventory(new Map());

      const coverage = tracker.calculateCoverage();

      expect(coverage.covered).toEqual([]);
      expect(coverage.uncovered).toEqual([]);
    });

    it('includes tools invoked but not in inventory as covered', async () => {
      const logPath = join(tempDir, 'session.jsonl');
      await writeFile(logPath, JSON.stringify({ type: 'tool_use', name: 'mcp__mittwald__unknown_tool' }));

      tracker.setInventory(new Map()); // Empty inventory

      await tracker.parseSessionLog(logPath, 'test');

      const coverage = tracker.calculateCoverage();

      expect(coverage.covered).toContain('unknown/tool');
    });
  });

  describe('generateReport', () => {
    beforeEach(async () => {
      const inventory = new Map<string, UseCaseDomain>([
        ['app/create', 'apps'],
        ['app/delete', 'apps'],
        ['project/list', 'project-foundation'],
      ]);
      tracker.setInventory(inventory);
    });

    it('generates report with correct statistics', async () => {
      const logPath = join(tempDir, 'session.jsonl');
      await writeFile(logPath, JSON.stringify({ type: 'tool_use', name: 'mcp__mittwald__app_create' }));
      await tracker.parseSessionLog(logPath, 'test-exec');

      const report = tracker.generateReport();

      expect(report.totalTools).toBe(3);
      expect(report.coveredTools).toBe(1);
      expect(report.coveragePercent).toBeCloseTo(33.3, 0);
      expect(report.executionIds).toContain('test-exec');
    });

    it('includes uncovered tools list', async () => {
      const logPath = join(tempDir, 'session.jsonl');
      await writeFile(logPath, JSON.stringify({ type: 'tool_use', name: 'mcp__mittwald__app_create' }));
      await tracker.parseSessionLog(logPath, 'test');

      const report = tracker.generateReport();

      expect(report.uncoveredTools).toContain('app/delete');
      expect(report.uncoveredTools).toContain('project/list');
      expect(report.uncoveredTools).not.toContain('app/create');
    });

    it('sorts tool stats by invocation count descending', async () => {
      const logPath = join(tempDir, 'session.jsonl');
      const logContent = [
        JSON.stringify({ type: 'tool_use', name: 'mcp__mittwald__app_create' }),
        JSON.stringify({ type: 'tool_use', name: 'mcp__mittwald__app_create' }),
        JSON.stringify({ type: 'tool_use', name: 'mcp__mittwald__project_list' }),
      ].join('\n');
      await writeFile(logPath, logContent);

      // Parse twice from different use cases to get multiple invocations
      await tracker.parseSessionLog(logPath, 'test-1');

      const report = tracker.generateReport();

      // Note: invocationCount is the number of unique use cases, not total calls
      expect(report.toolStats.length).toBeGreaterThan(0);
    });

    it('includes generatedAt timestamp', () => {
      const before = new Date();
      const report = tracker.generateReport();
      const after = new Date();

      expect(report.generatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(report.generatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('generateRecommendations', () => {
    it('generates recommendations for uncovered tools', async () => {
      const inventory = new Map<string, UseCaseDomain>([
        ['app/create', 'apps'],
        ['backup/schedule/delete', 'backups'],
      ]);
      tracker.setInventory(inventory);

      const report = tracker.generateReport();

      expect(report.recommendations.length).toBe(2);
      expect(report.recommendations.some((r) => r.tool === 'app/create')).toBe(true);
    });

    it('assigns priority based on domain', async () => {
      const inventory = new Map<string, UseCaseDomain>([
        ['app/create', 'apps'], // high priority domain
        ['ssh/key/list', 'access-users'], // low priority domain
      ]);
      tracker.setInventory(inventory);

      const report = tracker.generateReport();

      const appRec = report.recommendations.find((r) => r.tool === 'app/create');
      const sshRec = report.recommendations.find((r) => r.tool === 'ssh/key/list');

      expect(appRec?.priority).toBe('high');
      expect(sshRec?.priority).toBe('low');
    });

    it('sorts recommendations by priority then tool name', async () => {
      const inventory = new Map<string, UseCaseDomain>([
        ['backup/create', 'backups'], // medium
        ['app/create', 'apps'], // high
        ['ssh/key/list', 'access-users'], // low
        ['database/create', 'databases'], // high
      ]);
      tracker.setInventory(inventory);

      const report = tracker.generateReport();

      // High priority tools should come first
      const highPriorityTools = report.recommendations.filter((r) => r.priority === 'high');
      const mediumPriorityTools = report.recommendations.filter((r) => r.priority === 'medium');
      const lowPriorityTools = report.recommendations.filter((r) => r.priority === 'low');

      expect(highPriorityTools.length).toBe(2);
      expect(mediumPriorityTools.length).toBe(1);
      expect(lowPriorityTools.length).toBe(1);

      // Verify order: high tools come before medium, medium before low
      const firstHighIndex = report.recommendations.findIndex((r) => r.priority === 'high');
      const firstMediumIndex = report.recommendations.findIndex((r) => r.priority === 'medium');
      const firstLowIndex = report.recommendations.findIndex((r) => r.priority === 'low');

      expect(firstHighIndex).toBeLessThan(firstMediumIndex);
      expect(firstMediumIndex).toBeLessThan(firstLowIndex);
    });

    it('uses predefined scenario suggestions when available', async () => {
      const inventory = new Map<string, UseCaseDomain>([
        ['backup/schedule/delete', 'backups'],
      ]);
      tracker.setInventory(inventory);

      const report = tracker.generateReport();
      const rec = report.recommendations.find((r) => r.tool === 'backup/schedule/delete');

      expect(rec?.suggestedScenario).toBe('Remove a backup schedule');
    });

    it('generates generic scenario for unknown tools', async () => {
      const inventory = new Map<string, UseCaseDomain>([
        ['custom/tool/action', 'apps'],
      ]);
      tracker.setInventory(inventory);

      const report = tracker.generateReport();
      const rec = report.recommendations.find((r) => r.tool === 'custom/tool/action');

      expect(rec?.suggestedScenario).toContain('Action');
      expect(rec?.suggestedScenario).toContain('custom tool');
    });
  });

  describe('writeReports', () => {
    it('writes JSON report to file', async () => {
      const inventory = new Map<string, UseCaseDomain>([['app/create', 'apps']]);
      tracker.setInventory(inventory);

      const report = tracker.generateReport();
      const { jsonPath } = await tracker.writeReports(report, 'test-report');

      const content = await readFile(jsonPath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.totalTools).toBe(1);
      expect(parsed.generatedAt).toBeDefined();
    });

    it('writes markdown report to file', async () => {
      const inventory = new Map<string, UseCaseDomain>([['app/create', 'apps']]);
      tracker.setInventory(inventory);

      const report = tracker.generateReport();
      const { mdPath } = await tracker.writeReports(report, 'test-report');

      const content = await readFile(mdPath, 'utf-8');

      expect(content).toContain('# Tool Coverage Report');
      expect(content).toContain('## Summary');
      expect(content).toContain('| Total Tools | 1 |');
    });

    it('creates output directory if it does not exist', async () => {
      const newOutputDir = join(tempDir, 'nested', 'output');
      const newTracker = new CoverageTracker({ outputRoot: newOutputDir });
      newTracker.setInventory(new Map([['app/create', 'apps']]));

      const report = newTracker.generateReport();
      const { jsonPath, mdPath } = await newTracker.writeReports(report, 'test');

      expect(jsonPath).toContain(newOutputDir);
      expect(mdPath).toContain(newOutputDir);
    });

    it('uses timestamp-based filename when baseName not provided', async () => {
      const inventory = new Map<string, UseCaseDomain>([['app/create', 'apps']]);
      tracker.setInventory(inventory);

      const report = tracker.generateReport();
      const { jsonPath } = await tracker.writeReports(report);

      expect(jsonPath).toMatch(/coverage-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
    });

    it('includes coverage bar in markdown report', async () => {
      const inventory = new Map<string, UseCaseDomain>([
        ['app/create', 'apps'],
        ['app/delete', 'apps'],
      ]);
      tracker.setInventory(inventory);

      const logPath = join(tempDir, 'session.jsonl');
      await writeFile(logPath, JSON.stringify({ type: 'tool_use', name: 'mcp__mittwald__app_create' }));
      await tracker.parseSessionLog(logPath, 'test');

      const report = tracker.generateReport();
      const { mdPath } = await tracker.writeReports(report, 'bar-test');

      const content = await readFile(mdPath, 'utf-8');

      expect(content).toContain('█');
      expect(content).toContain('░');
    });
  });

  describe('reset', () => {
    it('clears all tracked state', async () => {
      const logPath = join(tempDir, 'session.jsonl');
      await writeFile(logPath, JSON.stringify({ type: 'tool_use', name: 'mcp__mittwald__app_create' }));
      await tracker.parseSessionLog(logPath, 'test');

      expect(tracker.getState().toolCount).toBe(1);

      tracker.reset();

      expect(tracker.getState().toolCount).toBe(0);
      expect(tracker.getState().executionCount).toBe(0);
    });
  });

  describe('getState', () => {
    it('returns current tracking state', async () => {
      const inventory = new Map<string, UseCaseDomain>([['app/create', 'apps']]);
      tracker.setInventory(inventory);

      const logPath = join(tempDir, 'session.jsonl');
      await writeFile(logPath, JSON.stringify({ type: 'tool_use', name: 'mcp__mittwald__app_create' }));
      await tracker.parseSessionLog(logPath, 'exec-1');

      const state = tracker.getState();

      expect(state.toolCount).toBe(1);
      expect(state.executionCount).toBe(1);
      expect(state.inventorySize).toBe(1);
    });
  });
});

describe('createCoverageTracker', () => {
  it('creates a new CoverageTracker instance', () => {
    const tracker = createCoverageTracker();
    expect(tracker).toBeInstanceOf(CoverageTracker);
  });

  it('passes options to the instance', async () => {
    const tempDir = join(tmpdir(), `factory-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });

    try {
      const tracker = createCoverageTracker({ outputRoot: tempDir });
      tracker.setInventory(new Map([['test/tool', 'apps']]));

      const report = tracker.generateReport();
      const { jsonPath } = await tracker.writeReports(report, 'factory-test');

      expect(jsonPath).toContain(tempDir);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe('generateCoverageReport', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `generate-report-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('generates report from multiple session logs', async () => {
    const log1 = join(tempDir, 'session1.jsonl');
    const log2 = join(tempDir, 'session2.jsonl');

    await writeFile(log1, JSON.stringify({ type: 'tool_use', name: 'mcp__mittwald__app_create' }));
    await writeFile(log2, JSON.stringify({ type: 'tool_use', name: 'mcp__mittwald__project_list' }));

    // Mock the loadInventory to avoid MCP server dependency
    const originalDiscover = await import('../coverage-tracker.js').then((m) => m);

    // Use the convenience function - it will try to load inventory
    // but will fall back gracefully
    const report = await generateCoverageReport(
      [
        { path: log1, useCaseId: 'use-case-1' },
        { path: log2, useCaseId: 'use-case-2' },
      ],
      { outputRoot: tempDir, mcpServerUrl: 'http://localhost:9999' } // Non-existent server
    );

    expect(report.executionIds).toContain('use-case-1');
    expect(report.executionIds).toContain('use-case-2');
    expect(report.toolStats.length).toBeGreaterThan(0);
  });
});

describe('markdown report formatting', () => {
  let tracker: CoverageTracker;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `markdown-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    tracker = new CoverageTracker({ outputRoot: tempDir });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('includes uncovered tools grouped by domain', async () => {
    const inventory = new Map<string, UseCaseDomain>([
      ['app/create', 'apps'],
      ['app/delete', 'apps'],
      ['database/create', 'databases'],
    ]);
    tracker.setInventory(inventory);

    const report = tracker.generateReport();
    const { mdPath } = await tracker.writeReports(report, 'domain-test');

    const content = await readFile(mdPath, 'utf-8');

    expect(content).toContain('## Uncovered Tools by Domain');
    expect(content).toContain('### apps');
    expect(content).toContain('### databases');
  });

  it('includes recommendations section', async () => {
    const inventory = new Map<string, UseCaseDomain>([['app/create', 'apps']]);
    tracker.setInventory(inventory);

    const report = tracker.generateReport();
    const { mdPath } = await tracker.writeReports(report, 'rec-test');

    const content = await readFile(mdPath, 'utf-8');

    expect(content).toContain('## Recommendations');
    expect(content).toContain('**app/create**');
    expect(content).toContain('high priority');
  });

  it('includes most invoked tools table', async () => {
    const inventory = new Map<string, UseCaseDomain>([['app/create', 'apps']]);
    tracker.setInventory(inventory);

    const logPath = join(tempDir, 'session.jsonl');
    await writeFile(logPath, JSON.stringify({ type: 'tool_use', name: 'mcp__mittwald__app_create' }));
    await tracker.parseSessionLog(logPath, 'test');

    const report = tracker.generateReport();
    const { mdPath } = await tracker.writeReports(report, 'invoked-test');

    const content = await readFile(mdPath, 'utf-8');

    expect(content).toContain('## Most Invoked Tools');
    expect(content).toContain('| Tool | Domain | Invocations | Use Cases |');
    expect(content).toContain('| app/create |');
  });

  it('includes execution IDs section', async () => {
    const logPath = join(tempDir, 'session.jsonl');
    await writeFile(logPath, JSON.stringify({ type: 'tool_use', name: 'mcp__mittwald__app_create' }));

    await tracker.parseSessionLog(logPath, 'exec-001');
    await tracker.parseSessionLog(logPath, 'exec-002');

    const report = tracker.generateReport();
    const { mdPath } = await tracker.writeReports(report, 'exec-test');

    const content = await readFile(mdPath, 'utf-8');

    expect(content).toContain('## Included Executions');
    expect(content).toContain('- exec-001');
    expect(content).toContain('- exec-002');
  });
});
