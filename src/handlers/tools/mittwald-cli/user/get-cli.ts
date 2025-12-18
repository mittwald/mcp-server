import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { getUser, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldUserGetArgs {
  userId?: string;
  output?: 'txt' | 'json' | 'yaml';
}

interface RawUserProfile {
  userId?: string;
  email?: string;
  person?: {
    firstName?: string;
    lastName?: string;
    [key: string]: unknown;
  };
  phoneNumber?: string;
  registeredAt?: string;
  mfa?: {
    active?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function buildCliArgs(args: MittwaldUserGetArgs): { argv: string[]; userId: string } {
  const userId = args.userId && args.userId.trim() ? args.userId : 'self';
  const argv = ['user', 'get', userId, '--output', 'json'];
  return { argv, userId };
}

function parseUserProfile(stdout: string): RawUserProfile {
  const lines = stdout.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || (!line.startsWith('{') && !line.startsWith('['))) continue;

    let jsonSnippet = line;
    for (let j = i + 1; j < lines.length; j++) {
      jsonSnippet += '\n' + lines[j];
      try {
        const parsed = JSON.parse(jsonSnippet);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as RawUserProfile;
        }
      } catch {
        // Keep collecting until JSON parses
      }
    }

    const parsed = JSON.parse(jsonSnippet);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as RawUserProfile;
    }
  }

  const parsed = JSON.parse(stdout);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as RawUserProfile;
  }

  throw new Error('Unexpected output format from CLI command');
}

function formatUserProfileText(user: RawUserProfile): string {
  const firstName = user.person?.firstName ?? 'N/A';
  const lastName = user.person?.lastName ?? 'N/A';
  const mfaActive = user.mfa?.active ? 'Yes' : 'No';

  return [
    'User Profile:',
    `ID: ${user.userId ?? 'N/A'}`,
    `Email: ${user.email ?? 'N/A'}`,
    `First Name: ${firstName}`,
    `Last Name: ${lastName}`,
    `Phone: ${user.phoneNumber ?? 'N/A'}`,
    `Registered: ${user.registeredAt ?? 'N/A'}`,
    `MFA Active: ${mfaActive}`,
  ].join('\n');
}

function formatUserProfileYaml(user: RawUserProfile): string {
  return Object.entries(user)
    .map(([key, value]) => {
      if (value && typeof value === 'object') {
        return `${key}: ${JSON.stringify(value)}`;
      }
      return `${key}: ${value ?? 'null'}`;
    })
    .join('\n');
}

function mapCliError(error: CliToolError, userId: string): string {
  const stdout = error.stdout ?? '';
  const stderr = error.stderr ?? '';
  const combined = `${stdout}\n${stderr}`;
  const combinedLower = combined.toLowerCase();

  if (combinedLower.includes('not found') || combinedLower.includes('no user found')) {
    return `User not found: ${userId}.\nError: ${stderr || error.message}`;
  }

  const rawMessage = stderr || stdout || error.message;
  return `Failed to get user: ${rawMessage}`;
}

export const handleUserGetCli: MittwaldCliToolHandler<MittwaldUserGetArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const { argv, userId } = buildCliArgs(args);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_user_get',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await getUser({
          userId: args.userId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_user_get',
        userId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_user_get',
        userId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const user = validation.libraryOutput.data as RawUserProfile;
    const outputFormat = args.output ?? 'txt';

    let formattedOutput: string;
    switch (outputFormat) {
      case 'json':
        formattedOutput = JSON.stringify(user, null, 2);
        break;
      case 'yaml':
        formattedOutput = formatUserProfileYaml(user);
        break;
      case 'txt':
      default:
        formattedOutput = formatUserProfileText(user);
        break;
    }

    return formatToolResponse(
      'success',
      `User details for ${userId}:`,
      {
        user,
        formattedOutput,
        format: outputFormat,
      },
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
      const message = mapCliError(error, userId);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP04] Unexpected error in user get handler', { error });
    return formatToolResponse('error', `Failed to get user: ${error instanceof Error ? error.message : String(error)}`);
  }
};
