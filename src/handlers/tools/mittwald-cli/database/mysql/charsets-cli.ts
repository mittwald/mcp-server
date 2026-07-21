import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { parseJsonOutput } from '@/utils/cli-output.js';
import { invokeCliTool, CliToolError } from '@/tools/index.js';

type MittwaldDatabaseMysqlCharsetsArgs = Record<string, never>;

export const handleDatabaseMysqlCharsetsCli: MittwaldToolHandler<MittwaldDatabaseMysqlCharsetsArgs> = async () => {
  const cliArgs: string[] = ['database', 'mysql', 'charsets', '--output', 'json'];

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_database_mysql_charsets',
      argv: cliArgs,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';

    try {
      const charsets = parseJsonOutput(stdout || stderr);
      return formatToolResponse(
        'success',
        `Successfully retrieved ${Array.isArray(charsets) ? charsets.length : 'MySQL'} character sets and collations`,
        charsets,
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
  } catch (error) {
    if (error instanceof CliToolError) {
      const errorMessage = error.stderr || error.stdout || error.message;
      const combined = `${error.stderr ?? ''}${error.stdout ?? ''}`.toLowerCase();

      if (combined.includes('403') || combined.includes('forbidden') || combined.includes('permission denied')) {
        return formatToolResponse(
          'error',
          `Permission denied when listing MySQL charsets. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorMessage}`
        );
      }

      return formatToolResponse('error', `Failed to list MySQL charsets: ${errorMessage}`);
    }

    return formatToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
