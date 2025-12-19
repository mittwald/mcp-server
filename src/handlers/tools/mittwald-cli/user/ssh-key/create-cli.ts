import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { createUserSshKey, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

interface MittwaldUserSshKeyCreateArgs {
  publicKey?: string;  // Optional - will generate if not provided
  quiet?: boolean;
  expires?: string;
  output?: string;
  noPassphrase?: boolean;
  comment?: string;
  description?: string;
}

/**
 * Generates a new SSH key pair locally and returns the public key.
 */
function generateSshKey(comment?: string, passphrase?: string): string {
  const keyName = `mcp-eval-key-${Date.now()}`;
  const tmpDir = tmpdir();
  const keyPath = join(tmpDir, keyName);

  try {
    // Generate ed25519 key (modern, secure, small)
    const passphraseFlag = passphrase ? `-N "${passphrase}"` : '-N ""';
    const commentFlag = comment ? `-C "${comment}"` : `-C "mcp-generated-key"`;

    execSync(`ssh-keygen -t ed25519 -f "${keyPath}" ${passphraseFlag} ${commentFlag}`, {
      stdio: 'pipe',
    });

    // Read the public key
    const publicKey = readFileSync(`${keyPath}.pub`, 'utf-8').trim();

    // Clean up the private key (we only need public for import)
    unlinkSync(keyPath);
    unlinkSync(`${keyPath}.pub`);

    return publicKey;
  } catch (error) {
    logger.error('Failed to generate SSH key', { error });
    throw new Error(`Failed to generate SSH key: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export const handleUserSshKeyCreateCli: MittwaldCliToolHandler<MittwaldUserSshKeyCreateArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  // Generate key if publicKey not provided
  let publicKey = args.publicKey;
  let keyGenerated = false;

  if (!publicKey) {
    try {
      const passphrase = args.noPassphrase ? undefined : 'default-passphrase';
      publicKey = generateSshKey(args.comment || args.description, passphrase);
      keyGenerated = true;
      logger.info('Generated SSH key locally for import');
    } catch (error) {
      return formatToolResponse('error', `Failed to generate SSH key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await createUserSshKey({
      publicKey: publicKey!,
      comment: args.comment || args.description,
      expiresAt: args.expires,
      apiToken: session.mittwaldAccessToken,
    });

    const sshKey = result.data as any;
    const message = keyGenerated
      ? 'SSH key generated and imported successfully'
      : 'SSH key imported successfully';

    return formatToolResponse(
      'success',
      message,
      {
        sshKeyId: sshKey?.id,
        publicKey: keyGenerated ? '[generated - not returned for security]' : publicKey,
        keyGenerated,
        comment: args.comment || args.description,
        expiresAt: args.expires,
        fingerprint: sshKey?.fingerprint,
      },
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

    logger.error('[WP06] Unexpected error in user ssh key create handler', { error });
    return formatToolResponse('error', `Failed to create SSH key: ${error instanceof Error ? error.message : String(error)}`);
  }
};
