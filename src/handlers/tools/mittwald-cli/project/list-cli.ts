import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldProjectListArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  csvSeparator?: ',' | ';';
  noHeader?: boolean;
  noRelativeDates?: boolean;
  noTruncate?: boolean;
}

function buildCliArgs(args: MittwaldProjectListArgs): string[] {
  const cliArgs: string[] = ['project', 'list', '--output', 'json'];

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

  if (error.kind === 'AUTHENTICATION' || combined.includes('authentication') || combined.includes('unauthorized')) {
    const details = stderr || stdout || error.message;
    return `Authentication failed. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${details}`;
  }

  const details = stderr || stdout || error.message;
  return `Failed to list projects: ${details}`;
}

function formatProjects(data: unknown[]): Array<{
  id: unknown;
  shortId: unknown;
  description: unknown;
  createdAt: unknown;
  serverId: unknown;
  enabled: unknown;
  readiness: unknown;
}> {
  return data.map((item) => {
    const record = (item ?? {}) as Record<string, unknown>;
    return {
      id: record.id,
      shortId: record.shortId,
      description: record.description,
      createdAt: record.createdAt,
      serverId: record.serverId,
      enabled: record.enabled,
      readiness: record.readiness,
    };
  });
}

export const handleMittwaldProjectListCli: MittwaldCliToolHandler<MittwaldProjectListArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_project_list',
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
        return formatToolResponse('success', 'No projects found', [], commandMeta);
      }

      const formatted = formatProjects(parsed);

      return formatToolResponse(
        'success',
        `Found ${formatted.length} project(s)`,
        formatted,
        commandMeta
      );
    } catch (parseError) {
      return formatToolResponse(
        'success',
        'Projects retrieved (raw output)',
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
