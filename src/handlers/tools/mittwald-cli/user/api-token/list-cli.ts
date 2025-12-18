import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { listUserApiTokens, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

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

export const handleUserApiTokenListCli: MittwaldCliToolHandler<MittwaldUserApiTokenListArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_user_api_token_list',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await listUserApiTokens({
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_user_api_token_list',
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_user_api_token_list',
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated) - data is array directly
    const tokens = validation.libraryOutput.data as any[];

    if (!tokens || tokens.length === 0) {
      return formatToolResponse(
        'success',
        'No API tokens found',
        [],
        {
          durationMs: validation.libraryOutput.durationMs,
          validationPassed: validation.passed,
          cliDuration: validation.cliOutput.durationMs,
          libraryDuration: validation.libraryOutput.durationMs,
        }
      );
    }

    const formatted = formatTokenData(tokens);
    return formatToolResponse(
      'success',
      `Found ${formatted.length} API token(s)`,
      formatted,
      {
        durationMs: validation.libraryOutput.durationMs,
        validationPassed: validation.passed,
        discrepancyCount: validation.discrepancies.length,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    if (error instanceof CliToolError) {
      const message = mapCliError(error);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP04] Unexpected error in user api token list handler', { error });
    return formatToolResponse('error', `Failed to list API tokens: ${error instanceof Error ? error.message : String(error)}`);
  }
};
