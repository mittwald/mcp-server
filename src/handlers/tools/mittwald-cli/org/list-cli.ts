import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { listOrganizations, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface OrganizationListItem {
  id: string;
  name: string;
  role: string;
  shortId?: string;
  memberCount?: number;
}

/**
 * Converts a raw CLI object into a normalized organization list entry.
 *
 * @param entry - Arbitrary CLI object describing an organization.
 * @returns Normalized organization details.
 */
function normalizeOrganizationEntry(entry: unknown): OrganizationListItem {
  const record = (entry ?? {}) as Record<string, unknown>;

  const id = String(record.id ?? record.orgId ?? record.organizationId ?? 'unknown');
  const name = String(record.name ?? record.title ?? 'Unnamed Organization');
  const roleValue = record.role ?? record.membershipRole ?? record.userRole ?? 'member';
  const role = typeof roleValue === 'string' ? roleValue : 'member';

  const memberCountRaw = record.memberCount ?? record.membersCount ?? record.membershipCount;
  const memberCount = typeof memberCountRaw === 'number' ? memberCountRaw : undefined;
  const shortId = typeof record.shortId === 'string' ? record.shortId : undefined;

  return {
    id,
    name,
    role: formatRole(role),
    memberCount,
    shortId,
  };
}

/**
 * Formats a role value into a user-friendly label.
 *
 * @param value - Raw role string returned by the CLI.
 * @returns Formatted role label.
 */
function formatRole(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return 'Member';
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * Creates an ASCII table representation of the organization list.
 *
 * @param organizations - Normalized organizations.
 * @returns Formatted table string.
 */
function formatOrganizationTable(organizations: OrganizationListItem[]): string {
  if (organizations.length === 0) {
    return 'No organizations found.';
  }

  const header = ['ID', 'Name', 'Role'];
  const rows = organizations.map((org) => [org.id, org.name, org.role]);
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
 * Handler for the `mittwald_org_list` tool.
 */
export const handleOrgListCli: MittwaldCliToolHandler<Record<string, never>> = async (args, context) => {
  const effectiveSessionId = context?.sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await listOrganizations({
      apiToken: session.mittwaldAccessToken,
    });

    const organizations = (result.data as any[]).map((org) => normalizeOrganizationEntry(org));

    const table = formatOrganizationTable(organizations);
    const message = organizations.length === 0
      ? 'No organizations found.'
      : `Found ${organizations.length} organization(s).`;

    const payload = {
      table,
      organizations,
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

    logger.error('[WP06] Unexpected error in org list handler', { error });
    return formatToolResponse(
      'error',
      `Failed to list organizations: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
