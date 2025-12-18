import { spawn } from 'child_process';
import { getCurrentAbortSignal, getCurrentSessionId } from './execution-context.js';
import { sessionManager } from '../server/session-manager.js';
import { cliCallsTotal, cliInflight, cliQueueDepth, cliQueueWait } from '../metrics/index.js';

/**
 * Use spawn instead of execFile to avoid buffering issues with concurrent processes.
 * spawn gives us explicit control over stdio streams and prevents file descriptor leaks.
 */
async function spawnPromise(
  command: string,
  args: string[],
  options: {
    timeout?: number;
    maxBuffer?: number;
    env?: NodeJS.ProcessEnv;
  }
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const { timeout, maxBuffer = 20 * 1024 * 1024 } = options;

    const child = spawn(command, args, {
      env: options.env,
      stdio: ['ignore', 'pipe', 'pipe'], // stdin=ignore, stdout=pipe, stderr=pipe
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let maxBufferExceeded = false;
    let settled = false; // Track if promise already resolved/rejected

    // CRITICAL: Attach data listeners IMMEDIATELY to avoid pipe buffer overflow
    // If we don't read from pipes fast enough, child process blocks waiting
    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString('utf8');
      if (stdout.length > maxBuffer && !settled) {
        settled = true;
        maxBufferExceeded = true;
        child.kill('SIGTERM');
        setTimeout(() => child.kill('SIGKILL'), 5000);

        const error: any = new Error(`stdout maxBuffer exceeded`);
        error.code = 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER';
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      }
    });

    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString('utf8');
      if (stderr.length > maxBuffer && !settled) {
        settled = true;
        maxBufferExceeded = true;
        child.kill('SIGTERM');
        setTimeout(() => child.kill('SIGKILL'), 5000);

        const error: any = new Error(`stderr maxBuffer exceeded`);
        error.code = 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER';
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      }
    });

    // Set up timeout
    console.log(`[TIMEOUT] Setting up timeout for ${timeout}ms`);
    const timeoutHandle = timeout ? setTimeout(() => {
      console.log(`[TIMEOUT] Timeout fired after ${timeout}ms! Killing process and rejecting.`);
      timedOut = true;

      // Try graceful shutdown first
      child.kill('SIGTERM');

      // Force kill after 5 seconds if SIGTERM doesn't work
      setTimeout(() => {
        child.kill('SIGKILL');
      }, 5000);

      // CRITICAL: Reject the promise immediately to release semaphore slot
      // Even if the process doesn't exit, we need to unblock the caller
      if (!settled) {
        settled = true;
        console.log(`[TIMEOUT] Rejecting promise with timeout error`);
        const error: any = new Error(`Command timed out after ${timeout}ms`);
        error.code = 'ETIMEDOUT';
        error.signal = 'SIGTERM';
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      } else {
        console.log(`[TIMEOUT] Promise already settled, skipping rejection`);
      }
    }, timeout) : null;

    // Handle process exit
    child.on('close', (code, signal) => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }

      // Don't settle twice - timeout handler may have already rejected
      if (settled) {
        return;
      }
      settled = true;

      if (timedOut) {
        const error: any = new Error(`Command timed out after ${timeout}ms`);
        error.code = 'ETIMEDOUT';
        error.signal = 'SIGTERM';
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      } else if (maxBufferExceeded) {
        const error: any = new Error(`stdout maxBuffer exceeded`);
        error.code = 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER';
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      } else if (code !== 0) {
        const error: any = new Error(`Command failed with exit code ${code}`);
        error.code = code;
        error.signal = signal;
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });

    // Handle spawn errors (e.g., command not found)
    child.on('error', (error: any) => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }

      // Don't settle twice
      if (settled) {
        return;
      }
      settled = true;

      error.stdout = stdout;
      error.stderr = stderr;
      reject(error);
    });
  });
}

const DEFAULT_MAX_BUFFER_BYTES = 20 * 1024 * 1024; // 20MB cap for stdout buffering
const DEFAULT_MAX_HEAP_MB = 384; // Keep below Fly machine memory ceiling
const DEFAULT_CLI_CONCURRENCY = 1; // Protect Fly VMs from mw's high RSS usage
const DEFAULT_CLI_QUEUE_LIMIT = 25; // Prevent unbounded memory growth under load

function parsePositiveInteger(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
}

function parseNonNegativeInteger(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }
  return parsed;
}

function resolveCliConcurrencyLimit(): number | undefined {
  const raw = process.env.MCP_CLI_CONCURRENCY?.trim();
  if (raw === '0') {
    return undefined;
  }
  const fromEnv = parsePositiveInteger(raw);
  if (typeof fromEnv === 'number') {
    return fromEnv;
  }
  return DEFAULT_CLI_CONCURRENCY;
}

function resolveCliQueueLimit(): number {
  const raw = process.env.MCP_CLI_QUEUE_LIMIT?.trim();
  if (raw === '0') {
    return 0;
  }
  const fromEnv = parseNonNegativeInteger(raw);
  if (typeof fromEnv === 'number') {
    return fromEnv;
  }
  return DEFAULT_CLI_QUEUE_LIMIT;
}

class AsyncSemaphore {
  private active = 0;
  private readonly queue: Array<(release: () => void) => void> = [];

  constructor(
    private readonly limit: number,
    private readonly queueLimit: number
  ) {
    cliQueueDepth.set(0);
    cliInflight.set(0);
  }

  getState(): { active: number; queued: number; limit: number; queueLimit: number } {
    return {
      active: this.active,
      queued: this.queue.length,
      limit: this.limit,
      queueLimit: this.queueLimit,
    };
  }

  async acquire(signal?: AbortSignal): Promise<() => void> {
    if (this.limit <= 0) {
      return () => {};
    }

    if (signal?.aborted) {
      throw new Error('Request aborted before acquiring a Mittwald CLI slot.');
    }

    if (this.active < this.limit) {
      this.active += 1;
      cliInflight.set(this.active);
      return this.release;
    }

    if (this.queueLimit === 0 || this.queue.length >= this.queueLimit) {
      const state = this.getState();
      throw new Error(
        `Server is busy running Mittwald CLI commands (inflight=${state.active}/${state.limit}, queued=${state.queued}/${state.queueLimit}). Try again later.`
      );
    }

    return new Promise((resolve, reject) => {
      let settled = false;
      let onAbort: (() => void) | undefined;

      const cleanup = () => {
        if (signal && onAbort) {
          signal.removeEventListener('abort', onAbort);
        }
      };

      const waiter = (release: () => void) => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        resolve(release);
      };

      onAbort = () => {
        if (settled) {
          return;
        }
        settled = true;
        const index = this.queue.indexOf(waiter);
        if (index >= 0) {
          this.queue.splice(index, 1);
          cliQueueDepth.set(this.queue.length);
        }
        cleanup();
        reject(new Error('Request aborted while waiting for a Mittwald CLI slot.'));
      };

      this.queue.push(waiter);
      cliQueueDepth.set(this.queue.length);

      if (signal) {
        signal.addEventListener('abort', onAbort, { once: true });
      }
    });
  }

  private readonly release = (): void => {
    if (this.limit <= 0) {
      return;
    }

    this.active = Math.max(0, this.active - 1);
    cliInflight.set(this.active);

    const next = this.queue.shift();
    cliQueueDepth.set(this.queue.length);

    if (next) {
      this.active += 1;
      cliInflight.set(this.active);
      next(this.release);
    }
  };
}

const cliConcurrencyLimit = resolveCliConcurrencyLimit();
const cliSemaphore = typeof cliConcurrencyLimit === 'number'
  ? new AsyncSemaphore(cliConcurrencyLimit, resolveCliQueueLimit())
  : null;

function resolveMaxBufferBytes(explicit?: number): number {
  if (typeof explicit === 'number' && explicit > 0) {
    return explicit;
  }
  const fromEnvMb = parsePositiveInteger(process.env.MCP_CLI_MAX_BUFFER_MB);
  if (typeof fromEnvMb === 'number') {
    return fromEnvMb * 1024 * 1024;
  }
  return DEFAULT_MAX_BUFFER_BYTES;
}

function resolveMaxOldSpaceMb(): number | undefined {
  const raw = process.env.MCP_CLI_MAX_HEAP_MB;
  if (raw?.trim() === '0') {
    return undefined;
  }
  const fromEnv = parsePositiveInteger(raw);
  if (typeof fromEnv === 'number') {
    return fromEnv;
  }
  return DEFAULT_MAX_HEAP_MB;
}

function containsMaxOldSpaceFlag(value?: string): boolean {
  if (!value) {
    return false;
  }
  return /--max-old-space-size(=\S+)?/.test(value);
}

function combineNodeOptions(
  existing: string | undefined,
  additional: string | undefined,
  maxOldSpaceMb?: number
): string | undefined {
  const parts: string[] = [];

  const normalizedExisting = existing?.trim();
  if (normalizedExisting) {
    parts.push(normalizedExisting);
  }

  const normalizedAdditional = additional?.trim();
  if (normalizedAdditional) {
    parts.push(normalizedAdditional);
  }

  const alreadyHasHeapFlag = parts.some(containsMaxOldSpaceFlag);
  if (!alreadyHasHeapFlag && typeof maxOldSpaceMb === 'number' && maxOldSpaceMb > 0) {
    parts.push(`--max-old-space-size=${maxOldSpaceMb}`);
  }

  if (parts.length === 0) {
    return undefined;
  }

  return parts.join(' ').trim();
}

function formatMegabytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 10) {
    return `${Math.round(mb)} MB`;
  }
  return `${mb.toFixed(1).replace(/\.0$/, '')} MB`;
}

function stdoutBufferExceeded(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const message = (error as { message?: string }).message;
  if (typeof message === 'string' && message.includes('stdout maxBuffer exceeded')) {
    return true;
  }
  const stderr = (error as { stderr?: string }).stderr;
  return typeof stderr === 'string' && stderr.includes('maxBuffer exceeded');
}

export interface CliExecuteOptions {
  timeout?: number;
  maxBuffer?: number;
  env?: Record<string, string>;
  /** Per-user Mittwald access token to pass to the CLI via --token */
  token?: string;
  /** Abort signal from the MCP transport, used to cancel the CLI call early. */
  signal?: AbortSignal;
}

export interface CliExecuteResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  /** Execution duration in milliseconds (best effort). */
  durationMs?: number;
}

export async function executeCli(
  command: string,
  args: string[],
  options: CliExecuteOptions = {}
): Promise<CliExecuteResult> {
  // Extract CLI subcommand for metrics (e.g., "app list" from args ["app", "list", ...])
  const cliCommand = args.slice(0, 2).join(' ') || 'unknown';

  const {
    timeout = 180000, // 180 seconds (3 min) - some user/* and org/* commands take 90+ seconds
    maxBuffer,
    env = {},
    token,
    signal,
  } = options;
  const resolvedMaxBuffer = resolveMaxBufferBytes(maxBuffer);
  const maxOldSpaceMb = resolveMaxOldSpaceMb();
  const abortSignal = signal ?? getCurrentAbortSignal();

  // Compute token to inject if not already present in args
  let effectiveArgs = [...args];
  const hasTokenArg = effectiveArgs.includes('--token');
  let effectiveToken = token;
  if (!effectiveToken) {
    // Derive token from current session context, if available
    const sessionId = getCurrentSessionId();
    if (sessionId) {
      try {
        const session = await sessionManager.getSession(sessionId);
        effectiveToken = session?.mittwaldAccessToken;
      } catch {
        // ignore; will proceed without token
      }
    }
  }

  if (!hasTokenArg) {
    if (effectiveToken) {
      effectiveArgs.push('--token', effectiveToken);
    }
  }

  // No need to escape arguments - spawn passes them directly to the executable
  // without shell interpretation. Shell metacharacters are treated as literal strings.
  // This eliminates shell injection vulnerabilities.

  const startedAt = Date.now();
  const mergedEnv: NodeJS.ProcessEnv = {
    ...process.env,
    ...env,
  };
  mergedEnv.MITTWALD_NONINTERACTIVE = '1';
  mergedEnv.CI = '1';
  mergedEnv.MW_DISABLE_AUTOUPDATE = mergedEnv.MW_DISABLE_AUTOUPDATE ?? '1';
  mergedEnv.MW_SKIP_NEW_VERSION_CHECK = mergedEnv.MW_SKIP_NEW_VERSION_CHECK ?? '1';
  mergedEnv.MW_SKIP_ANALYTICS = mergedEnv.MW_SKIP_ANALYTICS ?? '1';

  // CRITICAL FIX: Each mw process gets its own temp config dir to prevent
  // concurrent file access to ~/.config/mw/context.json which has NO LOCKING
  // See: https://github.com/mittwald/cli/blob/master/src/lib/context/UserContextProvider.ts
  mergedEnv.XDG_CONFIG_HOME = `/tmp/mw-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const nodeOptions = combineNodeOptions(
    mergedEnv.NODE_OPTIONS,
    process.env.MCP_CLI_NODE_OPTIONS,
    maxOldSpaceMb
  );
  if (nodeOptions) {
    mergedEnv.NODE_OPTIONS = nodeOptions;
  } else {
    delete mergedEnv.NODE_OPTIONS;
  }

  // Build redacted command for error messages (redact token value)
  const redactedArgs = effectiveArgs.map((arg, i) => {
    if (effectiveArgs[i - 1] === '--token') {
      return '[REDACTED]';
    }
    return arg;
  });
  const redactedCommand = `${command} ${redactedArgs.join(' ')}`;

  try {
    const queueStart = Date.now();
    const release = cliSemaphore ? await cliSemaphore.acquire(abortSignal) : null;
    const queueWaitSeconds = (Date.now() - queueStart) / 1000;
    if (queueWaitSeconds > 0) {
      cliQueueWait.observe(queueWaitSeconds);
    }

	    try {
	      console.log(`[CLI-EXEC] BEFORE spawnPromise: ${cliCommand}, slot acquired`);
	      // Execute CLI directly without shell wrapper - spawn handles concurrent processes better
	      const { stdout, stderr } = await spawnPromise(command, effectiveArgs, {
	        timeout,
	        maxBuffer: resolvedMaxBuffer,
	        env: mergedEnv,
	      });
	      console.log(`[CLI-EXEC] AFTER spawnPromise: ${cliCommand}, got ${stdout.length} bytes stdout`);

      cliCallsTotal.inc({ command: cliCommand, status: 'success' });
      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0,
        durationMs: Date.now() - startedAt
      };
    } finally {
      console.log(`[CLI-EXEC] FINALLY block: ${cliCommand}, releasing slot`);
      release?.();
      console.log(`[CLI-EXEC] FINALLY complete: ${cliCommand}, slot released`);
    }
  } catch (error: any) {
    cliCallsTotal.inc({ command: cliCommand, status: 'error' });
    // spawn rejects the promise if the command exits with non-zero
    let stderr = error?.stderr?.trim() || '';

    // If stderr is empty but we have an error message, use that
    if (!stderr && error?.message) {
      stderr = error.message;
    }

    if (stdoutBufferExceeded(error)) {
      const limitText = formatMegabytes(resolvedMaxBuffer);
      const hint = `Command output exceeded the configured ${limitText} limit. Narrow the request or raise MCP_CLI_MAX_BUFFER_MB.`;
      stderr = stderr ? `${hint}\n${stderr}` : hint;
    }

    // If we have a signal (like timeout), include that information
    if (error?.signal) {
      const signalLine = `Command killed with signal ${error.signal}.`;
      stderr = stderr ? `${signalLine} ${stderr}` : signalLine;
    }

    // Include the command in error output for debugging
    if (!stderr.includes(redactedCommand)) {
      stderr = `Command: ${redactedCommand}\nError: ${stderr}`.trim();
    }

    return {
      stdout: error.stdout?.trim() || '',
      stderr,
      exitCode: error.code || 1,
      durationMs: Date.now() - startedAt
    };
  }
}

export function parseJsonOutput(output: string): any {
  try {
    // Handle multiline JSON output
    const lines = output.split('\n');
    
    // Try to find JSON in the output
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('{') || line.startsWith('[')) {
        // Found potential JSON start, collect all lines until valid JSON
        let jsonStr = line;
        for (let j = i + 1; j < lines.length; j++) {
          jsonStr += '\n' + lines[j];
          try {
            return JSON.parse(jsonStr);
          } catch {
            // Continue collecting lines
          }
        }
        // Try parsing what we have
        try {
          return JSON.parse(jsonStr);
        } catch {
          // Continue to next potential JSON start
        }
      }
    }
    
    // If no valid JSON found, try parsing the entire output
    return JSON.parse(output);
  } catch (error) {
    throw new Error(`Failed to parse JSON output: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function parseQuietOutput(output: string): string | null {
  // Quiet mode typically outputs just the ID
  const lines = output.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    // Return the last non-empty line (usually the ID)
    return lines[lines.length - 1].trim();
  }
  return null;
}
