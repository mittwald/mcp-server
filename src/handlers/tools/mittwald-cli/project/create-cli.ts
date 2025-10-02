import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';


function buildCliArgs(args: MittwaldProjectCreateArgs): string[] {
  const cliArgs: string[] = ['project', 'create', '--description', args.description];

  if (args.serverId) cliArgs.push('--server-id', args.serverId);
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
  wait?: boolean;
  waitTimeout?: string;
  updateContext?: boolean;
}

export const handleProjectCreateCli: MittwaldToolHandler<MittwaldProjectCreateArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_project_create',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const output = stdout || stderr;

    return formatToolResponse(
      'success',
      'Project created successfully',
      {
        output,
        description: args.description,
        serverId: args.serverId,
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
