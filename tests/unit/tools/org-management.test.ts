import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CliToolError } from '../../../src/tools/error.js';
import { handleOrgListCli } from '../../../src/handlers/tools/mittwald-cli/org/list-cli.js';
import { handleOrgGetCli } from '../../../src/handlers/tools/mittwald-cli/org/get-cli.js';
import { handleOrgDeleteCli } from '../../../src/handlers/tools/mittwald-cli/org/delete-cli.js';
import { handleOrgInviteCli } from '../../../src/handlers/tools/mittwald-cli/org/invite-cli.js';
import { handleOrgMembershipListCli } from '../../../src/handlers/tools/mittwald-cli/org/membership-list-cli.js';
import { handleOrgMembershipListOwnCli } from '../../../src/handlers/tools/mittwald-cli/org/membership-list-own-cli.js';
import { handleOrgMembershipRevokeCli } from '../../../src/handlers/tools/mittwald-cli/org/membership-revoke-cli.js';
import type { CliToolResult } from '../../../src/tools/error.js';

vi.mock('../../../src/tools/index.js', async () => {
  const actual = await vi.importActual<typeof import('../../../src/tools/index.js')>(
    '../../../src/tools/index.js'
  );

  return {
    ...actual,
    invokeCliTool: vi.fn(),
  };
});

const { invokeCliTool } = await import('../../../src/tools/index.js');
const mockInvokeCliTool = invokeCliTool as unknown as vi.MockInstance<Promise<CliToolResult<any>>, any>;

function parseResponse(payload: unknown) {
  return JSON.parse((payload as { content: Array<{ text: string }> }).content?.[0]?.text ?? '{}');
}

describe('Organization management tool handlers', () => {
  beforeEach(() => {
    mockInvokeCliTool.mockReset();
  });

  describe('handleOrgListCli', () => {
    it('lists organizations and formats the table', async () => {
      const cliOutput = JSON.stringify([
        { id: 'o-123', name: 'Acme Corp', role: 'owner', memberCount: 5 },
        { id: 'o-456', name: 'Beta Org', membershipRole: 'member', memberCount: 2 },
      ]);

      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: cliOutput,
        meta: { command: 'mw org list --output json', exitCode: 0, durationMs: 42 },
      });

      const response = await handleOrgListCli({}, {} as any);
      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.data.organizations).toHaveLength(2);
      expect(payload.data.table).toContain('Acme Corp');
      expect(payload.data.table).toContain('Owner');
    });

    it('handles an empty organization list', async () => {
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: JSON.stringify([]),
        meta: { command: 'mw org list --output json', exitCode: 0, durationMs: 10 },
      });

      const response = await handleOrgListCli({}, {} as any);
      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.message).toMatch(/No organizations/);
    });
  });

  describe('handleOrgGetCli', () => {
    it('parses organization details', async () => {
      const cliOutput = JSON.stringify({
        id: 'o-123',
        name: 'Acme Corp',
        description: 'Primary tenant',
        role: 'owner',
        memberCount: 5,
        owner: { id: 'u-1', email: 'owner@example.com', name: 'Owner One' },
      });

      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: cliOutput,
        meta: { command: 'mw org get o-123 --output json', exitCode: 0, durationMs: 18 },
      });

      const response = await handleOrgGetCli({ organizationId: 'o-123' });
      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.data.organization).toMatchObject({
        id: 'o-123',
        name: 'Acme Corp',
        role: 'Owner',
        memberCount: 5,
      });
      expect(payload.data.summary).toContain('Acme Corp');
    });

    it('returns a descriptive error when the organization is missing', async () => {
      mockInvokeCliTool.mockRejectedValueOnce(
        new CliToolError('Not found', {
          kind: 'EXECUTION',
          stderr: 'organization o-missing not found',
          stdout: '',
        })
      );

      const response = await handleOrgGetCli({ organizationId: 'o-missing' });
      const payload = parseResponse(response);

      expect(payload.status).toBe('error');
      expect(payload.message).toMatch(/Organization not found/);
    });
  });

  describe('handleOrgDeleteCli', () => {
    it('requires explicit confirmation', async () => {
      const response = await handleOrgDeleteCli(
        { organizationId: 'o-123', confirm: false },
        { sessionId: 'sess', userId: 'user' } as any
      );
      const payload = parseResponse(response);

      expect(payload.status).toBe('error');
      expect(mockInvokeCliTool).not.toHaveBeenCalled();
    });

    it('deletes an organization when confirmed', async () => {
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: 'o-123\n',
        meta: { command: 'mw org delete o-123 --force --quiet', exitCode: 0, durationMs: 55 },
      });

      const response = await handleOrgDeleteCli(
        { organizationId: 'o-123', confirm: true },
        { sessionId: 'sess', userId: 'user' } as any
      );
      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.data.deleted).toBe(true);
      expect(payload.data.organizationId).toBe('o-123');

      const args = mockInvokeCliTool.mock.calls[0]?.[0];
      expect(args?.argv).toEqual(['org', 'delete', 'o-123', '--force', '--quiet']);
    });
  });

  describe('handleOrgInviteCli', () => {
    it('sends an invitation and returns the invite ID', async () => {
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: 'invite-123\n',
        meta: { command: 'mw org invite --quiet', exitCode: 0, durationMs: 25 },
      });

      const response = await handleOrgInviteCli({
        organizationId: 'o-123',
        email: 'user@example.com',
        role: 'member',
        message: 'Welcome aboard',
        expires: '30d',
      });

      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.data.inviteId).toBe('invite-123');
      expect(payload.data.role).toBe('member');

      const args = mockInvokeCliTool.mock.calls[0]?.[0];
      expect(args?.argv).toContain('--org-id');
      expect(args?.argv).toContain('--email');
      expect(args?.argv).toContain('--role');
      expect(args?.argv).toContain('--quiet');
    });
  });

  describe('handleOrgMembershipListCli', () => {
    it('parses memberships and generates a table', async () => {
      const cliOutput = JSON.stringify([
        {
          id: 'm-1',
          userId: 'u-1',
          email: 'alice@example.com',
          role: 'owner',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ]);

      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: cliOutput,
        meta: { command: 'mw org membership list --output json', exitCode: 0, durationMs: 32 },
      });

      const response = await handleOrgMembershipListCli({ organizationId: 'o-123' });
      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.data.memberships).toHaveLength(1);
      expect(payload.data.table).toContain('alice@example.com');
    });

    it('handles organizations without members', async () => {
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: JSON.stringify([]),
        meta: { command: 'mw org membership list --output json', exitCode: 0, durationMs: 11 },
      });

      const response = await handleOrgMembershipListCli({ organizationId: 'o-123' });
      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.message).toMatch(/No memberships/);
    });
  });

  describe('handleOrgMembershipListOwnCli', () => {
    it('lists memberships for the current user', async () => {
      const cliOutput = JSON.stringify([
        {
          id: 'm-1',
          organization: { id: 'o-123', name: 'Acme Corp' },
          role: 'member',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ]);

      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: cliOutput,
        meta: { command: 'mw org membership list-own --output json', exitCode: 0, durationMs: 15 },
      });

      const response = await handleOrgMembershipListOwnCli({}, {} as any);
      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.data.memberships).toHaveLength(1);
      expect(payload.data.table).toContain('Acme Corp');
    });
  });

  describe('handleOrgMembershipRevokeCli', () => {
    it('revokes a membership and reports success', async () => {
      mockInvokeCliTool.mockResolvedValueOnce({
        ok: true,
        result: 'm-1\n',
        meta: { command: 'mw org membership revoke m-1 --quiet', exitCode: 0, durationMs: 21 },
      });

      const response = await handleOrgMembershipRevokeCli(
        { membershipId: 'm-1', organizationId: 'o-123' },
        { sessionId: 'sess', userId: 'user' } as any
      );
      const payload = parseResponse(response);

      expect(payload.status).toBe('success');
      expect(payload.data.revoked).toBe(true);
      expect(payload.data.membershipId).toBe('m-1');
    });

    it('maps CLI errors to descriptive messages', async () => {
      mockInvokeCliTool.mockRejectedValueOnce(
        new CliToolError('Forbidden', {
          kind: 'EXECUTION',
          stderr: 'permission denied',
          stdout: '',
        })
      );

      const response = await handleOrgMembershipRevokeCli(
        { membershipId: 'm-denied' },
        { sessionId: 'sess', userId: 'user' } as any
      );
      const payload = parseResponse(response);

      expect(payload.status).toBe('error');
      expect(payload.message).toMatch(/Permission denied/);
    });
  });
});
