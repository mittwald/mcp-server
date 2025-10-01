import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldUserApiTokenListArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function buildCliArgs(args: MittwaldUserApiTokenListArgs): string[] {
  const cliArgs: string[] = ['user', 'api-token', 'list', '--output', 'json'];

  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator && args.output === 'csv') cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

function parseTokenList(output: string): Record<string, unknown>[] {
  if (!output.trim()) {
    return [];
  }

  const lines = output.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('[') && !line.startsWith('{')) {
      continue;
    }

    let jsonStr = line;
    for (let j = i + 1; j < lines.length; j++) {
      jsonStr += '\n' + lines[j];
      try {
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
          return parsed.filter((item) => typeof item === 'object' && item !== null) as Record<string, unknown>[];
        }
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return [parsed as Record<string, unknown>];
        }
      } catch {
        // Continue collecting lines until JSON parses
      }
    }

    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === 'object' && item !== null) as Record<string, unknown>[];
    }
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return [parsed as Record<string, unknown>];
    }
  }

  const parsed = JSON.parse(output);
  if (Array.isArray(parsed)) {
    return parsed.filter((item) => typeof item === 'object' && item !== null) as Record<string, unknown>[];
  }
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return [parsed as Record<string, unknown>];
  }

  throw new Error('Parsed output is not an array.');
}

function formatTokenData(items: Record<string, unknown>[]) {
  return items.map((item) => ({
    id: item.id,
    description: item.description,
    roles: item.roles,
    createdAt: item.createdAt,
    expiresAt: item.expiresAt,
    ...item,
  }));
}

function mapCliError(error: CliToolError): string {
  const rawMessage = error.stderr || error.stdout || error.message;
  return `Failed to list API tokens: ${rawMessage}`;
}

export const handleUserApiTokenListCli: MittwaldCliToolHandler<MittwaldUserApiTokenListArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_user_api_token_list',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';

    try {
      const parsed = parseTokenList(stdout);

      if (parsed.length === 0) {
        return formatToolResponse(
          'success',
          'No API tokens found',
          [],
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      }

      const formatted = formatTokenData(parsed);
      return formatToolResponse(
        'success',
        `Found ${formatted.length} API token(s)`,
        formatted,
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    } catch (parseError) {
      return formatToolResponse(
        'success',
        'API tokens retrieved (raw output)',
        {
          rawOutput: stdout || stderr,
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
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

    return formatToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
