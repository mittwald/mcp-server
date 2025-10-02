import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

export interface MittwaldProjectMembershipListOwnArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function buildCliArgs(args: MittwaldProjectMembershipListOwnArgs): string[] {
  const cliArgs: string[] = ['project', 'membership', 'list-own', '--output', 'json'];

  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

function mapCliError(error: CliToolError): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}\n${error.message}`.toLowerCase();

  if (error.kind === 'AUTHENTICATION' || combined.includes('not authenticated') || combined.includes('401')) {
    const details = stderr || stdout || error.message;
    return `Authentication failed. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${details}`;
  }

  const details = stderr || stdout || error.message;
  return `Failed to list own project memberships: ${details}`;
}

function formatMembership(record: Record<string, unknown>) {
  const project = (record.project ?? {}) as Record<string, unknown>;

  return {
    id: record.id,
    projectId: record.projectId,
    projectName: record.projectName ?? project.name,
    role: record.role ?? record.projectRole,
    status: record.status ?? 'active',
    createdAt: record.createdAt,
    expiresAt: record.expiresAt ?? record.membershipExpiresAt ?? 'Never',
    userId: record.userId,
  };
}

export const handleProjectMembershipListOwnCli: MittwaldCliToolHandler<MittwaldProjectMembershipListOwnArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_project_membership_list_own',
      argv,
    });

    const commandMeta = {
      command: result.meta.command,
      durationMs: result.meta.durationMs,
    };

    const output = result.result ?? '';

    try {
      const parsed = JSON.parse(output);

      if (!Array.isArray(parsed)) {
        return formatToolResponse('error', 'Unexpected output format from CLI command');
      }

      if (parsed.length === 0) {
        return formatToolResponse('success', 'No project memberships found for the current user', [], commandMeta);
      }

      const formatted = parsed.map((item) => formatMembership((item ?? {}) as Record<string, unknown>));

      return formatToolResponse(
        'success',
        `Found ${formatted.length} project membership(s) for the current user`,
        formatted,
        commandMeta
      );
    } catch (parseError) {
      return formatToolResponse(
        'success',
        'Own project memberships retrieved (raw output)',
        {
          rawOutput: output,
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
        },
        commandMeta
      );
    }
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error);
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
