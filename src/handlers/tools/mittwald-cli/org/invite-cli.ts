import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { parseQuietOutput } from '../../../../utils/cli-output.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { inviteToOrg, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

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
export const handleOrgInviteCli: MittwaldToolHandler<OrgInviteArgs> = async (args, context) => {
  if (!args.organizationId) {
    return formatToolResponse('error', 'Parameter "organizationId" is required.');
  }

  if (!args.email) {
    return formatToolResponse('error', 'Parameter "email" is required.');
  }

  if (!args.role) {
    return formatToolResponse('error', 'Parameter "role" is required.');
  }

  const effectiveSessionId = context?.sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP05: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_org_invite',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await inviteToOrg({
          customerId: args.organizationId,
          email: args.email,
          role: args.role,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_org_invite',
        organizationId: args.organizationId,
        email: args.email,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_org_invite',
        organizationId: args.organizationId,
        email: args.email,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const inviteData = validation.libraryOutput.data as any;

    const payload: OrgInvitePayload = {
      organizationId: args.organizationId,
      email: args.email,
      role: args.role,
      inviteId: inviteData?.id,
      expires: args.expires,
      message: args.message,
    };

    return formatToolResponse(
      'success',
      `Invitation sent to ${args.email} for organization ${args.organizationId}.`,
      payload,
      {
        durationMs: validation.libraryOutput.durationMs,
        validationPassed: validation.passed,
        discrepancyCount: validation.discrepancies.length,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    if (error instanceof CliToolError) {
      const message = mapCliError(error, args);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP05] Unexpected error in org invite handler', { error });
    return formatToolResponse(
      'error',
      `Failed to send organization invite: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
