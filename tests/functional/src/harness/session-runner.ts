/**
 * Session Runner - Claude Code Subprocess Management
 *
 * Spawns Claude Code headless sessions with streaming JSON output,
 * enforces tool restrictions, and manages session lifecycle.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { createInterface } from 'node:readline';
import { randomUUID } from 'node:crypto';
import type {
  SpawnSessionOptions,
  SessionResult,
  StreamEvent,
  ISessionRunner,
  TestTerminalStatus,
} from '../types/index.js';

/**
 * Default model for cost-efficient test agents (FR-001a)
 */
const DEFAULT_MODEL = 'haiku';

/**
 * Always disallow the mw CLI to ensure agents use MCP tools (FR-002)
 */
const MANDATORY_DISALLOWED_TOOLS = ['Bash(mw)'];

/**
 * Parse a streaming JSON line from Claude Code output
 */
function parseStreamLine(line: string): StreamEvent | null {
  if (!line.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(line);
    return {
      type: parsed.type || 'message',
      timestamp: new Date(),
      content: parsed,
    };
  } catch {
    // Malformed JSON - log and skip
    console.warn('[session-runner] Malformed JSON line:', line.substring(0, 100));
    return null;
  }
}

/**
 * Extract session_id from a stream event
 * Session ID appears in result events
 */
function extractSessionId(event: StreamEvent): string | null {
  const content = event.content as Record<string, unknown>;

  // Check common locations for session_id
  if (content.session_id && typeof content.session_id === 'string') {
    return content.session_id;
  }

  // Check nested in result
  if (content.result && typeof content.result === 'object') {
    const result = content.result as Record<string, unknown>;
    if (result.session_id && typeof result.session_id === 'string') {
      return result.session_id;
    }
  }

  return null;
}

/**
 * Extract cost information from stream events
 */
function extractCost(event: StreamEvent): number | null {
  const content = event.content as Record<string, unknown>;

  // Check for cost in result event
  if (content.cost_usd !== undefined) {
    return Number(content.cost_usd);
  }

  if (content.total_cost_usd !== undefined) {
    return Number(content.total_cost_usd);
  }

  // Check nested in result
  if (content.result && typeof content.result === 'object') {
    const result = content.result as Record<string, unknown>;
    if (result.cost_usd !== undefined) {
      return Number(result.cost_usd);
    }
    if (result.total_cost_usd !== undefined) {
      return Number(result.total_cost_usd);
    }
  }

  return null;
}

/**
 * Extract number of turns from stream events
 */
function extractNumTurns(event: StreamEvent): number | null {
  const content = event.content as Record<string, unknown>;

  if (content.num_turns !== undefined) {
    return Number(content.num_turns);
  }

  // Check nested in result
  if (content.result && typeof content.result === 'object') {
    const result = content.result as Record<string, unknown>;
    if (result.num_turns !== undefined) {
      return Number(result.num_turns);
    }
  }

  return null;
}

/**
 * Session runner implementation
 */
export class SessionRunner implements ISessionRunner {
  /**
   * Spawn a new Claude Code headless session
   */
  async spawn(options: SpawnSessionOptions): Promise<{
    sessionId: string;
    stream: AsyncIterable<StreamEvent>;
    result: Promise<SessionResult>;
    kill: () => void;
    stdin: import('stream').Writable | null;
  }> {
    const startTime = Date.now();
    let sessionId: string = randomUUID(); // Fallback if not extracted
    let totalCostUsd = 0;
    let numTurns = 0;
    let lastResult: string | undefined;
    let errorMessage: string | undefined;
    let isKilled = false;
    let isTimedOut = false;

    // Determine mode:
    // - interactive: keep stdin open for mid-session injection (WP01/WP03)
    // - stdinOnly: pre-send all messages then close stdin
    // - standard: use -p flag and close stdin immediately
    const isInteractive = options.interactive === true;
    const useStdinOnlyMode = !isInteractive && options.additionalMessages && options.additionalMessages.length > 0;

    // Build command arguments (T007, T008, T004-007)
    const args: string[] = [];

    // Only use -p flag if NOT in stdin-only mode AND NOT interactive
    // Interactive mode sends initial prompt via stdin to keep it open
    if (!useStdinOnlyMode && !isInteractive) {
      args.push('-p', options.prompt);
    }

    args.push(
      '--output-format',
      'stream-json',
      '--input-format',
      'stream-json',
      '--verbose',
      '--model',
      DEFAULT_MODEL,
      '--dangerously-skip-permissions'  // Required for automated MCP tool usage
    );

    // Add MCP config if provided
    if (options.mcpConfig) {
      args.push('--mcp-config', options.mcpConfig);
    }

    // Always include mandatory disallowed tools (T008)
    const allDisallowed = [...MANDATORY_DISALLOWED_TOOLS];
    if (options.disallowedTools) {
      for (const tool of options.disallowedTools) {
        if (!allDisallowed.includes(tool)) {
          allDisallowed.push(tool);
        }
      }
    }
    args.push('--disallowedTools', allDisallowed.join(','));

    // Spawn the subprocess
    const childProcess: ChildProcess = spawn('claude', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: options.workingDir,
      env: {
        ...process.env,
        ...options.env,
      },
    });

    // Handle stdin based on mode
    if (isInteractive && childProcess.stdin) {
      // Interactive mode: send initial prompt via stdin, but keep stdin OPEN
      // The caller will inject additional messages and call stdin.end() when done
      const initialMessage = {
        type: 'user',
        message: { role: 'user', content: options.prompt },
      };
      childProcess.stdin.write(JSON.stringify(initialMessage) + '\n');
      // DO NOT close stdin - caller will inject more messages
    } else if (useStdinOnlyMode && childProcess.stdin) {
      // Pre-populated mode: send all messages upfront, then close stdin
      const initialMessage = {
        type: 'user',
        message: { role: 'user', content: options.prompt },
      };
      childProcess.stdin.write(JSON.stringify(initialMessage) + '\n');

      // Send additional messages
      for (const content of options.additionalMessages!) {
        const message = {
          type: 'user',
          message: { role: 'user', content },
        };
        childProcess.stdin.write(JSON.stringify(message) + '\n');
      }

      // Close stdin to trigger processing
      childProcess.stdin.end();
    } else if (childProcess.stdin) {
      // Standard mode: close stdin immediately since we're using -p
      childProcess.stdin.end();
    }

    // Collect stderr for error reporting (T012)
    let stderrOutput = '';
    childProcess.stderr?.on('data', (data: Buffer) => {
      stderrOutput += data.toString();
    });

    // Kill function (T011)
    let killTimeout: NodeJS.Timeout | null = null;
    const kill = (): void => {
      if (isKilled) return;
      isKilled = true;

      childProcess.kill('SIGTERM');
      // Force kill after 5 seconds if still running
      killTimeout = setTimeout(() => {
        childProcess.kill('SIGKILL');
      }, 5000);
    };

    // Set up timeout (T011)
    let timeoutHandle: NodeJS.Timeout | null = null;
    if (options.timeoutMs && options.timeoutMs > 0) {
      timeoutHandle = setTimeout(() => {
        isTimedOut = true;
        kill();
      }, options.timeoutMs);
    }

    // Create stream iterator (T009)
    const stream = (async function* (): AsyncIterable<StreamEvent> {
      if (!childProcess.stdout) {
        return;
      }

      const rl = createInterface({
        input: childProcess.stdout,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        const event = parseStreamLine(line);
        if (event) {
          // Extract session_id if present (T010)
          const extractedSessionId = extractSessionId(event);
          if (extractedSessionId) {
            sessionId = extractedSessionId;
          }

          // Extract cost
          const cost = extractCost(event);
          if (cost !== null) {
            totalCostUsd = cost;
          }

          // Extract turns
          const turns = extractNumTurns(event);
          if (turns !== null) {
            numTurns = turns;
          }

          // Store result text
          if (event.type === 'result') {
            const content = event.content as Record<string, unknown>;
            if (content.result && typeof content.result === 'string') {
              lastResult = content.result;
            } else if (content.text && typeof content.text === 'string') {
              lastResult = content.text;
            }
          }

          // Check for errors
          if (event.type === 'error') {
            const content = event.content as Record<string, unknown>;
            errorMessage = String(content.message || content.error || 'Unknown error');
          }

          yield event;
        }
      }
    })();

    // Create result promise (T012, T013)
    const result = new Promise<SessionResult>((resolve) => {
      const handleExit = (code: number | null, signal: NodeJS.Signals | null): void => {
        // Clear timeouts
        if (timeoutHandle) clearTimeout(timeoutHandle);
        if (killTimeout) clearTimeout(killTimeout);

        const durationMs = Date.now() - startTime;

        // Determine status based on exit condition (T012)
        let status: TestTerminalStatus;
        if (isTimedOut) {
          status = 'timeout';
          errorMessage = errorMessage || 'Session timed out';
        } else if (isKilled && !isTimedOut) {
          status = 'interrupted';
          errorMessage = errorMessage || 'Session was interrupted';
        } else if (signal) {
          status = 'interrupted';
          errorMessage = errorMessage || `Session killed by signal: ${signal}`;
        } else if (code !== 0) {
          status = 'failed';
          errorMessage = errorMessage || stderrOutput || `Exit code: ${code}`;
        } else {
          // Exit code 0 - check if we have errors in stream
          status = errorMessage ? 'failed' : 'passed';
        }

        resolve({
          sessionId,
          status,
          result: lastResult,
          error: errorMessage,
          metrics: {
            durationMs,
            totalCostUsd,
            numTurns,
          },
        });
      };

      childProcess.on('exit', handleExit);
      childProcess.on('error', (err: Error) => {
        errorMessage = err.message;
        handleExit(1, null);
      });
    });

    return {
      sessionId,
      stream,
      result,
      kill,
      stdin: childProcess.stdin,
    };
  }
}

/**
 * Create a session runner instance
 */
export function createSessionRunner(): ISessionRunner {
  return new SessionRunner();
}
