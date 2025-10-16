import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { parseJsonOutput } from '../../../../utils/cli-output.js';

interface MittwaldCronjobExecutionLogsCliArgs {
  cronjobId: string;
  executionId: string;
  output?: 'txt' | 'json' | 'yaml';
  noPager?: boolean;
}

function buildCliArgs(args: MittwaldCronjobExecutionLogsCliArgs): string[] {
  const cliArgs: string[] = ['cronjob', 'execution', 'logs', args.cronjobId, args.executionId];
  const outputFormat = args.output ?? 'txt';
  cliArgs.push('--output', outputFormat);
  if (args.noPager) cliArgs.push('--no-pager');
  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldCronjobExecutionLogsCliArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const baseMessage = error.stderr || error.stdout || error.message;

  if (combined.includes('not found')) {
    return `Cronjob or execution not found: ${args.cronjobId} / ${args.executionId}.\nError: ${baseMessage}`;
  }

  return `Failed to get cronjob execution logs: ${baseMessage}`;
}

export const handleCronjobExecutionLogsCli: MittwaldToolHandler<MittwaldCronjobExecutionLogsCliArgs> = async (args) => {
  try {
    const argv = buildCliArgs(args);
    const result = await invokeCliTool({
      toolName: 'mittwald_cronjob_execution_logs',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const outputFormat = args.output ?? 'txt';

    if (outputFormat === 'json') {
      try {
        const data = parseJsonOutput(stdout);
        return formatToolResponse(
          'success',
          `Cronjob execution logs for ${args.executionId}`,
          {
            cronjobId: args.cronjobId,
            executionId: args.executionId,
            logs: data,
          },
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      } catch (parseError) {
        return formatToolResponse(
          'success',
          'Cronjob execution logs retrieved (raw output)',
          {
            rawOutput: stdout,
            parseError: parseError instanceof Error ? parseError.message : String(parseError),
          },
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      }
    }

    return formatToolResponse(
      'success',
      `Cronjob execution logs for ${args.executionId}`,
      {
        cronjobId: args.cronjobId,
        executionId: args.executionId,
        logs: stdout || stderr,
        format: outputFormat,
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
