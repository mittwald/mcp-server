import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { parseJsonOutput, parseQuietOutput } from '@/utils/cli-output.js';
import { logger } from '../../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '@/tools/index.js';
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

interface MysqlUserDetails {
  id: string;
  name?: string;
  description?: string;
  databaseId?: string;
  accessLevel?: string;
  externalAccess?: boolean;
  accessIpMask?: string | null;
  createdAt?: string;
  updatedAt?: string;
  mainUser?: boolean;
  disabled?: boolean;
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
    // Access mask without external access would be ignored by the CLI
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

function parseMysqlUserCreateOutput(stdout: string, stderr: string): string | undefined {
  const userId = parseQuietOutput(stdout) ?? parseQuietOutput(stderr);
  if (userId) {
    return userId;
  }

  const combined = `${stdout}\n${stderr}`;
  // Attempt to extract UUIDs or short IDs from narrative output
  const idMatch = combined.match(/(mysql-[a-z0-9]+|[a-f0-9-]{8,})/i);
  if (idMatch) {
    return idMatch[1];
  }

  logger.error('[MySQL User Create] Unable to determine created user ID from CLI output', {
    stdout,
    stderr,
  });
  return undefined;
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

async function fetchMysqlUserDetails(userId: string, sessionId?: string): Promise<MysqlUserDetails | undefined> {
  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_database_mysql_user_get',
      argv: ['database', 'mysql', 'user', 'get', userId, '--output', 'json'],
      sessionId,
      parser: (stdout) => stdout,
    });

    const parsed = parseJsonOutput(result.result);
    if (!parsed || typeof parsed !== 'object') {
      logger.warn('[MySQL User Create] Unexpected structure for user details', { parsed });
      return undefined;
    }

    return parsed as MysqlUserDetails;
  } catch (error) {
    logger.warn('[MySQL User Create] Failed to fetch details for newly created MySQL user', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
}

/**
 * Handle creation of MySQL users through the Mittwald CLI wrapper.
 */
export const handleDatabaseMysqlUserCreateCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlUserCreateArgs> = async (
  args,
  sessionId,
) => {
  if (!args.databaseId) {
    return buildSecureToolResponse('error', 'Database ID is required to create a MySQL user.');
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
    const result = await invokeCliTool({
      toolName: 'mittwald_database_mysql_user_create',
      argv,
      sessionId,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const userId = parseMysqlUserCreateOutput(stdout, stderr);

    if (!userId) {
      return buildSecureToolResponse(
        'error',
        'MySQL user created but the CLI did not return an identifier.',
        {
          output: stdout || stderr,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    const details = await fetchMysqlUserDetails(userId, sessionId);

    const responseData = {
      userId,
      databaseId: args.databaseId,
      accessLevel: args.accessLevel ?? 'full',
      description,
      externalAccess: !!args.enableExternalAccess,
      accessIpMask: args.enableExternalAccess ? args.accessIpMask : undefined,
      passwordGenerated,
      generatedPassword,
      details,
    };

    const messagePieces = [`Created MySQL user ${userId}`];
    if (passwordGenerated) {
      messagePieces.push('Generated a secure password for the user.');
    }
    if (!details) {
      messagePieces.push('Unable to fetch user details; see data payload for raw output.');
    }

    return buildSecureToolResponse(
      'success',
      messagePieces.join(' '),
      responseData,
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, args);
      return buildSecureToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return buildSecureToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
