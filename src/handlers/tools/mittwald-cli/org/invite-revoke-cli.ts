import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

export interface MittwaldOrgInviteRevokeArgs {
  inviteId: string;
  quiet?: boolean;
}

function buildCliArgs(args: MittwaldOrgInviteRevokeArgs): string[] {
  const cliArgs: string[] = ['org', 'invite', 'revoke', args.inviteId];
  if (args.quiet) cliArgs.push('--quiet');
  return cliArgs;
}

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1)?.trim();
}

function mapCliError(error: CliToolError, inviteId: string): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const errorMessage = error.stderr || error.stdout || error.message;

  if (combined.includes('not found')) {
    return `Organization invite not found: ${inviteId}.\nError: ${errorMessage}`;
  }

  if (combined.includes('permission denied') || combined.includes('forbidden')) {
    return `Permission denied when revoking organization invite ${inviteId}.\nError: ${errorMessage}`;
  }

  return `Failed to revoke organization invite: ${errorMessage}`;
}

export const handleOrgInviteRevokeCli: MittwaldToolHandler<MittwaldOrgInviteRevokeArgs> = async (args) => {
  if (!args.inviteId) {
    return formatToolResponse('error', 'Invite ID is required for revoking an organization invitation.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_org_invite_revoke',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const output = stdout || stderr;

    if (args.quiet) {
      const quietResult = parseQuietOutput(stdout) ?? parseQuietOutput(stderr);
      return formatToolResponse(
        'success',
        `Organization invite ${args.inviteId} revoked successfully`,
        {
          inviteId: args.inviteId,
          revoked: true,
          result: quietResult,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    return formatToolResponse(
      'success',
      `Organization invite ${args.inviteId} has been revoked successfully`,
      {
        inviteId: args.inviteId,
        revoked: true,
        output,
      },
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, args.inviteId);
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
