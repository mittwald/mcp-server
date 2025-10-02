import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldDomainVirtualhostDeleteArgs {
  virtualhostId: string;
  force?: boolean;
}

function buildCliArgs(args: MittwaldDomainVirtualhostDeleteArgs): string[] {
  const cliArgs: string[] = ['domain', 'virtualhost', 'delete', args.virtualhostId];
  if (args.force) cliArgs.push('--force');
  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldDomainVirtualhostDeleteArgs): string {
  const combined = `${error.stderr ?? ''} ${error.stdout ?? ''}`;

  if (/not found/i.test(combined)) {
    return `Virtual host not found: ${args.virtualhostId}.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  if (/403|forbidden|permission denied/i.test(combined)) {
    return `Permission denied when deleting virtual host. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  return `Failed to delete virtual host: ${error.stderr || error.stdout || error.message}`;
}

export const handleDomainVirtualhostDeleteCli: MittwaldCliToolHandler<MittwaldDomainVirtualhostDeleteArgs> = async (args) => {
  if (!args.virtualhostId) {
    return formatToolResponse('error', 'Virtual host ID is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_domain_virtualhost_delete',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr ?? '' }),
    });

    return formatToolResponse(
      'success',
      `Successfully deleted virtual host ${args.virtualhostId}`,
      {
        deletedId: args.virtualhostId,
        stdout: result.result.stdout,
        stderr: result.result.stderr,
        force: args.force ?? false,
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
