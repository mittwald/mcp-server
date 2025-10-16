import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldStackDeployCliArgs {
  stackId?: string;
  composeFile?: string;
  envFile?: string;
}

function buildCliArgs(args: MittwaldStackDeployCliArgs): string[] {
  const cliArgs: string[] = ['stack', 'deploy'];

  if (args.stackId) cliArgs.push('--stack-id', args.stackId);
  if (args.composeFile) cliArgs.push('--compose-file', args.composeFile);
  if (args.envFile) cliArgs.push('--env-file', args.envFile);

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldStackDeployCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('stack')) {
    return `Stack not found: ${args.stackId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('not found') && combined.includes('file')) {
    return `Compose file not found: ${args.composeFile ?? 'docker-compose.yml'}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleStackDeployCli: MittwaldCliToolHandler<MittwaldStackDeployCliArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_stack_deploy',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout || '';
    const stderr = result.result.stderr || '';
    const output = stdout || stderr || 'Stack deployed successfully';

    return formatToolResponse(
      'success',
      'Stack deployment completed',
      {
        stackId: args.stackId,
        status: 'deployed',
        composeFile: args.composeFile,
        envFile: args.envFile,
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
