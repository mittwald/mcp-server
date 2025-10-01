import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldUserSshKeyListArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

interface RawSshKeyItem {
  id?: string;
  comment?: string;
  fingerprint?: string;
  publicKey?: string;
  createdAt?: string;
  expiresAt?: string;
  [key: string]: unknown;
}

function buildCliArgs(args: MittwaldUserSshKeyListArgs): string[] {
  const argv = ['user', 'ssh-key', 'list', '--output', 'json'];

  if (args.extended) argv.push('--extended');
  if (args.noHeader) argv.push('--no-header');
  if (args.noTruncate) argv.push('--no-truncate');
  if (args.noRelativeDates) argv.push('--no-relative-dates');
  if (args.csvSeparator && args.output === 'csv') {
    argv.push('--csv-separator', args.csvSeparator);
  }

  return argv;
}

function parseSshKeyList(stdout: string): RawSshKeyItem[] {
  const trimmed = stdout.trim();
  if (!trimmed) return [];

  const lines = trimmed.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || (!line.startsWith('[') && !line.startsWith('{'))) continue;

    let snippet = line;
    for (let j = i + 1; j < lines.length; j++) {
      snippet += '\n' + lines[j];
      try {
        const parsed = JSON.parse(snippet);
        if (Array.isArray(parsed)) {
          return parsed as RawSshKeyItem[];
        }
      } catch {
        // continue accumulating
      }
    }

    const parsed = JSON.parse(snippet);
    if (Array.isArray(parsed)) {
      return parsed as RawSshKeyItem[];
    }
  }

  const parsed = JSON.parse(trimmed);
  if (Array.isArray(parsed)) {
    return parsed as RawSshKeyItem[];
  }

  throw new Error('Unexpected output format from CLI command');
}

function mapCliError(error: CliToolError): string {
  const stdout = error.stdout ?? '';
  const stderr = error.stderr ?? '';
  const rawMessage = stderr || stdout || error.message;
  return `Failed to list SSH keys: ${rawMessage}`;
}

export const handleUserSshKeyListCli: MittwaldCliToolHandler<MittwaldUserSshKeyListArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_user_ssh_key_list',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';

    try {
      const keys = parseSshKeyList(stdout);

      if (keys.length === 0) {
        return formatToolResponse(
          'success',
          'No SSH keys found',
          [],
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      }

      const formatted = keys.map((key) => ({
        id: key.id,
        comment: key.comment,
        fingerprint: key.fingerprint,
        publicKey: key.publicKey,
        createdAt: key.createdAt,
        expiresAt: key.expiresAt,
        ...key,
      }));

      return formatToolResponse(
        'success',
        `Found ${keys.length} SSH key(s)`,
        formatted,
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    } catch (parseError) {
      return formatToolResponse(
        'success',
        'SSH keys retrieved (raw output)',
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
