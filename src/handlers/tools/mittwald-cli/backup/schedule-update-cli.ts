import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { updateBackupSchedule, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldBackupScheduleUpdateCliArgs {
  backupScheduleId: string;
  description?: string;
  schedule?: string;
  ttl?: string;
  quiet?: boolean;
}

function buildCliArgs(args: MittwaldBackupScheduleUpdateCliArgs): string[] {
  const cliArgs: string[] = ['backup', 'schedule', 'update', args.backupScheduleId];

  if (args.description) cliArgs.push('--description', args.description);
  if (args.schedule) cliArgs.push('--schedule', args.schedule);
  if (args.ttl) cliArgs.push('--ttl', args.ttl);
  if (args.quiet) cliArgs.push('--quiet');

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldBackupScheduleUpdateCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('schedule')) {
    return `Backup schedule not found. Please verify the schedule ID: ${args.backupScheduleId}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('invalid') && combined.includes('schedule')) {
    return `Invalid schedule format. Expected cron expression.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('invalid') && combined.includes('ttl')) {
    return `Invalid TTL format. Expected format like '7d' (7-400 days).\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleBackupScheduleUpdateCli: MittwaldCliToolHandler<MittwaldBackupScheduleUpdateCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.backupScheduleId) {
    return formatToolResponse('error', 'Backup schedule ID is required. Please provide the backupScheduleId parameter.');
  }

  if (!args.description && !args.schedule && !args.ttl) {
    return formatToolResponse('error', 'At least one field (description, schedule, ttl) must be provided to update.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP05: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_backup_schedule_update',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await updateBackupSchedule({
          scheduleId: args.backupScheduleId,
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
        tool: 'mittwald_backup_schedule_update',
        backupScheduleId: args.backupScheduleId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_backup_schedule_update',
        backupScheduleId: args.backupScheduleId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    return formatToolResponse(
      'success',
      `Backup schedule ${args.backupScheduleId} updated successfully`,
      {
        backupScheduleId: args.backupScheduleId,
        description: args.description,
        schedule: args.schedule,
        ttl: args.ttl,
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

    logger.error('[WP05] Unexpected error in backup schedule update handler', { error });
    return formatToolResponse('error', `Failed to update backup schedule: ${error instanceof Error ? error.message : String(error)}`);
  }
};
