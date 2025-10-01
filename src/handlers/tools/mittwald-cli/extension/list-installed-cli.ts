import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { parseJsonOutput } from '../../../../utils/cli-wrapper.js';

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

function validateContext(args: MittwaldExtensionListInstalledCliArgs): string | undefined {
  if (!args.projectId && !args.orgId) {
    return 'Either projectId or orgId must be provided';
  }

  if (args.projectId && args.orgId) {
    return 'Only one of projectId or orgId can be provided';
  }

  return undefined;
}

function buildCliArgs(args: MittwaldExtensionListInstalledCliArgs): string[] {
  const cliArgs: string[] = ['extension', 'list-installed'];

  cliArgs.push('--output', 'json');

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.orgId) cliArgs.push('--org-id', args.orgId);
  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

type RawInstalledExtension = {
  id?: string;
  extensionId?: string;
  extensionName?: string;
  name?: string;
  state?: string;
  disabled?: boolean;
  consentedScopes?: string[];
};

function parseInstalledExtensions(output: string): { items?: RawInstalledExtension[]; error?: string } {
  if (!output) return { items: [] };

  try {
    const data = parseJsonOutput(output);
    return Array.isArray(data) ? { items: data } : { error: 'Unexpected output format from CLI command' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

function mapCliError(error: CliToolError, args: MittwaldExtensionListInstalledCliArgs): string {
  const combined = `${error.stderr ?? ''} ${error.stdout ?? ''}`.toLowerCase();

  if (combined.includes('not found') && (combined.includes('project') || combined.includes('organization'))) {
    return `Resource not found. Please verify the ${args.projectId ? 'project' : 'organization'} ID: ${args.projectId || args.orgId}.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  return `Failed to list installed extensions: ${error.stderr || error.stdout || error.message}`;
}

export const handleExtensionListInstalledCli: MittwaldCliToolHandler<MittwaldExtensionListInstalledCliArgs> = async (args) => {
  const validationMessage = validateContext(args);
  if (validationMessage) {
    return formatToolResponse('error', validationMessage);
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_extension_list_installed',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const { items, error: parseError } = parseInstalledExtensions(stdout);

    if (!items) {
      return formatToolResponse(
        'success',
        'Installed extensions retrieved (raw output)',
        {
          rawOutput: stdout,
          stderr,
          parseError,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    if (items.length === 0) {
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

    const formattedData = items.map((item) => ({
      id: item.id,
      extensionId: item.extensionId,
      extensionName: item.extensionName || item.name,
      state: item.state || 'enabled',
      context: args.orgId ? 'organization' : 'project',
      contextId: args.orgId || args.projectId,
      disabled: item.disabled || false,
      consentedScopes: item.consentedScopes || [],
    }));

    return formatToolResponse(
      'success',
      `Found ${formattedData.length} installed extension(s)`,
      formattedData,
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
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

    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
