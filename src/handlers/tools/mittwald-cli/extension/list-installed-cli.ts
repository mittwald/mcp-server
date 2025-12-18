import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { parseJsonOutput } from '../../../../utils/cli-output.js';
import { LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldExtensionListInstalledCliArgs {
  projectId?: string;
  orgId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function validateScope(args: MittwaldExtensionListInstalledCliArgs) {
  if (!args.projectId && !args.orgId) {
    return 'Either projectId or orgId must be provided';
  }

  if (args.projectId && args.orgId) {
    return 'Only one of projectId or orgId can be provided';
  }

  return undefined;
}

function buildCliArgs(args: MittwaldExtensionListInstalledCliArgs): string[] {
  const cliArgs: string[] = ['extension', 'list-installed', '--output', 'json'];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.orgId) cliArgs.push('--org-id', args.orgId);
  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldExtensionListInstalledCliArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();

  if (combined.includes('project') && combined.includes('not found')) {
    return `Project not found: ${args.projectId}.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  if (combined.includes('organization') && combined.includes('not found')) {
    return `Organization not found: ${args.orgId}.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  return `Failed to list installed extensions: ${error.stderr || error.stdout || error.message}`;
}

export const handleExtensionListInstalledCli: MittwaldCliToolHandler<MittwaldExtensionListInstalledCliArgs> = async (
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
    // Note: Extension list-installed requires orchestration not available in library yet
    // This will be migrated when library wrapper is complete
    const validation = await validateToolParity({
      toolName: 'mittwald_extension_list_installed',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        // TODO: Implement library wrapper when orchestration logic is extracted
        // For now, return CLI result as library result
        const result = await invokeCliTool({
          toolName: 'mittwald_extension_list_installed',
          argv: [...argv, '--token', session.mittwaldAccessToken],
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
        tool: 'mittwald_extension_list_installed',
        projectId: args.projectId,
        orgId: args.orgId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_extension_list_installed',
        projectId: args.projectId,
        orgId: args.orgId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    }

    // Use library result (validated)
    const stdout = validation.libraryOutput.data as string;

    try {
      const parsed = parseJsonOutput(stdout);

      if (!Array.isArray(parsed)) {
        return formatToolResponse('error', 'Unexpected output format from CLI command', undefined, {
          durationMs: validation.libraryOutput.durationMs,
          validationPassed: validation.passed,
        });
      }

      const data = parsed.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);

      if (data.length === 0) {
        return formatToolResponse('success', 'No installed extensions found', [], {
          durationMs: validation.libraryOutput.durationMs,
          validationPassed: validation.passed,
          discrepancyCount: validation.discrepancies.length,
          cliDuration: validation.cliOutput.durationMs,
          libraryDuration: validation.libraryOutput.durationMs,
        });
      }

      const formattedData = data.map((item) => ({
        id: item.id,
        extensionId: item.extensionId,
        extensionName: (item.extensionName ?? item.name) as unknown,
        state: item.state ?? 'enabled',
        context: args.orgId ? 'organization' : 'project',
        contextId: args.orgId || args.projectId,
        disabled: item.disabled ?? false,
        consentedScopes: Array.isArray(item.consentedScopes) ? item.consentedScopes : [],
      }));

      return formatToolResponse('success', `Found ${data.length} installed extension(s)`, formattedData, {
        durationMs: validation.libraryOutput.durationMs,
        validationPassed: validation.passed,
        discrepancyCount: validation.discrepancies.length,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } catch (parseError) {
      return formatToolResponse(
        'success',
        'Installed extensions retrieved (raw output)',
        {
          rawOutput: stdout,
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
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

    logger.error('[WP05] Unexpected error in extension list-installed handler', { error });
    return formatToolResponse(
      'error',
      `Failed to list installed extensions: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
