import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { createUserSshKey, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldUserSshKeyImportArgs {
  publicKey: string; // REQUIRED - SSH public key content
  quiet?: boolean;
  expires?: string;
}

function parseExpiresInterval(expires?: string): string | undefined {
  if (!expires) return undefined;

  // Convert interval format (30m, 30d, 1y) to ISO 8601 datetime
  const now = new Date();
  const match = expires.match(/^(\d+)([mhdwy])$/i);

  if (!match) {
    throw new Error(`Invalid expires format: ${expires}. Use format like: 30m, 30d, 1y`);
  }

  const [, amount, unit] = match;
  const value = parseInt(amount, 10);

  switch (unit.toLowerCase()) {
    case 'm': // minutes
      now.setMinutes(now.getMinutes() + value);
      break;
    case 'h': // hours
      now.setHours(now.getHours() + value);
      break;
    case 'd': // days
      now.setDate(now.getDate() + value);
      break;
    case 'w': // weeks
      now.setDate(now.getDate() + value * 7);
      break;
    case 'y': // years
      now.setFullYear(now.getFullYear() + value);
      break;
    default:
      throw new Error(`Invalid expires unit: ${unit}. Use m, h, d, w, or y`);
  }

  return now.toISOString();
}

export const handleUserSshKeyImportCli: MittwaldCliToolHandler<MittwaldUserSshKeyImportArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.publicKey) {
    return formatToolResponse(
      'error',
      'publicKey parameter is required. The MCP server runs on Fly.io with no persistent filesystem. Provide the SSH public key content directly as a string parameter.'
    );
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const publicKey = args.publicKey.trim();

    // Parse expires interval to ISO 8601 datetime
    const expiresAt = parseExpiresInterval(args.expires);

    const result = await createUserSshKey({
      publicKey,
      expiresAt,
      apiToken: session.mittwaldAccessToken,
    });

    const data = result.data as Record<string, unknown>;

    if (args.quiet) {
      const keyId = data.id as string;
      if (!keyId) {
        return formatToolResponse('error', 'Failed to import SSH key - no key ID returned');
      }

      return formatToolResponse(
        'success',
        keyId,
        {
          keyId,
          expires: args.expires,
          input: args.input,
        },
        {
          durationMs: result.durationMs,
        }
      );
    }

    const message = `SSH key imported successfully${args.expires ? ` (expires in ${args.expires})` : ''}`;
    return formatToolResponse(
      'success',
      message,
      {
        keyId: data.id,
        expires: args.expires,
        expiresAt: data.expiresAt,
        input: args.input,
        fingerprint: data.fingerprint,
        publicKey: data.publicKey,
      },
      {
        durationMs: result.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', `Failed to import SSH key: ${error.message}`, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('[WP06] Unexpected error in user ssh key import handler', { error });
    return formatToolResponse('error', `Failed to import SSH key: ${error instanceof Error ? error.message : String(error)}`);
  }
};
