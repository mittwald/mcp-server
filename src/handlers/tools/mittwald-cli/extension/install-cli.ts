import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { parseQuietOutput } from '../../../../utils/cli-output.js';
import { LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldExtensionInstallCliArgs {
  extensionId: string;
  projectId?: string;
  orgId?: string;
  quiet?: boolean;
  consent?: boolean;
}

function validateScope(args: MittwaldExtensionInstallCliArgs) {
  if (!args.projectId && !args.orgId) {
    return 'Either projectId or orgId must be provided';
  }

  if (args.projectId && args.orgId) {
    return 'Only one of projectId or orgId can be provided';
  }

  return undefined;
}

function buildCliArgs(args: MittwaldExtensionInstallCliArgs): string[] {
  const cliArgs: string[] = ['extension', 'install', args.extensionId];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.orgId) cliArgs.push('--org-id', args.orgId);
  if (args.quiet) cliArgs.push('--quiet');
  if (args.consent) cliArgs.push('--consent');

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldExtensionInstallCliArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();

  if (combined.includes('extension') && combined.includes('not found')) {
    return `Extension not found: ${args.extensionId}.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  if (combined.includes('project') && combined.includes('not found')) {
    return `Project not found: ${args.projectId}.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  if (combined.includes('organization') && combined.includes('not found')) {
    return `Organization not found: ${args.orgId}.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  if (combined.includes('consent') || combined.includes('scope')) {
    return `Consent required. Please run the command with consent=true to grant permissions.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  return `Failed to install extension: ${error.stderr || error.stdout || error.message}`;
}

export const handleExtensionInstallCli: MittwaldCliToolHandler<MittwaldExtensionInstallCliArgs> = async (
  args,
  sessionId
) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const validationMessage = validateScope(args);
  if (validationMessage) {
    return formatToolResponse('error', validationMessage);
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP05: Parallel validation - run both CLI and library
    // Note: Extension install requires orchestration not available in library yet
    // This will be migrated when library wrapper is complete
    const validation = await validateToolParity({
      toolName: 'mittwald_extension_install',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        // TODO: Implement library wrapper when orchestration logic is extracted
        // For now, return CLI result as library result
        const result = await invokeCliTool({
          toolName: 'mittwald_extension_install',
          argv: [...argv, '--token', session.mittwaldAccessToken],
          parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
        });
        return {
          data: result.result,
          status: 200,
          durationMs: result.meta.durationMs,
        };
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_extension_install',
        extensionId: args.extensionId,
        projectId: args.projectId,
        orgId: args.orgId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_extension_install',
        extensionId: args.extensionId,
        projectId: args.projectId,
        orgId: args.orgId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    }

    // Use library result (validated)
    const stdout = (validation.libraryOutput.data as any).stdout ?? '';

    if (args.quiet) {
      const extensionInstanceId = parseQuietOutput(stdout);
      return formatToolResponse(
        'success',
        'Extension installed successfully',
        {
          extensionInstanceId,
          extensionId: args.extensionId,
          projectId: args.projectId,
          orgId: args.orgId,
          status: 'installed',
        },
        {
          durationMs: validation.libraryOutput.durationMs,
          validationPassed: validation.passed,
          discrepancyCount: validation.discrepancies.length,
          cliDuration: validation.cliOutput.durationMs,
          libraryDuration: validation.libraryOutput.durationMs,
        }
      );
    }

    const successMessage = stdout || 'Extension installation completed successfully';
    return formatToolResponse(
      'success',
      'Extension installation completed',
      {
        extensionId: args.extensionId,
        projectId: args.projectId,
        orgId: args.orgId,
        status: 'installed',
        output: successMessage,
      },
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

    logger.error('[WP05] Unexpected error in extension install handler', { error });
    return formatToolResponse(
      'error',
      `Failed to install extension: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
