import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldContainerLogsArgs {
  containerId: string;
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml';
  noPager?: boolean;
}

function buildCliArgs(args: MittwaldContainerLogsArgs): string[] {
  const cliArgs: string[] = ['container', 'logs', args.containerId];

  cliArgs.push('--output', args.output ?? 'txt');
  cliArgs.push('--no-pager');
  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.noPager) cliArgs.push('--no-pager');

  return cliArgs;
}

function tryParseJson(output: string): unknown {
  if (!output.trim()) return undefined;

  try {
    return JSON.parse(output);
  } catch {
    return undefined;
  }
}

function mapCliError(error: CliToolError, args: MittwaldContainerLogsArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('container')) {
    return `Container not found. Please verify the container ID: ${args.containerId}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleContainerLogsCli: MittwaldCliToolHandler<MittwaldContainerLogsArgs> = async (args) => {
  if (!args.containerId) {
    return formatToolResponse('error', 'Container ID is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_container_logs',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout || '';
    const stderr = result.result.stderr || '';

    if (!stdout.trim() && !stderr.trim()) {
      return formatToolResponse(
        'success',
        'No logs found for the specified container',
        {
          containerId: args.containerId,
          projectId: args.projectId,
          logs: '',
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    if ((args.output ?? 'txt') === 'json') {
      const parsed = tryParseJson(stdout);
      if (parsed !== undefined) {
        return formatToolResponse(
          'success',
          `Retrieved logs for container ${args.containerId}`,
          parsed,
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      }
    }

    return formatToolResponse(
      'success',
      stdout || stderr,
      {
        containerId: args.containerId,
        projectId: args.projectId,
        format: args.output ?? 'txt',
        output: stdout || stderr,
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

    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
