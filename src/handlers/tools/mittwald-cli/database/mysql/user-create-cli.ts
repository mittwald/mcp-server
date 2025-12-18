import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { CliToolError } from '@/tools/index.js';
import { createMysqlUser, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';
import { buildSecureToolResponse } from '../../../../../utils/credential-response.js';
import { generateSecurePassword } from '../../../../../utils/credential-generator.js';

interface MittwaldDatabaseMysqlUserCreateArgs {
  databaseId: string;
  description?: string;
  username?: string;
  accessLevel?: 'readonly' | 'full';
  password?: string;
  enableExternalAccess?: boolean;
  accessIpMask?: string;
  quiet?: boolean;
}

function buildCliArgs(
  args: MittwaldDatabaseMysqlUserCreateArgs,
  password: string,
  quiet: boolean,
  description: string,
): string[] {
  const cliArgs: string[] = ['database', 'mysql', 'user', 'create'];

  cliArgs.push('--database-id', args.databaseId);
  cliArgs.push('--access-level', args.accessLevel ?? 'full');
  cliArgs.push('--description', description);
  cliArgs.push('--password', password);

  if (args.enableExternalAccess) {
    cliArgs.push('--enable-external-access');
    if (args.accessIpMask) {
      cliArgs.push('--access-ip-mask', args.accessIpMask);
    }
  } else if (args.accessIpMask) {
    logger.warn('[MySQL User Create] Ignoring accessIpMask because enableExternalAccess is not set');
  }

  if (quiet) {
    cliArgs.push('--quiet');
  }

  return cliArgs;
}

function resolveDescription(args: MittwaldDatabaseMysqlUserCreateArgs): string {
  const label = args.description?.trim() || args.username?.trim();
  if (!label) {
    throw new CliToolError('Description or username is required to create a MySQL user.', {
      kind: 'EXECUTION',
      toolName: 'mittwald_database_mysql_user_create',
    });
  }

  return label;
}

function mapCliError(error: CliToolError, args: MittwaldDatabaseMysqlUserCreateArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const message = error.stderr || error.stdout || error.message;

  if (combined.includes('permission denied') || combined.includes('forbidden') || combined.includes('401')) {
    return `Permission denied while creating MySQL user. Re-authenticate and ensure the Mittwald CLI session is valid.\nError: ${message}`;
  }

  if (combined.includes('database') && combined.includes('not found')) {
    return `MySQL database not found. Verify the database ID: ${args.databaseId}.\nError: ${message}`;
  }

  if (combined.includes('external access') && combined.includes('access-ip-mask')) {
    return `Access IP mask requires external access to be enabled. Either enable external access or remove the access IP mask.\nError: ${message}`;
  }

  if (combined.includes('existing') && combined.includes('user')) {
    return `A MySQL user with the same description already exists for database ${args.databaseId}.\nError: ${message}`;
  }

  return `Failed to create MySQL user: ${message}`;
}

export const handleDatabaseMysqlUserCreateCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlUserCreateArgs> = async (
  args,
  sessionId,
) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return buildSecureToolResponse('error', 'Session ID required');
  }

  if (!args.databaseId) {
    return buildSecureToolResponse('error', 'Database ID is required to create a MySQL user.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return buildSecureToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  let password = args.password;
  let generatedPassword: string | undefined;

  if (!password) {
    const credential = generateSecurePassword();
    generatedPassword = credential.value;
    password = credential.value;
  }

  const passwordGenerated = Boolean(generatedPassword);

  let description: string;
  let argv: string[];
  try {
    description = resolveDescription(args);
    argv = buildCliArgs(args, password, args.quiet ?? true, description);
  } catch (buildError) {
    if (buildError instanceof CliToolError) {
      return buildSecureToolResponse('error', buildError.message);
    }
    throw buildError;
  }

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_database_mysql_user_create',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await createMysqlUser({
          databaseId: args.databaseId,
          accessLevel: args.accessLevel ?? 'full',
          description,
          password,
          accessIpMask: args.accessIpMask,
          externalAccess: args.enableExternalAccess,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_database_mysql_user_create',
        databaseId: args.databaseId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_database_mysql_user_create',
        databaseId: args.databaseId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const result = validation.libraryOutput.data;

    const responseData = {
      ...result,
      passwordGenerated,
      generatedPassword,
    };

    const messagePieces = [`Created MySQL user`];
    if (passwordGenerated) {
      messagePieces.push('Generated a secure password for the user.');
    }

    return buildSecureToolResponse(
      'success',
      messagePieces.join(' '),
      responseData,
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
      const message = mapCliError(error, args);
      return buildSecureToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP04] Unexpected error in database mysql user create handler', { error });
    return buildSecureToolResponse('error', `Failed to create MySQL user: ${error instanceof Error ? error.message : String(error)}`);
  }
};
