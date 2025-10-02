import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldServerGetArgs {
  serverId?: string;
  output?: 'txt' | 'json' | 'yaml';
}

function buildCliArgs(args: MittwaldServerGetArgs): string[] {
  const cliArgs: string[] = ['server', 'get'];
  if (args.serverId) cliArgs.push(args.serverId);
  cliArgs.push('--output', 'json');
  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldServerGetArgs): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}\n${error.message}`.toLowerCase();

  if (combined.includes('not found') || combined.includes('no server found')) {
    const details = stderr || stdout || error.message;
    return `Server not found. Please verify the server ID: ${args.serverId || 'not specified'}.\nError: ${details}`;
  }

  const details = stderr || stdout || error.message;
  return `Failed to get server: ${details}`;
}

function formatServer(record: Record<string, unknown>) {
  return {
    id: record.id,
    description: record.description,
    createdAt: record.createdAt,
    isReady: record.isReady,
    status: record.status,
    data: record,
  };
}

export const handleServerGetCli: MittwaldCliToolHandler<MittwaldServerGetArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_server_get',
      argv,
      parser: (stdout) => stdout,
    });

    const commandMeta = {
      command: result.meta.command,
      durationMs: result.meta.durationMs,
    };

    const stdout = result.result ?? '';

    try {
      const parsed = JSON.parse(stdout);

      if (!parsed || typeof parsed !== 'object') {
        return formatToolResponse('error', 'Unexpected output format from CLI command');
      }

      const formatted = formatServer(parsed as Record<string, unknown>);

      return formatToolResponse(
        'success',
        `Server information retrieved for ${String((parsed as Record<string, unknown>).id ?? args.serverId ?? 'server')}`,
        formatted,
        commandMeta
      );
    } catch (parseError) {
      return formatToolResponse(
        'success',
        'Server retrieved (raw output)',
        {
          rawOutput: stdout,
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
        },
        commandMeta
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
