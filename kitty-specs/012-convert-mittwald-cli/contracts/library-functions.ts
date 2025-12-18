/**
 * Library Function Contracts
 *
 * Standard interfaces for all library functions exported from @mittwald-mcp/cli-core
 *
 * Location: packages/mittwald-cli-core/src/contracts/functions.ts
 */

/**
 * Standard interface for all library functions
 *
 * All exported library functions MUST extend this base interface.
 */
export interface LibraryFunctionBase {
  /** Mittwald API access token (extracted from MCP session) */
  apiToken: string;

  /** Optional abort signal for request cancellation */
  signal?: AbortSignal;
}

/**
 * Standard result wrapper for library functions
 *
 * All library functions MUST return this wrapper structure.
 *
 * @template T - The actual result data type
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
 *
 * Library functions MUST throw this error type to maintain CLI parity.
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
 * Example: App List Function Signature
 *
 * This demonstrates the pattern for library function definitions.
 */
export interface AppListOptions extends LibraryFunctionBase {
  projectId: string;
}

export interface AppListResult {
  installations: Array<{
    id: string;
    appId: string;
    name: string;
    version: string;
    status: string;
  }>;
}

/**
 * List apps in a project
 *
 * @param options - Project ID and authentication
 * @returns Library result with app installations
 * @throws LibraryError if operation fails
 */
export async function listApps(
  options: AppListOptions
): Promise<LibraryResult<AppListResult>>;
