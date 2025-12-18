import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { getUserApiToken, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldUserApiTokenGetArgs {
  tokenId: string;
  output?: 'txt' | 'json' | 'yaml';
}

function buildCliArgs(args: MittwaldUserApiTokenGetArgs): string[] {
  return ['user', 'api-token', 'get', args.tokenId, '--output', 'json'];
}

function parseApiTokenOutput(output: string): Record<string, unknown> {
  const lines = output.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('{') && !line.startsWith('[')) {
      continue;
    }

    let jsonStr = line;
    for (let j = i + 1; j < lines.length; j++) {
      jsonStr += '\n' + lines[j];
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        // Continue collecting lines until JSON parses
      }
    }

    const parsed = JSON.parse(jsonStr);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  }

  const parsed = JSON.parse(output);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }

  throw new Error('Parsed output is not an object.');
}

function mapCliError(error: CliToolError, args: MittwaldUserApiTokenGetArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`;
  const combinedLower = combined.toLowerCase();

  if (combinedLower.includes('not found') || combinedLower.includes('no token found')) {
    return `API token not found: ${args.tokenId}.\nError: ${error.stderr || error.message}`;
  }

  const rawMessage = error.stderr || error.stdout || error.message;
  return `Failed to get API token: ${rawMessage}`;
}

export const handleUserApiTokenGetCli: MittwaldCliToolHandler<MittwaldUserApiTokenGetArgs> = async (args) => {
  if (!args.tokenId) {
    return formatToolResponse('error', 'Token ID is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_user_api_token_get',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';

    try {
      const parsed = parseApiTokenOutput(stdout);
      const formattedData = {
        id: parsed.id,
        description: parsed.description,
        roles: parsed.roles,
        createdAt: parsed.createdAt,
        expiresAt: parsed.expiresAt,
        ...parsed,
      };

      return formatToolResponse(
        'success',
        `API token information retrieved for ${args.tokenId}`,
        formattedData,
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    } catch (parseError) {
      return formatToolResponse(
        'success',
        'API token retrieved (raw output)',
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
      const message = mapCliError(error, args);
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
