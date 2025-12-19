import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { getOrganization, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

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
 * Normalizes the organization record emitted by the CLI.
 *
 * @param record - Raw record from CLI JSON.
 * @returns Organization details with consistent property names.
 */
function normalizeOrganizationDetails(record: Record<string, unknown>): OrganizationDetails {
  const id = String(record.customerId ?? record.id ?? record.organizationId ?? 'unknown');
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
 * Handler for the `mittwald_org_get` tool.
 */
export const handleOrgGetCli: MittwaldToolHandler<{ organizationId: string }> = async (args, context) => {
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
    const result = await getOrganization({
      customerId: args.organizationId,
      apiToken: session.mittwaldAccessToken,
    });

    const organization = normalizeOrganizationDetails(result.data as Record<string, unknown>);
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
        durationMs: result.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('[WP06] Unexpected error in org get handler', { error });
    return formatToolResponse(
      'error',
      `Failed to get organization: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
