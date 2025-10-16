import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface OrgMembershipOwnEntry {
  membershipId: string;
  organizationId?: string;
  organizationName?: string;
  role?: string;
  joinedAt?: string;
  status?: string;
}

interface OrgMembershipOwnPayload {
  table: string;
  memberships: OrgMembershipOwnEntry[];
}

/**
 * Parses `mw org membership list-own` JSON output.
 *
 * @param stdout - Raw JSON output from CLI.
 * @returns Normalized membership entries for the current user.
 */
function parseOwnMembershipList(stdout: string): OrgMembershipOwnEntry[] {
  const parsed = JSON.parse(stdout) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('Unexpected CLI output: expected an array of memberships');
  }

  return parsed.map((entry) => normalizeOwnMembershipEntry(entry));
}

/**
 * Normalizes the raw membership entry for the list-own command.
 *
 * @param entry - Raw CLI output entry.
 * @returns Normalized entry for downstream formatting.
 */
function normalizeOwnMembershipEntry(entry: unknown): OrgMembershipOwnEntry {
  const record = (entry ?? {}) as Record<string, unknown>;
  const membershipId = String(record.id ?? record.membershipId ?? 'unknown');

  const organizationRaw = record.organization ?? record.org ?? record.account;
  const organizationRecord = organizationRaw && typeof organizationRaw === 'object'
    ? (organizationRaw as Record<string, unknown>)
    : undefined;

  const organizationId = typeof record.organizationId === 'string'
    ? record.organizationId
    : typeof organizationRecord?.id === 'string'
    ? (organizationRecord.id as string)
    : undefined;
  const organizationName = typeof organizationRecord?.name === 'string'
    ? (organizationRecord.name as string)
    : typeof record.organizationName === 'string'
    ? record.organizationName
    : undefined;

  const roleValue = record.role ?? record.membershipRole ?? record.orgRole ?? record.userRole;
  const role = typeof roleValue === 'string' ? formatRole(roleValue) : undefined;

  const joinedAt = typeof record.createdAt === 'string'
    ? record.createdAt
    : typeof record.joinedAt === 'string'
    ? record.joinedAt
    : undefined;

  const status = typeof record.status === 'string' ? record.status : undefined;

  return {
    membershipId,
    organizationId,
    organizationName,
    role,
    joinedAt,
    status,
  };
}

/**
 * Formats a raw role string into a sentence-case label.
 *
 * @param value - Raw role string from CLI output.
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
 * Builds an ASCII table summarizing memberships for the current user.
 *
 * @param memberships - Normalized membership entries.
 * @returns Table string for display.
 */
function formatOwnMembershipTable(memberships: OrgMembershipOwnEntry[]): string {
  if (memberships.length === 0) {
    return 'No organization memberships found for the authenticated user.';
  }

  const header = ['Organization', 'Role', 'Joined'];
  const rows = memberships.map((membership) => [
    membership.organizationName ?? membership.organizationId ?? 'N/A',
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
 * Maps CLI errors to descriptive messages for the list-own command.
 *
 * @param error - CLI adapter error.
 * @returns Human-readable error message.
 */
function mapCliError(error: CliToolError): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}`.toLowerCase();

  if (error.kind === 'AUTHENTICATION' || combined.includes('unauthorized') || combined.includes('not authenticated')) {
    const details = stderr || stdout || error.message;
    return `Authentication failed when listing memberships for the current user.\nError: ${details}`;
  }

  const details = stderr || stdout || error.message;
  return `Failed to list organization memberships for the current user: ${details}`;
}

/**
 * Handler for the `mittwald_org_membership_list_own` tool.
 */
export const handleOrgMembershipListOwnCli: MittwaldToolHandler<Record<string, never>> = async () => {
  const argv = ['org', 'membership', 'list-own', '--output', 'json'];

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_org_membership_list_own',
      argv,
    });

    const { command, durationMs } = result.meta;
    const rawOutput = result.result ?? '';

    try {
      const memberships = parseOwnMembershipList(rawOutput);
      const table = formatOwnMembershipTable(memberships);
      const message = memberships.length === 0
        ? 'No organization memberships found for the current user.'
        : `Found ${memberships.length} membership(s) for the current user.`;

      const payload: OrgMembershipOwnPayload = {
        table,
        memberships,
      };

      return formatToolResponse('success', message, payload, {
        command,
        durationMs,
      });
    } catch (parseError) {
      const message = parseError instanceof Error ? parseError.message : String(parseError);
      return formatToolResponse(
        'success',
        'Organization memberships retrieved (raw output – parsing failed).',
        {
          rawOutput,
          parseError: message,
        },
        {
          command,
          durationMs,
        }
      );
    }
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return formatToolResponse(
      'error',
      `Failed to execute organization membership list-own command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
