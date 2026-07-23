import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { handleToolCall } from '../../../src/handlers/tool-handlers.js';
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { MCPToolContext } from '../../../src/types/request-context.js';
import { logger } from '../../../src/utils/logger.js';

// Mock the logger to capture warning messages
vi.mock('../../../src/utils/logger.js', async () => {
  const actual = await vi.importActual<typeof import('../../../src/utils/logger.js')>(
    '../../../src/utils/logger.js'
  );
  return {
    ...actual,
    logger: {
      ...actual.logger,
      warn: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
  };
});

// Mock metrics to avoid metric registration errors
vi.mock('../../../src/metrics/index.js', () => ({
  toolCallsTotal: {
    inc: vi.fn(),
  },
  toolDuration: {
    startTimer: vi.fn(() => vi.fn()),
  },
  memoryPressure: {
    set: vi.fn(),
  },
}));

describe('Disabled Tools Error Handling', () => {
  const mockContext: MCPToolContext = {
    sessionId: 'test-session',
    authInfo: {
      token: 'test-token',
      clientId: 'test-client',
      scopes: ['read'],
      extra: { userId: 'test-user' },
    },
  };

  const warnSpy = vi.mocked(logger.warn);

  beforeEach(() => {
    warnSpy.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('mittwald_org_delete (excluded tool)', () => {
    it('returns a clear error message when calling disabled org/delete tool', async () => {
      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'mittwald_org_delete',
          arguments: {
            organizationId: 'o-12345',
            confirm: true,
          },
        },
      };

      const result = await handleToolCall(request, mockContext);

      // Verify it's an error response
      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      // Parse the response text
      const responseText = result.content[0].text;
      const response = JSON.parse(responseText);

      // Verify error message format
      expect(response.status).toBe('error');
      expect(response.message).toContain('mittwald_org_delete');
      expect(response.message).toContain('disabled for safety reasons');
      expect(response.message).toContain('organization deletion is irreversible');
      expect(response.message).toContain('no org/create tool exists');

      // Verify data structure
      expect(response.data).toBeDefined();
      expect(response.data.toolName).toBe('mittwald_org_delete');
      expect(response.data.reason).toBe('excluded_for_safety');
      expect(response.data.suggestedAction).toContain('contact support');

      // Verify logging occurred
      expect(warnSpy).toHaveBeenCalledWith(
        'Attempted to call disabled tool: mittwald_org_delete',
        expect.objectContaining({
          toolName: 'mittwald_org_delete',
        })
      );
    });
  });

  describe('mittwald_container_run (excluded tool)', () => {
    it('returns a clear error message when calling disabled container_run tool', async () => {
      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'mittwald_container_run',
          arguments: {},
        },
      };

      const result = await handleToolCall(request, mockContext);

      // Verify it's an error response
      expect(result.isError).toBe(true);

      // Parse the response text
      const responseText = result.content[0].text;
      const response = JSON.parse(responseText);

      // Verify error message contains tool name and safety message
      expect(response.status).toBe('error');
      expect(response.message).toContain('mittwald_container_run');
      expect(response.message).toContain('disabled for safety reasons');
      expect(response.message).toContain('interactive');

      // Verify data structure
      expect(response.data.toolName).toBe('mittwald_container_run');
      expect(response.data.reason).toBe('excluded_for_safety');
    });
  });

  describe('removed tools', () => {
    // These tools were removed entirely (interactive logins, local file transfer and
    // local session context); they are unknown rather than excluded.
    it.each([
      'mittwald_login_token',
      'mittwald_login_reset',
      'mittwald_app_upload',
      'mittwald_context_set_session',
    ])('reports %s as an unknown tool', async (toolName) => {
      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: {},
        },
      };

      const result = await handleToolCall(request, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unknown tool');
    });
  });

  describe('non-excluded tool', () => {
    it('does not trigger disabled tool error for regular tools', async () => {
      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'mittwald_org_list',
          arguments: {},
        },
      };

      // This should not return a "disabled" error - it might fail for other reasons
      // but the error should not be about the tool being disabled
      const result = await handleToolCall(request, mockContext);

      // If it's an error, it should NOT be about the tool being disabled
      if (result.isError && result.content[0].text) {
        const responseText = result.content[0].text;
        // Either it's not JSON (a different error) or it doesn't have excluded_for_safety
        try {
          const response = JSON.parse(responseText);
          if (response.data) {
            expect(response.data.reason).not.toBe('excluded_for_safety');
          }
        } catch {
          // Not JSON - different type of error, which is fine
        }
      }
    });
  });
});
