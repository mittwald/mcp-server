import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { createBackupSchedule, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldBackupScheduleCreateCliArgs {
  projectId?: string;
  schedule: string;
  ttl: string;
  description?: string;
  quiet?: boolean;
}

function buildCliArgs(args: MittwaldBackupScheduleCreateCliArgs): string[] {
  const cliArgs: string[] = ['backup', 'schedule', 'create', '--schedule', args.schedule, '--ttl', args.ttl];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.description) cliArgs.push('--description', args.description);
  if (args.quiet) cliArgs.push('--quiet');

  return cliArgs;
}

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1);
}

function mapCliError(error: CliToolError, args: MittwaldBackupScheduleCreateCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('invalid') && combined.includes('schedule')) {
    return `Invalid schedule format. Expected cron expression.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('invalid') && combined.includes('ttl')) {
    return `Invalid TTL format. Expected format like '7d' (7-400 days).\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

function buildSuccessPayload(args: MittwaldBackupScheduleCreateCliArgs, output: string, scheduleId?: string) {
  return {
    scheduleId,
    projectId: args.projectId,
    schedule: args.schedule,
    ttl: args.ttl,
    description: args.description,
    output,
  };
}

export const handleBackupScheduleCreateCli: MittwaldCliToolHandler<MittwaldBackupScheduleCreateCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.projectId) {
    return formatToolResponse('error', 'projectId is required');
  }

  if (!args.schedule) {
    return formatToolResponse('error', "'schedule' is required. Please provide the schedule parameter.");
  }

  if (!args.ttl) {
    return formatToolResponse('error', "'ttl' is required. Please provide the ttl parameter.");
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP05: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_backup_schedule_create',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await createBackupSchedule({
          projectId: args.projectId!,
          schedule: args.schedule,
          ttl: args.ttl,
          description: args.description,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_backup_schedule_create',
        projectId: args.projectId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_backup_schedule_create',
        projectId: args.projectId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const schedule = validation.libraryOutput.data as any;

    return formatToolResponse(
      'success',
      'Backup schedule created successfully',
      {
        scheduleId: schedule?.id,
        projectId: args.projectId,
        schedule: args.schedule,
        ttl: args.ttl,
        description: args.description,
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

    logger.error('[WP05] Unexpected error in backup schedule create handler', { error });
    return formatToolResponse('error', `Failed to create backup schedule: ${error instanceof Error ? error.message : String(error)}`);
  }
};
