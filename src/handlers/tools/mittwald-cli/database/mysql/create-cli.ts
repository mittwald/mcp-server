import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { CliToolError } from '@/tools/index.js';
import { createMysqlDatabase, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldDatabaseMysqlCreateArgs {
  description: string;
  version: string;
  projectId?: string;
  quiet?: boolean;
  collation?: string;
  characterSet?: string;
  userPassword?: string;
  userExternal?: boolean;
  userAccessLevel?: "full" | "readonly";
  timeout?: string;
  enable?: boolean;
  disable?: boolean;
  email?: string;
  url?: string;
  command?: string;
  interpreter?: string;
}

function buildCliArgs(args: MittwaldDatabaseMysqlCreateArgs): string[] {
  const cliArgs: string[] = ['database', 'mysql', 'create'];

  cliArgs.push('--description', args.description);
  cliArgs.push('--version', args.version);

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.quiet) cliArgs.push('--quiet');
  if (args.collation) cliArgs.push('--collation', args.collation);
  if (args.characterSet) cliArgs.push('--character-set', args.characterSet);
  if (args.userPassword) cliArgs.push('--user-password', args.userPassword);
  if (args.userExternal) cliArgs.push('--user-external');
  if (args.userAccessLevel) cliArgs.push('--user-access-level', args.userAccessLevel);
  if (args.timeout) cliArgs.push('--timeout', args.timeout);

  if (args.enable && args.disable) {
    // CLI only accepts either enable or disable
    cliArgs.push('--enable');
  } else if (args.enable) {
    cliArgs.push('--enable');
  } else if (args.disable) {
    cliArgs.push('--disable');
  }

  if (args.email) cliArgs.push('--email', args.email);
  if (args.url) cliArgs.push('--url', args.url);
  if (args.command) cliArgs.push('--command', args.command);
  if (args.interpreter) cliArgs.push('--interpreter', args.interpreter);

  return cliArgs;
}

function parseQuietIdentifier(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1)?.trim();
}

function extractDatabaseId(output: string): string | undefined {
  const match = output.match(/ID\s+([a-f0-9-]+)/i);
  return match ? match[1] : undefined;
}

function mapCliError(error: CliToolError, args: MittwaldDatabaseMysqlCreateArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const message = error.stderr || error.stdout || error.message;

  if (combined.includes('permission denied') || combined.includes('403')) {
    return `Permission denied when creating MySQL database. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${message}`;
  }

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${message}`;
  }

  if (combined.includes('version') && combined.includes('not supported')) {
    return `MySQL version '${args.version}' is not supported. Use 'database mysql versions' to list available versions.\nError: ${message}`;
  }

  if (combined.includes('invalid') && combined.includes('password')) {
    return `Invalid password provided. Please check password requirements.\nError: ${message}`;
  }

  if (combined.includes('400') || combined.includes('request failed with status code 400')) {
    return `Invalid request parameters for database creation. Please check:\n• Project ID: ${args.projectId ?? 'not specified'}\n• Password provided: ${args.userPassword ? 'yes' : 'no'}\n• MySQL version: ${args.version}\n\nError: ${message}`;
  }

  if (combined.includes('404') || combined.includes('request failed with status code 404')) {
    return `Database creation failed - resource not found. This might be due to project limitations or unavailable MySQL version.\nError: ${message}`;
  }

  return `Failed to create MySQL database: ${message}`;
}

function mapInteractiveOutput(stdout: string, stderr: string): string | undefined {
  const output = `${stdout}\n${stderr}`.toLowerCase();
  if (output.includes('interactive input required') || output.includes('enter password')) {
    return 'Command requires interactive input, but running in non-interactive mode. Provide --user-password or use a non-interactive authentication method.';
  }
  return undefined;
}

export const handleDatabaseMysqlCreateCli: MittwaldToolHandler<MittwaldDatabaseMysqlCreateArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.projectId) {
    return formatToolResponse(
      'error',
      "Project ID is required for database creation. Please provide --project-id or set a default project context via 'mw context set --project-id=<PROJECT_ID>'."
    );
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // Build character settings if provided
    const characterSettings = (args.collation || args.characterSet) ? {
      ...(args.collation && { collation: args.collation }),
      ...(args.characterSet && { characterSet: args.characterSet }),
    } : undefined;

    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_database_mysql_create',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await createMysqlDatabase({
          projectId: args.projectId!,
          description: args.description,
          version: args.version,
          characterSettings,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_database_mysql_create',
        projectId: args.projectId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_database_mysql_create',
        projectId: args.projectId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const result = validation.libraryOutput.data;

    return formatToolResponse(
      'success',
      `Successfully created MySQL database '${args.description}'`,
      result,
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
      const message = mapCliError(error, args);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP04] Unexpected error in database mysql create handler', { error });
    return formatToolResponse('error', `Failed to create MySQL database: ${error instanceof Error ? error.message : String(error)}`);
  }
};
