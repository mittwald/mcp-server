import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldProjectUpdateArgs {
  projectId: string;
  description?: string;
  quiet?: boolean;
}

function buildCliArgs(args: MittwaldProjectUpdateArgs): string[] {
  const cliArgs: string[] = ['project', 'update', args.projectId];

  if (args.description) cliArgs.push('--description', args.description);
  if (args.quiet) cliArgs.push('--quiet');

  return cliArgs;
}

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1);
}

function mapCliError(error: CliToolError, args: MittwaldProjectUpdateArgs): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}\n${error.message}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('project')) {
    const details = stderr || stdout || error.message;
    return `Project not found. Please verify the project ID: ${args.projectId}.\nError: ${details}`;
  }

  if (error.kind === 'AUTHENTICATION' || combined.includes('authentication') || combined.includes('unauthorized')) {
    const details = stderr || stdout || error.message;
    return `Authentication failed. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${details}`;
  }

  if (combined.includes('permission') || combined.includes('forbidden')) {
    const details = stderr || stdout || error.message;
    return `Permission denied. You may not have the required permissions to update this project.\nError: ${details}`;
  }

  const details = stderr || stdout || error.message;
  return `Failed to update project: ${details}`;
}

function buildSuccessPayload(args: MittwaldProjectUpdateArgs, output: string, quietValue?: string) {
  return {
    projectId: args.projectId,
    description: args.description,
    quietOutput: quietValue,
    output,
  };
}

export const handleProjectUpdateCli: MittwaldCliToolHandler<MittwaldProjectUpdateArgs> = async (args) => {
  if (!args.projectId) {
    return formatToolResponse('error', 'Project ID is required.');
  }

  if (!args.description) {
    return formatToolResponse('error', 'No update parameters provided. Please specify at least one field to update (e.g., description).');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_project_update',
      argv,
      parser: (stdout) => stdout,
    });

    const commandMeta = {
      command: result.meta.command,
      durationMs: result.meta.durationMs,
    };

    const stdout = result.result ?? '';

    if (args.quiet) {
      const quietValue = parseQuietOutput(stdout) ?? args.projectId;
      return formatToolResponse(
        'success',
        `Project ${args.projectId} updated successfully`,
        buildSuccessPayload(args, stdout, quietValue),
        commandMeta
      );
    }

    return formatToolResponse(
      'success',
      `Project ${args.projectId} updated successfully`,
      buildSuccessPayload(args, stdout),
      commandMeta
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
