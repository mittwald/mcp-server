import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { listUserSshKeys, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldUserSshKeyListArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

interface RawSshKeyItem {
  id?: string;
  comment?: string;
  fingerprint?: string;
  publicKey?: string;
  createdAt?: string;
  expiresAt?: string;
  [key: string]: unknown;
}

function buildCliArgs(args: MittwaldUserSshKeyListArgs): string[] {
  const argv = ['user', 'ssh-key', 'list', '--output', 'json'];

  if (args.extended) argv.push('--extended');
  if (args.noHeader) argv.push('--no-header');
  if (args.noTruncate) argv.push('--no-truncate');
  if (args.noRelativeDates) argv.push('--no-relative-dates');
  if (args.csvSeparator && args.output === 'csv') {
    argv.push('--csv-separator', args.csvSeparator);
  }

  return argv;
}

function parseSshKeyList(stdout: string): RawSshKeyItem[] {
  const trimmed = stdout.trim();
  if (!trimmed) return [];

  const lines = trimmed.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || (!line.startsWith('[') && !line.startsWith('{'))) continue;

    let snippet = line;
    for (let j = i + 1; j < lines.length; j++) {
      snippet += '\n' + lines[j];
      try {
        const parsed = JSON.parse(snippet);
        if (Array.isArray(parsed)) {
          return parsed as RawSshKeyItem[];
        }
      } catch {
        // Continue accumulating until JSON parses successfully
      }
    }

    const parsed = JSON.parse(snippet);
    if (Array.isArray(parsed)) {
      return parsed as RawSshKeyItem[];
    }
  }

  const parsed = JSON.parse(trimmed);
  if (Array.isArray(parsed)) {
    return parsed as RawSshKeyItem[];
  }

  throw new Error('Unexpected output format from CLI command');
}

function mapCliError(error: CliToolError): string {
  const stdout = error.stdout ?? '';
  const stderr = error.stderr ?? '';
  const rawMessage = stderr || stdout || error.message;
  return `Failed to list SSH keys: ${rawMessage}`;
}

export const handleUserSshKeyListCli: MittwaldCliToolHandler<MittwaldUserSshKeyListArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_user_ssh_key_list',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await listUserSshKeys({
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_user_ssh_key_list',
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_user_ssh_key_list',
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated) - data is array directly
    const keys = validation.libraryOutput.data as any[];

    if (!keys || keys.length === 0) {
      return formatToolResponse(
        'success',
        'No SSH keys found',
        [],
        {
          durationMs: validation.libraryOutput.durationMs,
          validationPassed: validation.passed,
          cliDuration: validation.cliOutput.durationMs,
          libraryDuration: validation.libraryOutput.durationMs,
        }
      );
    }

    const formatted = keys.map((key) => ({
      id: key.id,
      comment: key.comment,
      fingerprint: key.fingerprint,
      publicKey: key.publicKey,
      createdAt: key.createdAt,
      expiresAt: key.expiresAt,
      ...key,
    }));

    return formatToolResponse(
      'success',
      `Found ${keys.length} SSH key(s)`,
      formatted,
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
      const message = mapCliError(error);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP04] Unexpected error in user ssh key list handler', { error });
    return formatToolResponse('error', `Failed to list SSH keys: ${error instanceof Error ? error.message : String(error)}`);
  }
};
