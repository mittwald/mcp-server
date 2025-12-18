# Implementation Plan: Convert Mittwald CLI to Library

**Feature**: `012-convert-mittwald-cli`
**Branch**: `012-convert-mittwald-cli`
**Status**: Planning Complete
**Created**: 2025-12-18

---

## Technical Context

### Architecture Decisions

**Problem Statement:**
MCP server fails with concurrent users due to:
- Process spawning conflicts when multiple requests spawn `mw` CLI simultaneously
- Node.js compilation cache deadlocks across concurrent processes
- 200-400ms overhead per CLI spawn vs <50ms target

**Solution Architecture:**
Monorepo package `packages/mittwald-cli-core/` containing extracted business logic from `@mittwald/cli` v1.12.0.

**Key Architectural Decisions:**

1. **Why not use `@mittwald/api-client` directly?**
   - CLI contains multi-step orchestration logic (one command = multiple API calls + coordination)
   - Example: `mw app install wordpress` orchestrates app creation, database setup, virtual host config, deployment
   - Recreating this logic would duplicate ~101 files of business logic
   - Decision: Extract existing CLI logic rather than recreate

2. **Why not import `@mittwald/cli` package directly?**
   - Package exports NO library interface (`main: null`, `exports: null`)
   - Only exports binary: `bin/mw`
   - oclif framework official guidance: "Don't run commands programmatically - extract business logic instead"
   - Reference: https://oclif.io/docs/running_programmatically/
   - Decision: Extract source code, not import package

3. **Why extract `src/lib/` only vs full CLI clone?**
   - CLI already well-architected with business logic separated in `src/lib/` (~101 files)
   - Commands are thin oclif wrappers (~94 files) we don't need
   - Commands just call `installer.exec()` and `installer.render()` from lib
   - Minor refactor needed: relocate installer instances from command files to lib
   - Decision: Extract lib only, skip command layer entirely

4. **Validation Strategy:**
   - Parallel execution: Run both CLI spawn AND library calls for same request
   - Compare outputs (stdout, errors, status codes) before cutover
   - Log discrepancies for investigation
   - Rationale: Existing functional tests unreliable ("never worked perfectly"), need high-confidence validation
   - Decision: Parallel validation required before removing CLI spawning

### Technology Stack

**Extracted Components:**
- `@mittwald/cli` v1.12.0 source code (`src/lib/` directory)
- `@mittwald/api-client` v4.169.0 (already in dependencies)
- TypeScript business logic, validation, orchestration

**Package Structure:**
```
packages/
  mittwald-cli-core/
    src/
      lib/           # Extracted from @mittwald/cli/src/lib/
      installers/    # Relocated from @mittwald/cli/src/commands/*/create|install
    package.json
    tsconfig.json
```

**Integration Points:**
- MCP tool handlers (`src/handlers/tools/mittwald-cli/**/*.ts`) - Replace `invokeCliTool()` with library imports
- Session manager (`src/server/session-manager.ts`) - Pass tokens to library functions instead of CLI args
- Authentication layer (`src/server/oauth-middleware.ts`) - UNCHANGED, still extracts tokens identically

### Dependencies

**New Package Dependencies:**
- All `@mittwald/cli` dependencies needed by `src/lib/`:
  - `@mittwald/api-client` (already present)
  - `date-fns`, `semver`, `chalk` (utility libraries)
  - TypeScript, types

**Removed at Cutover:**
- CLI spawning infrastructure (`src/utils/cli-wrapper.ts`, `src/tools/cli-adapter.ts`)
- Process management (semaphores, queuing, child_process)
- Shell escaping, argument parsing for CLI

### Constraints & NFRs

**Performance:**
- Target: <50ms median response time (vs 200-400ms baseline)
- Concurrency: 10 concurrent users minimum, zero failures
- Throughput: 1000 requests/second sustained

**Compatibility:**
- Zero MCP tool signature changes (backward compatible)
- Zero authentication layer changes
- Tool parameter schemas unchanged
- Error formats must match existing CLI patterns

**Operational:**
- Single Fly.io instance deployment (in-memory state, no horizontal scaling)
- No fallback mechanisms (fail fast if library errors)
- Zero compilation cache issues (no child processes)

---

## Constitution Check

**Status**: N/A - No project constitution defined.

When constitution exists, verify:
- [ ] Library-first architecture (if principle exists)
- [ ] Test coverage requirements
- [ ] Breaking change policies
- [ ] Performance standards

---

## Phase 0: Research

### Research Completed

**1. Why Process Spawning Was Used**

**Finding:** CLI is built on oclif framework, designed as binary-only tool with no library exports.

**Evidence:**
- `@mittwald/cli` package.json: `"main": null`, `"exports": null`, `"bin": {"mw": "bin/run.js"}`
- oclif documentation explicitly discourages programmatic command invocation
- MCP server spawns `mw` binary because no import alternative existed

**Conclusion:** Process spawning was the ONLY option given CLI package structure. Converting to library is necessary.

---

**2. Alternative Architectures Evaluated**

**Option A: Use `@mittwald/api-client` directly**
- **Pro:** No CLI dependency, simple imports
- **Con:** Must recreate all orchestration logic (multi-step workflows, validation)
- **Example:** `app install wordpress` = 5+ API calls + coordination + error handling
- **Decision:** REJECTED - Too much logic duplication

**Option B: Programmatic oclif invocation**
- **Pro:** No code extraction needed
- **Con:** oclif docs say "don't do this - extract logic instead"
- **Con:** Still carries oclif framework overhead (arg parsing, command resolution)
- **Decision:** REJECTED - Violates framework best practices

**Option C: Full CLI clone to monorepo**
- **Pro:** Keep everything, no decisions about what to extract
- **Con:** 94 unnecessary command files (oclif wrappers)
- **Con:** Larger maintenance surface
- **Decision:** REJECTED - Extract lib only is cleaner

**Option D: Extract `src/lib/` only (SELECTED)**
- **Pro:** Business logic already separated in lib
- **Pro:** Commands are thin wrappers we don't need
- **Pro:** Smallest conversion surface (~101 files vs 195 total)
- **Con:** Minor refactor to relocate installer instances
- **Decision:** ACCEPTED

---

**3. CLI Internal Structure Analysis**

**Finding:** CLI is well-architected with clear separation of concerns.

**Structure:**
```
src/
  commands/          # 94 files - oclif command classes
    app/
      list.ts        # Thin wrapper: calls lib functions
      create/
        php.tsx      # Exports: phpInstaller instance + command class
  lib/               # 101 files - business logic
    resources/
      app/
        Installer.ts # AppInstaller class (actual logic)
        uuid.ts      # Helper functions
    auth/
      token.ts       # Authentication utilities
    util/            # Shared utilities
```

**Pattern Example** (`commands/app/list.ts`):
1. Command extends `ListBaseCommand` (oclif)
2. `getData()` calls `apiClient.app.listAppinstallations()`
3. `mapData()` enriches response via `getAppFromUuid()` (from lib)
4. Rendering handled by oclif framework

**Extraction Strategy:**
- Copy `src/lib/` entirely → `packages/mittwald-cli-core/src/lib/`
- Move installer instances (e.g., `phpInstaller`) from `commands/*/create|install/*.tsx` → `packages/mittwald-cli-core/src/installers/`
- Create wrapper functions in `packages/mittwald-cli-core/src/index.ts` that expose lib functionality with MCP-friendly signatures

---

**4. Dependencies and Circular References**

**Finding:** Some `src/lib/` files import from `commands/` (installer instances).

**Example:**
```typescript
// src/lib/resources/app/custom_installation.ts
import { phpInstaller } from "../../../commands/app/create/php.js";
```

**Analysis:**
- Imports are for **configuration constants** (installer instances), not command classes
- Installer instances are just: `new AppInstaller(appId, name, flags)`
- Actual business logic lives in `src/lib/resources/app/Installer.ts`

**Resolution:**
1. Move installer instances to `packages/mittwald-cli-core/src/installers/`
2. Update imports in lib files to point to new location
3. No circular dependency remains

---

**5. Testing Strategy Research**

**Requirement:** Parallel validation (run CLI spawn + library, compare outputs)

**Implementation Approach:**
1. Create comparison harness in test utilities
2. For each tool invocation:
   - Execute via CLI spawn (existing `invokeCliTool`)
   - Execute via library import (new `invokeLibraryFunction`)
   - Compare: stdout, stderr, exit code, response time
3. Log discrepancies with detailed diff
4. Gate cutover on: 100% output parity across all tools

**Validation Scope:**
- All ~100 MCP tools must pass validation
- Test with various parameter combinations
- Include error cases (invalid IDs, auth failures)

---

## Phase 1: Design & Contracts

### Data Model

**Entity: CLI Library Package**

```typescript
// packages/mittwald-cli-core/package.json
{
  "name": "@mittwald-mcp/cli-core",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": "./dist/index.js",
    "./lib/*": "./dist/lib/*.js",
    "./installers/*": "./dist/installers/*.js"
  },
  "dependencies": {
    "@mittwald/api-client": "^4.169.0",
    "date-fns": "^...",
    "semver": "^...",
    "chalk": "^..."
  }
}
```

**Entity: Library Function**

```typescript
// packages/mittwald-cli-core/src/index.ts

export interface LibraryFunctionOptions {
  apiToken: string;           // Mittwald access token from session
  signal?: AbortSignal;       // Request cancellation
}

export interface AppListOptions extends LibraryFunctionOptions {
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

// Library function signature
export async function listApps(
  options: AppListOptions
): Promise<AppListResult>;
```

**Entity: Tool Handler Migration**

```typescript
// Before (CLI spawning):
const result = await invokeCliTool({
  toolName: 'mittwald_app_list',
  argv: ['app', 'list', projectId, '--output', 'json'],
});

// After (library import):
import { listApps } from '@mittwald-mcp/cli-core';

const result = await listApps({
  projectId,
  apiToken: session.mittwaldAccessToken,
});
```

---

### API Contracts

**Contract: Library Function Interface**

Location: `packages/mittwald-cli-core/src/contracts/functions.ts`

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

**Contract: Parallel Validation Interface**

Location: `tests/validation/parallel-validator.ts`

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

export async function validateToolParity(
  toolName: string,
  params: Record<string, unknown>
): Promise<ValidationResult>;
```

---

### Implementation Quickstart

**Step 1: Extract CLI Library**

```bash
# Clone Mittwald CLI (already done at ~/Code/mittwald-cli)
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

**Step 2: Create Package Configuration**

```bash
cd packages/mittwald-cli-core

# Create package.json
npm init -y
# Edit: Set name, exports, dependencies

# Create tsconfig.json
# (Configure TypeScript build)

# Build package
npm run build
```

**Step 3: Create Library Wrapper Functions**

```typescript
// packages/mittwald-cli-core/src/index.ts

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { withProjectId } from './lib/resources/project/flags.js';
import { assertStatus } from '@mittwald/api-client-commons';

export async function listApps(options: AppListOptions): Promise<AppListResult> {
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

  return { installations: enrichedData };
}
```

**Step 4: Update Tool Handler (Single Tool Pilot)**

```typescript
// src/handlers/tools/mittwald-cli/app/list-cli.ts

import { listApps } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../tests/validation/parallel-validator.js';

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

**Step 5: Validation & Cutover**

```bash
# Run validation suite
npm run test:validation

# Review validation report
cat validation-report.json

# If 100% parity achieved:
# Remove parallel validation code
# Remove CLI spawning infrastructure
# Deploy library-only implementation
```

---

## Evaluation Gates

### Gate 1: Library Package Extraction Complete
- [ ] `packages/mittwald-cli-core/` created with `src/lib/` copied
- [ ] Installer instances relocated to `src/installers/`
- [ ] Circular imports resolved (lib no longer imports from commands)
- [ ] package.json configured with correct dependencies
- [ ] TypeScript builds without errors
- [ ] All lib exports accessible via `import { ... } from '@mittwald-mcp/cli-core'`

**Blocker Criteria:** TypeScript compilation fails, missing dependencies, import errors

---

### Gate 2: Wrapper Functions Implemented
- [ ] Core library functions created for top 10 most-used tools
- [ ] Function signatures match LibraryFunctionBase contract
- [ ] Error handling matches CLI error patterns
- [ ] Token authentication flows correctly
- [ ] Abort signals propagate to API calls

**Blocker Criteria:** Functions throw unexpected errors, authentication fails, signatures incompatible with tool handlers

---

### Gate 3: Parallel Validation Harness Operational
- [ ] `validateToolParity()` function implemented
- [ ] CLI spawn + library call comparison working
- [ ] Output diff generation accurate
- [ ] Validation results logged with structured format
- [ ] Test suite runnable via `npm run test:validation`

**Blocker Criteria:** Validation harness crashes, comparison logic flawed, cannot detect discrepancies

---

### Gate 4: Pilot Tool Validated (100% Parity)
- [ ] Single tool (e.g., `mittwald_app_list`) migrated to library
- [ ] Parallel validation shows 100% output parity
- [ ] Performance improves (<50ms vs 200-400ms baseline)
- [ ] Error cases handled identically
- [ ] No authentication regressions

**Blocker Criteria:** Output discrepancies exist, performance worse, errors differ from CLI

---

### Gate 5: All Tools Validated
- [ ] All ~100 MCP tools migrated to library calls
- [ ] Validation report shows 100% parity across all tools
- [ ] No discrepancies in success cases
- [ ] No discrepancies in error cases
- [ ] Concurrency testing passes (10 concurrent users, zero failures)

**Blocker Criteria:** Any tool shows parity failures, concurrency errors occur

---

### Gate 6: CLI Spawning Removed
- [ ] Parallel validation code removed from tool handlers
- [ ] `cli-wrapper.ts`, `cli-adapter.ts` deleted
- [ ] `child_process` imports removed
- [ ] No `spawn()`, `exec()`, `execFile()` calls to `mw` remain
- [ ] All tool handlers use direct library imports
- [ ] Tests pass without CLI binary installed

**Blocker Criteria:** Tests fail after CLI removal, tool handlers broken

---

### Gate 7: Production Validation
- [ ] Deployed to Fly.io `mittwald-mcp-fly2`
- [ ] 10 concurrent users tested (zero failures)
- [ ] Median response time <50ms measured
- [ ] 1000 req/sec throughput sustained
- [ ] Zero process spawning confirmed (monitoring)
- [ ] Authentication flows unchanged
- [ ] No MCP tool signature changes required by clients

**Blocker Criteria:** Concurrent user failures, performance degradation, authentication errors

---

## Success Criteria Traceability

| Spec Criterion | Plan Gate | Validation Method |
|----------------|-----------|-------------------|
| SC-001: 10 concurrent users, zero failures | Gate 7 | Load test with 10 parallel tool invocations |
| SC-002: Tools function identically | Gate 5 | Parallel validation 100% parity |
| SC-003: Zero CLI processes spawned | Gate 6 | Code search for spawn/exec, process monitoring |
| SC-004: <50ms median response time | Gate 7 | Performance benchmarking |
| SC-005: 1000 req/sec throughput | Gate 7 | Load testing with sustained traffic |
| SC-006: Auth layer unchanged | Gate 4 | Token flow testing, no code changes to auth modules |
| SC-007: Tool signatures unchanged | Gate 6 | TypeScript compilation, existing tests pass |
| SC-008: 100% tool coverage | Gate 5 | All tools in `src/handlers/tools/mittwald-cli/` migrated |

---

## Risk Assessment

### High Risk
- **Output parity failures** - Library behavior differs from CLI
  - Mitigation: Parallel validation catches this before cutover
  - Fallback: Fix library to match CLI exactly, re-validate

### Medium Risk
- **Performance regression** - Library slower than expected
  - Mitigation: Benchmark early (Gate 4), optimize before full rollout
  - Fallback: Profile, optimize hot paths, consider caching

### Low Risk
- **Authentication token flow changes** - Tokens don't reach library correctly
  - Mitigation: Early testing in Gate 4, clear token passing pattern
  - Fallback: Adjust session manager integration

---

## Next Steps

**Immediate:**
1. User runs `/spec-kitty.tasks` to generate work packages
2. Implementation begins with Gate 1 (library extraction)

**DO NOT PROCEED TO TASK GENERATION** - This planning phase is complete.

---

**Plan Version**: 1.0
**Author**: Claude (Sonnet 4.5)
**Last Updated**: 2025-12-18
