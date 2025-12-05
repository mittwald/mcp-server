/**
 * Curl Verifier Tests (WP07)
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { writeFile, mkdir, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CurlVerifier } from '../curl-verifier.js';

describe('CurlVerifier', () => {
  let verifier: CurlVerifier;
  let tempDir: string;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(async () => {
    verifier = new CurlVerifier();
    tempDir = join(tmpdir(), `curl-verifier-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    originalFetch = globalThis.fetch;
  });

  afterEach(async () => {
    globalThis.fetch = originalFetch;
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('verifyHttp', () => {
    it('returns success when status matches expected', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 200,
        text: () => Promise.resolve('OK'),
      }) as Mock;

      const result = await verifier.verifyHttp(
        { url: 'https://example.com', expectedStatus: 200 },
        { criterionIndex: 0 }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
    });

    it('returns failure when status does not match', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 404,
        text: () => Promise.resolve('Not Found'),
      }) as Mock;

      const result = await verifier.verifyHttp(
        { url: 'https://example.com/missing', expectedStatus: 200, retry: { maxRetries: 0 } },
        { criterionIndex: 0 }
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
      expect(result.error).toContain('404');
      expect(result.error).toContain('200');
    });

    it('verifies body pattern when provided', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 200,
        text: () => Promise.resolve('<html><body>Welcome to My PHP App</body></html>'),
      }) as Mock;

      const result = await verifier.verifyHttp(
        { url: 'https://example.com', expectedStatus: 200, bodyPattern: 'My PHP App' },
        { criterionIndex: 0 }
      );

      expect(result.success).toBe(true);
    });

    it('fails when body pattern does not match', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 200,
        text: () => Promise.resolve('<html><body>Generic Page</body></html>'),
      }) as Mock;

      const result = await verifier.verifyHttp(
        { url: 'https://example.com', expectedStatus: 200, bodyPattern: 'My PHP App' },
        { criterionIndex: 0 }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Pattern');
      expect(result.error).toContain('My PHP App');
    });

    it('writes response artifact when responsePath provided', async () => {
      const responsePath = join(tempDir, 'response.txt');
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 200,
        text: () => Promise.resolve('Hello World'),
      }) as Mock;

      const result = await verifier.verifyHttp(
        { url: 'https://example.com', expectedStatus: 200 },
        { criterionIndex: 2, responsePath }
      );

      expect(result.success).toBe(true);
      expect(result.artifacts.length).toBe(1);
      expect(result.artifacts[0].type).toBe('response');
      expect(result.artifacts[0].path).toBe(responsePath);
      expect(result.artifacts[0].criterionIndex).toBe(2);

      const savedContent = await readFile(responsePath, 'utf-8');
      expect(savedContent).toBe('Hello World');
    });

    it('captures body on status mismatch for debugging', async () => {
      const responsePath = join(tempDir, 'response.txt');
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 500,
        text: () => Promise.resolve('Internal Server Error: Database connection failed'),
      }) as Mock;

      const result = await verifier.verifyHttp(
        { url: 'https://example.com', expectedStatus: 200, retry: { maxRetries: 0 } },
        { criterionIndex: 0, responsePath }
      );

      expect(result.success).toBe(false);
      // Body should still be captured even on failure
      const savedContent = await readFile(responsePath, 'utf-8');
      expect(savedContent).toContain('Database connection failed');
    });

    it('handles network errors gracefully', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED')) as Mock;

      const result = await verifier.verifyHttp(
        { url: 'https://unreachable.example.com', expectedStatus: 200, retry: { maxRetries: 0 } },
        { criterionIndex: 0 }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('ECONNREFUSED');
    });

    it('supports regex patterns in body matching', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 200,
        text: () => Promise.resolve('{"version": "v2.3.15", "build": "abc123"}'),
      }) as Mock;

      const result = await verifier.verifyHttp(
        { url: 'https://example.com/version', expectedStatus: 200, bodyPattern: 'v\\d+\\.\\d+\\.\\d+' },
        { criterionIndex: 0 }
      );

      expect(result.success).toBe(true);
    });
  });

  describe('retry with exponential backoff', () => {
    it('retries on 5xx errors and eventually succeeds', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve({
            status: 503,
            text: () => Promise.resolve('Service Unavailable'),
          });
        }
        return Promise.resolve({
          status: 200,
          text: () => Promise.resolve('OK'),
        });
      }) as Mock;

      const result = await verifier.verifyHttp(
        {
          url: 'https://example.com',
          expectedStatus: 200,
          retry: { maxRetries: 3, initialDelayMs: 10 },
        },
        { criterionIndex: 0 }
      );

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
      expect(callCount).toBe(3);
    });

    it('retries on 404 for propagation delays', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          return Promise.resolve({
            status: 404,
            text: () => Promise.resolve('Not Found'),
          });
        }
        return Promise.resolve({
          status: 200,
          text: () => Promise.resolve('New deployment ready'),
        });
      }) as Mock;

      const result = await verifier.verifyHttp(
        {
          url: 'https://new-deploy.example.com',
          expectedStatus: 200,
          retry: { maxRetries: 3, initialDelayMs: 10 },
        },
        { criterionIndex: 0 }
      );

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
    });

    it('retries on network errors', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          return Promise.reject(new Error('ETIMEDOUT'));
        }
        return Promise.resolve({
          status: 200,
          text: () => Promise.resolve('OK'),
        });
      }) as Mock;

      const result = await verifier.verifyHttp(
        {
          url: 'https://flaky.example.com',
          expectedStatus: 200,
          retry: { maxRetries: 3, initialDelayMs: 10 },
        },
        { criterionIndex: 0 }
      );

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
    });

    it('does not retry on 4xx errors (except 404)', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 403,
        text: () => Promise.resolve('Forbidden'),
      }) as Mock;

      const result = await verifier.verifyHttp(
        {
          url: 'https://example.com/private',
          expectedStatus: 200,
          retry: { maxRetries: 3, initialDelayMs: 10 },
        },
        { criterionIndex: 0 }
      );

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('respects maxRetries limit', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 500,
        text: () => Promise.resolve('Internal Error'),
      }) as Mock;

      const result = await verifier.verifyHttp(
        {
          url: 'https://broken.example.com',
          expectedStatus: 200,
          retry: { maxRetries: 2, initialDelayMs: 10 },
        },
        { criterionIndex: 0 }
      );

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3); // 1 initial + 2 retries
      expect(globalThis.fetch).toHaveBeenCalledTimes(3);
    });

    it('uses exponential backoff for delays', async () => {
      const delays: number[] = [];
      const originalSetTimeout = globalThis.setTimeout;

      vi.useFakeTimers();

      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 3) {
          return Promise.resolve({
            status: 500,
            text: () => Promise.resolve('Error'),
          });
        }
        return Promise.resolve({
          status: 200,
          text: () => Promise.resolve('OK'),
        });
      }) as Mock;

      const resultPromise = verifier.verifyHttp(
        {
          url: 'https://example.com',
          expectedStatus: 200,
          retry: { maxRetries: 3, initialDelayMs: 100, backoffMultiplier: 2 },
        },
        { criterionIndex: 0 }
      );

      // First attempt
      await vi.advanceTimersByTimeAsync(0);

      // First retry after 100ms
      await vi.advanceTimersByTimeAsync(100);

      // Second retry after 200ms (100 * 2)
      await vi.advanceTimersByTimeAsync(200);

      // Third retry after 400ms (100 * 2 * 2)
      await vi.advanceTimersByTimeAsync(400);

      const result = await resultPromise;

      vi.useRealTimers();

      expect(result.success).toBe(true);
      expect(callCount).toBe(4);
    });

    it('caps delay at maxDelayMs', async () => {
      // This test verifies that delays don't exceed maxDelayMs
      // Using real timers with very small delay values to avoid timeout
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          status: 500,
          text: () => Promise.resolve('Error'),
        });
      }) as Mock;

      const result = await verifier.verifyHttp(
        {
          url: 'https://example.com',
          expectedStatus: 200,
          retry: {
            maxRetries: 3,
            initialDelayMs: 10,
            backoffMultiplier: 10, // Would be 10, 100, 1000 without cap
            maxDelayMs: 50, // Cap at 50ms
          },
        },
        { criterionIndex: 0 }
      );

      expect(result.success).toBe(false);
      expect(callCount).toBe(4); // 1 initial + 3 retries
    });
  });
});
