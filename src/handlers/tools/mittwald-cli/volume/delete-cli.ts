import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldVolumeDeleteArgs {
  volumeId?: string;
  name?: string;
  projectId?: string;
  force?: boolean;
  quiet?: boolean;
}

interface RawVolume {
  id?: string;
  name?: string;
  orphaned?: boolean;
  linkedServices?: Array<{ id?: string; name?: string }> | null;
}

interface VolumeSafetyCheck {
  status: 'ok' | 'mounted' | 'not-found' | 'unknown';
  volumeName?: string;
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
    return { status: 'unknown', volumeName };
  }

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_volume_list',
      argv: ['volume', 'list', '--project-id', args.projectId, '--output', 'json'],
    });

    const volumes = safeParseVolumes(result.result);
    if (!volumes) {
      return { status: 'unknown', volumeName };
    }

    const match = volumes.find((volume) => {
      const candidateName = volume.name ?? volume.id;
      return candidateName === volumeName || volume.id === volumeName;
    });

    if (!match) {
      return { status: 'not-found', volumeName };
    }

    const linkedServices = Array.isArray(match.linkedServices)
      ? match.linkedServices.filter(Boolean)
      : [];

    if (linkedServices.length > 0 && !match.orphaned) {
      return {
        status: 'mounted',
        volumeName: match.name ?? volumeName,
        linkedServices,
      };
    }

    return {
      status: 'ok',
      volumeName: match.name ?? volumeName,
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

    return { status: 'unknown', volumeName };
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

export const handleVolumeDeleteCli: MittwaldCliToolHandler<MittwaldVolumeDeleteArgs> = async (args) => {
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

  if (!VOLUME_NAME_PATTERN.test(volumeName)) {
    logger.warn('[Volume Delete] Volume identifier does not match standard naming pattern', { volumeName });
    return formatToolResponse(
      'error',
      'Invalid volume identifier. Use lowercase letters, numbers, and hyphens only.'
    );
  }

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

  logger.info('[Volume Delete] Deleting volume', {
    volumeName,
    projectId: args.projectId,
    force: Boolean(args.force),
  });

  const argv = buildCliArgs(volumeName, args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_volume_delete',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const deletedName = parseQuietOutput(stdout) ?? safety.volumeName ?? volumeName;

    const message = `Volume '${deletedName}' deleted successfully.`;

    const responseData: Record<string, unknown> = {
      volume: {
        name: deletedName,
        projectId: args.projectId,
        force: Boolean(args.force),
      },
      output: stdout.trim() || stderr.trim() || undefined,
    };

    if (safety.linkedServices && safety.linkedServices.length > 0) {
      responseData.previouslyMountedServices = safety.linkedServices;
    }

    return formatToolResponse(
      'success',
      message,
      responseData,
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, volumeName, args.projectId);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return formatToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
