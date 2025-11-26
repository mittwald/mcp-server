import fs from 'node:fs';
import path from 'node:path';
import type { UserConfigExport } from 'vitest/config';

export interface SharedVitestOptions {
  /** Absolute path to the project root that is instantiating Vitest. */
  projectRoot: string;
  /** Optional setup files to load before the test suite. */
  setupFiles?: string[];
  /** Module alias map that should be applied for the project. */
  alias?: Record<string, string>;
  /** Additional glob patterns to exclude from coverage. */
  coverageExclude?: string[];
}

const DEFAULT_COVERAGE_EXCLUDES = [
  'node_modules/',
  'tests/',
  'build/',
  '**/*.d.ts',
  '**/*.test.ts',
  '**/*.spec.ts'
];

export function createSharedVitestConfig(options: SharedVitestOptions): UserConfigExport {
  const { projectRoot, alias = {}, coverageExclude = [] } = options;

  const setupFiles = (options.setupFiles ?? [])
    .map((filePath) => (path.isAbsolute(filePath) ? filePath : path.resolve(projectRoot, filePath)))
    .filter((filePath) => fs.existsSync(filePath));

  return {
    test: {
      globals: true,
      environment: 'node',
      setupFiles,
      testTimeout: 15_000,
      hookTimeout: 5_000,
      exclude: [
        'node_modules/**',
        '.worktrees/**'
      ],
      silent: process.env.CI ? true : false,
      reporter: process.env.CI ? 'basic' : 'default',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [...DEFAULT_COVERAGE_EXCLUDES, ...coverageExclude]
      },
      pool: 'threads',
      poolOptions: {
        threads: {
          singleThread: true,
          maxThreads: 1,
          minThreads: 1
        }
      },
      onConsoleLog: () => false,
      maxConcurrency: 1
    },
    resolve: {
      alias
    }
  } satisfies UserConfigExport;
}
