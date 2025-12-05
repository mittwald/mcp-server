/**
 * API Verifier Tests (WP07)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeFile, mkdir, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ApiVerifier, type McpToolCaller } from '../api-verifier.js';

describe('ApiVerifier', () => {
  let verifier: ApiVerifier;
  let tempDir: string;

  beforeEach(async () => {
    verifier = new ApiVerifier();
    tempDir = join(tmpdir(), `api-verifier-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('verifyApi', () => {
    it('returns error when no tool caller is configured', async () => {
      const result = await verifier.verifyApi(
        { tool: 'mw_project_list', params: {}, expectedPattern: 'project' },
        { criterionIndex: 0 }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('no MCP tool caller configured');
    });

    it('calls the configured tool caller with correct parameters', async () => {
      const mockCaller: McpToolCaller = vi.fn().mockResolvedValue({
        success: true,
        result: { projects: ['project-123', 'project-456'] },
      });

      verifier.setToolCaller(mockCaller);

      await verifier.verifyApi(
        {
          tool: 'mw_project_list',
          params: { customerId: 'cust-001' },
          expectedPattern: 'project',
        },
        { criterionIndex: 0 }
      );

      expect(mockCaller).toHaveBeenCalledWith('mw_project_list', { customerId: 'cust-001' });
    });

    it('returns success when pattern matches result', async () => {
      const mockCaller: McpToolCaller = vi.fn().mockResolvedValue({
        success: true,
        result: { id: 'app-abc123', name: 'my-php-app', status: 'running' },
      });

      verifier.setToolCaller(mockCaller);

      const result = await verifier.verifyApi(
        { tool: 'mw_app_get', params: { appId: 'app-abc123' }, expectedPattern: 'my-php-app' },
        { criterionIndex: 0 }
      );

      expect(result.success).toBe(true);
      expect(result.toolResult).toEqual({ id: 'app-abc123', name: 'my-php-app', status: 'running' });
    });

    it('returns failure when pattern does not match', async () => {
      const mockCaller: McpToolCaller = vi.fn().mockResolvedValue({
        success: true,
        result: { databases: [] },
      });

      verifier.setToolCaller(mockCaller);

      const result = await verifier.verifyApi(
        { tool: 'mw_database_list', params: {}, expectedPattern: 'mysql-prod' },
        { criterionIndex: 0 }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Pattern 'mysql-prod' not found");
    });

    it('returns failure when tool call fails', async () => {
      const mockCaller: McpToolCaller = vi.fn().mockResolvedValue({
        success: false,
        result: null,
        error: 'Authentication failed',
      });

      verifier.setToolCaller(mockCaller);

      const result = await verifier.verifyApi(
        { tool: 'mw_app_create', params: {}, expectedPattern: 'created' },
        { criterionIndex: 0 }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication failed');
    });

    it('writes response artifact when responsePath provided', async () => {
      const responsePath = join(tempDir, 'response.json');
      const mockCaller: McpToolCaller = vi.fn().mockResolvedValue({
        success: true,
        result: { status: 'healthy', uptime: 3600 },
      });

      verifier.setToolCaller(mockCaller);

      const result = await verifier.verifyApi(
        { tool: 'mw_app_status', params: {}, expectedPattern: 'healthy' },
        { criterionIndex: 1, responsePath }
      );

      expect(result.success).toBe(true);
      expect(result.artifacts.length).toBe(1);
      expect(result.artifacts[0].type).toBe('response');
      expect(result.artifacts[0].path).toBe(responsePath);
      expect(result.artifacts[0].criterionIndex).toBe(1);

      const savedContent = JSON.parse(await readFile(responsePath, 'utf-8'));
      expect(savedContent.tool).toBe('mw_app_status');
      expect(savedContent.result).toEqual({ status: 'healthy', uptime: 3600 });
      expect(savedContent.matched).toBe(true);
    });

    it('supports regex patterns for matching', async () => {
      const mockCaller: McpToolCaller = vi.fn().mockResolvedValue({
        success: true,
        result: { version: 'PHP 8.2.15' },
      });

      verifier.setToolCaller(mockCaller);

      const result = await verifier.verifyApi(
        { tool: 'mw_app_info', params: {}, expectedPattern: 'PHP \\d+\\.\\d+' },
        { criterionIndex: 0 }
      );

      expect(result.success).toBe(true);
    });

    it('handles string results correctly', async () => {
      const mockCaller: McpToolCaller = vi.fn().mockResolvedValue({
        success: true,
        result: 'Successfully deployed app to production',
      });

      verifier.setToolCaller(mockCaller);

      const result = await verifier.verifyApi(
        { tool: 'mw_app_deploy', params: {}, expectedPattern: 'Successfully deployed' },
        { criterionIndex: 0 }
      );

      expect(result.success).toBe(true);
    });

    it('handles tool caller throwing an error', async () => {
      const mockCaller: McpToolCaller = vi.fn().mockRejectedValue(new Error('Network timeout'));

      verifier.setToolCaller(mockCaller);

      const result = await verifier.verifyApi(
        { tool: 'mw_project_list', params: {}, expectedPattern: 'project' },
        { criterionIndex: 0 }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network timeout');
    });
  });
});
