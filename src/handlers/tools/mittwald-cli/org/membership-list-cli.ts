import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { listOrgMemberships, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface OrgMembershipListArgs {
  organizationId: string;
}

interface OrgMembershipEntry {
  membershipId: string;
  userId?: string;
  email?: string;
  role?: string;
  joinedAt?: string;
  organizationId?: string;
  status?: string;
}

interface OrgMembershipListPayload {
  table: string;
  memberships: OrgMembershipEntry[];
}

/**
 * Normalizes an individual membership entry from the CLI output.
 *
 * @param entry - Raw CLI output entry.
 * @returns Normalized membership object.
 */
function normalizeMembershipEntry(entry: unknown): OrgMembershipEntry {
  const record = (entry ?? {}) as Record<string, unknown>;
  const membershipId = String(record.id ?? record.membershipId ?? 'unknown');

  const userRaw = record.user ?? record.account ?? record.member;
  const userRecord = userRaw && typeof userRaw === 'object'
    ? (userRaw as Record<string, unknown>)
    : undefined;

  const userId = typeof record.userId === 'string'
    ? record.userId
    : typeof userRecord?.id === 'string'
    ? (userRecord.id as string)
    : typeof userRecord?.userId === 'string'
    ? (userRecord.userId as string)
    : undefined;

  const email = typeof record.email === 'string'
    ? record.email
    : typeof userRecord?.email === 'string'
    ? (userRecord.email as string)
    : undefined;
  const roleValue = record.role ?? record.orgRole ?? record.membershipRole ?? record.userRole;
  const role = typeof roleValue === 'string' ? formatRole(roleValue) : undefined;
  const joinedAt = typeof record.createdAt === 'string'
    ? record.createdAt
    : typeof record.joinedAt === 'string'
    ? record.joinedAt
    : undefined;
  const organizationId = typeof record.organizationId === 'string' ? record.organizationId : undefined;
  const status = typeof record.status === 'string' ? record.status : undefined;

  return {
    membershipId,
    userId,
    email,
    role,
    joinedAt,
    organizationId,
    status,
  };
}

/**
 * Formats a raw role value into a sentence-case label.
 *
 * @param value - Raw role string from the CLI.
 * @returns Formatted role string.
 */
function formatRole(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return 'Member';
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * Builds an ASCII table with membership summary columns.
 *
 * @param memberships - Normalized membership entries.
 * @returns Formatted table string.
 */
function formatMembershipTable(memberships: OrgMembershipEntry[]): string {
  if (memberships.length === 0) {
    return 'No members found for this organization.';
  }

  const header = ['User ID', 'Email', 'Role', 'Joined'];
  const rows = memberships.map((membership) => [
    membership.userId ?? 'N/A',
    membership.email ?? 'N/A',
    membership.role ?? 'N/A',
    membership.joinedAt ?? 'N/A',
  ]);
  const allRows = [header, ...rows];
  const columnWidths = header.map((_, columnIndex) =>
    Math.max(...allRows.map((row) => row[columnIndex].length))
  );

  return allRows
    .map((row, rowIndex) => {
      const line = row
        .map((cell, columnIndex) => cell.padEnd(columnWidths[columnIndex], ' '))
        .join(' | ');
      if (rowIndex === 0) {
        const separator = columnWidths
          .map((width) => '-'.repeat(width))
          .join('-+-');
        return `${line}\n${separator}`;
      }
      return line;
    })
    .join('\n');
}

/**
 * Handler for the `mittwald_org_membership_list` tool.
 */
export const handleOrgMembershipListCli: MittwaldToolHandler<OrgMembershipListArgs> = async (args, context) => {
  if (!args.organizationId) {
    return formatToolResponse('error', 'Parameter "organizationId" is required.');
  }

  const effectiveSessionId = context?.sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await listOrgMemberships({
      customerId: args.organizationId,
      apiToken: session.mittwaldAccessToken,
    });

    const memberships = (result.data as any[]).map((m) => normalizeMembershipEntry(m));

    const table = formatMembershipTable(memberships);
    const message = memberships.length === 0
      ? `No memberships found for organization ${args.organizationId}.`
      : `Found ${memberships.length} membership(s) for organization ${args.organizationId}.`;

    const payload: OrgMembershipListPayload = {
      table,
      memberships,
    };

    return formatToolResponse('success', message, payload, {
      durationMs: result.durationMs,
    });
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('[WP06] Unexpected error in org membership list handler', { error });
    return formatToolResponse(
      'error',
      `Failed to list organization memberships: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
