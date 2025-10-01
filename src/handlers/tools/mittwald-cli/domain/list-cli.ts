import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldDomainListArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function buildCliArgs(args: MittwaldDomainListArgs): string[] {
  const cliArgs: string[] = ['domain', 'list'];

  // Enforce JSON output for deterministic parsing; CLI ignores duplicate flags.
  cliArgs.push('--output', 'json');

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator && args.output === 'csv') cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

type RawDomainListItem = {
  domain?: string;
  connected?: boolean;
  deleted?: boolean;
  nameservers?: string[];
  usesDefaultNameserver?: boolean;
  projectId?: string;
  contactHash?: string;
  authCode?: string;
};

interface ParsedDomainListResult {
  items?: RawDomainListItem[];
  error?: string;
}

function parseDomainList(output: string): ParsedDomainListResult {
  if (!output) return { items: undefined };

  try {
    const parsed = JSON.parse(output);
    return Array.isArray(parsed) ? { items: parsed } : { error: 'Unexpected output format from CLI command' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

function mapCliError(error: CliToolError, args: MittwaldDomainListArgs): string {
  const combined = `${error.stderr ?? ''} ${error.stdout ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleDomainListCli: MittwaldCliToolHandler<MittwaldDomainListArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_domain_list',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const { items, error: parseError } = parseDomainList(stdout);

    if (!items) {
      return formatToolResponse(
        'success',
        'Domains retrieved (raw output)',
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
        'No domains found',
        [],
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    const formatted = items.map((item) => ({
      domain: item.domain,
      connected: item.connected,
      deleted: item.deleted,
      nameservers: item.nameservers,
      usesDefaultNameserver: item.usesDefaultNameserver,
      projectId: item.projectId,
      contactHash: item.contactHash,
      authCode: item.authCode,
    }));

    return formatToolResponse(
      'success',
      `Found ${formatted.length} domain(s)`,
      formatted,
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
