import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { parseJsonOutput } from '../../../../utils/cli-wrapper.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

export interface MittwaldProjectInviteGetArgs {
  inviteId: string;
  output?: 'json' | 'table' | 'yaml';
}

function buildCliArgs(args: MittwaldProjectInviteGetArgs): string[] {
  return ['project', 'invite', 'get', args.inviteId, '--output', 'json'];
}

function mapCliError(error: CliToolError, args: MittwaldProjectInviteGetArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const errorText = error.stderr || error.stdout || error.message;

  if (combined.includes('not found') || combined.includes('404')) {
    return `Project invite not found. Please verify the invite ID: ${args.inviteId}.\nError: ${errorText}`;
  }

  if (combined.includes('not authenticated') || combined.includes('401')) {
    return `Authentication failed. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorText}`;
  }

  if (combined.includes('forbidden') || combined.includes('403')) {
    return `Access denied. You don't have permission to view this project invite.\nError: ${errorText}`;
  }

  return `Failed to get project invite: ${errorText}`;
}

export const handleProjectInviteGetCli: MittwaldCliToolHandler<MittwaldProjectInviteGetArgs> = async (args) => {
  if (!args.inviteId) {
    return formatToolResponse('error', 'Invite ID is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_project_invite_get',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';

    try {
      const data = parseJsonOutput(stdout);

      if (!data || typeof data !== 'object') {
        return formatToolResponse(
          'error',
          'Unexpected output format from CLI command'
        );
      }

      const formattedData = {
        id: data.id,
        email: data.mailAddress || data.email,
        role: data.projectRole || data.role,
        status: data.expired ? 'expired' : 'active',
        createdAt: data.createdAt,
        expiresAt: data.membershipExpiresAt || data.expiresAt || 'Never',
        projectId: data.projectId,
        userId: data.userId,
        invitedBy: data.invitedBy || data.inviter,
        message: data.message,
      };

      return formatToolResponse(
        'success',
        'Project invite retrieved successfully',
        formattedData,
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    } catch (parseError) {
      return formatToolResponse(
        'success',
        'Project invite retrieved (raw output)',
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
