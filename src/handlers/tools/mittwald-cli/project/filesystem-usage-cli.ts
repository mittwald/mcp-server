import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { parseJsonOutput } from '../../../../utils/cli-output.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldProjectFilesystemUsageArgs {
  projectId: string;
  output?: 'txt' | 'json' | 'yaml';
  human?: boolean;
}

function buildCliArgs(args: MittwaldProjectFilesystemUsageArgs): string[] {
  const cliArgs: string[] = ['project', 'filesystem', 'usage', args.projectId, '--output', 'json'];

  if (args.human) cliArgs.push('--human');

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldProjectFilesystemUsageArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const errorMessage = error.stderr || error.stdout || error.message;

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId}.\nError: ${errorMessage}`;
  }

  if (combined.includes('authentication') || combined.includes('unauthorized')) {
    return `Authentication failed. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorMessage}`;
  }

  if (combined.includes('permission') || combined.includes('forbidden')) {
    return `Permission denied. You may not have the required permissions to access filesystem usage for this project.\nError: ${errorMessage}`;
  }

  return `Failed to get filesystem usage: ${errorMessage}`;
}

export const handleProjectFilesystemUsageCli: MittwaldCliToolHandler<MittwaldProjectFilesystemUsageArgs> = async (args) => {
  if (!args.projectId) {
    return formatToolResponse('error', 'Project ID is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_project_filesystem_usage',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const timestamp = new Date().toISOString();

    try {
      const data = parseJsonOutput(stdout);

      if (!data || typeof data !== 'object') {
        return formatToolResponse(
          'error',
          'Unexpected output format from CLI command',
          {
            projectId: args.projectId,
            rawOutput: stdout || stderr,
          },
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      }

      const usage = (data as Record<string, unknown>).usage ?? data;

      return formatToolResponse(
        'success',
        `Filesystem usage for project ${args.projectId}`,
        {
          projectId: args.projectId,
          usage,
          human: Boolean(args.human),
          timestamp,
          outputFormat: 'json',
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    } catch (parseError) {
      const message = parseError instanceof Error ? parseError.message : String(parseError);

      return formatToolResponse(
        'success',
        'Filesystem usage retrieved (raw output)',
        {
          projectId: args.projectId,
          rawOutput: stdout || stderr,
          parseError: message,
          human: Boolean(args.human),
          timestamp,
          outputFormat: 'json',
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }
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

    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
