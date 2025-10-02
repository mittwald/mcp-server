import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { parseJsonOutput as parseJsonOutputLegacy } from '../../../../../utils/cli-wrapper.js';

interface MittwaldDatabaseMysqlVersionsArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function buildCliArgs(args: MittwaldDatabaseMysqlVersionsArgs): { argv: string[]; outputFormat: string } {
  const argv: string[] = ['database', 'mysql', 'versions'];
  const outputFormat = args.output ?? 'json';
  argv.push('--output', outputFormat);

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
  const combined = `${error.stderr ?? ''} ${error.stdout ?? ''}`.toLowerCase();

  if (combined.includes('403') || combined.includes('forbidden') || combined.includes('permission denied')) {
    return `Permission denied when listing MySQL versions. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  return error.message;
}

export const handleDatabaseMysqlVersionsCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlVersionsArgs> = async (args) => {
  const { argv, outputFormat } = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_database_mysql_versions',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';

    if (outputFormat === 'json') {
      try {
        const versions = parseJsonOutputLegacy(stdout);
        const count = Array.isArray(versions) ? versions.length : 'MySQL';
        return formatToolResponse(
          'success',
          `Successfully retrieved ${count} versions`,
          versions,
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      } catch (error) {
        return formatToolResponse(
          'error',
          `Failed to parse JSON output: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return formatToolResponse(
      'success',
      'MySQL versions retrieved successfully',
      stdout,
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
