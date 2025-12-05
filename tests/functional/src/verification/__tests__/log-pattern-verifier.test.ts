/**
 * Log Pattern Verifier Tests (WP07)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { LogPatternVerifier } from '../log-pattern-verifier.js';

describe('LogPatternVerifier', () => {
  let verifier: LogPatternVerifier;
  let tempDir: string;

  beforeEach(async () => {
    verifier = new LogPatternVerifier();
    tempDir = join(tmpdir(), `log-pattern-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('verifyLogPattern', () => {
    it('finds pattern in session log and reports success when minOccurrences met', async () => {
      const logPath = join(tempDir, 'session.jsonl');
      const logContent = [
        '{"type": "tool_call", "tool": "mw_project_list"}',
        '{"type": "tool_result", "result": "project-1234"}',
        '{"type": "tool_call", "tool": "mw_app_create"}',
        '{"type": "message", "content": "Created app successfully"}',
      ].join('\n');
      await writeFile(logPath, logContent, 'utf-8');

      const result = await verifier.verifyLogPattern(
        logPath,
        { pattern: 'mw_project_list', minOccurrences: 1 },
        { criterionIndex: 0 }
      );

      expect(result.success).toBe(true);
      expect(result.matchCount).toBe(1);
    });

    it('fails when pattern not found enough times', async () => {
      const logPath = join(tempDir, 'session.jsonl');
      const logContent = [
        '{"type": "tool_call", "tool": "mw_project_list"}',
        '{"type": "message", "content": "Done"}',
      ].join('\n');
      await writeFile(logPath, logContent, 'utf-8');

      const result = await verifier.verifyLogPattern(
        logPath,
        { pattern: 'mw_project_list', minOccurrences: 3 },
        { criterionIndex: 0 }
      );

      expect(result.success).toBe(false);
      expect(result.matchCount).toBe(1);
      expect(result.error).toContain('found 1 times');
      expect(result.error).toContain('expected at least 3');
    });

    it('matches case-insensitively', async () => {
      const logPath = join(tempDir, 'session.jsonl');
      const logContent = [
        '{"type": "message", "content": "Creating MySQL database"}',
        '{"type": "message", "content": "MYSQL connection established"}',
        '{"type": "message", "content": "mysql server ready"}',
      ].join('\n');
      await writeFile(logPath, logContent, 'utf-8');

      const result = await verifier.verifyLogPattern(
        logPath,
        { pattern: 'mysql', minOccurrences: 3 },
        { criterionIndex: 0 }
      );

      expect(result.success).toBe(true);
      expect(result.matchCount).toBe(3);
    });

    it('creates excerpt artifact when excerptPath provided', async () => {
      const logPath = join(tempDir, 'session.jsonl');
      const excerptPath = join(tempDir, 'excerpt.txt');
      const logContent = '{"type": "tool_call", "tool": "mw_database_create"}';
      await writeFile(logPath, logContent, 'utf-8');

      const result = await verifier.verifyLogPattern(
        logPath,
        { pattern: 'mw_database_create', minOccurrences: 1 },
        { criterionIndex: 2, excerptPath }
      );

      expect(result.success).toBe(true);
      expect(result.artifacts.length).toBe(1);
      expect(result.artifacts[0].type).toBe('log-excerpt');
      expect(result.artifacts[0].path).toBe(excerptPath);
      expect(result.artifacts[0].criterionIndex).toBe(2);
    });

    it('returns matched lines for debugging', async () => {
      const logPath = join(tempDir, 'session.jsonl');
      const logContent = [
        '{"type": "tool_call", "tool": "mw_app_create", "params": {"name": "test"}}',
        '{"type": "message", "content": "other content"}',
        '{"type": "tool_call", "tool": "mw_app_create", "params": {"name": "prod"}}',
      ].join('\n');
      await writeFile(logPath, logContent, 'utf-8');

      const result = await verifier.verifyLogPattern(
        logPath,
        { pattern: 'mw_app_create', minOccurrences: 1 },
        { criterionIndex: 0 }
      );

      expect(result.matchedLines).toBeDefined();
      expect(result.matchedLines?.length).toBe(2);
      expect(result.matchedLines?.[0]).toContain('mw_app_create');
    });

    it('handles file not found error gracefully', async () => {
      const result = await verifier.verifyLogPattern(
        '/nonexistent/path/session.jsonl',
        { pattern: 'test', minOccurrences: 1 },
        { criterionIndex: 0 }
      );

      expect(result.success).toBe(false);
      expect(result.matchCount).toBe(0);
      expect(result.error).toBeDefined();
    });

    it('supports regex patterns', async () => {
      const logPath = join(tempDir, 'session.jsonl');
      const logContent = [
        '{"tool": "mw_project_list", "result": "project-abc123"}',
        '{"tool": "mw_app_list", "result": "app-def456"}',
        '{"tool": "other_tool", "result": "data"}',
      ].join('\n');
      await writeFile(logPath, logContent, 'utf-8');

      const result = await verifier.verifyLogPattern(
        logPath,
        { pattern: 'mw_\\w+_list', minOccurrences: 2 },
        { criterionIndex: 0 }
      );

      expect(result.success).toBe(true);
      expect(result.matchCount).toBe(2);
    });
  });

  describe('findPatterns', () => {
    it('finds multiple patterns and returns counts', async () => {
      const logPath = join(tempDir, 'session.jsonl');
      const logContent = [
        '{"tool": "mw_project_list"}',
        '{"tool": "mw_app_create"}',
        '{"tool": "mw_project_list"}',
        '{"tool": "mw_database_create"}',
      ].join('\n');
      await writeFile(logPath, logContent, 'utf-8');

      const results = await verifier.findPatterns(logPath, [
        'mw_project_list',
        'mw_app_create',
        'mw_database_create',
        'nonexistent_pattern',
      ]);

      expect(results.get('mw_project_list')).toBe(2);
      expect(results.get('mw_app_create')).toBe(1);
      expect(results.get('mw_database_create')).toBe(1);
      expect(results.get('nonexistent_pattern')).toBe(0);
    });

    it('returns empty map on file error', async () => {
      const results = await verifier.findPatterns('/nonexistent/path.jsonl', ['pattern']);

      expect(results.size).toBe(0);
    });
  });
});
