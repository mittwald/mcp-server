import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { deleteVolume, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldVolumeDeleteArgs {
  volumeId?: string;
  name?: string;
  projectId?: string;
  confirm?: boolean;
  force?: boolean;
  quiet?: boolean;
}

interface RawVolume {
  id?: string;
  name?: string;
  orphaned?: boolean;
  linkedServices?: Array<{ id?: string; name?: string }> | null;
  stackId?: string;
}

interface VolumeSafetyCheck {
  status: 'ok' | 'mounted' | 'not-found' | 'unknown';
  volumeName?: string;
  stackId?: string;
  linkedServices?: Array<{ id?: string; name?: string }>;
}

const VOLUME_NAME_PATTERN = /^[a-z0-9-]+$/;

function resolveVolumeName(args: MittwaldVolumeDeleteArgs): string | undefined {
  return args.name ?? args.volumeId;
}

function buildCliArgs(volumeName: string, args: MittwaldVolumeDeleteArgs): string[] {
  const cliArgs: string[] = ['volume', 'delete', volumeName];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.force) cliArgs.push('--force');
  if (args.quiet) cliArgs.push('--quiet');

  return cliArgs;
}

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1)?.trim();
}

function safeParseVolumes(output: string): RawVolume[] | undefined {
  if (!output) return undefined;

  try {
    const parsed = JSON.parse(output);
    return Array.isArray(parsed) ? (parsed as RawVolume[]) : undefined;
  } catch (error) {
    logger.warn('[Volume Delete] Failed to parse volume list during safety check', { error });
    return undefined;
  }
}

async function checkVolumeSafety(args: MittwaldVolumeDeleteArgs, volumeName: string): Promise<VolumeSafetyCheck> {
  if (!args.projectId) {
    logger.warn('[Volume Delete] Skipping mounted volume check because projectId is missing', {
      volumeName,
    });
    return { status: 'unknown', volumeName, stackId: undefined };
  }

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_volume_list',
      argv: ['volume', 'list', '--project-id', args.projectId, '--output', 'json'],
    });

    const volumes = safeParseVolumes(result.result);
    if (!volumes) {
      return { status: 'unknown', volumeName, stackId: undefined };
    }

    const match = volumes.find((volume) => {
      const candidateName = volume.name ?? volume.id;
      return candidateName === volumeName || volume.id === volumeName;
    });

    if (!match) {
      return { status: 'not-found', volumeName, stackId: undefined };
    }

    const linkedServices = Array.isArray(match.linkedServices)
      ? match.linkedServices.filter(Boolean)
      : [];

    if (linkedServices.length > 0 && !match.orphaned) {
      return {
        status: 'mounted',
        volumeName: match.name ?? volumeName,
        stackId: match.stackId,
        linkedServices,
      };
    }

    return {
      status: 'ok',
      volumeName: match.name ?? volumeName,
      stackId: match.stackId,
      linkedServices,
    };
  } catch (error) {
    if (error instanceof CliToolError) {
      logger.warn('[Volume Delete] Unable to run safety check using volume list', {
        volumeName,
        projectId: args.projectId,
        error: {
          kind: error.kind,
          message: error.message,
          stderr: error.stderr,
        },
      });
    } else {
      logger.warn('[Volume Delete] Unexpected error while running safety check', { error });
    }

    return { status: 'unknown', volumeName, stackId: undefined };
  }
}

function mapCliError(error: CliToolError, volumeName: string, projectId?: string): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}\n${error.message}`.toLowerCase();

  if (combined.includes('does not exist') || combined.includes('not found')) {
    return `Volume '${volumeName}' was not found in project ${projectId ?? 'unknown'}.`;
  }

  if (combined.includes('in use') && combined.includes('force')) {
    return `Volume '${volumeName}' is still mounted to one or more containers. Use force: true to override, but proceed with caution.`;
  }

  if (error.kind === 'AUTHENTICATION' || combined.includes('unauthorized')) {
    return 'Authentication with Mittwald CLI failed. Re-run OAuth authentication and try again.';
  }

  return `Failed to delete volume '${volumeName}'. ${error.stderr || error.message}`;
}

export const handleVolumeDeleteCli: MittwaldCliToolHandler<MittwaldVolumeDeleteArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const resolvedUserId = typeof sessionId === 'string' ? undefined : (sessionId as any)?.userId;
  const volumeName = resolveVolumeName(args);

  if (!volumeName) {
    return formatToolResponse('error', 'Provide the volumeId or name of the volume to delete.');
  }

  if (!args.projectId) {
    return formatToolResponse(
      'error',
      'Project ID is required for volume deletion to avoid deleting the wrong resource.'
    );
  }

  // C4 Pattern: Confirm flag validation (MUST be first check for destructive operations)
  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'Volume deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  if (!VOLUME_NAME_PATTERN.test(volumeName)) {
    logger.warn('[Volume Delete] Volume identifier does not match standard naming pattern', { volumeName });
    return formatToolResponse(
      'error',
      'Invalid volume identifier. Use lowercase letters, numbers, and hyphens only.'
    );
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  // C4 Pattern: Audit logging with session context (BEFORE any destructive action)
  logger.warn('[Volume Delete] Destructive operation attempted', {
    volumeName,
    projectId: args.projectId,
    force: Boolean(args.force),
    sessionId: effectiveSessionId,
    ...(resolvedUserId ? { userId: resolvedUserId } : {}),
  });

  const safety = await checkVolumeSafety(args, volumeName);

  if (safety.status === 'not-found') {
    return formatToolResponse('error', `Volume '${volumeName}' was not found in project ${args.projectId}.`);
  }

  if (safety.status === 'mounted' && !args.force) {
    const services = safety.linkedServices?.map((service) => service?.name ?? service?.id).filter(Boolean) ?? [];
    const serviceList = services.length > 0 ? services.join(', ') : 'unknown services';
    return formatToolResponse(
      'error',
      `Volume '${safety.volumeName ?? volumeName}' is currently mounted to ${services.length} container(s): ${serviceList}. ` +
        'Set force: true only if you are certain it is safe to detach the volume.'
    );
  }

  const argv = buildCliArgs(volumeName, args);

  try {
    // WP05: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_volume_delete',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await deleteVolume({
          volumeId: volumeName,
          stackId: safety.stackId || '',
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_volume_delete',
        volumeName,
        projectId: args.projectId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_volume_delete',
        volumeName,
        projectId: args.projectId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    const deletedName = safety.volumeName ?? volumeName;
    const message = `Volume '${deletedName}' deleted successfully.`;

    const responseData: Record<string, unknown> = {
      volume: {
        name: deletedName,
        projectId: args.projectId,
        force: Boolean(args.force),
      },
    };

    if (safety.linkedServices && safety.linkedServices.length > 0) {
      responseData.previouslyMountedServices = safety.linkedServices;
    }

    return formatToolResponse(
      'success',
      message,
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
      const message = mapCliError(error, volumeName, args.projectId);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP05] Unexpected error in volume delete handler', { error });
    return formatToolResponse(
      'error',
      `Failed to execute volume delete: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
