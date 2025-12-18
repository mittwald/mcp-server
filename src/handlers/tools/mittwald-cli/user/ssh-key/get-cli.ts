import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { getUserSshKey, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldUserSshKeyGetArgs {
  keyId: string;
  output?: 'txt' | 'json' | 'yaml';
}

interface RawSshKey {
  id?: string;
  comment?: string;
  fingerprint?: string;
  publicKey?: string;
  createdAt?: string;
  expiresAt?: string;
  [key: string]: unknown;
}

function buildCliArgs(keyId: string): string[] {
  return ['user', 'ssh-key', 'get', keyId, '--output', 'json'];
}

function parseSshKey(stdout: string): RawSshKey {
  const trimmed = stdout.trim();
  if (!trimmed) {
    throw new Error('CLI returned empty output.');
  }

  const lines = trimmed.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || (!line.startsWith('{') && !line.startsWith('['))) continue;

    let snippet = line;
    for (let j = i + 1; j < lines.length; j++) {
      snippet += '\n' + lines[j];
      try {
        const parsed = JSON.parse(snippet);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as RawSshKey;
        }
      } catch {
        // continue collecting
      }
    }

    const parsed = JSON.parse(snippet);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as RawSshKey;
    }
  }

  const parsed = JSON.parse(trimmed);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as RawSshKey;
  }

  throw new Error('Unexpected output format from CLI command');
}

function mapCliError(error: CliToolError, keyId: string): string {
  const stdout = error.stdout ?? '';
  const stderr = error.stderr ?? '';
  const combined = `${stdout}\n${stderr}`.toLowerCase();

  if (combined.includes('not found') || combined.includes('no ssh key found')) {
    return `SSH key not found: ${keyId}.\nError: ${stderr || error.message}`;
  }

  const rawMessage = stderr || stdout || error.message;
  return `Failed to get SSH key: ${rawMessage}`;
}

export const handleUserSshKeyGetCli: MittwaldCliToolHandler<MittwaldUserSshKeyGetArgs> = async (args, sessionId) => {
  if (!args.keyId || !args.keyId.trim()) {
    return formatToolResponse('error', 'SSH key ID is required.');
  }

  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args.keyId);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_user_ssh_key_get',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await getUserSshKey({
          sshKeyId: args.keyId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_user_ssh_key_get',
        keyId: args.keyId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_user_ssh_key_get',
        keyId: args.keyId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const key = validation.libraryOutput.data as Record<string, unknown>;
    const formattedData = {
      id: key.id,
      comment: key.comment,
      fingerprint: key.fingerprint,
      publicKey: key.publicKey,
      createdAt: key.createdAt,
      expiresAt: key.expiresAt,
      ...key,
    };

    return formatToolResponse(
      'success',
      `SSH key information retrieved for ${args.keyId}`,
      formattedData,
      {
        durationMs: validation.libraryOutput.durationMs,
        validationPassed: validation.passed,
        discrepancyCount: validation.discrepancies.length,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    if (error instanceof CliToolError) {
      const message = mapCliError(error, args.keyId);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP04] Unexpected error in user ssh key get handler', { error });
    return formatToolResponse('error', `Failed to get SSH key: ${error instanceof Error ? error.message : String(error)}`);
  }
};
