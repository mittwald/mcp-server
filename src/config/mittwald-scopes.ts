import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '../utils/logger.js';

export interface MittwaldScopeConfiguration {
  readonly supportedScopes: readonly string[];
  readonly upstreamScopes: readonly string[];
  readonly defaultScopes: readonly string[];
}

interface RawScopeConfiguration {
  supportedScopes?: unknown;
  upstreamScopes?: unknown;
  defaultScopes?: unknown;
}

const CONFIG_FILE_NAME = 'mittwald-scopes.json';
const CONFIG_DIR_NAME = 'config';

const scopeConfiguration = loadScopeConfiguration();
const supportedScopeSet = new Set(scopeConfiguration.supportedScopes);
const upstreamScopeSet = new Set(scopeConfiguration.upstreamScopes);

export const SUPPORTED_SCOPES: readonly string[] = scopeConfiguration.supportedScopes;
export const UPSTREAM_SCOPES: readonly string[] = scopeConfiguration.upstreamScopes;
export const DEFAULT_SCOPES: readonly string[] = scopeConfiguration.defaultScopes;
export const DEFAULT_SCOPE_STRING = DEFAULT_SCOPES.join(' ');

export function getScopeConfiguration(): MittwaldScopeConfiguration {
  return scopeConfiguration;
}

export function validateRequestedScopes(scopes: Iterable<string>): {
  valid: string[];
  unsupported: string[];
  passthroughOnly: string[];
} {
  const valid: string[] = [];
  const unsupported: string[] = [];
  const passthroughOnly: string[] = [];

  for (const scope of new Set([...scopes])) {
    if (upstreamScopeSet.has(scope)) {
      valid.push(scope);
    } else if (supportedScopeSet.has(scope)) {
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
    if (upstreamScopeSet.has(scope)) {
      result.push(scope);
    }
  }
  return result;
}

export function buildScopeString(scopes: Iterable<string>): string {
  return Array.from(new Set(scopes)).join(' ');
}

function loadScopeConfiguration(): MittwaldScopeConfiguration {
  const configPath = resolveConfigPath();
  const raw = JSON.parse(readFileSync(configPath, 'utf-8')) as RawScopeConfiguration;

  const supported = parseScopeArray(raw.supportedScopes, 'supportedScopes');
  const upstream = parseScopeArray(raw.upstreamScopes ?? raw.supportedScopes, 'upstreamScopes');
  const defaults = parseScopeArray(raw.defaultScopes, 'defaultScopes');

  for (const scope of defaults) {
    if (!upstream.includes(scope)) {
      throw new Error(`Mittwald scope configuration invalid: default scope "${scope}" is not included in upstreamScopes.`);
    }
  }

  for (const scope of upstream) {
    if (!supported.includes(scope)) {
      logger.warn('[ScopeConfig] upstream scope missing from supportedScopes list', { scope });
    }
  }

  logger.info('[ScopeConfig] Loaded Mittwald scope configuration', {
    configPath,
    supportedCount: supported.length,
    upstreamCount: upstream.length,
    defaultCount: defaults.length
  });

  return {
    supportedScopes: Object.freeze([...supported]),
    upstreamScopes: Object.freeze([...upstream]),
    defaultScopes: Object.freeze([...defaults]),
  };
}

function parseScopeArray(value: unknown, field: keyof RawScopeConfiguration): string[] {
  if (!value) {
    throw new Error(`Mittwald scope configuration missing required field: ${String(field)}`);
  }
  if (!Array.isArray(value)) {
    throw new Error(`Mittwald scope configuration field ${String(field)} must be an array.`);
  }
  const items = value.map((entry) => String(entry).trim()).filter(Boolean);
  if (!items.length) {
    throw new Error(`Mittwald scope configuration field ${String(field)} must contain at least one value.`);
  }
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (!seen.has(item)) {
      seen.add(item);
      unique.push(item);
    }
  }
  return unique;
}

function resolveConfigPath(): string {
  const envPath = process.env.MITTWALD_SCOPE_CONFIG_PATH?.trim();
  if (envPath) {
    const resolved = path.resolve(envPath);
    if (!existsSync(resolved)) {
      throw new Error(`Mittwald scope configuration not found at MITTWALD_SCOPE_CONFIG_PATH: ${resolved}`);
    }
    return resolved;
  }

  const searchRoots = new Set<string>();
  searchRoots.add(process.cwd());

  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  searchRoots.add(moduleDir);

  let current = moduleDir;
  for (let i = 0; i < 6; i += 1) {
    searchRoots.add(current);
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  for (const root of searchRoots) {
    const candidate = path.resolve(root, CONFIG_DIR_NAME, CONFIG_FILE_NAME);
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('Unable to locate Mittwald scope configuration. Set MITTWALD_SCOPE_CONFIG_PATH.');
}
