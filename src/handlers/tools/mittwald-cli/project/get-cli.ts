import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { parseJsonOutput } from '../../../../utils/cli-wrapper.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldProjectGetArgs {
  projectId: string;
  output?: 'txt' | 'json' | 'yaml';
}

function buildCliArgs(args: MittwaldProjectGetArgs): string[] {
  const cliArgs: string[] = ['project', 'get', args.projectId, '--output', 'json'];
  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldProjectGetArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const detail = error.stderr || error.stdout || error.message;

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId}.\nError: ${detail}`;
  }

  if (combined.includes('authentication') || combined.includes('unauthorized')) {
    return `Authentication failed. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${detail}`;
  }

  if (combined.includes('permission') || combined.includes('forbidden')) {
    return `Permission denied. You may not have the required permissions to access this project.\nError: ${detail}`;
  }

  return `Failed to get project details: ${detail}`;
}

export const handleProjectGetCli: MittwaldCliToolHandler<MittwaldProjectGetArgs> = async (args) => {
  if (!args.projectId) {
    return formatToolResponse('error', 'Project ID is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_project_get',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';

    try {
      const data = parseJsonOutput(stdout);

      if (!data || typeof data !== 'object') {
        return formatToolResponse(
          'error',
          'Unexpected output format from CLI command',
          {
            projectId: args.projectId,
            rawOutput: stdout || stderr,
          },
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      }

      const project = data as Record<string, unknown>;

      return formatToolResponse(
        'success',
        `Project details for ${args.projectId}`,
        {
          id: project.id,
          shortId: project.shortId,
          description: project.description,
          createdAt: project.createdAt,
          serverId: project.serverId,
          enabled: project.enabled,
          readiness: project.readiness,
          projectHostingSettings: project.projectHostingSettings,
          clusterSettings: project.clusterSettings,
          outputFormat: 'json',
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    } catch (parseError) {
      const message = parseError instanceof Error ? parseError.message : String(parseError);
      return formatToolResponse(
        'success',
        'Project details retrieved (raw output)',
        {
          projectId: args.projectId,
          rawOutput: stdout || stderr,
          parseError: message,
          outputFormat: 'json',
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

    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
