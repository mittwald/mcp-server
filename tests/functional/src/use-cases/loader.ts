/**
 * Use Case Loader and Validator (WP06)
 *
 * Loads use case definitions from JSON files in use-case-library/
 * with validation against Zod schemas.
 */

import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { type UseCase, type UseCaseDomain, UseCaseSchema } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Default path to the use case library
 */
const DEFAULT_LIBRARY_PATH = join(__dirname, '../../use-case-library');

/**
 * Options for loading use cases (T039)
 */
export interface LoaderOptions {
  /** Filter by primary domain */
  domain?: UseCaseDomain;
  /** Filter by priority level */
  priority?: 'P1' | 'P2' | 'P3';
  /** Filter by tags (any match) */
  tags?: string[];
  /** Custom path to use case library */
  libraryPath?: string;
}

/**
 * Error encountered during loading (T040)
 */
export interface LoadError {
  /** Path to the file that failed */
  filePath: string;
  /** Error message */
  message: string;
  /** Additional error details (e.g., Zod issues) */
  details?: unknown;
}

/**
 * Result of loading use cases (T036)
 */
export interface LoadResult {
  /** Successfully loaded and validated use cases */
  useCases: UseCase[];
  /** Errors encountered during loading */
  errors: LoadError[];
}

/**
 * Scan a directory recursively for JSON files (T037)
 *
 * @param basePath - Directory to scan
 * @returns Array of JSON file paths
 */
async function scanLibrary(basePath: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(basePath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(basePath, entry.name);

      if (entry.isDirectory()) {
        // Recurse into subdirectories
        files.push(...(await scanLibrary(fullPath)));
      } else if (entry.name.endsWith('.json')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist or isn't readable
    console.warn(`[loader] Could not scan directory: ${basePath}`, error);
  }

  return files;
}

/**
 * Load and validate a single JSON file (T038)
 *
 * @param filePath - Path to the JSON file
 * @returns UseCase if valid, LoadError if invalid
 */
async function loadAndValidate(filePath: string): Promise<UseCase | LoadError> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const json = JSON.parse(content);
    const result = UseCaseSchema.safeParse(json);

    if (result.success) {
      return result.data;
    } else {
      return {
        filePath,
        message: 'Schema validation failed',
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      };
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        filePath,
        message: `JSON parse error: ${error.message}`,
      };
    }
    return {
      filePath,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Filter use cases based on options (T039)
 *
 * @param useCases - Array of use cases to filter
 * @param options - Filter options
 * @returns Filtered array
 */
function filterUseCases(useCases: UseCase[], options: LoaderOptions): UseCase[] {
  let filtered = useCases;

  if (options.domain) {
    filtered = filtered.filter((uc) => uc.domain === options.domain);
  }

  if (options.priority) {
    filtered = filtered.filter((uc) => uc.priority === options.priority);
  }

  if (options.tags?.length) {
    filtered = filtered.filter((uc) => options.tags!.some((tag) => uc.tags.includes(tag)));
  }

  return filtered;
}

/**
 * Load all use cases from the library with validation (T036)
 *
 * @param options - Optional filtering options
 * @returns LoadResult with valid use cases and any errors
 */
export async function loadUseCases(options: LoaderOptions = {}): Promise<LoadResult> {
  const libraryPath = options.libraryPath || DEFAULT_LIBRARY_PATH;

  // T037: Scan directory for JSON files
  const jsonFiles = await scanLibrary(libraryPath);

  if (jsonFiles.length === 0) {
    return {
      useCases: [],
      errors: [
        {
          filePath: libraryPath,
          message: 'No JSON files found in use case library',
        },
      ],
    };
  }

  // T038: Load and validate all files in parallel
  const results = await Promise.all(jsonFiles.map((file) => loadAndValidate(file)));

  // Separate valid use cases from errors
  const useCases: UseCase[] = [];
  const errors: LoadError[] = [];

  for (const result of results) {
    if ('id' in result) {
      useCases.push(result);
    } else {
      errors.push(result);
    }
  }

  // T039: Apply filters
  const filtered = filterUseCases(useCases, options);

  return {
    useCases: filtered,
    errors,
  };
}

/**
 * Load a single use case by ID or file path (T041)
 *
 * @param idOrPath - Use case ID or JSON file path
 * @param libraryPath - Optional custom library path
 * @returns The loaded use case
 * @throws Error if not found or invalid
 */
export async function loadSingleUseCase(idOrPath: string, libraryPath?: string): Promise<UseCase> {
  // If it looks like a file path, load directly
  if (idOrPath.endsWith('.json') || idOrPath.includes('/')) {
    const result = await loadAndValidate(idOrPath);
    if ('id' in result) {
      return result;
    }
    throw new Error(`Failed to load use case: ${result.message}`);
  }

  // Search by ID
  const { useCases, errors } = await loadUseCases({ libraryPath });

  const match = useCases.find((uc) => uc.id === idOrPath);
  if (match) {
    return match;
  }

  // Provide helpful error message
  const availableIds = useCases.map((uc) => uc.id).slice(0, 5);
  const errorCount = errors.length;

  let errorMsg = `Use case not found: ${idOrPath}`;
  if (availableIds.length > 0) {
    errorMsg += `\nAvailable IDs: ${availableIds.join(', ')}${useCases.length > 5 ? '...' : ''}`;
  }
  if (errorCount > 0) {
    errorMsg += `\n${errorCount} file(s) had validation errors`;
  }

  throw new Error(errorMsg);
}

/**
 * Format load errors for display (T040)
 *
 * @param result - Load result to format
 * @returns Formatted string for console output
 */
export function formatLoadResult(result: LoadResult): string {
  const lines: string[] = [];

  if (result.errors.length > 0) {
    lines.push('Validation Errors:');
    for (const error of result.errors) {
      lines.push(`  \u2717 ${error.filePath}`);
      lines.push(`    - ${error.message}`);
      if (error.details && Array.isArray(error.details)) {
        for (const detail of error.details as Array<{ path: string; message: string }>) {
          lines.push(`    - ${detail.path}: ${detail.message}`);
        }
      }
    }
    lines.push('');
  }

  lines.push(`Summary: ${result.useCases.length} valid, ${result.errors.length} errors`);

  return lines.join('\n');
}

/**
 * Get unique domains from loaded use cases
 *
 * @param useCases - Array of use cases
 * @returns Array of unique domains
 */
export function getUniqueDomains(useCases: UseCase[]): UseCaseDomain[] {
  const domains = new Set<UseCaseDomain>();
  for (const uc of useCases) {
    domains.add(uc.domain);
  }
  return Array.from(domains);
}

/**
 * Get unique tags from loaded use cases
 *
 * @param useCases - Array of use cases
 * @returns Array of unique tags
 */
export function getUniqueTags(useCases: UseCase[]): string[] {
  const tags = new Set<string>();
  for (const uc of useCases) {
    for (const tag of uc.tags) {
      tags.add(tag);
    }
  }
  return Array.from(tags).sort();
}
