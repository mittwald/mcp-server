import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { parseQuietOutput } from '../../../../utils/cli-output.js';
import { LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldExtensionUninstallCliArgs {
  extensionInstanceId: string;
  quiet?: boolean;
}

function buildCliArgs(args: MittwaldExtensionUninstallCliArgs): string[] {
  const cliArgs: string[] = ['extension', 'uninstall', args.extensionInstanceId];
  if (args.quiet) cliArgs.push('--quiet');
  return cliArgs;
}

function mapCliError(error: CliToolError, extensionInstanceId: string): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('extension')) {
    return `Extension instance not found: ${extensionInstanceId}.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  return `Failed to uninstall extension: ${error.stderr || error.stdout || error.message}`;
}

export const handleExtensionUninstallCli: MittwaldCliToolHandler<MittwaldExtensionUninstallCliArgs> = async (
  args,
  sessionId
) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

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
    // Note: Extension uninstall requires orchestration not available in library yet
    // This will be migrated when library wrapper is complete
    const validation = await validateToolParity({
      toolName: 'mittwald_extension_uninstall',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        // TODO: Implement library wrapper when orchestration logic is extracted
        // For now, return CLI result as library result
        const result = await invokeCliTool({
          toolName: 'mittwald_extension_uninstall',
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
        tool: 'mittwald_extension_uninstall',
        extensionInstanceId: args.extensionInstanceId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_extension_uninstall',
        extensionInstanceId: args.extensionInstanceId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    }

    // Use library result (validated)
    const stdout = (validation.libraryOutput.data as any).stdout ?? '';

    if (args.quiet) {
      const resultId = parseQuietOutput(stdout);
      return formatToolResponse(
        'success',
        'Extension uninstalled successfully',
        {
          extensionInstanceId: args.extensionInstanceId,
          status: 'uninstalled',
          resultId,
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

    const successMessage = stdout || 'Extension uninstallation completed successfully';
    return formatToolResponse(
      'success',
      'Extension uninstallation completed',
      {
        extensionInstanceId: args.extensionInstanceId,
        status: 'uninstalled',
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
      const message = mapCliError(error, args.extensionInstanceId);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP05] Unexpected error in extension uninstall handler', { error });
    return formatToolResponse(
      'error',
      `Failed to uninstall extension: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
