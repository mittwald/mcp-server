import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldCronjobGetCliArgs {
  cronjobId: string;
  output?: 'txt' | 'json' | 'yaml';
}

function buildCliArgs(args: MittwaldCronjobGetCliArgs): string[] {
  const cliArgs: string[] = ['cronjob', 'get', args.cronjobId];
  cliArgs.push('--output', 'json');
  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldCronjobGetCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const message = error.stderr || error.stdout || error.message;

  if (combined.includes('not found')) {
    return `Cronjob not found: ${args.cronjobId}.\nError: ${message}`;
  }

  if (combined.includes('permission denied') || combined.includes('forbidden')) {
    return `Permission denied when retrieving cronjob ${args.cronjobId}. Please ensure you are authenticated with the correct Mittwald account.`;
  }

  return `Failed to get cronjob: ${message}`;
}

function parseCronjob(output: string): Record<string, unknown> {
  const trimmed = output.trim();
  if (!trimmed) {
    throw new Error('CLI returned empty output.');
  }

  try {
    const data = JSON.parse(trimmed);
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      throw new Error('Unexpected JSON structure.');
    }
    return data as Record<string, unknown>;
  } catch (error) {
    throw new Error(`Failed to parse JSON output: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function formatCronjob(data: Record<string, unknown>): Record<string, unknown> {
  return {
    id: data.id,
    description: data.description,
    expression: data.expression,
    command: data.command,
    enabled: data.enabled,
    projectId: data.projectId,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    lastExecutedAt: data.lastExecutedAt,
    raw: data,
  };
}

export const handleCronjobGetCli: MittwaldToolHandler<MittwaldCronjobGetCliArgs> = async (args, _context) => {
  if (!args.cronjobId) {
    return formatToolResponse('error', 'Cronjob ID is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_cronjob_get',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';

    try {
      const parsed = parseCronjob(stdout);
      const formatted = formatCronjob(parsed);
      const cronjobId = typeof formatted.id === 'string' ? formatted.id : args.cronjobId;

      return formatToolResponse(
        'success',
        `Cronjob details for ${cronjobId}`,
        formatted,
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    } catch (parseError) {
      return formatToolResponse(
        'success',
        'Cronjob retrieved (raw output)',
        {
          cronjobId: args.cronjobId,
          rawOutput: stdout || stderr,
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
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
