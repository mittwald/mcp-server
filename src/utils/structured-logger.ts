import pino from 'pino';
import { SENSITIVE_KEYS } from './sanitize.js';

/**
 * Production-grade structured logger using Pino.
 * Configured for MCP tool call tracking with sensitive data redaction.
 *
 * Research: kitty-specs/018-documentation-driven-mcp-tool-testing/research.md (Section 1)
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // Redaction paths (fast-redact)
  redact: {
    paths: [
      // OAuth/JWT tokens
      'input.arguments.accessToken',
      'input.arguments.access_token',
      'input.arguments.refreshToken',
      'input.arguments.refresh_token',
      'input.arguments.authorization',

      // API keys
      'input.arguments.apiKey',
      'input.arguments.api_key',
      'input.arguments.apiToken',
      'input.arguments.api_token',

      // Passwords/secrets
      'input.arguments.password',
      'input.arguments.secret',
      'input.arguments.client_secret',
      'input.arguments.code_verifier',

      // Sensitive user data
      'input.arguments.email',
      'input.arguments.phoneNumber',
      'input.arguments.ssn',

      // Response content (tokens in results)
      'output.resultPreview.*.access_token',
      'output.resultPreview.*.refresh_token',
    ],
    censor: '[REDACTED]',
    remove: false, // Keep field structure
  },

  // Formatters
  formatters: {
    level: (label) => ({ level: label }),
  },

  // Development: pretty print (human-readable)
  // Production: JSON (parsed by Fly.io journald)
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
});

// Re-export sanitization for manual pre-sanitization if needed
export { sanitizeValue } from './sanitize.js';
