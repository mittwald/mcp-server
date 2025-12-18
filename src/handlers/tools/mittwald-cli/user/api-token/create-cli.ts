import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { parseQuietOutput } from '../../../../../utils/cli-output.js';
import { buildSecureToolResponse } from '../../../../../utils/credential-response.js';
import { createUserApiToken, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldUserApiTokenCreateArgs {
  description: string;
  roles: ('api_read' | 'api_write')[];
  quiet?: boolean;
  expires?: string;
}

function buildCliArgs(args: MittwaldUserApiTokenCreateArgs): string[] {
  const cliArgs: string[] = ['user', 'api-token', 'create', '--description', args.description];
  args.roles.forEach((role) => cliArgs.push('--roles', role));
  if (args.expires) cliArgs.push('--expires', args.expires);
  if (args.quiet ?? true) cliArgs.push('--quiet');
  return cliArgs;
}

function mapCliError(error: CliToolError): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const details = stderr || stdout || error.message;
  return `Failed to create API token: ${details}`;
}

function extractToken(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;

  try {
    const parsed = JSON.parse(trimmed);
    const tokenValue = (parsed as Record<string, unknown>).token;
    if (typeof tokenValue === 'string' && tokenValue) {
      return tokenValue;
    }
  } catch (error) {
    // ignore JSON parsing failures, fallback to regex extraction
  }

  const tokenMatch = trimmed.match(/token\s*[:=]\s*([A-Za-z0-9._-]+)/i) || trimmed.match(/^([A-Za-z0-9._-]+)$/);
  return tokenMatch ? tokenMatch[1] : undefined;
}

export const handleUserApiTokenCreateCli: MittwaldCliToolHandler<MittwaldUserApiTokenCreateArgs> = async (
  args,
  sessionId,
) => {
  if (!args.description) {
    return buildSecureToolResponse('error', 'Description is required to create an API token.');
  }

  if (!Array.isArray(args.roles) || args.roles.length === 0) {
    return buildSecureToolResponse('error', 'At least one role must be specified to create an API token.');
  }

  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return buildSecureToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return buildSecureToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_user_api_token_create',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await createUserApiToken({
          description: args.description,
          roles: args.roles,
          expiresAt: args.expires,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp', 'token', 'generatedToken'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_user_api_token_create',
        description: args.description,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_user_api_token_create',
        description: args.description,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const result = validation.libraryOutput.data;
    const token = result?.token;

    if (!token) {
      return buildSecureToolResponse(
        'error',
        'Failed to create API token - no token returned.',
        {
          result,
        },
        {
          durationMs: validation.libraryOutput.durationMs,
          validationPassed: validation.passed,
        }
      );
    }

    const data = {
      description: args.description,
      roles: args.roles,
      expires: args.expires,
      generatedToken: token,
      tokenGenerated: true,
    };

    const message = args.quiet ? token : 'API token created successfully';

    return buildSecureToolResponse(
      'success',
      message,
      data,
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
      return buildSecureToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    if (error instanceof CliToolError) {
      const message = mapCliError(error);
      return buildSecureToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP04] Unexpected error in user api token create handler', { error });
    return buildSecureToolResponse(
      'error',
      `Failed to create API token: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
