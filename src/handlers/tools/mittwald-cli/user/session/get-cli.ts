import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldUserSessionGetArgs {
  tokenId: string;
  output?: 'txt' | 'json' | 'yaml';
}

interface RawSession {
  id?: string;
  tokenId?: string;
  createdAt?: string;
  expiresAt?: string;
  userAgent?: string;
  ipAddress?: string;
  [key: string]: unknown;
}

function buildCliArgs(tokenId: string): string[] {
  return ['user', 'session', 'get', tokenId, '--output', 'json'];
}

function parseSession(stdout: string): RawSession {
  const lines = stdout.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || (!line.startsWith('{') && !line.startsWith('['))) continue;

    let snippet = line;
    for (let j = i + 1; j < lines.length; j++) {
      snippet += '\n' + lines[j];
      try {
        const parsed = JSON.parse(snippet);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as RawSession;
        }
      } catch {
        // Continue accumulating until JSON parses successfully
      }
    }

    const parsed = JSON.parse(snippet);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as RawSession;
    }
  }

  const parsed = JSON.parse(stdout);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as RawSession;
  }

  throw new Error('Unexpected output format from CLI command');
}

function mapCliError(error: CliToolError, tokenId: string): string {
  const stdout = error.stdout ?? '';
  const stderr = error.stderr ?? '';
  const combinedLower = `${stdout}\n${stderr}`.toLowerCase();

  if (combinedLower.includes('not found') || combinedLower.includes('no session found')) {
    return `Session not found: ${tokenId}.\nError: ${stderr || error.message}`;
  }

  const rawMessage = stderr || stdout || error.message;
  return `Failed to get session: ${rawMessage}`;
}

export const handleUserSessionGetCli: MittwaldCliToolHandler<MittwaldUserSessionGetArgs> = async (args) => {
  if (!args.tokenId || !args.tokenId.trim()) {
    return formatToolResponse('error', 'Token ID is required.');
  }

  const argv = buildCliArgs(args.tokenId);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_user_session_get',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';

    try {
      const session = parseSession(stdout);
      const formattedData = {
        id: session.id,
        tokenId: session.tokenId,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        ...session,
      };

      return formatToolResponse(
        'success',
        `Session information retrieved for ${args.tokenId}`,
        formattedData,
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    } catch (parseError) {
      return formatToolResponse(
        'success',
        'Session retrieved (raw output)',
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
      const message = mapCliError(error, args.tokenId);
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
