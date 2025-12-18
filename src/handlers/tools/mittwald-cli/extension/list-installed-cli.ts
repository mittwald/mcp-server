import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { parseJsonOutput } from '../../../../utils/cli-output.js';
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

  try {
    const cliArgs = ['extension', 'list-installed', '--output', 'json'];
    if (args.projectId) cliArgs.push('--project-id', args.projectId);
    if (args.orgId) cliArgs.push('--org-id', args.orgId);
    if (args.extended) cliArgs.push('--extended');
    if (args.noHeader) cliArgs.push('--no-header');
    if (args.noTruncate) cliArgs.push('--no-truncate');
    if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
    if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

    const result = await invokeCliTool({
      toolName: 'mittwald_extension_list_installed',
      argv: [...cliArgs, '--token', session.mittwaldAccessToken],
    });

    const stdout = result.result as string;
    const durationMs = result.meta.durationMs;

    try {
      const parsed = parseJsonOutput(stdout);

      if (!Array.isArray(parsed)) {
        return formatToolResponse('error', 'Unexpected output format from CLI command', undefined, {
          durationMs,
        });
      }

      const data = parsed.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);

      if (data.length === 0) {
        return formatToolResponse('success', 'No installed extensions found', [], {
          durationMs,
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
        durationMs,
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
          durationMs,
        }
      );
    }
  } catch (error) {
    if (error instanceof CliToolError) {
      const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
      let message = `Failed to list installed extensions: ${error.stderr || error.stdout || error.message}`;

      if (combined.includes('project') && combined.includes('not found')) {
        message = `Project not found: ${args.projectId}.\nError: ${error.stderr || error.stdout || error.message}`;
      } else if (combined.includes('organization') && combined.includes('not found')) {
        message = `Organization not found: ${args.orgId}.\nError: ${error.stderr || error.stdout || error.message}`;
      }

      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP06] Unexpected error in extension list-installed handler', { error });
    return formatToolResponse(
      'error',
      `Failed to list installed extensions: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
