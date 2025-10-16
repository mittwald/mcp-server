import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

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
 * Parses the JSON output produced by `mw org membership list`.
 *
 * @param stdout - Raw JSON string.
 * @returns Normalized membership entries.
 */
function parseMembershipList(stdout: string): OrgMembershipEntry[] {
  const parsed = JSON.parse(stdout) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('Unexpected CLI output: expected an array of memberships');
  }

  return parsed.map((entry) => normalizeMembershipEntry(entry));
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
 * Maps CLI errors to descriptive membership list messages.
 *
 * @param error - CLI adapter error.
 * @param organizationId - Requested organization identifier.
 * @returns Human-readable message.
 */
function mapCliError(error: CliToolError, organizationId: string): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}`.toLowerCase();

  if (combined.includes('not found')) {
    const details = stderr || stdout || error.message;
    return `Organization not found: ${organizationId}.\nError: ${details}`;
  }

  if (error.kind === 'AUTHENTICATION' || combined.includes('unauthorized') || combined.includes('not authenticated')) {
    const details = stderr || stdout || error.message;
    return `Authentication failed when listing memberships for ${organizationId}.\nError: ${details}`;
  }

  if (combined.includes('permission denied') || combined.includes('forbidden')) {
    const details = stderr || stdout || error.message;
    return `Permission denied when listing memberships for ${organizationId}.\nError: ${details}`;
  }

  const details = stderr || stdout || error.message;
  return `Failed to list organization memberships: ${details}`;
}

/**
 * Handler for the `mittwald_org_membership_list` tool.
 */
export const handleOrgMembershipListCli: MittwaldToolHandler<OrgMembershipListArgs> = async (args) => {
  if (!args.organizationId) {
    return formatToolResponse('error', 'Parameter "organizationId" is required.');
  }

  const argv = ['org', 'membership', 'list', '--org-id', args.organizationId, '--output', 'json'];

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_org_membership_list',
      argv,
    });

    const { command, durationMs } = result.meta;
    const rawOutput = result.result ?? '';

    try {
      const memberships = parseMembershipList(rawOutput);
      const table = formatMembershipTable(memberships);
      const message = memberships.length === 0
        ? `No memberships found for organization ${args.organizationId}.`
        : `Found ${memberships.length} membership(s) for organization ${args.organizationId}.`;

      const payload: OrgMembershipListPayload = {
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
      const message = mapCliError(error, args.organizationId);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return formatToolResponse(
      'error',
      `Failed to execute organization membership list command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
