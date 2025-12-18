import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { createProject, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1)?.trim();
}

function buildCliArgs(args: MittwaldProjectCreateArgs): string[] {
  const cliArgs: string[] = ['project', 'create', '--description', args.description];

  if (args.serverId) cliArgs.push('--server-id', args.serverId);
  if (args.quiet) cliArgs.push('--quiet');
  if (args.wait) cliArgs.push('--wait');
  if (args.waitTimeout) cliArgs.push('--wait-timeout', args.waitTimeout);
  if (args.updateContext) cliArgs.push('--update-context');

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldProjectCreateArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const errorMessage = error.stderr || error.stdout || error.message;

  if (combined.includes('no server context') || combined.includes('server context required')) {
    return `No server context available. You need to:\n` +
      `1. Provide a --server-id parameter, OR\n` +
      `2. Set the server context using 'mw context set --server-id <SERVER_ID>'\n` +
      `Use 'mittwald_server_list_cli' to see available servers.\nError: ${errorMessage}`;
  }

  if (combined.includes('server') && combined.includes('not found')) {
    return `Server not found. Please verify the server ID: ${args.serverId || 'not specified'}.\nError: ${errorMessage}`;
  }

  if (combined.includes('authentication') || combined.includes('unauthorized')) {
    return `Authentication failed. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorMessage}`;
  }

  if (combined.includes('quota') || combined.includes('limit')) {
    return `Project creation failed due to quota or limits: ${errorMessage}`;
  }

  return `Failed to create project: ${errorMessage}`;
}

interface MittwaldProjectCreateArgs {
  description: string;
  serverId?: string;
  quiet?: boolean;
  wait?: boolean;
  waitTimeout?: string;
  updateContext?: boolean;
}

export const handleProjectCreateCli: MittwaldToolHandler<MittwaldProjectCreateArgs> = async (args, sessionId) => {
  if (!args.serverId) {
    return formatToolResponse('error', 'serverId is required');
  }

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
      toolName: 'mittwald_project_create',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await createProject({
          serverId: args.serverId!,
          description: args.description,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp', 'id', 'projectId'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_project_create',
        description: args.description,
        serverId: args.serverId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_project_create',
        description: args.description,
        serverId: args.serverId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated) - data contains the project ID
    const projectData = validation.libraryOutput.data as any;
    const projectId = projectData?.id || projectData;

    return formatToolResponse(
      'success',
      'Project created successfully',
      {
        projectId,
        description: args.description,
        serverId: args.serverId,
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

    logger.error('[WP04] Unexpected error in project create handler', { error });
    return formatToolResponse('error', `Failed to create project: ${error instanceof Error ? error.message : String(error)}`);
  }
};
