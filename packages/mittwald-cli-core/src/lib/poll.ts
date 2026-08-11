/**
 * Generic polling helper for reading a value repeatedly until it looks "ready", with
 * exponential backoff between attempts.
 *
 * Typical use case in this codebase: right after creating a resource via the Mittwald API,
 * a follow-up read of the same resource can briefly return incomplete data because the backend
 * hasn't converged yet (eventual consistency). `poll` re-issues that read a bounded number of
 * times, waiting a little longer between each attempt, until either the data looks ready or the
 * attempt budget is exhausted.
 */

export interface PollOptions {
  /** Maximum number of attempts (including the first). Default: 5. */
  maxAttempts?: number;
  /** Delay before the second attempt, in ms. Grows by `backoffFactor` after that. Default: 100. */
  initialDelayMs?: number;
  /** Multiplier applied to the delay after each attempt. Default: 2. */
  backoffFactor?: number;
  /** Upper bound for any single delay, in ms. Default: 5000. */
  maxDelayMs?: number;
  /**
   * If `fn()` throws, should `poll` treat that attempt as "not ready" and keep going (`true`),
   * or propagate the error immediately (`false`)? Default: `false` — errors are unexpected by
   * default, so they surface rather than being silently retried; callers polling for eventual
   * consistency on an endpoint that itself may transiently error should opt in explicitly.
   */
  retryOnError?: boolean;
  /**
   * Injectable delay function, primarily so tests can run with fake timers instead of sleeping
   * for real wall-clock time. Defaults to a real `setTimeout`-based sleep.
   */
  delayFn?: (ms: number) => Promise<void>;
}

/** Thrown by `poll` when `throwOnExhausted` is set and the attempt budget runs out. */
export class PollTimeoutError extends Error {
  constructor(attempts: number) {
    super(`condition was not met after ${attempts} attempt(s)`);
    this.name = 'PollTimeoutError';
  }
}

function defaultDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollImpl<T>(
  fn: () => Promise<T>,
  isReady: (result: T) => boolean,
  options: PollOptions & { throwOnExhausted?: boolean } = {}
): Promise<T | undefined> {
  const {
    maxAttempts = 5,
    initialDelayMs = 100,
    backoffFactor = 2,
    maxDelayMs = 5000,
    retryOnError = false,
    throwOnExhausted = false,
    delayFn = defaultDelay,
  } = options;

  let delayMs = initialDelayMs;
  let attempts = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    attempts = attempt;

    if (attempt > 1) {
      await delayFn(Math.min(delayMs, maxDelayMs));
      delayMs = Math.min(delayMs * backoffFactor, maxDelayMs);
    }

    try {
      const result = await fn();
      if (isReady(result)) {
        return result;
      }
    } catch (error) {
      if (!retryOnError) {
        throw error;
      }
      // Best-effort: swallow this attempt's error and try again on the next iteration.
    }
  }

  if (throwOnExhausted) {
    throw new PollTimeoutError(attempts);
  }

  return undefined;
}

/**
 * Calls `fn()` up to `maxAttempts` times, waiting with exponential backoff between attempts,
 * until `isReady` returns `true` for the resolved value. Resolves with the first "ready" value,
 * or — once the attempt budget is exhausted — either resolves with `undefined` (default) or
 * throws a `PollTimeoutError`, depending on `throwOnExhausted`.
 *
 * Declared as a single `const` with an overloaded call signature (rather than multiple
 * `function poll(...)` declarations) so plain ESLint's `no-redeclare` rule — which doesn't
 * understand TypeScript overload syntax — doesn't flag it.
 */
export const poll = pollImpl as {
  <T>(fn: () => Promise<T>, isReady: (result: T) => boolean, options: PollOptions & { throwOnExhausted: true }): Promise<T>;
  <T>(fn: () => Promise<T>, isReady: (result: T) => boolean, options?: PollOptions & { throwOnExhausted?: false }): Promise<T | undefined>;
};
