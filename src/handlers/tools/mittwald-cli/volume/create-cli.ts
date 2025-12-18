import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { createVolume, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldVolumeCreateArgs {
  projectId: string;
  name: string;
  quiet?: boolean;
}

const VOLUME_NAME_PATTERN = /^[a-z0-9-]+$/;
// Default volume size: 1 GB (1073741824 bytes)
// The CLI creates volumes with a default size since it doesn't expose a size parameter
const DEFAULT_VOLUME_SIZE = 1073741824;

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

export const handleVolumeCreateCli: MittwaldCliToolHandler<MittwaldVolumeCreateArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

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

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP05: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_volume_create',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await createVolume({
          projectId: args.projectId,
          description: args.name,
          size: DEFAULT_VOLUME_SIZE,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_volume_create',
        projectId: args.projectId,
        volumeName: args.name,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_volume_create',
        projectId: args.projectId,
        volumeName: args.name,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result
    const volumeData = validation.libraryOutput.data as Record<string, unknown> | undefined;
    const createdName = args.name;

    const message = `Volume '${createdName}' created successfully.`;

    return formatToolResponse(
      'success',
      message,
      {
        volume: {
          name: createdName,
          projectId: args.projectId,
          quiet: Boolean(args.quiet),
          ...(volumeData && typeof volumeData === 'object' ? volumeData : {}),
        },
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

    logger.error('[WP05] Unexpected error in volume create handler', { error });
    return formatToolResponse(
      'error',
      `Failed to create volume: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
