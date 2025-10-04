import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { parseJsonOutput } from '../../../../utils/cli-output.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

export interface MittwaldOrgInviteListOwnArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function buildCliArgs(args: MittwaldOrgInviteListOwnArgs): { argv: string[]; outputFormat: Required<MittwaldOrgInviteListOwnArgs>['output'] } {
  const outputFormat = args.output ?? 'txt';
  const argv: string[] = ['org', 'invite', 'list-own', '--output', outputFormat];

  if (args.extended) argv.push('--extended');
  if (args.noHeader) argv.push('--no-header');
  if (args.noTruncate) argv.push('--no-truncate');
  if (args.noRelativeDates) argv.push('--no-relative-dates');
  if (args.csvSeparator && (outputFormat === 'csv' || outputFormat === 'tsv')) {
    argv.push('--csv-separator', args.csvSeparator);
  }

  return { argv, outputFormat };
}

function mapCliError(error: CliToolError): string {
  const errorMessage = error.stderr || error.stdout || error.message;
  return `Failed to list user's organization invites: ${errorMessage}`;
}

export const handleOrgInviteListOwnCli: MittwaldToolHandler<MittwaldOrgInviteListOwnArgs> = async (args) => {
  const { argv, outputFormat } = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_org_invite_list_own',
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
          `Found ${count} organization invite(s) for the user`,
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
          "User's organization invites retrieved (raw output)",
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
      "User's organization invites retrieved",
      {
        output,
        format: outputFormat,
      },
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
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
