/**
 * Standard interface for all library functions
 */
export interface LibraryFunctionBase {
  /** Mittwald API access token */
  apiToken: string;
  /** Optional abort signal for request cancellation */
  signal?: AbortSignal;
}

/**
 * Standard result wrapper for library functions
 */
export interface LibraryResult<T> {
  /** Operation result data */
  data: T;
  /** HTTP status code (for consistency with API client) */
  status: number;
  /** Execution duration in milliseconds */
  durationMs: number;
}

/**
 * Standard error format matching CLI error patterns
 */
export class LibraryError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'LibraryError';
  }
}
