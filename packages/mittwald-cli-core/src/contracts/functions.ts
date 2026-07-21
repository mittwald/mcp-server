import type { MittwaldAPIV2 } from '@mittwald/api-client';

type CommonsValidationErrors = MittwaldAPIV2.Components.Schemas.CommonsValidationErrors;

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

/**
 * Extracts a human-readable error message from an API error response.
 * Handles validation errors by formatting them into a readable list.
 *
 * @param error - The caught error object
 * @returns Formatted error message string
 */
function extractApiErrorMessage(error: unknown): string {
  // Check if error has response.data (Axios-style error)
  const response = (error as { response?: { data?: CommonsValidationErrors & { message?: string } } })?.response;
  const data = response?.data;

  if (data) {
    // Handle validation errors with individual field messages
    if (data.type === 'ValidationError' && data.validationErrors?.length) {
      const errors = data.validationErrors
        .map((e) => (e.path ? `${e.path}: ${e.message}` : e.message))
        .join('; ');
      return `Validation error: ${errors}`;
    }

    // Use the API's error message if available
    if (data.message) {
      return data.message;
    }
  }

  // Fall back to generic error message
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error';
}

/**
 * Extracts the HTTP status code from an API error response.
 *
 * @param error - The caught error object
 * @param fallback - Fallback status code (default: 500)
 * @returns HTTP status code
 */
function extractApiErrorStatus(error: unknown, fallback = 500): number {
  const err = error as { response?: { status?: number }; status?: number };
  return err?.response?.status ?? err?.status ?? fallback;
}

/**
 * Extracts API error details for inclusion in LibraryError.details
 *
 * @param error - The caught error object
 * @returns Object with error details or undefined
 */
function extractApiErrorDetails(error: unknown): Record<string, unknown> | undefined {
  const response = (error as { response?: { status?: number; statusText?: string; data?: CommonsValidationErrors & { message?: string; params?: Record<string, unknown> } } })?.response;
  const data = response?.data;

  if (!data && !response) {
    return undefined;
  }

  return {
    status: response?.status,
    statusText: response?.statusText,
    type: data?.type,
    validationErrors: data?.validationErrors,
    traceId: data?.params?.traceId,
  };
}

/**
 * Creates a LibraryError from an API error with proper message, status, and details extraction.
 *
 * @param error - The caught error object
 * @param startTime - The start time from performance.now() for duration calculation
 * @returns LibraryError with extracted details
 */
export function libraryErrorFromApiError(error: unknown, startTime: number): LibraryError {
  return new LibraryError(
    extractApiErrorMessage(error),
    extractApiErrorStatus(error),
    { ...extractApiErrorDetails(error), durationMs: performance.now() - startTime }
  );
}
