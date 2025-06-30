/**
 * Utilities for handling long-running async operations in tests
 */

import { logger } from '../../src/utils/logger';

export interface PollingOptions {
  maxAttempts?: number;
  intervalMs?: number;
  timeoutMs?: number;
  onProgress?: (attempt: number, maxAttempts: number) => void;
}

export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  duration: number;
  attempts: number;
}

/**
 * Poll an async operation until it completes or times out
 */
export async function pollOperation<T>(
  operation: () => Promise<{ completed: boolean; data?: T; error?: string }>,
  options: PollingOptions = {}
): Promise<OperationResult<T>> {
  const {
    maxAttempts = 120, // 10 minutes with 5s intervals
    intervalMs = 5000,
    timeoutMs = 600000, // 10 minutes
    onProgress
  } = options;

  const startTime = Date.now();
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    
    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      return {
        success: false,
        error: `Operation timed out after ${timeoutMs}ms`,
        duration: Date.now() - startTime,
        attempts
      };
    }

    try {
      const result = await operation();
      
      if (result.completed) {
        return {
          success: !result.error,
          data: result.data,
          error: result.error,
          duration: Date.now() - startTime,
          attempts
        };
      }

      // Report progress
      if (onProgress) {
        onProgress(attempts, maxAttempts);
      }

      // Wait before next attempt
      if (attempts < maxAttempts) {
        await sleep(intervalMs);
      }
    } catch (error) {
      logger.error('Polling operation failed', { error, attempt: attempts });
      
      // Continue polling on transient errors
      if (attempts < maxAttempts) {
        await sleep(intervalMs);
      } else {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
          attempts
        };
      }
    }
  }

  return {
    success: false,
    error: `Max attempts (${maxAttempts}) reached`,
    duration: Date.now() - startTime,
    attempts
  };
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run multiple async operations in parallel with individual timeout handling
 */
export async function runParallelOperations<T>(
  operations: Array<{
    name: string;
    operation: () => Promise<T>;
    timeout?: number;
  }>
): Promise<Map<string, OperationResult<T>>> {
  const results = new Map<string, OperationResult<T>>();
  
  const promises = operations.map(async ({ name, operation, timeout = 600000 }) => {
    const startTime = Date.now();
    
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation ${name} timed out`)), timeout);
      });
      
      // Race between operation and timeout
      const data = await Promise.race([operation(), timeoutPromise]) as T;
      
      results.set(name, {
        success: true,
        data,
        duration: Date.now() - startTime,
        attempts: 1
      });
    } catch (error) {
      results.set(name, {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
        attempts: 1
      });
    }
  });
  
  await Promise.all(promises);
  return results;
}

/**
 * Retry an operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (i < maxRetries - 1) {
        const delay = initialDelayMs * Math.pow(2, i);
        logger.info(`Retrying operation after ${delay}ms (attempt ${i + 1}/${maxRetries})`);
        await sleep(delay);
      }
    }
  }
  
  throw lastError!;
}

/**
 * Create a progress reporter for console output
 */
export function createProgressReporter(taskName: string) {
  let lastProgress = 0;
  
  return (attempt: number, maxAttempts: number) => {
    const progress = Math.floor((attempt / maxAttempts) * 100);
    
    if (progress > lastProgress && progress % 10 === 0) {
      console.log(`${taskName}: ${progress}% (attempt ${attempt}/${maxAttempts})`);
      lastProgress = progress;
    }
  };
}