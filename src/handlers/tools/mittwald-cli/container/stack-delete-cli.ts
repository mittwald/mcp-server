import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldStackDeleteCliArgs {
  stackId?: string;
  force?: boolean;
  withVolumes?: boolean;
}

function buildCliArgs(args: MittwaldStackDeleteCliArgs): string[] {
  const cliArgs: string[] = ['stack', 'delete'];

  if (args.stackId) cliArgs.push(args.stackId);
  if (args.force) cliArgs.push('--force');
  if (args.withVolumes) cliArgs.push('--with-volumes');

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldStackDeleteCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('stack')) {
    return `Stack not found: ${args.stackId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleStackDeleteCli: MittwaldCliToolHandler<MittwaldStackDeleteCliArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_container_stack_delete',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout || '';
    const stderr = result.result.stderr || '';
    const output = stdout || stderr || 'Stack deleted successfully';

    return formatToolResponse(
      'success',
      'Stack deletion completed',
      {
        stackId: args.stackId,
        status: 'deleted',
        withVolumes: args.withVolumes,
        output,
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
