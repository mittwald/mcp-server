import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { parseJsonOutput } from '../../../../utils/cli-output.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldExtensionListCliArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleExtensionListCli: MittwaldCliToolHandler<MittwaldExtensionListCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const cliArgs = ['extension', 'list', '--output', 'json'];
    if (args.extended) cliArgs.push('--extended');
    if (args.noHeader) cliArgs.push('--no-header');
    if (args.noTruncate) cliArgs.push('--no-truncate');
    if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
    if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

    const result = await invokeCliTool({
      toolName: 'mittwald_extension_list',
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
        return formatToolResponse('success', 'No extensions found', [], {
          durationMs,
        });
      }

      const formattedData = data.map((item) => ({
        id: item.id,
        name: item.name,
        context: item.context,
        subTitle: item.subTitle,
        description: item.description,
        scopes: Array.isArray(item.scopes) ? item.scopes : [],
        tags: Array.isArray(item.tags) ? item.tags : [],
      }));

      return formatToolResponse('success', `Found ${data.length} extension(s)`, formattedData, {
        durationMs,
      });
    } catch (parseError) {
      return formatToolResponse(
        'success',
        'Extensions retrieved (raw output)',
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
      return formatToolResponse('error', error.message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP06] Unexpected error in extension list handler', { error });
    return formatToolResponse(
      'error',
      `Failed to list extensions: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
