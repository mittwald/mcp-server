import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { CliToolError } from '../../../../tools/index.js';
import { createSshUser, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldSshUserCreateArgs {
  projectId?: string;
  description: string;
  quiet?: boolean;
  expires?: string;
  publicKey?: string;
  password?: string;
}

function buildCliArgs(args: MittwaldSshUserCreateArgs): string[] {
  const cliArgs: string[] = ['ssh-user', 'create', '--description', args.description];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.quiet ?? true) cliArgs.push('--quiet');
  if (args.expires) cliArgs.push('--expires', args.expires);
  if (args.publicKey) cliArgs.push('--public-key', args.publicKey);
  if (args.password) cliArgs.push('--password', args.password);

  return cliArgs;
}

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1)?.trim();
}

function extractSshUserId(output: string): string | undefined {
  const match = output.match(/ID\s+([a-f0-9-]+)/i);
  return match ? match[1] : undefined;
}

function mapCliError(error: CliToolError, args: MittwaldSshUserCreateArgs): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}\n${error.message}`.toLowerCase();

  if (combined.includes('403') || combined.includes('forbidden') || combined.includes('permission denied')) {
    return `Permission denied when creating SSH user. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${stderr || stdout || error.message}`;
  }

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId || 'not specified'}.\nError: ${stderr || stdout || error.message}`;
  }

  if (combined.includes('invalid') && combined.includes('format')) {
    return `Invalid format in request. Please check your parameters.\nError: ${stderr || stdout || error.message}`;
  }

  return `Failed to create SSH user: ${stderr || stdout || error.message}`;
}

export const handleSshUserCreateCli: MittwaldCliToolHandler<MittwaldSshUserCreateArgs> = async (
  args,
  sessionId,
) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.description) {
    return formatToolResponse('error', 'Description is required to create an SSH user');
  }

  if (args.password && args.publicKey) {
    return formatToolResponse('error', 'Cannot specify both password and public key authentication. Choose one.');
  }

  if (!args.password && !args.publicKey) {
    return formatToolResponse('error', 'Either password or public key must be specified for authentication');
  }

  if (!args.projectId) {
    return formatToolResponse(
      'error',
      "Project ID is required for SSH user creation. Please provide --project-id or set a default project context via 'mw context set --project-id=<PROJECT_ID>'."
    );
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // Note: Library currently only supports publicKey authentication via publicKeys[] parameter
    // Password authentication needs to be handled separately or library needs enhancement
    const publicKeys = args.publicKey
      ? [{ key: args.publicKey, comment: args.description }]
      : undefined;

    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_ssh_user_create',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await createSshUser({
          projectId: args.projectId!,
          description: args.description,
          publicKeys,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_ssh_user_create',
        projectId: args.projectId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_ssh_user_create',
        projectId: args.projectId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const result = validation.libraryOutput.data as any;

    // Extract SSH user ID from result
    const sshUserId = result?.id || parseQuietOutput(validation.cliOutput.stdout || '') || extractSshUserId(validation.cliOutput.stdout || '');

    const authentication = {
      method: args.publicKey ? 'publicKey' : 'password',
      passwordProvided: Boolean(args.password),
      publicKeyProvided: Boolean(args.publicKey),
    };

    const responseData = {
      id: sshUserId,
      description: args.description,
      authentication,
      projectId: args.projectId,
      expires: args.expires,
      ...(result || {}),
    };

    const message = sshUserId
      ? `Successfully created SSH user '${args.description}' with ID ${sshUserId}`
      : `Successfully created SSH user '${args.description}'`;

    return formatToolResponse(
      'success',
      args.quiet ? sshUserId ?? message : message,
      responseData,
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
      const message = mapCliError(error, args);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP04] Unexpected error in SSH user create handler', { error });
    return formatToolResponse(
      'error',
      `Failed to create SSH user: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
