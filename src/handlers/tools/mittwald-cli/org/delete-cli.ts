import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { parseQuietOutput } from '../../../../utils/cli-output.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { logger } from '../../../../utils/logger.js';
import { deleteOrganization, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface OrgDeleteArgs {
  organizationId: string;
  confirm: boolean;
}

interface OrgDeletePayload {
  organizationId: string;
  deleted: boolean;
  result?: string;
}

/**
 * Maps CLI errors to descriptive messages for organization deletion.
 *
 * @param error - CLI adapter error.
 * @param organizationId - Organization slated for deletion.
 * @returns Human-readable error string.
 */
function mapCliError(error: CliToolError, organizationId: string): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}`.toLowerCase();

  if (combined.includes('not found')) {
    const details = stderr || stdout || error.message;
    return `Organization not found: ${organizationId}.\nError: ${details}`;
  }

  if (error.kind === 'AUTHENTICATION' || combined.includes('unauthorized') || combined.includes('not authenticated')) {
    const details = stderr || stdout || error.message;
    return `Authentication failed when deleting organization ${organizationId}.\nError: ${details}`;
  }

  if (combined.includes('forbidden') || combined.includes('permission denied')) {
    const details = stderr || stdout || error.message;
    return `Permission denied while deleting organization ${organizationId}.\nError: ${details}`;
  }

  const details = stderr || stdout || error.message;
  return `Failed to delete organization ${organizationId}: ${details}`;
}

/**
 * Handler for the `mittwald_org_delete` tool.
 */
export const handleOrgDeleteCli: MittwaldToolHandler<OrgDeleteArgs> = async (args, context) => {
  if (!args.organizationId) {
    return formatToolResponse('error', 'Parameter "organizationId" is required.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'Organization deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  const effectiveSessionId = context?.sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  logger.warn('[OrgDelete] Attempting to delete organization', {
    organizationId: args.organizationId,
    sessionId: context?.sessionId,
    userId: context?.userId,
  });

  const argv = ['org', 'delete', args.organizationId, '--force', '--quiet'];

  try {
    // WP05: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_org_delete',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await deleteOrganization({
          customerId: args.organizationId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_org_delete',
        organizationId: args.organizationId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_org_delete',
        organizationId: args.organizationId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    const payload: OrgDeletePayload = {
      organizationId: args.organizationId,
      deleted: true,
    };

    return formatToolResponse(
      'success',
      `Organization ${args.organizationId} deleted successfully.`,
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
      const message = mapCliError(error, args.organizationId);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP05] Unexpected error in org delete handler', { error });
    return formatToolResponse(
      'error',
      `Failed to delete organization: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
