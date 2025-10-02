import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { parseQuietOutput } from '../../../../utils/cli-wrapper.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface OrgInviteArgs {
  organizationId: string;
  email: string;
  role: 'owner' | 'member' | 'accountant';
  message?: string;
  expires?: string;
}

interface OrgInvitePayload {
  organizationId: string;
  email: string;
  role: string;
  inviteId?: string;
  expires?: string;
  message?: string;
}

/**
 * Builds CLI arguments for the organization invite command.
 *
 * @param args - Tool arguments.
 * @returns CLI argument array.
 */
function buildCliArgs(args: OrgInviteArgs): string[] {
  const argv: string[] = [
    'org',
    'invite',
    '--org-id',
    args.organizationId,
    '--email',
    args.email,
    '--role',
    args.role,
    '--quiet',
  ];

  if (args.message) {
    argv.push('--message', args.message);
  }

  if (args.expires) {
    argv.push('--expires', args.expires);
  }

  return argv;
}

/**
 * Maps CLI errors to descriptive invite messages.
 *
 * @param error - CLI adapter error.
 * @param args - Tool arguments used for the invite.
 * @returns Human-readable error.
 */
function mapCliError(error: CliToolError, args: OrgInviteArgs): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}`.toLowerCase();

  if (combined.includes('not found')) {
    const details = stderr || stdout || error.message;
    return `Organization not found: ${args.organizationId}.\nError: ${details}`;
  }

  if (combined.includes('already') && combined.includes('invite')) {
    const details = stderr || stdout || error.message;
    return `An active invitation already exists for ${args.email}.\nError: ${details}`;
  }

  if (combined.includes('invalid') && combined.includes('email')) {
    const details = stderr || stdout || error.message;
    return `Invalid email address provided for ${args.email}.\nError: ${details}`;
  }

  if (error.kind === 'AUTHENTICATION' || combined.includes('unauthorized') || combined.includes('not authenticated')) {
    const details = stderr || stdout || error.message;
    return `Authentication failed when inviting ${args.email}.\nError: ${details}`;
  }

  if (combined.includes('permission denied') || combined.includes('forbidden')) {
    const details = stderr || stdout || error.message;
    return `Permission denied when inviting ${args.email} to ${args.organizationId}.\nError: ${details}`;
  }

  const details = stderr || stdout || error.message;
  return `Failed to send organization invite: ${details}`;
}

/**
 * Handler for the `mittwald_org_invite` tool.
 */
export const handleOrgInviteCli: MittwaldToolHandler<OrgInviteArgs> = async (args) => {
  if (!args.organizationId) {
    return formatToolResponse('error', 'Parameter "organizationId" is required.');
  }

  if (!args.email) {
    return formatToolResponse('error', 'Parameter "email" is required.');
  }

  if (!args.role) {
    return formatToolResponse('error', 'Parameter "role" is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_org_invite',
      argv,
    });

    const { command, durationMs } = result.meta;
    const rawOutput = result.result ?? '';
    const inviteId = parseQuietOutput(rawOutput) ?? undefined;

    const payload: OrgInvitePayload = {
      organizationId: args.organizationId,
      email: args.email,
      role: args.role,
      inviteId,
      expires: args.expires,
      message: args.message,
    };

    return formatToolResponse(
      'success',
      `Invitation sent to ${args.email} for organization ${args.organizationId}.`,
      payload,
      {
        command,
        durationMs,
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
      `Failed to execute organization invite command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
