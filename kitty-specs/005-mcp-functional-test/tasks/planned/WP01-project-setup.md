---
work_package_id: "WP01"
subtasks:
  - "T001"
  - "T002"
  - "T003"
  - "T004"
  - "T005"
  - "T006"
title: "Project Setup & Core Types"
phase: "Phase 1 - Foundation"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
history:
  - timestamp: "2025-12-04T11:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP01 – Project Setup & Core Types

## Objectives & Success Criteria

- Establish `tests/functional/` directory structure per plan.md
- Initialize TypeScript project with all required dependencies
- Create shared type definitions matching data-model.md and contracts/harness-api.ts
- Project compiles with `npm run build` and no TypeScript errors

**Success Gate**: `npm install && npm run build` completes successfully.

## Context & Constraints

- **Reference Documents**:
  - `kitty-specs/005-mcp-functional-test/plan.md` - Project structure specification
  - `kitty-specs/005-mcp-functional-test/data-model.md` - Entity type definitions
  - `kitty-specs/005-mcp-functional-test/contracts/harness-api.ts` - API interface contracts
- **Runtime**: Node.js 20+, ES modules
- **Dependencies**: `@anthropic-ai/sdk` for Haiku coordinator

## Subtasks & Detailed Guidance

### Subtask T001 – Create directory structure

- **Purpose**: Establish the folder hierarchy per plan.md.
- **Steps**:
  1. Create `tests/functional/` at repository root
  2. Create subdirectories:
     ```
     tests/functional/
     ├── src/
     │   ├── harness/
     │   ├── resources/
     │   ├── inventory/
     │   └── types/
     ├── config/
     ├── fixtures/
     │   └── test-apps/
     └── output/
         └── sessions/
     ```
- **Files**: Create directories only, no files yet.
- **Parallel?**: No (must complete first)

### Subtask T002 – Initialize package.json

- **Purpose**: Set up Node.js project with correct dependencies.
- **Steps**:
  1. Run `npm init -y` in `tests/functional/`
  2. Add dependencies:
     - `@anthropic-ai/sdk` (Haiku coordinator)
     - `typescript` (dev)
     - `@types/node` (dev)
  3. Configure `"type": "module"` for ES modules
  4. Add scripts:
     ```json
     {
       "scripts": {
         "build": "tsc",
         "test:all": "node dist/harness/index.js --all",
         "test:domain": "node dist/harness/index.js --domain",
         "test:tool": "node dist/harness/index.js --tool",
         "coverage": "node dist/harness/coverage.js",
         "cleanup": "node dist/harness/cleanup.js",
         "status": "node dist/harness/status.js"
       }
     }
     ```
- **Files**: `tests/functional/package.json`
- **Parallel?**: No (needed for T003-T006)

### Subtask T003 – Configure tsconfig.json

- **Purpose**: Enable strict TypeScript with ES module output.
- **Steps**:
  1. Create `tsconfig.json` with:
     ```json
     {
       "compilerOptions": {
         "target": "ES2022",
         "module": "NodeNext",
         "moduleResolution": "NodeNext",
         "outDir": "./dist",
         "rootDir": "./src",
         "strict": true,
         "esModuleInterop": true,
         "skipLibCheck": true,
         "declaration": true
       },
       "include": ["src/**/*"],
       "exclude": ["node_modules", "dist"]
     }
     ```
- **Files**: `tests/functional/tsconfig.json`
- **Parallel?**: Yes (after T002)

### Subtask T004 – Create shared types

- **Purpose**: Define all TypeScript interfaces from data-model.md.
- **Steps**:
  1. Create `src/types/index.ts`
  2. Export all interfaces:
     - `TestSession`, `TestDomain`
     - `ManifestEntry`
     - `ToolInventory`, `ToolEntry`
     - `ResourceTracker`, `TrackedResource`, `ResourceType`
     - `SessionLogRef`
     - `CoordinatorState`, `SessionMonitor`, `TestQueueItem`
  3. Also include contracts from harness-api.ts:
     - `SpawnSessionOptions`, `SessionResult`, `StreamEvent`
     - `CoordinatorDecision`, `CoordinatorInput`, `CoordinatorStatus`
     - `ManifestAppendOptions`, `CoverageReport`
     - `ResourceCreateOptions`, `CleanupResult`
     - `DiscoveryOptions`, `DiscoveredTool`
     - `TestExecutionOptions`, `TestSuiteResult`
- **Files**: `tests/functional/src/types/index.ts`
- **Parallel?**: Yes (after T002)
- **Notes**: Use exact type definitions from data-model.md; status values must be `'passed' | 'failed' | 'timeout' | 'interrupted'`.

### Subtask T005 – Create MCP server config template

- **Purpose**: Provide MCP server connection configuration.
- **Steps**:
  1. Create `config/mcp-server.json`:
     ```json
     {
       "mcpServers": {
         "mittwald": {
           "transport": "http",
           "url": "https://mittwald-mcp-fly2.fly.dev/mcp"
         }
       }
     }
     ```
- **Files**: `tests/functional/config/mcp-server.json`
- **Parallel?**: Yes (after T001)

### Subtask T006 – Create harness entry point stub

- **Purpose**: Provide initial entry point that compiles.
- **Steps**:
  1. Create `src/harness/index.ts` with stub exports:
     ```typescript
     export async function runTestSuite(): Promise<void> {
       console.log('MCP Functional Test Harness - not yet implemented');
     }

     // CLI entry point
     if (import.meta.url === `file://${process.argv[1]}`) {
       runTestSuite().catch(console.error);
     }
     ```
- **Files**: `tests/functional/src/harness/index.ts`
- **Parallel?**: No (validates full project compiles)

## Risks & Mitigations

- **Type drift**: Types must match data-model.md exactly. Use copy-paste, not reinterpretation.
- **ES module compatibility**: Some packages may not be ESM-ready. Test imports early.

## Definition of Done Checklist

- [ ] All directories created per plan.md structure
- [ ] `package.json` has correct dependencies and scripts
- [ ] `tsconfig.json` configured for ES modules
- [ ] All types from data-model.md exported from `src/types/index.ts`
- [ ] `config/mcp-server.json` created with correct URL
- [ ] `npm install && npm run build` succeeds with no errors
- [ ] `tasks.md` updated with completion status

## Review Guidance

- Verify type definitions match data-model.md exactly (especially status enums)
- Confirm ES module configuration works (`"type": "module"`)
- Check that all directories exist and are empty except for created files

## Activity Log

> Append entries when the work package changes lanes.

- 2025-12-04T11:00:00Z – system – lane=planned – Prompt created.
