import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { createBackup, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldBackupCreateCliArgs {
  projectId?: string;
  expires: string;
  description?: string;
  quiet?: boolean;
  wait?: boolean;
  waitTimeout?: string;
}

function buildCliArgs(args: MittwaldBackupCreateCliArgs): string[] {
  const cliArgs: string[] = ['backup', 'create', '--expires', args.expires];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.description) cliArgs.push('--description', args.description);
  if (args.quiet) cliArgs.push('--quiet');
  if (args.wait) cliArgs.push('--wait');
  if (args.waitTimeout) cliArgs.push('--wait-timeout', args.waitTimeout);

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldBackupCreateCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('invalid') && combined.includes('expires')) {
    return `Invalid expires format. Expected format like '30d', '1y', or '30m'.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleBackupCreateCli: MittwaldCliToolHandler<MittwaldBackupCreateCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.projectId) {
    return formatToolResponse('error', 'projectId is required');
  }

  if (!args.expires) {
    return formatToolResponse('error', "'expires' is required. Please provide the expires parameter.");
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP05: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_backup_create',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await createBackup({
          projectId: args.projectId!,
          description: args.description,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_backup_create',
        projectId: args.projectId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_backup_create',
        projectId: args.projectId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const backup = validation.libraryOutput.data as any;

    const message = args.wait ? 'Backup created successfully' : 'Backup creation initiated';

    return formatToolResponse(
      'success',
      message,
      {
        backupId: backup?.id,
        projectId: args.projectId,
        expires: args.expires,
        description: args.description,
        wait: args.wait,
      },
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

    logger.error('[WP05] Unexpected error in backup create handler', { error });
    return formatToolResponse('error', `Failed to create backup: ${error instanceof Error ? error.message : String(error)}`);
  }
};
