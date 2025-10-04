import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { parseJsonOutput } from '../../../../utils/cli-output.js';

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

export const handleExtensionListInstalledCli: MittwaldToolHandler<MittwaldExtensionListInstalledCliArgs> = async (args) => {
  const validationMessage = validateScope(args);
  if (validationMessage) {
    return formatToolResponse('error', validationMessage);
  }

  const cliArgs: string[] = ['extension', 'list-installed', '--output', 'json'];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.orgId) cliArgs.push('--org-id', args.orgId);
  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_extension_list_installed',
      argv: cliArgs,
    });

    const stdout = result.result ?? '';

    try {
      const parsed = parseJsonOutput(stdout);

      if (!Array.isArray(parsed)) {
        return formatToolResponse(
          'error',
          'Unexpected output format from CLI command',
          undefined,
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      }

      const data = parsed.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);

      if (data.length === 0) {
        return formatToolResponse(
          'success',
          'No installed extensions found',
          [],
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
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

      return formatToolResponse(
        'success',
        `Found ${data.length} installed extension(s)`,
        formattedData,
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    } catch (parseError) {
      return formatToolResponse(
        'success',
        'Installed extensions retrieved (raw output)',
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
