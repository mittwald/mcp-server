import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldUserSshKeyGetArgs {
  keyId: string;
  output?: 'txt' | 'json' | 'yaml';
}

interface RawSshKey {
  id?: string;
  comment?: string;
  fingerprint?: string;
  publicKey?: string;
  createdAt?: string;
  expiresAt?: string;
  [key: string]: unknown;
}

function buildCliArgs(keyId: string): string[] {
  return ['user', 'ssh-key', 'get', keyId, '--output', 'json'];
}

function parseSshKey(stdout: string): RawSshKey {
  const trimmed = stdout.trim();
  if (!trimmed) {
    throw new Error('CLI returned empty output.');
  }

  const lines = trimmed.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || (!line.startsWith('{') && !line.startsWith('['))) continue;

    let snippet = line;
    for (let j = i + 1; j < lines.length; j++) {
      snippet += '\n' + lines[j];
      try {
        const parsed = JSON.parse(snippet);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as RawSshKey;
        }
      } catch {
        // continue collecting
      }
    }

    const parsed = JSON.parse(snippet);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as RawSshKey;
    }
  }

  const parsed = JSON.parse(trimmed);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as RawSshKey;
  }

  throw new Error('Unexpected output format from CLI command');
}

function mapCliError(error: CliToolError, keyId: string): string {
  const stdout = error.stdout ?? '';
  const stderr = error.stderr ?? '';
  const combined = `${stdout}\n${stderr}`.toLowerCase();

  if (combined.includes('not found') || combined.includes('no ssh key found')) {
    return `SSH key not found: ${keyId}.\nError: ${stderr || error.message}`;
  }

  const rawMessage = stderr || stdout || error.message;
  return `Failed to get SSH key: ${rawMessage}`;
}

export const handleUserSshKeyGetCli: MittwaldCliToolHandler<MittwaldUserSshKeyGetArgs> = async (args) => {
  if (!args.keyId || !args.keyId.trim()) {
    return formatToolResponse('error', 'SSH key ID is required.');
  }

  const argv = buildCliArgs(args.keyId);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_user_ssh_key_get',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';

    try {
      const key = parseSshKey(stdout);
      const formattedData = {
        id: key.id,
        comment: key.comment,
        fingerprint: key.fingerprint,
        publicKey: key.publicKey,
        createdAt: key.createdAt,
        expiresAt: key.expiresAt,
        ...key,
      };

      return formatToolResponse(
        'success',
        `SSH key information retrieved for ${args.keyId}`,
        formattedData,
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    } catch (parseError) {
      return formatToolResponse(
        'success',
        'SSH key retrieved (raw output)',
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
      const message = mapCliError(error, args.keyId);
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
