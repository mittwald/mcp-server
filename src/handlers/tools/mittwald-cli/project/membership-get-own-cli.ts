import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

export interface MittwaldProjectMembershipGetOwnArgs {
  projectId: string;
  output?: 'txt' | 'json' | 'yaml';
}

function buildCliArgs(args: MittwaldProjectMembershipGetOwnArgs): string[] {
  return [
    'project',
    'membership',
    'get-own',
    '--output',
    'json',
    '--project-id',
    args.projectId,
  ];
}

function mapCliError(error: CliToolError, args: MittwaldProjectMembershipGetOwnArgs): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}\n${error.message}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('project')) {
    const details = stderr || stdout || error.message;
    return `Project not found. Please verify the project ID: ${args.projectId}.\nError: ${details}`;
  }

  if (combined.includes('not found') && (combined.includes('membership') || combined.includes('member'))) {
    const details = stderr || stdout || error.message;
    return `You are not a member of this project: ${args.projectId}.\nError: ${details}`;
  }

  if (error.kind === 'AUTHENTICATION' || combined.includes('not authenticated') || combined.includes('401')) {
    const details = stderr || stdout || error.message;
    return `Authentication failed. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${details}`;
  }

  if (combined.includes('forbidden') || combined.includes('403')) {
    const details = stderr || stdout || error.message;
    return `Access denied. You don't have permission to view this project.\nError: ${details}`;
  }

  const details = stderr || stdout || error.message;
  return `Failed to get own project membership: ${details}`;
}

function formatMembership(record: Record<string, unknown>) {
  const project = (record.project ?? {}) as Record<string, unknown>;

  return {
    id: record.id,
    userId: record.userId,
    projectId: record.projectId,
    projectName: record.projectName ?? project.name,
    role: record.role ?? record.projectRole,
    status: record.status ?? 'active',
    createdAt: record.createdAt,
    expiresAt: record.expiresAt ?? record.membershipExpiresAt ?? 'Never',
    permissions: record.permissions ?? record.projectPermissions,
  };
}

export const handleProjectMembershipGetOwnCli: MittwaldCliToolHandler<MittwaldProjectMembershipGetOwnArgs> = async (args) => {
  if (!args.projectId) {
    return formatToolResponse('error', 'Project ID is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_project_membership_get_own',
      argv,
    });

    const commandMeta = {
      command: result.meta.command,
      durationMs: result.meta.durationMs,
    };

    const output = result.result ?? '';

    try {
      const parsed = JSON.parse(output);

      if (!parsed || typeof parsed !== 'object') {
        return formatToolResponse('error', 'Unexpected output format from CLI command');
      }

      const formatted = formatMembership(parsed as Record<string, unknown>);

      return formatToolResponse(
        'success',
        'Own project membership retrieved successfully',
        formatted,
        commandMeta
      );
    } catch (parseError) {
      return formatToolResponse(
        'success',
        'Own project membership retrieved (raw output)',
        {
          rawOutput: output,
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
        },
        commandMeta
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
