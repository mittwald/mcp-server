import { formatToolResponse } from './format-tool-response.js';
import { redactMetadata } from './credential-redactor.js';

export interface BuildUpdatedAttributesOptions {
  password?: string;
  token?: string;
  apiKey?: string;
  secret?: string;
  [key: string]: unknown;
}

export function buildUpdatedAttributes(attributes: BuildUpdatedAttributesOptions): Record<string, unknown> {
  const safe: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'password') {
      if (value !== undefined) {
        safe.passwordChanged = Boolean(value);
      }
      continue;
    }

    if (key === 'token') {
      if (value !== undefined) {
        safe.tokenChanged = Boolean(value);
      }
      continue;
    }

    if (key === 'apiKey') {
      if (value !== undefined) {
        safe.apiKeyChanged = Boolean(value);
      }
      continue;
    }

    if (key === 'secret') {
      if (value !== undefined) {
        safe.secretChanged = Boolean(value);
      }
      continue;
    }

    safe[key] = value;
  }

  return safe;
}

export function buildSecureToolResponse(
  status: 'success' | 'error',
  message: string,
  data?: Record<string, unknown>,
  meta?: { command?: string; durationMs?: number; [key: string]: unknown },
) {
  const sanitizedMeta = meta ? redactMetadata(meta) : undefined;
  const sanitizedData = data ? buildUpdatedAttributes(data) : undefined;

  return formatToolResponse(status, message, sanitizedData, sanitizedMeta);
}
