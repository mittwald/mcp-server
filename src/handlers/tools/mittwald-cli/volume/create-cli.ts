import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldVolumeCreateArgs {
  projectId: string;
  name: string;
  quiet?: boolean;
}

const VOLUME_NAME_PATTERN = /^[a-z0-9-]+$/;

function buildCliArgs(args: MittwaldVolumeCreateArgs): string[] {
  const cliArgs: string[] = ['volume', 'create', args.name];

  cliArgs.push('--project-id', args.projectId);
  if (args.quiet) cliArgs.push('--quiet');

  return cliArgs;
}

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1)?.trim();
}

function mapCliError(error: CliToolError, args: MittwaldVolumeCreateArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}\n${error.message}`.toLowerCase();

  if (combined.includes('already exists')) {
    return `Volume '${args.name}' already exists in project ${args.projectId}. Choose a different name.`;
  }

  if (combined.includes('project') && combined.includes('not found')) {
    return `Project not found. Verify the project ID: ${args.projectId}.`;
  }

  if (error.kind === 'AUTHENTICATION' || combined.includes('unauthorized')) {
    return 'Authentication with Mittwald CLI failed. Re-run OAuth authentication and try again.';
  }

  return `Failed to create volume '${args.name}'. ${error.stderr || error.message}`;
}

export const handleVolumeCreateCli: MittwaldCliToolHandler<MittwaldVolumeCreateArgs> = async (args) => {
  if (!args.projectId) {
    return formatToolResponse('error', 'Project ID is required to create a volume.');
  }

  if (!args.name) {
    return formatToolResponse('error', 'Volume name is required.');
  }

  if (!VOLUME_NAME_PATTERN.test(args.name)) {
    logger.warn('[Volume Create] Invalid volume name provided', { name: args.name });
    return formatToolResponse(
      'error',
      'Invalid volume name. Use lowercase letters, numbers, and hyphens only.'
    );
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_volume_create',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const createdName = parseQuietOutput(stdout) ?? args.name;

    const message = `Volume '${createdName}' created successfully.`;

    return formatToolResponse(
      'success',
      message,
      {
        volume: {
          name: createdName,
          projectId: args.projectId,
          quiet: Boolean(args.quiet),
        },
        output: stdout.trim() || stderr.trim() || undefined,
      },
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, args);
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
