# Implementation Quickstart: Convert Mittwald CLI to Library

**Feature**: `012-convert-mittwald-cli`
**Created**: 2025-12-18

---

## Overview

This quickstart guide walks through the complete implementation flow, from extracting the CLI library to production deployment.

**Prerequisites:**
- Mittwald CLI already cloned at `~/Code/mittwald-cli`
- Working knowledge of TypeScript, MCP tools
- Access to Mittwald API access tokens for testing
  - **Real token available:** `/Users/robert/Code/mittwald-mcp/.env` (use `MITTWALD_API_TOKEN` env var)
  - Load via: `import 'dotenv/config'` in test scripts
  - Avoids need to mock OAuth during development

**Total Steps:** 5

**Estimated Time:** 8-12 days (full batch migration)

**MVP Scope:** Steps 1-4 (proves approach, 1-2 days)

---

## Step 1: Extract CLI Library

**Goal:** Create `packages/mittwald-cli-core/` with business logic extracted from CLI.

**Work Package:** WP01 (T001-T008)

### Commands

```bash
# Navigate to repo root
cd /Users/robert/Code/mittwald-mcp

# Create package directory
mkdir -p packages/mittwald-cli-core/src

# Copy lib directory
cp -r ~/Code/mittwald-cli/src/lib packages/mittwald-cli-core/src/

# Create installers directory
mkdir -p packages/mittwald-cli-core/src/installers

# Extract installer instances from commands
# (Manual step: identify and move installer exports)
```

### Identify Installer Instances

```bash
cd ~/Code/mittwald-cli

# Find installer exports
grep -r "new AppInstaller" src/commands/ | grep export
```

**Expected findings:**
- `src/commands/app/create/php.tsx` → `phpInstaller`
- `src/commands/app/create/node.tsx` → `nodeInstaller`
- `src/commands/app/create/python.tsx` → `pythonInstaller`
- `src/commands/app/install/wordpress.tsx` → `wordpressInstaller`
- (... and more)

### Extract Installer Instance (Example)

**From:** `~/Code/mittwald-cli/src/commands/app/create/php.tsx`

```typescript
import { AppInstaller } from "../../../lib/resources/app/Installer.js";

export const phpInstaller = new AppInstaller(
  "34220303-cb87-4592-8a95-2eb20a97b2ac",
  "custom PHP",
  ["document-root", "site-title"] as const,
);
```

**To:** `packages/mittwald-cli-core/src/installers/php.ts`

```typescript
import { AppInstaller } from '../lib/resources/app/Installer.js';

export const phpInstaller = new AppInstaller(
  "34220303-cb87-4592-8a95-2eb20a97b2ac",
  "custom PHP",
  ["document-root", "site-title"] as const,
);
```

### Update Import Paths

**File:** `packages/mittwald-cli-core/src/lib/resources/app/custom_installation.ts`

```typescript
// Before:
import { phpInstaller } from "../../../commands/app/create/php.js";

// After:
import { phpInstaller } from "../../installers/php.js";
```

### Create Package Configuration

**File:** `packages/mittwald-cli-core/package.json`

```json
{
  "name": "@mittwald-mcp/cli-core",
  "version": "1.0.0",
  "description": "Extracted business logic from @mittwald/cli for MCP server library usage",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./lib/*": {
      "types": "./dist/lib/*.d.ts",
      "import": "./dist/lib/*.js"
    },
    "./installers/*": {
      "types": "./dist/installers/*.d.ts",
      "import": "./dist/installers/*.js"
    }
  },
  "scripts": {
    "build": "tsc && tsc-alias",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@mittwald/api-client": "^4.169.0",
    "@mittwald/api-client-commons": "^4.0.0",
    "date-fns": "^3.0.0",
    "semver": "^7.6.0",
    "chalk": "^5.3.0",
    "axios": "^1.12.0",
    "axios-retry": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/semver": "^7.5.0",
    "typescript": "^5.8.0",
    "tsc-alias": "^1.8.0"
  }
}
```

**File:** `packages/mittwald-cli-core/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node16",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Build Package

```bash
cd packages/mittwald-cli-core

# Install dependencies
npm install

# Build package
npm run build

# Verify output
ls -la dist/
ls -la dist/lib/
ls -la dist/installers/
# Should see .js, .d.ts, .js.map files
```

**Success Criteria:**
- ✅ `npm run build` completes with zero errors
- ✅ `dist/` contains compiled .js and .d.ts files
- ✅ No circular import errors
- ✅ All lib exports accessible

---

## Step 2: Create Package Configuration

**Goal:** Define TypeScript contracts and create core library wrapper functions.

**Work Package:** WP02 (T009-T015)

### Create Contracts

**File:** `packages/mittwald-cli-core/src/contracts/functions.ts`

```typescript
/**
 * Standard interface for all library functions
 */
export interface LibraryFunctionBase {
  /** Mittwald API access token */
  apiToken: string;
  /** Optional abort signal for request cancellation */
  signal?: AbortSignal;
}

/**
 * Standard result wrapper for library functions
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
```

### Create Library Wrapper Functions

**File:** `packages/mittwald-cli-core/src/index.ts`

```typescript
import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { assertStatus } from '@mittwald/api-client-commons';
import type { LibraryFunctionBase, LibraryResult } from './contracts/functions.js';

export * from './contracts/functions.js';

// Example: App List Wrapper
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

export async function listApps(options: AppListOptions): Promise<LibraryResult<AppListResult>> {
  const startTime = Date.now();

  // Create authenticated API client
  const client = MittwaldAPIV2Client.newWithToken(options.apiToken);

  // Use existing lib logic
  const response = await client.app.listAppinstallations({
    projectId: options.projectId,
  });

  assertStatus(response, 200);

  // Map data using existing lib helpers
  const { getAppFromUuid, getAppVersionFromUuid } = await import('./lib/resources/app/uuid.js');

  const enrichedData = await Promise.all(
    response.data.map(async (item) => ({
      id: item.id,
      appId: item.appId,
      name: (await getAppFromUuid(client, item.appId)).name,
      version: item.appVersion.desired,
      status: item.installationStatus,
    }))
  );

  return {
    data: { installations: enrichedData },
    status: 200,
    durationMs: Date.now() - startTime,
  };
}

// Repeat pattern for listProjects(), listMysqlDatabases(), etc.
```

### Test Token Authentication

```typescript
// Manual test script (packages/mittwald-cli-core/test-auth.ts)
import 'dotenv/config';  // Load /Users/robert/Code/mittwald-mcp/.env
import { listApps } from './src/index.js';

const apiToken = process.env.MITTWALD_API_TOKEN!;

const result = await listApps({
  projectId: 'p-abc123',  // Use real project ID from your Mittwald account
  apiToken,
});

console.log(result);
// Should authenticate successfully and return app list
```

**Run test:**
```bash
cd packages/mittwald-cli-core
tsx test-auth.ts
```

**Success Criteria:**
- ✅ Contracts defined (LibraryFunctionBase, LibraryResult, LibraryError)
- ✅ 3 wrapper functions implemented (listApps, listProjects, listMysqlDatabases)
- ✅ Token authentication verified with real token
- ✅ TypeScript builds without errors

---

## Step 3: Create Library Wrapper Functions

**Goal:** Build validation infrastructure to compare CLI vs library outputs.

**Work Package:** WP03 (T016-T022)

### Create Validation Types

**File:** `tests/validation/types.ts`

```typescript
export interface ValidationResult {
  toolName: string;
  passed: boolean;
  cliOutput: {
    stdout: string;
    stderr: string;
    exitCode: number;
    durationMs: number;
  };
  libraryOutput: {
    data: unknown;
    status: number;
    durationMs: number;
  };
  discrepancies: Array<{
    field: string;
    cliValue: unknown;
    libraryValue: unknown;
    diff: string;
  }>;
}
```

### Implement Validation Function

**File:** `tests/validation/parallel-validator.ts`

```typescript
import { invokeCliTool } from '../../src/tools/cli-adapter.js';
import { listApps } from '@mittwald-mcp/cli-core';

export async function validateToolParity(
  toolName: string,
  params: Record<string, unknown>
): Promise<ValidationResult> {
  const startTime = Date.now();

  // Execute via CLI spawn
  const cliResult = await invokeCliTool({
    toolName,
    argv: ['app', 'list', params.projectId as string, '--output', 'json'],
  });
  const cliDuration = Date.now() - startTime;

  // Execute via library
  const libStartTime = Date.now();
  const libraryResult = await listApps({
    projectId: params.projectId as string,
    apiToken: params.apiToken as string,
  });
  const libDuration = Date.now() - libStartTime;

  // Parse CLI output
  const cliData = JSON.parse(cliResult.stdout);

  // Deep compare
  const discrepancies = deepCompare(cliData, libraryResult.data);

  return {
    toolName,
    passed: discrepancies.length === 0,
    cliOutput: {
      stdout: cliResult.stdout,
      stderr: cliResult.stderr,
      exitCode: cliResult.exitCode,
      durationMs: cliDuration,
    },
    libraryOutput: {
      data: libraryResult.data,
      status: libraryResult.status,
      durationMs: libDuration,
    },
    discrepancies,
  };
}

function deepCompare(cli: unknown, lib: unknown): Array<Discrepancy> {
  // Implement deep object comparison
  // Ignore timing fields (createdAt, updatedAt, durationMs)
  // Return field-level discrepancies
}
```

### Create npm Script

**File:** `package.json` (root)

```json
{
  "scripts": {
    "test:validation": "tsx tests/validation/run-validation.ts"
  }
}
```

**Success Criteria:**
- ✅ validateToolParity() returns accurate ValidationResult
- ✅ CLI spawn + library call both execute
- ✅ Output diff generation works
- ✅ `npm run test:validation` script operational

---

## Step 4: Update Tool Handler (Single Tool Pilot)

**Goal:** Migrate pilot tool (`mittwald_app_list`) with parallel validation.

**Work Package:** WP04 (T023-T029)

### Update Tool Handler

**File:** `src/handlers/tools/mittwald-cli/app/list-cli.ts`

```typescript
import { listApps } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../utils/execution-context.js';

export const handleAppListCli: MittwaldCliToolHandler<MittwaldAppListArgs> = async (args) => {
  const projectId = args.projectId;
  const session = await sessionManager.getSession(getCurrentSessionId());

  // PARALLEL VALIDATION MODE
  const validation = await validateToolParity('mittwald_app_list', {
    projectId,
    apiToken: session.mittwaldAccessToken,
  });

  if (!validation.passed) {
    logger.warn('[Validation] Output mismatch detected', {
      tool: 'mittwald_app_list',
      discrepancies: validation.discrepancies,
    });
  }

  // Use library result (validated)
  const result = validation.libraryOutput;

  return formatToolResponse('success', 'Apps retrieved', result.data);
};
```

### Run Validation

```bash
# Test with valid projectId
npm run test:validation -- mittwald_app_list --projectId p-abc123

# Test with invalid projectId (error case)
npm run test:validation -- mittwald_app_list --projectId invalid

# Check validation report
cat validation-report.json
```

### Investigate Discrepancies

If `validation.passed = false`:

1. Review discrepancies array
2. Identify field-level differences
3. Fix library implementation to match CLI exactly
4. Re-run validation

### Measure Performance

```bash
# Benchmark: 100 requests
for i in {1..100}; do
  curl -X POST http://localhost:3000/mcp/tools/mittwald_app_list \
    -d '{"projectId": "p-abc123"}' \
    -w "%{time_total}\n" >> response-times.txt
done

# Calculate median
sort -n response-times.txt | awk '{arr[NR]=$1} END {print arr[int(NR/2)]}'
# Target: <0.050 (50ms)
```

**Success Criteria:**
- ✅ Pilot tool migrated to library calls
- ✅ Parallel validation shows 100% output parity (passed = true)
- ✅ Performance <50ms median
- ✅ Error cases handled identically

---

## Step 5: Validation & Cutover

**Goal:** Deploy to production after full validation passes.

**Work Packages:** WP05 (batch migration), WP06 (CLI removal), WP07 (production)

### Batch Migration (WP05)

```bash
# Migrate all tools by category
npm run migrate-tools -- app      # ~25 tools
npm run migrate-tools -- project  # ~20 tools
npm run migrate-tools -- database # ~25 tools
npm run migrate-tools -- infra    # ~30 tools

# Run full validation suite
npm run test:validation

# Review validation report
cat validation-report.json
# Ensure: passedTools = 100, failedTools = 0
```

### Remove CLI Spawning (WP06)

```bash
# Remove validation code from tool handlers
npm run remove-validation-code

# Delete CLI spawning files
rm src/utils/cli-wrapper.ts
rm src/tools/cli-adapter.ts

# Remove child_process imports
grep -r "from 'child_process'" src/
# Should return no results

# Run test suite
npm test
# Verify tests pass without CLI binary
```

### Production Deployment (WP07)

```bash
# Update workspace dependencies
cd /Users/robert/Code/mittwald-mcp
npm install  # Link workspace packages

# Build library for production
cd packages/mittwald-cli-core
npm run build

# Commit and push to main (triggers GitHub Actions)
git add .
git commit -m "feat: Convert CLI to library for concurrent users

- Extract business logic to @mittwald-mcp/cli-core
- Remove CLI spawning infrastructure
- Achieve 100% output parity via parallel validation
- Performance: <50ms median (vs 200-400ms baseline)

🤖 Generated with Claude Code
Co-Authored-By: Claude Sonnet 4.5 (1M context) <noreply@anthropic.com>"

git push origin main

# Monitor deployment
gh run watch

# Verify deployment
flyctl logs -a mittwald-mcp-fly2
```

### Production Validation

```bash
# Concurrency test: 10 parallel users
npm run test:concurrency -- --users 10

# Performance test: 100 requests
npm run test:performance -- --requests 100 --tool mittwald_project_list

# Verify zero spawning
flyctl ssh console -a mittwald-mcp-fly2 -C "ps aux | grep mw"
# Should show no mw CLI processes
```

**Success Criteria:**
- ✅ All tools migrated (100% coverage)
- ✅ CLI spawning removed
- ✅ Production deployed successfully
- ✅ 10 concurrent users, zero failures
- ✅ <50ms median response time
- ✅ Zero `mw` processes spawned

---

## Troubleshooting

### Build Errors

**Issue:** TypeScript compilation fails with import errors

**Solution:** Verify installer instances relocated correctly, check import paths

```bash
grep -r "from.*commands/" packages/mittwald-cli-core/src/lib
# Should return no results
```

### Validation Failures

**Issue:** `validation.passed = false` with discrepancies

**Solution:** Review discrepancy details, fix library to match CLI exactly

```typescript
validation.discrepancies.forEach(d => {
  console.log(`Field: ${d.field}`);
  console.log(`CLI: ${JSON.stringify(d.cliValue)}`);
  console.log(`Lib: ${JSON.stringify(d.libraryValue)}`);
});
```

### Authentication Errors

**Issue:** Library calls fail with 401 Unauthorized

**Solution:** Verify token extraction from session, check API client creation

```typescript
console.log('Token:', session.mittwaldAccessToken.substring(0, 10) + '...');
const client = MittwaldAPIV2Client.newWithToken(session.mittwaldAccessToken);
```

---

## Next Steps

After completing this quickstart:

1. **Review validation reports** - Ensure 100% parity across all tools
2. **Monitor production** - Watch for errors, performance regressions
3. **Document findings** - Update CLAUDE.md with any discoveries
4. **Celebrate** 🎉 - Feature complete!

**Related Documentation:**
- **Research:** `research.md` - Architectural decisions
- **Contracts:** `contracts/` - TypeScript schemas
- **Data Model:** `data-model.md` - Entity definitions
- **Plan:** `plan.md` - Full technical design
