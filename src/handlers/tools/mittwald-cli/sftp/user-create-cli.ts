import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { buildSecureToolResponse } from '../../../../utils/credential-response.js';
import { createSftpUser, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldSftpUserCreateArgs {
  projectId?: string;
  description: string;
  directories: string[];
  quiet?: boolean;
  expires?: string;
  publicKey?: string;
  password?: string;
  accessLevel?: 'read' | 'full';
}

function buildCliArgs(args: MittwaldSftpUserCreateArgs): string[] {
  const cliArgs: string[] = ['sftp-user', 'create', '--description', args.description];

  for (const directory of args.directories) {
    cliArgs.push('--directories', directory);
  }
  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.quiet ?? true) cliArgs.push('--quiet');
  if (args.expires) cliArgs.push('--expires', args.expires);
  if (args.accessLevel) cliArgs.push('--access-level', args.accessLevel);
  if (args.publicKey) cliArgs.push('--public-key', args.publicKey);
  if (args.password) cliArgs.push('--password', args.password);

  return cliArgs;
}

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1)?.trim();
}

function extractSftpUserId(output: string): string | undefined {
  const match = output.match(/ID\s+([a-z0-9-]+)/i);
  return match ? match[1] : undefined;
}

function mapCliError(error: CliToolError, args: MittwaldSftpUserCreateArgs): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}\n${error.message}`.toLowerCase();

  if (combined.includes('forbidden') || combined.includes('permission denied') || combined.includes('403')) {
    return `Permission denied when creating SFTP user. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${stderr || stdout || error.message}`;
  }

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId || 'not specified'}.\nError: ${stderr || stdout || error.message}`;
  }

  if (combined.includes('invalid') && combined.includes('format')) {
    return `Invalid format in request. Please check your parameters.\nError: ${stderr || stdout || error.message}`;
  }

  return `Failed to create SFTP user: ${stderr || stdout || error.message}`;
}

export const handleSftpUserCreateCli: MittwaldCliToolHandler<MittwaldSftpUserCreateArgs> = async (
  args,
  sessionId,
) => {
  if (!args.description) {
    return buildSecureToolResponse('error', 'Description is required to create an SFTP user');
  }

  if (!args.directories || args.directories.length === 0) {
    return buildSecureToolResponse('error', 'At least one directory must be specified');
  }

  if (args.password && args.publicKey) {
    return buildSecureToolResponse('error', 'Cannot specify both password and public key authentication. Choose one.');
  }

  if (!args.password && !args.publicKey) {
    return buildSecureToolResponse('error', 'Either password or public key must be specified for authentication');
  }

  if (!args.projectId) {
    return buildSecureToolResponse('error', 'projectId is required');
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
    // WP05: Note - Library function has limited parameter support (only description + password)
    // CLI supports: directories, expires, publicKey, accessLevel
    // For now, we only validate when using password authentication with basic params
    const canUseLibrary = args.password && !args.publicKey && !args.expires && !args.accessLevel;

    if (canUseLibrary) {
      // Run parallel validation for simple password-based creation
      const validation = await validateToolParity({
        toolName: 'mittwald_sftp_user_create',
        cliCommand: 'mw',
        cliArgs: [...argv, '--token', session.mittwaldAccessToken],
        libraryFn: async () => {
          return await createSftpUser({
            projectId: args.projectId!,
            description: args.description,
            password: args.password!,
            directories: (args.directories && args.directories.length > 0) ?
              (args.directories as [string, ...string[]]) : ['/'],
            apiToken: session.mittwaldAccessToken,
          });
        },
        ignoreFields: ['durationMs', 'duration', 'timestamp'],
      });

      // Log validation results
      if (!validation.passed) {
        logger.warn('[WP05 Validation] Output mismatch detected', {
          tool: 'mittwald_sftp_user_create',
          projectId: args.projectId,
          discrepancyCount: validation.discrepancies.length,
          discrepancies: validation.discrepancies,
          cliExitCode: validation.cliOutput.exitCode,
          cliDuration: validation.cliOutput.durationMs,
          libraryDuration: validation.libraryOutput.durationMs,
        });
      } else {
        logger.info('[WP05 Validation] 100% parity achieved', {
          tool: 'mittwald_sftp_user_create',
          projectId: args.projectId,
          cliDuration: validation.cliOutput.durationMs,
          libraryDuration: validation.libraryOutput.durationMs,
          speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
        });
      }

      // Extract SFTP user ID from library result
      const libraryData = validation.libraryOutput.data as any;
      const sftpUserId = libraryData?.id || libraryData?.sftpUserId;

      const authentication = {
        method: 'password',
        passwordProvided: true,
        publicKeyProvided: false,
      };

      const responseData = {
        id: sftpUserId,
        description: args.description,
        directories: args.directories,
        accessLevel: args.accessLevel ?? 'read',
        authentication,
        projectId: args.projectId,
        expires: args.expires,
      };

      const message = sftpUserId
        ? `Successfully created SFTP user '${args.description}' with ID ${sftpUserId}`
        : `Successfully created SFTP user '${args.description}'`;

      return buildSecureToolResponse(
        'success',
        args.quiet ? sftpUserId ?? message : message,
        responseData,
        {
          durationMs: validation.libraryOutput.durationMs,
          validationPassed: validation.passed,
          discrepancyCount: validation.discrepancies.length,
          cliDuration: validation.cliOutput.durationMs,
          libraryDuration: validation.libraryOutput.durationMs,
        }
      );
    } else {
      // Fall back to CLI-only for advanced features (publicKey, expires, accessLevel, directories)
      logger.info('[WP05] Using CLI-only mode for advanced SFTP user create features', {
        tool: 'mittwald_sftp_user_create',
        projectId: args.projectId,
        hasPublicKey: Boolean(args.publicKey),
        hasExpires: Boolean(args.expires),
        hasAccessLevel: Boolean(args.accessLevel),
        reason: 'Library function does not support these parameters',
      });

      const result = await invokeCliTool({
        toolName: 'mittwald_sftp_user_create',
        argv,
        sessionId: effectiveSessionId,
        parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
      });

      const stdout = result.result.stdout ?? '';
      const sftpUserId = parseQuietOutput(stdout) ?? extractSftpUserId(stdout);

      const authentication = {
        method: args.publicKey ? 'publicKey' : 'password',
        passwordProvided: Boolean(args.password),
        publicKeyProvided: Boolean(args.publicKey),
      };

      const responseData = {
        id: sftpUserId,
        description: args.description,
        directories: args.directories,
        accessLevel: args.accessLevel ?? 'read',
        authentication,
        projectId: args.projectId,
        expires: args.expires,
      };

      const message = sftpUserId
        ? `Successfully created SFTP user '${args.description}' with ID ${sftpUserId}`
        : `Successfully created SFTP user '${args.description}'`;

      return buildSecureToolResponse(
        'success',
        args.quiet ? sftpUserId ?? message : message,
        responseData,
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
          mode: 'cli-only',
        }
      );
    }
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

    logger.error('[WP05] Unexpected error in sftp user create handler', { error });
    return buildSecureToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
