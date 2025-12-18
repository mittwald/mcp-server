# Research: Convert Mittwald CLI to Library

**Feature**: `012-convert-mittwald-cli`
**Created**: 2025-12-18
**Status**: Complete

---

## Research Overview

This document captures architectural research conducted to determine the best approach for converting the Mittwald CLI from spawned processes to an importable library.

**Key Questions Answered:**
1. Why was process spawning used originally?
2. What alternative architectures were considered?
3. What is the CLI's internal structure?
4. What circular dependencies exist?
5. What testing strategy ensures parity?

---

## Finding 1: Why Process Spawning Was Used

### Problem

MCP server needed to invoke Mittwald CLI operations but the CLI package structure prevented direct imports.

### Evidence

**CLI Package Analysis** (`@mittwald/cli` package.json):
```json
{
  "name": "@mittwald/cli",
  "version": "1.12.0",
  "main": null,
  "exports": null,
  "bin": {
    "mw": "bin/run.js"
  }
}
```

**Key Observations:**
- `"main": null` - NO library entry point
- `"exports": null` - NO ES module exports
- Only exports CLI binary: `bin/mw`

**oclif Framework Guidance:**

From https://oclif.io/docs/running_programmatically/:
> "It's generally a bad idea to run a command directly as commands export a user interface, not a code interface. It's better to break up the code so that it can be called directly rather than as a command."

**MCP Server Context:**

The MCP server spawns `mw` CLI processes because:
- CLI package exports ONLY a binary executable
- No programmatic API exposed
- No TypeScript library interface available

### Conclusion

**Process spawning was the ONLY option given CLI package structure.**

Converting the CLI to a library is necessary because:
1. Package design prevents import-based usage
2. Process spawning causes concurrent user failures
3. oclif framework recommends extracting business logic instead of programmatic command invocation

---

## Finding 2: Alternative Architectures Evaluated

### Option A: Use `@mittwald/api-client` Directly

**Approach:** Bypass CLI entirely, call Mittwald API directly using `@mittwald/api-client` package.

**Pros:**
- No CLI dependency
- Simple imports
- Direct control

**Cons:**
- Must recreate ALL orchestration logic
- CLI contains multi-step workflows (5+ API calls + coordination per operation)
- Example: `app install wordpress` orchestrates:
  1. App creation API call
  2. Database setup API call
  3. Virtual host configuration
  4. File deployment
  5. Validation and error handling
- Would duplicate ~101 files of business logic

**Decision:** ❌ REJECTED - Too much logic duplication

---

### Option B: Programmatic oclif Invocation

**Approach:** Call CLI commands programmatically without spawning processes.

**Pros:**
- No code extraction needed
- Keep CLI as-is

**Cons:**
- oclif docs explicitly discourage this approach
- Still carries oclif framework overhead (arg parsing, command resolution)
- Violates framework best practices
- Doesn't eliminate CLI infrastructure complexity

**Decision:** ❌ REJECTED - Violates framework best practices

---

### Option C: Full CLI Clone to Monorepo

**Approach:** Clone entire `@mittwald/cli` repository into monorepo (`packages/mittwald-cli-fork/`).

**Pros:**
- Keep everything
- No decisions about what to extract
- Complete feature parity guaranteed

**Cons:**
- 94 unnecessary command files (oclif wrappers)
- Larger maintenance surface
- Includes CLI infrastructure we don't need
- 195 total files vs 101 needed files

**Decision:** ❌ REJECTED - Extract lib only is cleaner

---

### Option D: Extract `src/lib/` Only (SELECTED)

**Approach:** Extract ONLY business logic from `src/lib/` directory, skip CLI command wrappers.

**Pros:**
- Business logic already separated in `src/lib/` directory
- Commands are thin oclif wrappers we don't need
- Smallest conversion surface (~101 files vs 195 total)
- Clean separation of concerns

**Cons:**
- Minor refactor needed to relocate installer instances from command files
- Need to resolve circular imports

**Decision:** ✅ ACCEPTED

**Rationale:**
- CLI already well-architected with clear separation
- Extract proven business logic without CLI overhead
- Minimal refactoring required
- Aligns with oclif framework guidance

---

## Finding 3: CLI Internal Structure Analysis

### CLI Architecture

The Mittwald CLI is well-architected with clear separation of concerns:

```
@mittwald/cli/
├── src/
│   ├── commands/          # 94 files - oclif command classes
│   │   ├── app/
│   │   │   ├── list.ts        # Thin wrapper: calls lib functions
│   │   │   ├── create/
│   │   │   │   └── php.tsx    # Exports: phpInstaller + command class
│   │   │   └── install/
│   │   │       └── wordpress.tsx
│   │   ├── project/
│   │   ├── database/
│   │   └── ...
│   └── lib/               # 101 files - business logic
│       ├── resources/
│       │   ├── app/
│       │   │   ├── Installer.ts   # AppInstaller class (actual logic)
│       │   │   └── uuid.ts        # Helper functions
│       │   ├── project/
│       │   └── database/
│       ├── auth/
│       │   └── token.ts
│       └── util/
```

### Command Pattern Example

**File:** `src/commands/app/list.ts`

```typescript
import { ListBaseCommand } from "../../lib/basecommands/ListBaseCommand.js";
import { MittwaldAPIV2Client } from "@mittwald/api-client";
import { getAppFromUuid, getAppVersionFromUuid } from "../../lib/resources/app/uuid.js";

export default class List extends ListBaseCommand {
  static description = "List installed apps in a project.";
  static flags = { ...ListBaseCommand.baseFlags, ...projectFlags };

  // 1. Command extends oclif base class
  protected async getData(): Promise<Response> {
    const projectId = await withProjectId(this.apiClient, List, this.flags, this.args, this.config);

    // 2. Calls API client (business logic)
    const apps = await this.apiClient.app.listAppinstallations({ projectId });
    assertStatus(apps, 200);

    return apps;
  }

  // 3. Enriches data via lib helpers
  protected mapData(data): Promise<ExtendedResponseItem[]> {
    return Promise.all(
      data.map(async (item) => ({
        ...item,
        app: await getAppFromUuid(this.apiClient, item.appId),
        appVersionCurrent: item.appVersion.current
          ? await getAppVersionFromUuid(this.apiClient, item.appId, item.appVersion.current)
          : undefined,
        appVersionDesired: await getAppVersionFromUuid(this.apiClient, item.appId, item.appVersion.desired),
      }))
    );
  }

  // 4. Rendering handled by oclif framework
}
```

**Analysis:**
- Command is **thin wrapper** around lib utilities
- Business logic in `getAppFromUuid()`, `getAppVersionFromUuid()` (from lib/)
- API calls use `MittwaldAPIV2Client` (from `@mittwald/api-client`)
- oclif-specific: arg parsing, flags, rendering

### Extraction Strategy

1. **Copy `src/lib/` entirely** → `packages/mittwald-cli-core/src/lib/`
2. **Move installer instances** from `commands/*/create|install/*.tsx` → `packages/mittwald-cli-core/src/installers/`
3. **Create wrapper functions** in `packages/mittwald-cli-core/src/index.ts` that expose lib functionality
4. **Skip command layer** entirely (94 files not needed)

**Result:**
- Extract 101 business logic files
- Skip 94 oclif wrapper files
- Minimal conversion surface

---

## Finding 4: Dependencies and Circular References

### Problem Identified

Some `src/lib/` files import from `src/commands/` (installer instances).

### Example

**File:** `src/lib/resources/app/custom_installation.ts`

```typescript
import { phpInstaller } from "../../../commands/app/create/php.js";
import { nodeInstaller } from "../../../commands/app/create/node.js";
import { pythonInstaller } from "../../../commands/app/create/python.js";

export function isCustomAppInstallation(appId: string): boolean {
  return [
    phpInstaller.appId,
    nodeInstaller.appId,
    pythonInstaller.appId,
  ].includes(appId);
}
```

### Analysis

**What are installer instances?**

They are **configuration constants**, not command classes.

**File:** `src/commands/app/create/php.tsx`

```typescript
import { AppInstaller } from "../../../lib/resources/app/Installer.js";

// Installer instance (configuration)
export const phpInstaller = new AppInstaller(
  "34220303-cb87-4592-8a95-2eb20a97b2ac",  // appId
  "custom PHP",                             // name
  ["document-root", "site-title"] as const, // flags
);

// Command class (oclif wrapper)
export default class InstallPhp extends ExecRenderBaseCommand {
  static description = phpInstaller.description;
  static flags = phpInstaller.flags;

  protected async exec() {
    return phpInstaller.exec(this.apiClient, this.args, this.flags, this.config);
  }

  protected render(result) {
    return phpInstaller.render(result, this.flags);
  }
}
```

**Key Insight:**
- Installer instance: `phpInstaller = new AppInstaller(...)`
- Actual business logic: `AppInstaller` class (in `lib/resources/app/Installer.ts`)
- Command class just calls `phpInstaller.exec()` and `phpInstaller.render()`

### Resolution Strategy

1. **Move installer instances** to `packages/mittwald-cli-core/src/installers/`
   - Create: `installers/php.ts`, `installers/node.ts`, `installers/python.ts`, etc.
   - Export only the installer instance, not the command class

2. **Update imports** in lib files:
   ```typescript
   // Before:
   import { phpInstaller } from "../../../commands/app/create/php.js";

   // After:
   import { phpInstaller } from "../../installers/php.js";
   ```

3. **Result:** No circular dependency remains
   - lib/ only imports from lib/ and installers/
   - lib/ never imports from commands/

---

## Finding 5: Testing Strategy Research

### Requirement

Validate that library implementation produces identical outputs to CLI spawning before cutover.

### Problem

Existing functional tests are unreliable ("never worked perfectly" - user feedback). Cannot rely on test suite alone for validation.

### Solution: Parallel Validation

**Approach:** Run BOTH CLI spawn AND library call for same request, compare outputs.

### Implementation

```typescript
// For each tool invocation:
const validation = await validateToolParity(toolName, params);

// Execute via CLI spawn
const cliResult = await invokeCliTool({ argv: [...] });

// Execute via library
const libraryResult = await libraryWrapper({ ...params });

// Compare outputs
const discrepancies = deepCompare(cliResult.stdout, libraryResult.data);

// Log differences
if (discrepancies.length > 0) {
  logger.warn('Output mismatch detected', { discrepancies });
}

// Return ValidationResult
return {
  toolName,
  passed: discrepancies.length === 0,
  cliOutput: { stdout, stderr, exitCode, durationMs },
  libraryOutput: { data, status, durationMs },
  discrepancies,
};
```

### Validation Scope

**Coverage:**
- All ~100 MCP tools must pass validation
- Test with various parameter combinations
- Include error cases (invalid IDs, auth failures)

**Success Criteria:**
- 100% output parity (ValidationResult.passed = true)
- Zero discrepancies in success cases
- Zero discrepancies in error cases

### Benefits

1. **High confidence** - Compare actual outputs, not rely on tests
2. **Incremental validation** - Tool by tool, category by category
3. **Clear cutover gate** - Only remove CLI when 100% parity achieved
4. **Debugging** - Detailed diff shows exactly what differs

---

## Research Conclusions

### Architectural Decision: Extract `src/lib/` to Monorepo Package

**Package:** `packages/mittwald-cli-core/`

**Contents:**
- `src/lib/` - Business logic (101 files)
- `src/installers/` - Installer instances (relocated from commands/)
- `src/index.ts` - Wrapper functions (library API)
- `package.json` - Dependencies (@mittwald/api-client, etc.)

**Validation:** Parallel execution (CLI + library) until 100% parity

**Rationale:**
- ✅ Minimal conversion surface (101 files vs 195 total)
- ✅ Clean separation (business logic only)
- ✅ Proven architecture (CLI already separates lib from commands)
- ✅ High confidence (parallel validation ensures parity)
- ✅ Framework alignment (oclif recommends extracting logic)

---

## Next Steps

1. Implement WP01: Extract library package
2. Implement WP02: Create wrapper functions
3. Implement WP03: Build validation harness
4. Implement WP04: Validate pilot tool (prove approach)
5. Implement WP05: Migrate all tools (batch validation)
6. Implement WP06: Remove CLI spawning
7. Implement WP07: Deploy to production

**Research complete. Implementation ready to begin.**
