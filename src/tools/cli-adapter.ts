import { getCurrentSessionId } from '../utils/execution-context.js';
import { logger } from '../utils/logger.js';
import { sessionAwareCli, SessionAuthenticationError, SessionNotFoundError } from '../utils/session-aware-cli.js';
import type { CliExecuteOptions, CliExecuteResult } from '../utils/cli-wrapper.js';
import { CliToolError, type CliToolErrorKind, type CliToolResult } from './error.js';

export type CliOutputParser<T> = (stdout: string, raw: CliExecuteResult) => T;

export interface InvokeCliToolOptions<T> {
  /** Descriptive tool name for logging/errors. */
  toolName: string;
  /** Complete argument list passed to the `mw` CLI. */
  argv: string[];
  /** Optional session identifier (falls back to AsyncLocalStorage context). */
  sessionId?: string;
  /** Custom parser that converts stdout into a typed payload. */
  parser?: CliOutputParser<T>;
  /** Binary to execute, defaults to `mw`. */
  binary?: string;
  /** Optional CLI execution overrides. */
  cliOptions?: CliExecuteOptions;
}

const DEFAULT_PARSER: CliOutputParser<string> = (stdout) => stdout;

export async function invokeCliTool<T = string>(
  options: InvokeCliToolOptions<T>
): Promise<CliToolResult<T>> {
  const {
    toolName,
    argv,
    sessionId: providedSessionId,
    parser = DEFAULT_PARSER as CliOutputParser<T>,
    binary = 'mw',
    cliOptions
  } = options;

  const sessionId = providedSessionId ?? getCurrentSessionId();
  if (!sessionId) {
    throw new CliToolError(`Session is required to run ${toolName}`, {
      kind: 'SESSION_MISSING',
      toolName,
      command: formatCommand(binary, argv),
    });
  }

  const commandString = formatCommand(binary, argv);
  let execution: CliExecuteResult;

  try {
    execution = await sessionAwareCli.executeWithSession(
      binary,
      argv,
      sessionId,
      cliOptions ?? {}
    );
  } catch (error) {
    throw mapSessionError(error, toolName, commandString);
  }

  if (execution.exitCode !== 0) {
    throw buildExecutionError(execution, toolName, commandString);
  }

  try {
    const result = parser(execution.stdout, execution);
    const success: CliToolResult<T> = {
      ok: true,
      result,
      meta: {
        command: commandString,
        exitCode: execution.exitCode,
        durationMs: execution.durationMs,
      }
    };
    return success;
  } catch (error) {
    logger.error('[CliAdapter] Failed to parse CLI output', {
      toolName,
      command: commandString,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new CliToolError(`Failed to parse CLI output for ${toolName}`, {
      kind: 'PARSING',
      toolName,
      command: commandString,
      stdout: execution.stdout,
      stderr: execution.stderr,
      cause: error,
    });
  }
}

function formatCommand(binary: string, argv: string[]): string {
  return `${binary} ${argv.join(' ')}`.trim();
}

function mapSessionError(error: unknown, toolName: string, command: string): CliToolError {
  if (error instanceof SessionNotFoundError) {
    return new CliToolError(error.message, {
      kind: 'SESSION_MISSING',
      toolName,
      command,
      cause: error,
    });
  }

  if (error instanceof SessionAuthenticationError) {
    return new CliToolError(error.message, {
      kind: 'AUTHENTICATION',
      toolName,
      command,
      cause: error,
      suggestedAction: 'Re-run OAuth authentication to refresh Mittwald credentials.',
    });
  }

  return new CliToolError('Unexpected session error', {
    kind: 'UNKNOWN',
    toolName,
    command,
    cause: error,
  });
}

function buildExecutionError(
  execution: CliExecuteResult,
  toolName: string,
  command: string
): CliToolError {
  const kind = classifyExecutionError(execution);
  const message = kind === 'AUTHENTICATION'
    ? 'Authentication with Mittwald CLI failed'
    : `Mittwald CLI exited with code ${execution.exitCode}`;

  return new CliToolError(message, {
    kind,
    toolName,
    command,
    exitCode: execution.exitCode,
    stderr: execution.stderr,
    stdout: execution.stdout,
    suggestedAction: kind === 'AUTHENTICATION'
      ? 'Re-run OAuth authentication to refresh Mittwald credentials.'
      : undefined,
  });
}

function classifyExecutionError(execution: CliExecuteResult): CliToolErrorKind {
  const stderr = execution.stderr.toLowerCase();

  if (stderr.includes('unauthorized') || stderr.includes('authentication')) {
    return 'AUTHENTICATION';
  }

  if (stderr.includes('timeout') || stderr.includes('timed out')) {
    return 'TIMEOUT';
  }

  return 'EXECUTION';
}
