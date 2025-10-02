import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldRegistryCreateCliArgs {
  uri: string;
  description: string;
  projectId?: string;
  quiet?: boolean;
  username?: string;
  password?: string;
}

function buildCliArgs(args: MittwaldRegistryCreateCliArgs): string[] {
  const cliArgs: string[] = ['registry', 'create', '--uri', args.uri, '--description', args.description];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.quiet) cliArgs.push('--quiet');
  if (args.username) cliArgs.push('--username', args.username);
  if (args.password) cliArgs.push('--password', args.password);

  return cliArgs;
}

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1);
}

function mapCliError(error: CliToolError, args: MittwaldRegistryCreateCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('already exists') || combined.includes('duplicate')) {
    return `Registry with URI '${args.uri}' already exists.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleRegistryCreateCli: MittwaldCliToolHandler<MittwaldRegistryCreateCliArgs> = async (args) => {
  if (!args.uri) {
    return formatToolResponse('error', "'uri' is required. Please provide the uri parameter.");
  }

  if (!args.description) {
    return formatToolResponse('error', "'description' is required. Please provide the description parameter.");
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_registry_create',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout || '';
    const stderr = result.result.stderr || '';
    const output = stdout || stderr || 'Registry created successfully';

    if (args.quiet) {
      const registryId = parseQuietOutput(stdout);
      return formatToolResponse(
        'success',
        'Registry created successfully',
        {
          registryId,
          uri: args.uri,
          description: args.description,
          projectId: args.projectId,
          username: args.username,
          output,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    return formatToolResponse(
      'success',
      'Registry creation completed',
      {
        uri: args.uri,
        description: args.description,
        projectId: args.projectId,
        username: args.username,
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
