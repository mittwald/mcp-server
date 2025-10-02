import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldRegistryUpdateCliArgs {
  registryId: string;
  description?: string;
  uri?: string;
  username?: string;
  password?: string;
}

function buildCliArgs(args: MittwaldRegistryUpdateCliArgs): string[] {
  const cliArgs: string[] = ['registry', 'update', args.registryId];

  if (args.description) cliArgs.push('--description', args.description);
  if (args.uri) cliArgs.push('--uri', args.uri);
  if (args.username) cliArgs.push('--username', args.username);
  if (args.password) cliArgs.push('--password', args.password);

  return cliArgs;
}


function mapCliError(error: CliToolError, args: MittwaldRegistryUpdateCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('registry')) {
    return `Registry not found: ${args.registryId}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('already exists') || combined.includes('duplicate')) {
    return `Registry with URI '${args.uri ?? ''}' already exists.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

function buildUpdateSummary(args: MittwaldRegistryUpdateCliArgs) {
  return {
    description: args.description,
    uri: args.uri,
    username: args.username,
  };
}

export const handleRegistryUpdateCli: MittwaldCliToolHandler<MittwaldRegistryUpdateCliArgs> = async (args) => {
  if (!args.registryId) {
    return formatToolResponse('error', 'Registry ID is required. Please provide the registryId parameter.');
  }

  if (!args.description && !args.uri && !args.username && !args.password) {
    return formatToolResponse('error', 'At least one update parameter must be provided (description, uri, username, password).');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_registry_update',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout || '';
    const stderr = result.result.stderr || '';
    const output = stdout || stderr || 'Registry updated successfully';
    const updates = buildUpdateSummary(args);

    return formatToolResponse(
      'success',
      'Registry update completed',
      {
        registryId: args.registryId,
        status: 'updated',
        updates,
        output,
      },
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
