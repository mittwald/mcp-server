/**
 * Evidence Collector Tests (WP07)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { EvidenceCollector, type EvidenceCollectorOptions } from '../evidence-collector.js';
import { PlaywrightVerifier } from '../playwright-verifier.js';
import { CurlVerifier } from '../curl-verifier.js';
import { LogPatternVerifier } from '../log-pattern-verifier.js';
import { ApiVerifier, type McpToolCaller } from '../api-verifier.js';
import type { SuccessCriterion } from '../types.js';

describe('EvidenceCollector', () => {
  let collector: EvidenceCollector;
  let tempDir: string;
  let mockPlaywrightVerifier: PlaywrightVerifier;
  let mockCurlVerifier: CurlVerifier;
  let mockLogPatternVerifier: LogPatternVerifier;
  let mockApiVerifier: ApiVerifier;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `evidence-collector-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });

    // Create mock verifiers
    mockPlaywrightVerifier = {
      init: vi.fn().mockResolvedValue(undefined),
      verifyPageContent: vi.fn().mockResolvedValue({
        success: true,
        artifacts: [],
      }),
      close: vi.fn().mockResolvedValue(undefined),
    } as unknown as PlaywrightVerifier;

    mockCurlVerifier = {
      verifyHttp: vi.fn().mockResolvedValue({
        success: true,
        status: 200,
        artifacts: [],
      }),
    } as unknown as CurlVerifier;

    mockLogPatternVerifier = {
      verifyLogPattern: vi.fn().mockResolvedValue({
        success: true,
        matchCount: 1,
        artifacts: [],
      }),
    } as unknown as LogPatternVerifier;

    mockApiVerifier = {
      setToolCaller: vi.fn(),
      verifyApi: vi.fn().mockResolvedValue({
        success: true,
        artifacts: [],
      }),
    } as unknown as ApiVerifier;

    collector = new EvidenceCollector(
      mockPlaywrightVerifier,
      mockCurlVerifier,
      mockLogPatternVerifier,
      mockApiVerifier
    );
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  const baseOptions: EvidenceCollectorOptions = {
    executionId: 'test-exec-001',
    useCaseId: 'test-use-case',
    timestamp: new Date('2025-12-05T10:00:00Z'),
  };

  describe('collect', () => {
    it('creates evidence directory and manifest', async () => {
      const result = await collector.collect([], {
        ...baseOptions,
        evidenceRoot: tempDir,
      });

      expect(result.evidenceDir).toContain('test-use-case');
      expect(result.manifestPath).toContain('manifest.json');

      const manifest = JSON.parse(await readFile(result.manifestPath, 'utf-8'));
      expect(manifest.executionId).toBe('test-exec-001');
      expect(manifest.useCaseId).toBe('test-use-case');
      expect(manifest.allPassed).toBe(true);
    });

    it('evaluates playwright criterion', async () => {
      const criteria: SuccessCriterion[] = [
        {
          description: 'Website loads successfully',
          method: 'playwright',
          config: {
            url: 'https://example.com',
            waitForSelector: 'body',
            expectedText: 'Welcome',
          },
        },
      ];

      const result = await collector.collect(criteria, {
        ...baseOptions,
        evidenceRoot: tempDir,
      });

      expect(mockPlaywrightVerifier.init).toHaveBeenCalled();
      expect(mockPlaywrightVerifier.verifyPageContent).toHaveBeenCalled();
      expect(mockPlaywrightVerifier.close).toHaveBeenCalled();
      expect(result.manifest.criteria[0].passed).toBe(true);
      expect(result.manifest.criteria[0].method).toBe('playwright');
    });

    it('evaluates curl criterion', async () => {
      const criteria: SuccessCriterion[] = [
        {
          description: 'API returns 200',
          method: 'curl',
          config: {
            url: 'https://api.example.com/health',
            expectedStatus: 200,
          },
        },
      ];

      const result = await collector.collect(criteria, {
        ...baseOptions,
        evidenceRoot: tempDir,
      });

      expect(mockCurlVerifier.verifyHttp).toHaveBeenCalled();
      expect(result.manifest.criteria[0].passed).toBe(true);
      expect(result.manifest.criteria[0].method).toBe('curl');
    });

    it('evaluates log-pattern criterion', async () => {
      const sessionLogPath = join(tempDir, 'session.jsonl');
      await writeFile(sessionLogPath, '{"tool": "mw_project_list"}', 'utf-8');

      const criteria: SuccessCriterion[] = [
        {
          description: 'Tool was called',
          method: 'log-pattern',
          config: {
            pattern: 'mw_project_list',
            minOccurrences: 1,
          },
        },
      ];

      const result = await collector.collect(criteria, {
        ...baseOptions,
        evidenceRoot: tempDir,
        sessionLogPath,
      });

      expect(mockLogPatternVerifier.verifyLogPattern).toHaveBeenCalledWith(
        sessionLogPath,
        expect.objectContaining({ pattern: 'mw_project_list' }),
        expect.objectContaining({ criterionIndex: 0 })
      );
      expect(result.manifest.criteria[0].passed).toBe(true);
      expect(result.manifest.criteria[0].method).toBe('log-pattern');
    });

    it('fails log-pattern criterion when sessionLogPath not provided', async () => {
      const criteria: SuccessCriterion[] = [
        {
          description: 'Tool was called',
          method: 'log-pattern',
          config: {
            pattern: 'mw_project_list',
            minOccurrences: 1,
          },
        },
      ];

      const result = await collector.collect(criteria, {
        ...baseOptions,
        evidenceRoot: tempDir,
        // sessionLogPath not provided
      });

      expect(result.manifest.criteria[0].passed).toBe(false);
      expect(result.manifest.criteria[0].error).toContain('sessionLogPath');
    });

    it('evaluates api criterion', async () => {
      const mockToolCaller: McpToolCaller = vi.fn().mockResolvedValue({
        success: true,
        result: { status: 'ok' },
      });

      const criteria: SuccessCriterion[] = [
        {
          description: 'API check passed',
          method: 'api',
          config: {
            tool: 'mw_app_status',
            params: { appId: 'app-123' },
            expectedPattern: 'ok',
          },
        },
      ];

      const result = await collector.collect(criteria, {
        ...baseOptions,
        evidenceRoot: tempDir,
        mcpToolCaller: mockToolCaller,
      });

      expect(mockApiVerifier.setToolCaller).toHaveBeenCalledWith(mockToolCaller);
      expect(mockApiVerifier.verifyApi).toHaveBeenCalled();
      expect(result.manifest.criteria[0].passed).toBe(true);
      expect(result.manifest.criteria[0].method).toBe('api');
    });

    it('handles unsupported verification method', async () => {
      const criteria: SuccessCriterion[] = [
        {
          description: 'Unknown method',
          method: 'unknown' as 'playwright',
          config: {} as never,
        },
      ];

      const result = await collector.collect(criteria, {
        ...baseOptions,
        evidenceRoot: tempDir,
      });

      expect(result.manifest.criteria[0].passed).toBe(false);
      expect(result.manifest.criteria[0].error).toContain('Unsupported verification method');
    });

    it('handles verifier errors gracefully', async () => {
      // Return a failure result instead of rejecting to test error handling
      (mockCurlVerifier.verifyHttp as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        status: undefined,
        artifacts: [],
        error: 'Network failure: ECONNREFUSED',
      });

      const criteria: SuccessCriterion[] = [
        {
          description: 'API check',
          method: 'curl',
          config: {
            url: 'https://broken.example.com',
            expectedStatus: 200,
          },
        },
      ];

      const result = await collector.collect(criteria, {
        ...baseOptions,
        evidenceRoot: tempDir,
      });

      expect(result.manifest.criteria[0].passed).toBe(false);
      expect(result.manifest.criteria[0].error).toContain('Network failure');
    });

    it('sets allPassed to false when any criterion fails', async () => {
      (mockCurlVerifier.verifyHttp as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ success: true, status: 200, artifacts: [] })
        .mockResolvedValueOnce({ success: false, status: 500, artifacts: [], error: 'Server error' });

      const criteria: SuccessCriterion[] = [
        {
          description: 'First check',
          method: 'curl',
          config: { url: 'https://a.example.com', expectedStatus: 200 },
        },
        {
          description: 'Second check',
          method: 'curl',
          config: { url: 'https://b.example.com', expectedStatus: 200 },
        },
      ];

      const result = await collector.collect(criteria, {
        ...baseOptions,
        evidenceRoot: tempDir,
      });

      expect(result.manifest.criteria[0].passed).toBe(true);
      expect(result.manifest.criteria[1].passed).toBe(false);
      expect(result.manifest.allPassed).toBe(false);
    });

    it('evaluates multiple criteria of different types', async () => {
      const sessionLogPath = join(tempDir, 'session.jsonl');
      await writeFile(sessionLogPath, '{"tool": "test"}', 'utf-8');

      const criteria: SuccessCriterion[] = [
        {
          description: 'Playwright check',
          method: 'playwright',
          config: { url: 'https://example.com', expectedText: 'Hello' },
        },
        {
          description: 'Curl check',
          method: 'curl',
          config: { url: 'https://api.example.com', expectedStatus: 200 },
        },
        {
          description: 'Log check',
          method: 'log-pattern',
          config: { pattern: 'test', minOccurrences: 1 },
        },
      ];

      const result = await collector.collect(criteria, {
        ...baseOptions,
        evidenceRoot: tempDir,
        sessionLogPath,
      });

      expect(result.manifest.criteria.length).toBe(3);
      expect(result.manifest.criteria[0].method).toBe('playwright');
      expect(result.manifest.criteria[1].method).toBe('curl');
      expect(result.manifest.criteria[2].method).toBe('log-pattern');
    });
  });

  describe('manifest generation', () => {
    it('generates correct manifest structure', async () => {
      const criteria: SuccessCriterion[] = [
        {
          description: 'Test criterion',
          method: 'curl',
          config: { url: 'https://example.com', expectedStatus: 200 },
        },
      ];

      const result = await collector.collect(criteria, {
        ...baseOptions,
        evidenceRoot: tempDir,
      });

      const manifest = JSON.parse(await readFile(result.manifestPath, 'utf-8'));

      expect(manifest).toEqual({
        executionId: 'test-exec-001',
        useCaseId: 'test-use-case',
        generatedAt: '2025-12-05T10:00:00.000Z',
        evidenceDir: expect.stringContaining('test-use-case'),
        criteria: [
          {
            index: 0,
            description: 'Test criterion',
            method: 'curl',
            passed: true,
            artifacts: [],
          },
        ],
        allPassed: true,
      });
    });

    it('uses timestamp-based directory naming', async () => {
      const result = await collector.collect([], {
        ...baseOptions,
        evidenceRoot: tempDir,
        timestamp: new Date('2025-12-05T14:30:45.123Z'),
      });

      // Directory should contain use case ID and safe timestamp
      expect(result.evidenceDir).toContain('test-use-case');
      expect(result.evidenceDir).toContain('2025-12-05T14-30-45');
    });
  });
});
