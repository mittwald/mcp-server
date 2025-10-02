export type CliToolErrorKind =
  | 'SESSION_MISSING'
  | 'AUTHENTICATION'
  | 'EXECUTION'
  | 'PARSING'
  | 'TIMEOUT'
  | 'UNKNOWN';

export interface CliToolErrorOptions {
  kind: CliToolErrorKind;
  toolName?: string;
  command?: string;
  exitCode?: number;
  stderr?: string;
  stdout?: string;
  cause?: unknown;
  suggestedAction?: string;
}

export class CliToolError extends Error {
  readonly kind: CliToolErrorKind;
  readonly toolName?: string;
  readonly command?: string;
  readonly exitCode?: number;
  readonly stderr?: string;
  readonly stdout?: string;
  readonly suggestedAction?: string;

  constructor(message: string, options: CliToolErrorOptions) {
    super(message);
    this.name = 'CliToolError';
    this.kind = options.kind;
    this.toolName = options.toolName;
    this.command = options.command;
    this.exitCode = options.exitCode;
    this.stderr = options.stderr;
    this.stdout = options.stdout;
    this.suggestedAction = options.suggestedAction;
    if (options.cause) {
      (this as any).cause = options.cause;
    }
  }
}

export interface CliToolSuccessMeta {
  command: string;
  exitCode: number;
  durationMs?: number;
}

export interface CliToolSuccess<T> {
  ok: true;
  result: T;
  meta: CliToolSuccessMeta;
}

export type CliToolResult<T> = CliToolSuccess<T>;
