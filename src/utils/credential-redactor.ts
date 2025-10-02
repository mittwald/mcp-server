export interface RedactionPattern {
  pattern: RegExp;
  placeholder: string;
}

export const DEFAULT_CREDENTIAL_PATTERNS: RedactionPattern[] = [
  { pattern: /--password\s+\S+/g, placeholder: '--password [REDACTED]' },
  { pattern: /--token\s+\S+/g, placeholder: '--token [REDACTED]' },
  { pattern: /--api-key\s+\S+/g, placeholder: '--api-key [REDACTED]' },
  { pattern: /--secret\s+\S+/g, placeholder: '--secret [REDACTED]' },
  { pattern: /--access-token\s+\S+/g, placeholder: '--access-token [REDACTED]' },
  { pattern: /password=["']?[^"'\s&]+["']?/gi, placeholder: 'password=[REDACTED]' },
  { pattern: /token=["']?[^"'\s&]+["']?/gi, placeholder: 'token=[REDACTED]' },
];

export interface RedactCommandOptions {
  command: string;
  patterns?: RedactionPattern[];
  preserveLength?: boolean;
}

function extractSecretLength(match: string): number | undefined {
  if (match.includes('=')) {
    const [, valuePart = ''] = match.split('=');
    const trimmed = valuePart.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    return trimmed.length;
  }

  const parts = match.trim().split(/\s+/);
  if (parts.length < 2) {
    return undefined;
  }

  const [, valuePart] = parts;
  const trimmed = valuePart.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  return trimmed.length;
}

function buildPlaceholder(placeholder: string, length: number | undefined): string {
  if (!length || !placeholder.includes('[REDACTED]')) {
    return placeholder;
  }

  return placeholder.replace('[REDACTED]', `[REDACTED:${length}]`);
}

export function redactCredentialsFromCommand(options: RedactCommandOptions): string {
  const { command, patterns = DEFAULT_CREDENTIAL_PATTERNS, preserveLength = false } = options;

  let sanitized = command;

  for (const { pattern, placeholder } of patterns) {
    sanitized = sanitized.replace(pattern, (match) => {
      if (!preserveLength) {
        return placeholder;
      }

      const secretLength = extractSecretLength(match);
      return buildPlaceholder(placeholder, secretLength);
    });
  }

  return sanitized;
}

export function redactMetadata<T extends { command?: string; [key: string]: unknown }>(meta: T): T {
  if (!meta.command || typeof meta.command !== 'string') {
    return meta;
  }

  return {
    ...meta,
    command: redactCredentialsFromCommand({ command: meta.command }),
  };
}
