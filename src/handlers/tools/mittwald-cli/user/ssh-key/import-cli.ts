import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { createUserSshKey, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

interface MittwaldUserSshKeyImportArgs {
  quiet?: boolean;
  expires?: string;
  input?: string;
}

function readPublicKey(inputPath?: string): string {
  // Default to ~/.ssh/id_rsa.pub if no input specified
  const defaultPath = resolve(homedir(), '.ssh', 'id_rsa.pub');
  const filePath = inputPath ? resolve(homedir(), '.ssh', inputPath) : defaultPath;

  try {
    return readFileSync(filePath, 'utf-8').trim();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`SSH public key file not found: ${filePath}`);
    }
    throw new Error(`Failed to read SSH public key from ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
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

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  // Check for stdin (not supported in MCP)
  if (args.input === '-' || args.input === '/dev/stdin') {
    return formatToolResponse('error', 'Reading SSH key from stdin is not supported in MCP. Please specify a file path in your ~/.ssh directory.');
  }

  try {
    // Read the public key from file
    const publicKey = readPublicKey(args.input);

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
