# Data Model: Convert Mittwald CLI to Library

**Feature**: `012-convert-mittwald-cli`
**Created**: 2025-12-18

---

## Entity Definitions

This document defines the key entities involved in converting the Mittwald CLI to a library.

---

## Entity 1: CLI Library Package

**Description:** Monorepo package containing extracted business logic from `@mittwald/cli`.

**Package Name:** `@mittwald-mcp/cli-core`

**Location:** `packages/mittwald-cli-core/`

### Attributes

```typescript
// packages/mittwald-cli-core/package.json
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
  "dependencies": {
    "@mittwald/api-client": "^4.169.0",
    "@mittwald/api-client-commons": "^4.0.0",
    "date-fns": "^3.0.0",
    "semver": "^7.6.0",
    "chalk": "^5.3.0",
    "axios": "^1.12.0",
    "axios-retry": "^4.0.0"
  }
}
```

### Directory Structure

```
packages/mittwald-cli-core/
├── src/
│   ├── index.ts               # Wrapper function exports
│   ├── contracts/
│   │   └── functions.ts       # TypeScript contracts
│   ├── lib/                   # Business logic (copied from CLI)
│   │   ├── resources/
│   │   │   ├── app/
│   │   │   ├── project/
│   │   │   ├── database/
│   │   │   └── ...
│   │   ├── auth/
│   │   ├── util/
│   │   └── ...
│   └── installers/            # Installer instances (relocated from commands)
│       ├── php.ts
│       ├── node.ts
│       ├── python.ts
│       ├── wordpress.ts
│       └── ...
├── dist/                      # Compiled output
├── package.json
└── tsconfig.json
```

### Relationships

- **Imports:** Business logic from `@mittwald/cli` v1.12.0
- **Imported by:** MCP tool handlers (`src/handlers/tools/mittwald-cli/**/*.ts`)
- **Depends on:** `@mittwald/api-client` (API operations), utility libraries (date-fns, semver, chalk)
- **Replaces:** CLI spawning infrastructure (`cli-wrapper.ts`, `cli-adapter.ts`)

### Lifecycle

1. **Extraction** (WP01): Copy `src/lib/` from CLI, relocate installer instances
2. **Development** (WP02): Create wrapper functions, define contracts
3. **Validation** (WP03-WP05): Parallel execution, ensure output parity
4. **Deployment** (WP06-WP07): Remove CLI spawning, deploy to production

---

## Entity 2: Library Function

**Description:** Individual operation exposed from CLI library (e.g., `listApps`, `createProject`).

**Purpose:** Replace CLI spawn with direct function call, maintain identical behavior.

### Attributes

**Function Signature:**

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

export async function listApps(
  options: AppListOptions
): Promise<LibraryResult<AppListResult>>;
```

### Behavior

**Input:** Options object with `apiToken` + operation-specific parameters
**Output:** `LibraryResult<T>` with data, status, durationMs
**Error Handling:** Throws `LibraryError` with code, message, details

### Implementation Pattern

```typescript
export async function listApps(options: AppListOptions): Promise<LibraryResult<AppListResult>> {
  const startTime = Date.now();

  // 1. Create authenticated API client
  const client = MittwaldAPIV2Client.newWithToken(options.apiToken);

  // 2. Call API using existing lib logic
  const response = await client.app.listAppinstallations({
    projectId: options.projectId,
  });
  assertStatus(response, 200);

  // 3. Enrich data using lib helpers
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

  // 4. Return standard result wrapper
  return {
    data: { installations: enrichedData },
    status: 200,
    durationMs: Date.now() - startTime,
  };
}
```

### Relationships

- **Maps 1:1 to:** MCP tools (e.g., `listApps` → `mittwald_app_list`)
- **Called by:** Tool handlers (`src/handlers/tools/mittwald-cli/app/list-cli.ts`)
- **Uses internally:** Lib utilities (`getAppFromUuid`, `getAppVersionFromUuid`)
- **Depends on:** `@mittwald/api-client` (API calls), `LibraryFunctionBase` contract

### Lifecycle

1. **Definition** (WP02): Create wrapper function, define input/output types
2. **Validation** (WP03-WP04): Parallel execution, compare with CLI output
3. **Migration** (WP05): Update all tool handlers to use library function
4. **Cutover** (WP06): Remove CLI spawn alternative

---

## Entity 3: Tool Handler Migration

**Description:** MCP tool implementation that transitions from CLI spawning to library calls.

**Purpose:** Maintain tool signature while changing invocation mechanism.

### Before (CLI Spawning)

**File:** `src/handlers/tools/mittwald-cli/app/list-cli.ts`

```typescript
import { invokeCliTool } from '../../../tools/cli-adapter.js';

export const handleAppListCli: MittwaldCliToolHandler<MittwaldAppListArgs> = async (args) => {
  const projectId = args.projectId;

  // Spawn CLI process
  const result = await invokeCliTool({
    toolName: 'mittwald_app_list',
    argv: ['app', 'list', projectId, '--output', 'json'],
  });

  const data = JSON.parse(result.stdout);

  return formatToolResponse('success', 'Apps retrieved', data);
};
```

### After (Library Import)

**File:** `src/handlers/tools/mittwald-cli/app/list-cli.ts`

```typescript
import { listApps } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../utils/execution-context.js';

export const handleAppListCli: MittwaldCliToolHandler<MittwaldAppListArgs> = async (args) => {
  const projectId = args.projectId;
  const session = await sessionManager.getSession(getCurrentSessionId());

  // Call library function
  const result = await listApps({
    projectId,
    apiToken: session.mittwaldAccessToken,
  });

  return formatToolResponse('success', 'Apps retrieved', result.data);
};
```

### Attributes

**Tool Handler Properties:**
- **Tool Name:** MCP tool identifier (e.g., `mittwald_app_list`)
- **Parameter Schema:** Input validation (e.g., `MittwaldAppListArgs`)
- **Handler Function:** Async function that processes request
- **Session Dependency:** Requires session for token extraction

### Relationships

- **Imports from:** `@mittwald-mcp/cli-core` (library functions)
- **Extracts tokens from:** Session manager (`sessionManager.getSession()`)
- **Returns to:** MCP client (via `formatToolResponse`)
- **Signature:** UNCHANGED (input parameters, return types, error formats identical)

### Migration Phases

1. **Parallel Validation** (WP04-WP05):
   ```typescript
   // Call BOTH CLI and library
   const validation = await validateToolParity('mittwald_app_list', {
     projectId,
     apiToken: session.mittwaldAccessToken,
   });

   // Log discrepancies
   if (!validation.passed) {
     logger.warn('Output mismatch detected', { discrepancies: validation.discrepancies });
   }

   // Use library result (validated)
   return formatToolResponse('success', 'Apps retrieved', validation.libraryOutput.data);
   ```

2. **Library-Only** (WP06):
   ```typescript
   // Remove validation code, call library directly
   const result = await listApps({
     projectId,
     apiToken: session.mittwaldAccessToken,
   });

   return formatToolResponse('success', 'Apps retrieved', result.data);
   ```

### Lifecycle

1. **Baseline** (before migration): CLI spawning only
2. **Parallel Validation** (WP04-WP05): CLI + library, compare outputs
3. **Library-Only** (WP06): Library calls only, CLI removed
4. **Production** (WP07): Deployed, validated in production

---

## Entity Relationships Diagram

```
┌─────────────────────────────────────┐
│   @mittwald/cli v1.12.0             │
│   (Source: ~/Code/mittwald-cli)     │
└──────────────┬──────────────────────┘
               │ Extract src/lib/
               │ (101 files)
               ▼
┌─────────────────────────────────────┐
│   @mittwald-mcp/cli-core            │
│   (packages/mittwald-cli-core/)     │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  src/lib/ (business logic)  │   │
│   │  src/installers/ (config)   │   │
│   │  src/index.ts (wrappers)    │   │
│   │  src/contracts/ (types)     │   │
│   └─────────────────────────────┘   │
└──────────────┬──────────────────────┘
               │ Import from
               │
               ▼
┌─────────────────────────────────────┐
│   MCP Tool Handlers                 │
│   (src/handlers/tools/mittwald-cli)│
│                                     │
│   ┌─────────────────────────────┐   │
│   │  app/list-cli.ts            │   │
│   │  project/list-cli.ts        │   │
│   │  database/mysql/list-cli.ts │   │
│   │  ... (~100 tools)           │   │
│   └─────────────────────────────┘   │
└──────────────┬──────────────────────┘
               │ Extract token from
               │
               ▼
┌─────────────────────────────────────┐
│   Session Manager                   │
│   (src/server/session-manager.ts)   │
│                                     │
│   Provides: mittwaldAccessToken     │
└─────────────────────────────────────┘
```

---

## Data Flow

### Request Flow (Library-Only Mode)

```
1. MCP Client Request
   ↓
2. MCP Server (tool routing)
   ↓
3. Tool Handler (src/handlers/tools/mittwald-cli/app/list-cli.ts)
   ↓
4. Session Manager (extract mittwaldAccessToken)
   ↓
5. Library Function (listApps from @mittwald-mcp/cli-core)
   ↓
6. API Client (MittwaldAPIV2Client.newWithToken)
   ↓
7. Mittwald API (app.listAppinstallations)
   ↓
8. Response Enrichment (lib helpers: getAppFromUuid, getAppVersionFromUuid)
   ↓
9. Library Result (LibraryResult<AppListResult>)
   ↓
10. Tool Handler (formatToolResponse)
   ↓
11. MCP Client Response
```

### Validation Flow (Parallel Mode)

```
1. MCP Client Request
   ↓
2. Tool Handler
   ├─→ 3a. CLI Spawn (invokeCliTool)
   │    ↓
   │   4a. Parse stdout JSON
   │
   └─→ 3b. Library Call (listApps)
        ↓
       4b. LibraryResult
   ↓
5. validateToolParity (deep compare 4a vs 4b)
   ↓
6. ValidationResult (passed: true/false, discrepancies: [])
   ↓
7. Log discrepancies (if any)
   ↓
8. Return library result (validated)
   ↓
9. MCP Client Response
```

---

## Related Documentation

- **Contracts:** `contracts/` - TypeScript interface definitions
- **Quickstart:** `quickstart.md` - Implementation walkthrough
- **Research:** `research.md` - Architectural decisions
- **Plan:** `plan.md` - Full technical design
