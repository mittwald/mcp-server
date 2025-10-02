import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldUserSessionListArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

interface RawSessionItem {
  id?: string;
  tokenId?: string;
  createdAt?: string;
  expiresAt?: string;
  userAgent?: string;
  ipAddress?: string;
  [key: string]: unknown;
}

function buildCliArgs(args: MittwaldUserSessionListArgs): string[] {
  const argv = ['user', 'session', 'list', '--output', 'json'];

  if (args.extended) argv.push('--extended');
  if (args.noHeader) argv.push('--no-header');
  if (args.noTruncate) argv.push('--no-truncate');
  if (args.noRelativeDates) argv.push('--no-relative-dates');
  if (args.csvSeparator && args.output === 'csv') {
    argv.push('--csv-separator', args.csvSeparator);
  }

  return argv;
}

function parseSessionList(stdout: string): RawSessionItem[] {
  const lines = stdout.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || (!line.startsWith('[') && !line.startsWith('{'))) continue;

    let snippet = line;
    for (let j = i + 1; j < lines.length; j++) {
      snippet += '\n' + lines[j];
      try {
        const parsed = JSON.parse(snippet);
        if (Array.isArray(parsed)) {
          return parsed as RawSessionItem[];
        }
      } catch {
        // Keep collecting until JSON parses successfully
      }
    }

    const parsed = JSON.parse(snippet);
    if (Array.isArray(parsed)) {
      return parsed as RawSessionItem[];
    }
  }

  const parsed = JSON.parse(stdout);
  if (Array.isArray(parsed)) {
    return parsed as RawSessionItem[];
  }

  throw new Error('Unexpected output format from CLI command');
}

function mapCliError(error: CliToolError): string {
  const stdout = error.stdout ?? '';
  const stderr = error.stderr ?? '';
  const rawMessage = stderr || stdout || error.message;
  return `Failed to list sessions: ${rawMessage}`;
}

export const handleUserSessionListCli: MittwaldCliToolHandler<MittwaldUserSessionListArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_user_session_list',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';

    try {
      const sessions = parseSessionList(stdout);

      if (sessions.length === 0) {
        return formatToolResponse(
          'success',
          'No active sessions found',
          [],
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      }

      const formattedData = sessions.map((session) => ({
        id: session.id,
        tokenId: session.tokenId,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        ...session,
      }));

      return formatToolResponse(
        'success',
        `Found ${sessions.length} active session(s)`,
        formattedData,
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    } catch (parseError) {
      return formatToolResponse(
        'success',
        'Sessions retrieved (raw output)',
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
