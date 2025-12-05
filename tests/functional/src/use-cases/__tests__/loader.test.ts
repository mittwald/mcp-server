/**
 * Use Case Loader Tests (WP06)
 */

import { describe, it, expect } from 'vitest';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  loadUseCases,
  loadSingleUseCase,
  formatLoadResult,
  getUniqueDomains,
  getUniqueTags,
  type LoadResult,
} from '../loader.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LIBRARY_PATH = join(__dirname, '../../../use-case-library');

describe('loadUseCases', () => {
  it('loads all use cases from the library', async () => {
    const result = await loadUseCases({ libraryPath: LIBRARY_PATH });

    expect(result.useCases.length).toBeGreaterThanOrEqual(10);
    expect(result.errors.length).toBe(0);
  });

  it('filters by domain', async () => {
    const result = await loadUseCases({ libraryPath: LIBRARY_PATH, domain: 'apps' });

    expect(result.useCases.length).toBe(4); // Updated for WP11 library expansion (31 total use cases)
    expect(result.useCases.every((uc) => uc.domain === 'apps')).toBe(true);
  });

  it('filters by priority', async () => {
    const result = await loadUseCases({ libraryPath: LIBRARY_PATH, priority: 'P1' });

    expect(result.useCases.length).toBeGreaterThan(0);
    expect(result.useCases.every((uc) => uc.priority === 'P1')).toBe(true);
  });

  it('filters by tags', async () => {
    const result = await loadUseCases({ libraryPath: LIBRARY_PATH, tags: ['mysql'] });

    expect(result.useCases.length).toBeGreaterThan(0);
    expect(result.useCases.every((uc) => uc.tags.includes('mysql'))).toBe(true);
  });

  it('combines multiple filters', async () => {
    const result = await loadUseCases({
      libraryPath: LIBRARY_PATH,
      domain: 'apps',
      priority: 'P1',
    });

    expect(result.useCases.length).toBeGreaterThan(0);
    expect(result.useCases.every((uc) => uc.domain === 'apps' && uc.priority === 'P1')).toBe(true);
  });

  it('returns empty array for non-matching filters', async () => {
    const result = await loadUseCases({
      libraryPath: LIBRARY_PATH,
      domain: 'apps',
      tags: ['nonexistent-tag-xyz'],
    });

    expect(result.useCases.length).toBe(0);
  });

  it('returns error for non-existent directory', async () => {
    const result = await loadUseCases({ libraryPath: '/nonexistent/path' });

    expect(result.useCases.length).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('loadSingleUseCase', () => {
  it('loads use case by ID', async () => {
    const useCase = await loadSingleUseCase('apps-001-deploy-php-app', LIBRARY_PATH);

    expect(useCase.id).toBe('apps-001-deploy-php-app');
    expect(useCase.domain).toBe('apps');
    expect(useCase.title).toContain('PHP');
  });

  it('loads use case by file path', async () => {
    const filePath = join(LIBRARY_PATH, 'apps/apps-001-deploy-php-app.json');
    const useCase = await loadSingleUseCase(filePath);

    expect(useCase.id).toBe('apps-001-deploy-php-app');
  });

  it('throws error for non-existent ID', async () => {
    await expect(loadSingleUseCase('nonexistent-id', LIBRARY_PATH)).rejects.toThrow(
      'Use case not found',
    );
  });

  it('throws error for invalid file path', async () => {
    await expect(loadSingleUseCase('/nonexistent/file.json')).rejects.toThrow('Failed to load');
  });
});

describe('formatLoadResult', () => {
  it('formats successful result', () => {
    const result: LoadResult = {
      useCases: [
        {
          id: 'test-001',
          title: 'Test',
          description: 'Test desc',
          domain: 'apps',
          prompt: 'Test prompt',
          expectedDomains: ['apps'],
          expectedTools: ['app/create'],
          successCriteria: [],
          cleanupRequirements: [],
          questionAnswers: [],
          estimatedDuration: 5,
          timeout: 10,
          priority: 'P1',
          tags: ['test'],
        },
      ],
      errors: [],
    };

    const output = formatLoadResult(result);

    expect(output).toContain('1 valid');
    expect(output).toContain('0 errors');
  });

  it('formats result with errors', () => {
    const result: LoadResult = {
      useCases: [],
      errors: [
        {
          filePath: '/path/to/file.json',
          message: 'Schema validation failed',
          details: [{ path: 'prompt', message: 'Required' }],
        },
      ],
    };

    const output = formatLoadResult(result);

    expect(output).toContain('Validation Errors');
    expect(output).toContain('/path/to/file.json');
    expect(output).toContain('Schema validation failed');
    expect(output).toContain('prompt: Required');
    expect(output).toContain('0 valid');
    expect(output).toContain('1 errors');
  });
});

describe('getUniqueDomains', () => {
  it('returns unique domains from use cases', async () => {
    const result = await loadUseCases({ libraryPath: LIBRARY_PATH });
    const domains = getUniqueDomains(result.useCases);

    expect(domains).toContain('apps');
    expect(domains).toContain('databases');
    expect(domains).toContain('domains-mail');
    expect(domains).toContain('project-foundation');
    expect(domains).toContain('containers');
    // WP11 expanded library to 10 domains: apps, databases, domains-mail, project-foundation,
    // containers, identity, organization, access-users, automation, backups
    expect(domains.length).toBe(10);
  });
});

describe('getUniqueTags', () => {
  it('returns sorted unique tags from use cases', async () => {
    const result = await loadUseCases({ libraryPath: LIBRARY_PATH });
    const tags = getUniqueTags(result.useCases);

    expect(tags.length).toBeGreaterThan(0);
    expect(tags).toContain('mysql');
    expect(tags).toContain('deployment');
    // Check sorted
    expect(tags).toEqual([...tags].sort());
  });
});

describe('use case schema validation', () => {
  it('validates all use cases have required fields', async () => {
    const result = await loadUseCases({ libraryPath: LIBRARY_PATH });

    for (const uc of result.useCases) {
      expect(uc.id).toBeDefined();
      expect(uc.title).toBeDefined();
      expect(uc.prompt).toBeDefined();
      expect(uc.domain).toBeDefined();
      expect(uc.expectedTools).toBeDefined();
      expect(uc.expectedTools.length).toBeGreaterThan(0);
      expect(uc.timeout).toBeGreaterThan(0);
      expect(uc.estimatedDuration).toBeGreaterThan(0);
    }
  });

  it('validates prompts do not contain tool hints', async () => {
    const result = await loadUseCases({ libraryPath: LIBRARY_PATH });

    for (const uc of result.useCases) {
      expect(uc.prompt.toLowerCase()).not.toContain('mcp');
      expect(uc.prompt.toLowerCase()).not.toContain('mw cli');
      expect(uc.prompt.toLowerCase()).not.toContain('/create');
      expect(uc.prompt.toLowerCase()).not.toContain('/list');
    }
  });
});
