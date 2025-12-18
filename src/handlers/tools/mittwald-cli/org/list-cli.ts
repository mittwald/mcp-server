import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { listOrganizations, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
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

interface OrganizationListPayload {
  table: string;
  organizations: OrganizationListItem[];
}

/**
 * Parses the JSON output of the `mw org list --output json` command.
 *
 * @param stdout - Raw JSON string emitted by the CLI.
 * @returns A normalized list of organizations accessible to the user.
 */
function parseOrgListOutput(stdout: string): OrganizationListItem[] {
  const parsed = JSON.parse(stdout) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('Unexpected CLI output: expected an array of organizations');
  }

  return parsed.map((entry) => normalizeOrganizationEntry(entry));
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
 * Maps a CLI execution error into a user-friendly message.
 *
 * @param error - Error thrown by the CLI adapter.
 * @returns Human-readable error message.
 */
function mapCliError(error: CliToolError): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}`.toLowerCase();

  if (error.kind === 'AUTHENTICATION' || combined.includes('unauthorized') || combined.includes('not authenticated')) {
    const details = stderr || stdout || error.message;
    return `Authentication failed when listing organizations. Re-authenticate with Mittwald and try again.\nError: ${details}`;
  }

  if (combined.includes('forbidden') || combined.includes('permission denied')) {
    const details = stderr || stdout || error.message;
    return `Permission denied while listing organizations. Ensure you have access rights.\nError: ${details}`;
  }

  const details = stderr || stdout || error.message;
  return `Failed to list organizations: ${details}`;
}

/**
 * Handler for the `mittwald_org_list` tool.
 */
export const handleOrgListCli: MittwaldToolHandler<Record<string, never>> = async (args, context) => {
  const effectiveSessionId = context?.sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = ['org', 'list', '--output', 'json'];

  try {
    // WP05: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_org_list',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await listOrganizations({
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_org_list',
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_org_list',
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated) - data is array directly
    const organizations = (validation.libraryOutput.data as any[]).map((org) => normalizeOrganizationEntry(org));

    const table = formatOrganizationTable(organizations);
    const message = organizations.length === 0
      ? 'No organizations found.'
      : `Found ${organizations.length} organization(s).`;

    const payload: OrganizationListPayload = {
      table,
      organizations,
    };

    return formatToolResponse('success', message, payload, {
      durationMs: validation.libraryOutput.durationMs,
      validationPassed: validation.passed,
      discrepancyCount: validation.discrepancies.length,
      cliDuration: validation.cliOutput.durationMs,
      libraryDuration: validation.libraryOutput.durationMs,
    });
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    if (error instanceof CliToolError) {
      const message = mapCliError(error);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP05] Unexpected error in org list handler', { error });
    return formatToolResponse(
      'error',
      `Failed to list organizations: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
