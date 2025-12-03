import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

interface RawScopeConfiguration {
  supportedScopes?: unknown;
  upstreamScopes?: unknown;
  defaultScopes?: unknown;
}

interface ScopeConfiguration {
  supportedScopes: readonly string[];
  upstreamScopes: readonly string[];
  defaultScopes: readonly string[];
}

const CONFIG_FILE_NAME = 'mittwald-scopes.json';

const configuration = loadConfiguration();
const supportedSet = new Set(configuration.supportedScopes);
const upstreamSet = new Set(configuration.upstreamScopes);

export const SUPPORTED_SCOPES = configuration.supportedScopes;
export const UPSTREAM_SCOPES = configuration.upstreamScopes;
export const DEFAULT_SCOPES = configuration.defaultScopes;
export const DEFAULT_SCOPE_STRING = DEFAULT_SCOPES.join(' ');

// Mittwald accepts these scope formats (from /v2/scopes):
// - app:read, app:write, app:delete
// - user:read, user:write
// - project:read, project:write, project:delete
// - etc.
// There is NO "mittwald:api" passthrough scope!
// OIDC scopes (openid, profile, email) are also not supported.
export const MITTWALD_SCOPE_STRING = DEFAULT_SCOPE_STRING;

export function validateRequestedScopes(scopes: Iterable<string>) {
  const uniqueScopes = new Set(scopes);
  const valid: string[] = [];
  const unsupported: string[] = [];
  const passthroughOnly: string[] = [];

  for (const scope of uniqueScopes) {
    if (upstreamSet.has(scope)) {
      valid.push(scope);
    } else if (supportedSet.has(scope)) {
      passthroughOnly.push(scope);
    } else {
      unsupported.push(scope);
    }
  }

  return { valid, unsupported, passthroughOnly };
}

export function filterUpstreamScopes(scopes: Iterable<string>): string[] {
  const result: string[] = [];
  for (const scope of scopes) {
    if (upstreamSet.has(scope)) {
      result.push(scope);
    }
  }
  return result;
}

export function buildScopeString(scopes: Iterable<string>): string {
  return Array.from(new Set(scopes)).join(' ');
}

function loadConfiguration(): ScopeConfiguration {
  const filePath = resolveConfigurationPath();
  const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as RawScopeConfiguration;

  const supported = parseScopeArray(raw.supportedScopes, 'supportedScopes');
  const upstream = parseScopeArray(raw.upstreamScopes ?? raw.supportedScopes, 'upstreamScopes');
  const defaults = parseScopeArray(raw.defaultScopes, 'defaultScopes');

  for (const scope of defaults) {
    if (!upstream.includes(scope)) {
      throw new Error(`Mittwald scope configuration invalid: default scope "${scope}" is not included in upstreamScopes.`);
    }
  }

  return {
    supportedScopes: Object.freeze([...supported]),
    upstreamScopes: Object.freeze([...upstream]),
    defaultScopes: Object.freeze([...defaults])
  };
}

function parseScopeArray(value: unknown, field: keyof RawScopeConfiguration): string[] {
  if (!value) {
    throw new Error(`Mittwald scope configuration missing required field: ${String(field)}`);
  }
  if (!Array.isArray(value)) {
    throw new Error(`Mittwald scope configuration field ${String(field)} must be an array.`);
  }

  const unique: string[] = [];
  const seen = new Set<string>();

  for (const entry of value) {
    const scope = String(entry).trim();
    if (!scope) {
      continue;
    }
    if (!seen.has(scope)) {
      seen.add(scope);
      unique.push(scope);
    }
  }

  if (unique.length === 0) {
    throw new Error(`Mittwald scope configuration field ${String(field)} must contain at least one value.`);
  }

  return unique;
}

function resolveConfigurationPath(): string {
  const envPath = process.env.MITTWALD_SCOPE_CONFIG_PATH?.trim();
  if (envPath) {
    const resolved = path.resolve(envPath);
    if (!existsSync(resolved)) {
      throw new Error(`Mittwald scope configuration not found at MITTWALD_SCOPE_CONFIG_PATH: ${resolved}`);
    }
    return resolved;
  }

  const searchPaths = [
    path.resolve(process.cwd(), 'config', CONFIG_FILE_NAME),
    path.resolve(process.cwd(), CONFIG_FILE_NAME),
    path.resolve(process.cwd(), '..', CONFIG_FILE_NAME),
    path.resolve(process.cwd(), '..', 'config', CONFIG_FILE_NAME)
  ];

  for (const candidate of searchPaths) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('Unable to locate Mittwald scope configuration. Set MITTWALD_SCOPE_CONFIG_PATH.');
}
