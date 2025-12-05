/**
 * Stdin Injector - User message injection for Claude CLI sessions
 *
 * Provides typed interface for injecting user messages into running
 * Claude Code sessions via stdin in stream-json format.
 */

import type { Writable } from 'stream';

/**
 * User message format for stream-json injection
 */
export interface UserMessage {
  type: 'user';
  message: {
    role: 'user';
    content: string;
  };
}

/**
 * System message format for stream-json injection
 */
export interface SystemMessage {
  type: 'system';
  message: {
    role: 'system';
    content: string;
  };
}

/**
 * Union type for all injectable message types
 */
export type InjectableMessage = UserMessage | SystemMessage;

/**
 * Result of a message injection attempt
 */
export interface InjectionResult {
  success: boolean;
  error?: string;
  bytesWritten?: number;
}

/**
 * Create a user message object in stream-json format
 */
export function createUserMessage(content: string): UserMessage {
  return {
    type: 'user',
    message: {
      role: 'user',
      content,
    },
  };
}

/**
 * Create a system message object in stream-json format
 */
export function createSystemMessage(content: string): SystemMessage {
  return {
    type: 'system',
    message: {
      role: 'system',
      content,
    },
  };
}

/**
 * Write a user message to the stdin of a Claude session
 *
 * @param stdin - The writable stdin stream from ChildProcess
 * @param content - The message content to inject
 * @returns Injection result with success status
 */
export function writeUserMessage(
  stdin: Writable | null,
  content: string
): InjectionResult {
  if (!stdin) {
    return {
      success: false,
      error: 'stdin is null - session may have closed',
    };
  }

  if (stdin.writableEnded || stdin.destroyed) {
    return {
      success: false,
      error: 'stdin is no longer writable',
    };
  }

  const message = createUserMessage(content);
  const jsonLine = JSON.stringify(message) + '\n';

  try {
    const written = stdin.write(jsonLine);
    if (!written) {
      // Buffer is full, but will be drained
      return {
        success: true,
        bytesWritten: jsonLine.length,
      };
    }
    return {
      success: true,
      bytesWritten: jsonLine.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown write error',
    };
  }
}

/**
 * Write a raw message object to stdin
 *
 * @param stdin - The writable stdin stream from ChildProcess
 * @param message - The message object to inject
 * @returns Injection result with success status
 */
export function writeMessage(
  stdin: Writable | null,
  message: InjectableMessage
): InjectionResult {
  if (!stdin) {
    return {
      success: false,
      error: 'stdin is null - session may have closed',
    };
  }

  if (stdin.writableEnded || stdin.destroyed) {
    return {
      success: false,
      error: 'stdin is no longer writable',
    };
  }

  const jsonLine = JSON.stringify(message) + '\n';

  try {
    stdin.write(jsonLine);
    return {
      success: true,
      bytesWritten: jsonLine.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown write error',
    };
  }
}

/**
 * Write a user message with promise-based drain handling
 *
 * Useful when you need to ensure the message is fully written
 * before proceeding, especially with slow consumers.
 *
 * @param stdin - The writable stdin stream from ChildProcess
 * @param content - The message content to inject
 * @returns Promise resolving to injection result
 */
export async function writeUserMessageAsync(
  stdin: Writable | null,
  content: string
): Promise<InjectionResult> {
  if (!stdin) {
    return {
      success: false,
      error: 'stdin is null - session may have closed',
    };
  }

  if (stdin.writableEnded || stdin.destroyed) {
    return {
      success: false,
      error: 'stdin is no longer writable',
    };
  }

  const message = createUserMessage(content);
  const jsonLine = JSON.stringify(message) + '\n';

  return new Promise((resolve) => {
    try {
      const written = stdin.write(jsonLine, (error) => {
        if (error) {
          resolve({
            success: false,
            error: error.message,
          });
        }
      });

      if (written) {
        resolve({
          success: true,
          bytesWritten: jsonLine.length,
        });
      } else {
        // Wait for drain
        stdin.once('drain', () => {
          resolve({
            success: true,
            bytesWritten: jsonLine.length,
          });
        });
        stdin.once('error', (error) => {
          resolve({
            success: false,
            error: error.message,
          });
        });
      }
    } catch (error) {
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown write error',
      });
    }
  });
}
