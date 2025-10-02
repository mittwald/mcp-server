import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface OrganizationOwner {
  id?: string;
  email?: string;
  name?: string;
}

interface OrganizationDetails {
  id: string;
  shortId?: string;
  name?: string;
  description?: string;
  role?: string;
  memberCount?: number;
  createdAt?: string;
  updatedAt?: string;
  owner?: OrganizationOwner;
}

interface OrganizationDetailsPayload {
  summary: string;
  organization: OrganizationDetails;
}

/**
 * Parses and normalizes the CLI output for `mw org get`.
 *
 * @param stdout - Raw CLI stdout.
 * @returns Normalized organization details.
 */
function parseOrganizationDetails(stdout: string): OrganizationDetails {
  const parsed = JSON.parse(stdout) as unknown;
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Unexpected CLI output: expected an organization object');
  }

  return normalizeOrganizationDetails(parsed as Record<string, unknown>);
}

/**
 * Normalizes the organization record emitted by the CLI.
 *
 * @param record - Raw record from CLI JSON.
 * @returns Organization details with consistent property names.
 */
function normalizeOrganizationDetails(record: Record<string, unknown>): OrganizationDetails {
  const id = String(record.id ?? record.orgId ?? record.organizationId ?? 'unknown');
  const name = typeof record.name === 'string' ? record.name : undefined;
  const description = typeof record.description === 'string' ? record.description : undefined;
  const shortId = typeof record.shortId === 'string' ? record.shortId : undefined;
  const membershipRole = typeof record.role === 'string'
    ? record.role
    : typeof record.membershipRole === 'string'
    ? record.membershipRole
    : typeof record.userRole === 'string'
    ? record.userRole
    : undefined;
  const role = membershipRole ? formatRole(membershipRole) : undefined;

  const memberCountRaw = record.memberCount ?? record.membersCount ?? record.membershipCount;
  const memberCount = typeof memberCountRaw === 'number' ? memberCountRaw : undefined;
  const createdAt = typeof record.createdAt === 'string' ? record.createdAt : undefined;
  const updatedAt = typeof record.updatedAt === 'string' ? record.updatedAt : undefined;
  const owner = extractOwner(record);

  return {
    id,
    shortId,
    name,
    description,
    role,
    memberCount,
    createdAt,
    updatedAt,
    owner,
  };
}

/**
 * Formats an organization role into a human-readable label.
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
 * Extracts owner information from the CLI record, if available.
 *
 * @param record - Raw organization record.
 * @returns Normalized owner information.
 */
function extractOwner(record: Record<string, unknown>): OrganizationOwner | undefined {
  const owner = record.owner ?? record.orgOwner ?? record.accountOwner;
  if (!owner || typeof owner !== 'object') {
    return undefined;
  }

  const ownerRecord = owner as Record<string, unknown>;
  const user = ownerRecord.user ?? ownerRecord.account ?? ownerRecord.person;
  const userRecord = (user ?? {}) as Record<string, unknown>;

  const id = typeof ownerRecord.id === 'string'
    ? ownerRecord.id
    : typeof userRecord.id === 'string'
    ? userRecord.id
    : undefined;
  const email = typeof ownerRecord.email === 'string'
    ? ownerRecord.email
    : typeof userRecord.email === 'string'
    ? userRecord.email
    : undefined;
  const name = typeof ownerRecord.name === 'string'
    ? ownerRecord.name
    : typeof userRecord.name === 'string'
    ? userRecord.name
    : undefined;

  return {
    id,
    email,
    name,
  };
}

/**
 * Formats organization details into a readable summary block.
 *
 * @param details - Normalized organization details.
 * @returns Multi-line summary string.
 */
function formatOrganizationSummary(details: OrganizationDetails): string {
  const lines = [
    `Name       : ${details.name ?? 'Unknown'}`,
    `ID         : ${details.id}`,
    `Short ID   : ${details.shortId ?? 'N/A'}`,
    `Role       : ${details.role ?? 'N/A'}`,
    `Members    : ${details.memberCount ?? 'N/A'}`,
    `Created At : ${details.createdAt ?? 'N/A'}`,
    `Updated At : ${details.updatedAt ?? 'N/A'}`,
  ];

  if (details.owner) {
    const ownerParts = [details.owner.name, details.owner.email, details.owner.id].filter(Boolean).join(' - ');
    lines.push(`Owner      : ${ownerParts || 'N/A'}`);
  }

  return lines.join('\n');
}

/**
 * Maps CLI execution errors to descriptive messages.
 *
 * @param error - CLI adapter error.
 * @param organizationId - Requested organization identifier.
 * @returns Human-readable error message.
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
    return `Authentication failed when retrieving organization ${organizationId}.\nError: ${details}`;
  }

  if (combined.includes('forbidden') || combined.includes('permission denied')) {
    const details = stderr || stdout || error.message;
    return `Permission denied while retrieving organization ${organizationId}.\nError: ${details}`;
  }

  const details = stderr || stdout || error.message;
  return `Failed to retrieve organization ${organizationId}: ${details}`;
}

/**
 * Handler for the `mittwald_org_get` tool.
 */
export const handleOrgGetCli: MittwaldToolHandler<{ organizationId: string }> = async (args) => {
  if (!args.organizationId) {
    return formatToolResponse('error', 'Parameter "organizationId" is required.');
  }

  const argv = ['org', 'get', args.organizationId, '--output', 'json'];

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_org_get',
      argv,
    });

    const { command, durationMs } = result.meta;
    const rawOutput = result.result ?? '';

    try {
      const organization = parseOrganizationDetails(rawOutput);
      const summary = formatOrganizationSummary(organization);
      const payload: OrganizationDetailsPayload = {
        summary,
        organization,
      };

      return formatToolResponse(
        'success',
        `Organization ${organization.name ?? organization.id} retrieved successfully.`,
        payload,
        {
          command,
          durationMs,
        }
      );
    } catch (parseError) {
      const message = parseError instanceof Error ? parseError.message : String(parseError);
      return formatToolResponse(
        'success',
        'Organization retrieved (raw output – parsing failed).',
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
      `Failed to execute organization get command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
