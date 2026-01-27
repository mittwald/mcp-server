import { createHash } from 'crypto';

/**
 * Failure pattern analyzer.
 * Extracts error signatures and clusters failures by root cause.
 */

export interface ErrorSignature {
  error_type: string;               // e.g., "oauth_scope_missing"
  tool_name: string;                // e.g., "mittwald_project_create"
  http_status?: number;             // e.g., 403
  normalized_message: string;       // Normalized error text
}

/**
 * Normalize error message by replacing dynamic values with placeholders.
 * This enables clustering of similar errors with different IDs/timestamps.
 *
 * Replacements:
 * - UUIDs → `<UUID>`
 * - Resource IDs (p-xxx, app-xxx, db-xxx) → `<PROJECT_ID>`, `<APP_ID>`, `<DB_ID>`
 * - Numbers → `<NUM>`
 * - Timestamps → `<TIMESTAMP>`
 * - Hex hashes → `<HASH>`
 */
export function normalizeError(message: string): string {
  let normalized = message.toLowerCase();

  // Replace UUIDs (8-4-4-4-12 format)
  normalized = normalized.replace(/\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/g, '<UUID>');

  // Replace resource IDs
  normalized = normalized.replace(/\bp-[a-z0-9]+\b/g, '<PROJECT_ID>');
  normalized = normalized.replace(/\bapp-[a-z0-9]+\b/g, '<APP_ID>');
  normalized = normalized.replace(/\bdb-[a-z0-9]+\b/g, '<DB_ID>');
  normalized = normalized.replace(/\bdatabase-[a-z0-9]+\b/g, '<DB_ID>');
  normalized = normalized.replace(/\bbackup-[a-z0-9]+\b/g, '<BACKUP_ID>');
  normalized = normalized.replace(/\bdomain-[a-z0-9]+\b/g, '<DOMAIN_ID>');

  // Replace standalone numbers
  normalized = normalized.replace(/\b\d+\b/g, '<NUM>');

  // Replace ISO timestamps
  normalized = normalized.replace(/\b\d{4}-\d{2}-\d{2}t\d{2}:\d{2}:\d{2}(\.\d+)?z?\b/g, '<TIMESTAMP>');

  // Replace hex hashes (8+ chars)
  normalized = normalized.replace(/\b[a-f0-9]{8,}\b/g, '<HASH>');

  // Trim whitespace
  normalized = normalized.trim();

  return normalized;
}

/**
 * Classify error type from error message patterns.
 * Returns a canonical error type for clustering.
 */
export function classifyErrorType(message: string): string {
  const lowerMessage = message.toLowerCase();

  // OAuth scope errors
  if (
    lowerMessage.includes('scope') &&
    (lowerMessage.includes('required') || lowerMessage.includes('missing') || lowerMessage.includes('not granted'))
  ) {
    return 'oauth_scope_missing';
  }

  // Resource not found errors
  if (
    lowerMessage.includes('not found') ||
    lowerMessage.includes('does not exist') ||
    lowerMessage.includes('no such')
  ) {
    return 'resource_not_found';
  }

  // Timeout errors
  if (
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('timed out') ||
    lowerMessage.includes('deadline exceeded')
  ) {
    return 'timeout';
  }

  // Quota/limit errors
  if (
    lowerMessage.includes('quota') ||
    lowerMessage.includes('limit') ||
    lowerMessage.includes('rate limit') ||
    lowerMessage.includes('too many')
  ) {
    return 'quota_exceeded';
  }

  // Authorization errors (not scope-related)
  if (
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('forbidden') ||
    lowerMessage.includes('access denied')
  ) {
    return 'authorization_failed';
  }

  // Validation errors
  if (
    lowerMessage.includes('invalid') ||
    lowerMessage.includes('validation') ||
    lowerMessage.includes('malformed')
  ) {
    return 'validation_error';
  }

  // Network errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('econnrefused') ||
    lowerMessage.includes('enotfound')
  ) {
    return 'network_error';
  }

  // Unknown error type
  return 'unknown';
}

/**
 * Extract error signature from failure details.
 * @param errorMessage - Raw error message
 * @param toolName - Tool that failed
 * @param httpStatus - HTTP status code (if available)
 * @returns Normalized error signature
 */
export function extractSignature(
  errorMessage: string,
  toolName: string,
  httpStatus?: number
): ErrorSignature {
  return {
    error_type: classifyErrorType(errorMessage),
    tool_name: toolName,
    http_status: httpStatus,
    normalized_message: normalizeError(errorMessage),
  };
}

/**
 * Generate deterministic hash for error signature.
 * Used for stable pattern IDs across runs.
 */
export function hashSignature(signature: ErrorSignature): string {
  const key = `${signature.error_type}:${signature.tool_name}:${signature.http_status || 'none'}`;
  return createHash('sha256').update(key).digest('hex').substring(0, 16);
}

/**
 * Generate pattern ID from signature.
 * Format: {error-type}-{hash-6-chars}
 * Example: oauth-scope-missing-a3f5b1
 */
export function generatePatternId(signature: ErrorSignature): string {
  const prefix = signature.error_type.replace(/_/g, '-');
  const hash = hashSignature(signature).substring(0, 6);
  return `${prefix}-${hash}`;
}

/**
 * Generate human-readable root cause description.
 */
export function generateRootCause(signature: ErrorSignature): string {
  switch (signature.error_type) {
    case 'oauth_scope_missing':
      return `Missing OAuth scope for ${signature.tool_name}`;

    case 'resource_not_found':
      return `Resource not found when calling ${signature.tool_name}`;

    case 'timeout':
      return `Timeout calling ${signature.tool_name} (>30s)`;

    case 'quota_exceeded':
      return `Quota exceeded for ${signature.tool_name}`;

    case 'authorization_failed':
      return `Authorization failed for ${signature.tool_name} (HTTP ${signature.http_status})`;

    case 'validation_error':
      return `Validation error in ${signature.tool_name}`;

    case 'network_error':
      return `Network error calling ${signature.tool_name}`;

    case 'unknown':
    default:
      return `Unknown error in ${signature.tool_name}: ${signature.normalized_message.substring(0, 100)}`;
  }
}

/**
 * Generate recommended fix for error type.
 */
export function generateRecommendedFix(errorType: string): string | undefined {
  switch (errorType) {
    case 'oauth_scope_missing':
      return 'Update OAuth client configuration to request required scope. See: docs/oauth-scopes.md';

    case 'resource_not_found':
      return 'Verify resource exists before calling this tool. Check scenario setup steps.';

    case 'timeout':
      return 'Increase timeout threshold or investigate slow API responses.';

    case 'quota_exceeded':
      return 'Check account quota limits. May need to upgrade plan or throttle requests.';

    case 'authorization_failed':
      return 'Verify OAuth token is valid and has required permissions.';

    case 'validation_error':
      return 'Check tool arguments match expected schema. Review tool documentation.';

    case 'network_error':
      return 'Check network connectivity and API endpoint availability.';

    default:
      return undefined;
  }
}
