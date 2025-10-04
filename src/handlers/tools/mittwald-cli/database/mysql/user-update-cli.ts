import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { invokeCliTool, CliToolError } from '@/tools/index.js';
import { buildSecureToolResponse, buildUpdatedAttributes } from '../../../../../utils/credential-response.js';

interface MittwaldDatabaseMysqlUserUpdateArgs {
  userId: string;
  description?: string;
  accessLevel?: 'readonly' | 'full';
  password?: string;
  accessIpMask?: string;
  enableExternalAccess?: boolean;
  disableExternalAccess?: boolean;
  quiet?: boolean;
}

function buildCliArgs(args: MittwaldDatabaseMysqlUserUpdateArgs): string[] {
  const cliArgs: string[] = ['database', 'mysql', 'user', 'update', args.userId];

  if (args.accessLevel) cliArgs.push('--access-level', args.accessLevel);
  if (args.description) cliArgs.push('--description', args.description);
  if (args.password) cliArgs.push('--password', args.password);
  if (args.accessIpMask) cliArgs.push('--access-ip-mask', args.accessIpMask);
  if (args.enableExternalAccess) cliArgs.push('--enable-external-access');
  if (args.disableExternalAccess) cliArgs.push('--disable-external-access');
  if (args.quiet ?? true) cliArgs.push('--quiet');

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldDatabaseMysqlUserUpdateArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const message = error.stderr || error.stdout || error.message;

  if (combined.includes('permission denied') || combined.includes('forbidden') || combined.includes('401')) {
    return `Permission denied while updating MySQL user. Re-authenticate and ensure the Mittwald CLI session is valid.\nError: ${message}`;
  }

  if (combined.includes('not found') || combined.includes('404')) {
    return `MySQL user not found. Verify the user ID: ${args.userId}.\nError: ${message}`;
  }

  if (combined.includes('access-ip-mask') && combined.includes('external access')) {
    return `Access IP mask changes require external access to be enabled. Enable external access or omit the access IP mask.\nError: ${message}`;
  }

  return `Failed to update MySQL user: ${message}`;
}

function hasUpdatePayload(args: MittwaldDatabaseMysqlUserUpdateArgs): boolean {
  return Boolean(
    args.description ||
      args.accessLevel ||
      args.password ||
      typeof args.enableExternalAccess === 'boolean' ||
      typeof args.disableExternalAccess === 'boolean' ||
      args.accessIpMask
  );
}

/**
 * Handle updates to MySQL users through the Mittwald CLI wrapper.
 */
export const handleDatabaseMysqlUserUpdateCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlUserUpdateArgs> = async (
  args,
  sessionId,
) => {
  if (!args.userId) {
    return buildSecureToolResponse('error', 'User ID is required to update a MySQL user.');
  }

  if (args.enableExternalAccess && args.disableExternalAccess) {
    return buildSecureToolResponse('error', 'enableExternalAccess and disableExternalAccess cannot both be true.');
  }

  if (!hasUpdatePayload(args)) {
    return buildSecureToolResponse(
      'error',
      'Provide at least one property to update (description, accessLevel, password, accessIpMask, or external access flags).'
    );
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_database_mysql_user_update',
      argv,
      sessionId,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const output = stdout || stderr || undefined;
    const nothingToChange = /nothing to change/i.test(stdout) || /nothing to change/i.test(stderr);

    const updatedAttributes = buildUpdatedAttributes({
      description: args.description,
      accessLevel: args.accessLevel,
      accessIpMask: args.accessIpMask,
      externalAccess:
        args.enableExternalAccess === true
          ? 'enabled'
          : args.disableExternalAccess === true
            ? 'disabled'
            : undefined,
      password: typeof args.password === 'string' ? 'updated' : undefined,
    });

    return buildSecureToolResponse(
      'success',
      nothingToChange
        ? `No changes were applied to MySQL user ${args.userId}.`
        : `Updated MySQL user ${args.userId}.`,
      {
        userId: args.userId,
        output,
        updatedAttributes,
      },
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
