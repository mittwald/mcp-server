import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { parseJsonOutput } from '../../../../utils/cli-wrapper.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

export interface MittwaldOrgInviteListArgs {
  orgId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

interface BuildArgsResult {
  argv: string[];
  orgId: string;
  outputFormat: Required<MittwaldOrgInviteListArgs>['output'];
}

function resolveOrgId(args: MittwaldOrgInviteListArgs, context: unknown): string | undefined {
  return args.orgId || (context as { orgId?: string } | undefined)?.orgId;
}

function buildCliArgs(args: MittwaldOrgInviteListArgs, orgId: string): BuildArgsResult {
  const outputFormat = args.output ?? 'txt';
  const argv: string[] = ['org', 'invite', 'list', '--org-id', orgId, '--output', outputFormat];

  if (args.extended) argv.push('--extended');
  if (args.noHeader) argv.push('--no-header');
  if (args.noTruncate) argv.push('--no-truncate');
  if (args.noRelativeDates) argv.push('--no-relative-dates');
  if (args.csvSeparator && (outputFormat === 'csv' || outputFormat === 'tsv')) {
    argv.push('--csv-separator', args.csvSeparator);
  }

  return { argv, orgId, outputFormat };
}

function mapCliError(error: CliToolError, orgId: string): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const errorMessage = error.stderr || error.stdout || error.message;

  if (combined.includes('not found')) {
    return `Organization not found: ${orgId}.\nError: ${errorMessage}`;
  }

  if (combined.includes('permission denied') || combined.includes('forbidden')) {
    return `Permission denied when listing organization invites.\nError: ${errorMessage}`;
  }

  return `Failed to list organization invites: ${errorMessage}`;
}

export const handleOrgInviteListCli: MittwaldToolHandler<MittwaldOrgInviteListArgs> = async (args, { orgContext }) => {
  const orgId = resolveOrgId(args, orgContext);
  if (!orgId) {
    return formatToolResponse('error', 'Organization ID is required. Either provide it as a parameter or set a default org in the context.');
  }

  const { argv, outputFormat } = buildCliArgs(args, orgId);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_org_invite_list',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const output = stdout || stderr;

    if (outputFormat === 'json') {
      try {
        const data = parseJsonOutput(stdout);
        const count = Array.isArray(data) ? data.length : 0;

        return formatToolResponse(
          'success',
          `Found ${count} organization invite(s)`,
          data,
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return formatToolResponse(
          'success',
          'Organization invites retrieved (raw output)',
          {
            rawOutput: stdout,
            parseError: message,
          },
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      }
    }

    return formatToolResponse(
      'success',
      'Organization invites retrieved',
      {
        output,
        format: outputFormat,
        orgId,
      },
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, orgId);
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
