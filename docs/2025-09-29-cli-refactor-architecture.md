# MCP CLI Refactor Architecture (Draft – 2025-09-29)

## Purpose
Establish a single, session-aware abstraction for invoking the Mittwald CLI from MCP tools, eliminate duplicated handlers, and provide a sustainable pattern for future tool development. This document captures the target architecture, design principles, and the migration approach required to unify the current tool landscape.

## Background
- Current handlers mix direct calls to `executeCli` with bespoke parsing and error handling logic.
- Session-aware helpers exist (`sessionAwareCli`, `enhancedCliWrapper`) but are inconsistently adopted.
- Tool metadata lacks scope annotations and lifecycle context, preventing automated filtering or discovery.
- Redundant tools (e.g., `mittwald_project_list` vs `mittwald_user_accessible_projects`) mask CLI failures and dilute telemetry.
- The Oclif `Invalid regular expression flags` crash exposes the fragility of the CLI integration path.

## Design Goals
1. **Single Execution Path** – all CLI invocations route through a common adapter that enforces session awareness, token injection, context propagation, and logging.
2. **Deterministic Error Surface** – CLI non-zero exits map to structured MCP errors; no silent fallbacks.
3. **Scope-Aware Tool Registry** – every tool declares `requiredScopes`, enabling filtering (see scope filtering plan) and improved onboarding.
4. **Composable Post-Processing** – parsing/transformation logic cleanly separates from execution plumbing; JSON, text, and quiet-id outputs handled uniformly.
5. **Operational Observability** – central logging of command, exit code, stderr, and timing for SLOs.
6. **Testability** – unit tests mock the common adapter; integration tests cover representative commands only once.

## Target Architecture
```
┌─────────────────────────┐
│ Tool Registration (TS)  │  ─ name/title/description
│  - requiredScopes[]     │  ─ handler factory (metadata-driven)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Tool Handler Shell      │  ─ validates args (zod schema)
│ (per domain)            │  ─ delegates to CLI adapter with
│                         │    post-process function
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ CLI Adapter             │  ─ ensures sessionId
│ (new module)            │  ─ token/context injection
│                         │  ─ executes via sessionAwareCli
│                         │  ─ standardises result/error
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Execution Backend       │  ─ sessionAwareCli (Redis
│  - runWithSessionContext│    hydration + mw invocation)
│  - executeCli fallback  │  ─ fallback only for
│                         │    non-auth flows (e.g. health)
└─────────────────────────┘
```

### Key Modules
- `src/tools/registry.ts` *(new)* – exposes tool descriptors with `requiredScopes`, version, tags.
- `src/tools/cli-adapter.ts` *(new)* – exports `invokeCliTool({ command, args, sessionId, parser })`.
- `src/tools/parsers/` *(new)* – reusable result transformers (JSON array → typed objects, quiet output, passthrough).
- `src/tools/error.ts` *(new)* – defines `CliToolError` + helpers to format MCP responses consistently.
- `src/handlers/tools/**` – trimmed to glue: gather args, call adapter, format success payload.
- `src/utils/session-aware-cli.ts` – extended with structured errors, command metadata logging, and opt-in concurrency controls.

### Execution Flow
1. `handleToolCall` resolves tool metadata and invokes handler with `context.sessionId`.
2. Handler builds a declarative request for the adapter: `invokeCliTool({ command: 'project', subcommand: 'list', args, sessionId, parser: parseProjectList })`.
3. Adapter ensures `sessionId` exists, obtains tokens from Redis (via `sessionAwareCli`) and executes CLI.
4. Adapter captures stdout/stderr, exit code, duration; maps non-zero exit to `CliToolError` with typed `reason` (`AUTHENTICATION`, `NOT_FOUND`, `VALIDATION`, `UNKNOWN`).
5. Parser transforms stdout into typed domain object or raises `CliToolError` if shape invalid.
6. Handler wraps result via `formatToolResponse` (expanded to include `errorCode`, `debug` sections when needed).

### Error Semantics
- Non-zero exit → `CliToolError` with fields: `command`, `exitCode`, `stderr`, `suggestedAction`.
- Authentication errors flagged by `stderr` heuristics and raised as `AUTHENTICATION_REQUIRED`; bubble up to encourage re-auth.
- Parsers produce `PARSING_FAILED` with captured payload.
- Logging: single `logger.error` inside adapter with sanitized command (token redacted).

### Scope Metadata & Filtering
- Registrations include `requiredScopes`. Example:
  ```ts
  const registration: ToolRegistration = {
    tool: { name: 'mittwald_project_list', ..., requiredScopes: ['project:read'] },
    handler: createCliToolHandler({
      command: ['project', 'list'],
      parser: parseProjectList,
      permission: 'project:read',
    }),
  };
  ```
- `createCliToolHandler` attaches required scopes to metadata and enforces them at runtime (pre-check against session scopes; fail fast with `SCOPE_DENIED`).

### Logging & Metrics
- Adapter emits structured log: `{ command: 'mw project list', exitCode, durationMs, sessionId, stdoutBytes, stderrBytes }`.
- Hook for tracing (future): optional `traceId` from MCP request metadata.

### Testing Strategy
- Unit tests for adapter: simulate CLI success/failure, verify error mapping.
- Parser tests: supply sample stdout (fixture-based).
- Handler tests: ensure they pass correct args + produce expected tool response.
- Integration tests (selected commands) verifying end-to-end flow with redis mock + CLI stub.

## Migration Plan
### Phase 0 – Prep (Now → A4 completion)
- Confirm Oclif runtime fix availability (Workstream A). Block destructive migrations until CLI stable.
- Add lint rule (custom ESLint) forbidding direct `executeCli('mw', …)` usage outside adapter (initially warn).
- Document current tool inventory (spreadsheet or JSON export) – already underway in B1.

### Phase 1 – Infrastructure (Immediately after A4)
1. Implement new adapter + error types, keep existing handlers untouched.
2. Update `sessionAwareCli` to return structured result `{ stdout, stderr, exitCode, durationMs }` and throw `SessionMissingError` if no session.
3. Extend `formatToolResponse` to accept `meta` & `errorCode`.
4. Add Vitest coverage for adapter & parsers.

### Phase 2 – High-Value Tools (A5–A6 window)
1. Migrate project/server/conversation list handlers using factory `createCliToolHandler`.
2. Decommission fallback tool (`mittwald_user_accessible_projects`) by merging logic into `mittwald_project_list` with improved empty state messaging.
3. Update docs & smoke tests to cover new execution path.

### Phase 3 – Bulk Migration (Post A6)
1. Auto-generate migration checklist from tool inventory.
2. Migrate remaining handlers in batches (category per PR): app, backup, database, domain, extension, mail, org, user, etc.
3. Remove deprecated helper modules (`enhanced-cli-wrapper`, bespoke handler utilities) as batches finish.
4. Enforce ESLint rule as error once 100% migrated.

### Phase 4 – Cleanup & Observability
1. Delete duplicate tools and update registry metadata.
2. Hook adapter logs into existing monitoring (e.g., ship to Datadog).
3. Update onboarding docs (`README`, `ARCHITECTURE`, scope filtering plan) to reflect new flow.
4. Final audit verifying there are no direct `executeCli` usages.

### Dependencies & Coordination
- Workstream A must deliver CLI fix before Phase 2 (tools rely on stable CLI).
- Scope filtering (separate plan) consumes `requiredScopes` metadata; coordinate schema additions.
- Engage QA for regression passes after each migration batch.

## Open Questions
- Do we need support for streaming output (e.g., long-running commands)? If yes, adapter must expose event-based API.
- Should we adopt a declarative YAML/JSON registry for tools, or keep TypeScript descriptors? (TS favored for type safety.)
- How to expose CLI version compatibility info? Consider `mw --version` check and metadata field.

## Next Steps
1. Review this architecture with stakeholders (backend, platform, tooling PM).
2. Iterate on adapter interface and error taxonomy.
3. Once approved, begin Phase 1 implementation under Workstream B tasks.

## Implementation Status
- **2025-09-29** – Initial adapter scaffolding and helper updates merged in commit d7e4a329a57c4f81666d2a2d5f912a93a1fe6a94.
- **2025-09-30** – Generated end-to-end CLI tool inventory for migration tracking (`docs/2025-09-29-cli-tool-inventory.json`). _(commit 97dadafb695a8f66b4039f0f1c6315839484bc19)_
- **2025-09-30** – First handler migration complete (`mittwald_app_copy` now uses `invokeCliTool`). _(commit 13195fe6946880611c5d59fc011e21a2134ee14a)_
- **2025-09-30** – Migrated `mittwald_app_create_node` to the adapter path, continuing alphabetical rollout. _(commit 688ed9397389e6a8f2c65a984cbf6c67c8e40661)_
- **2025-09-30** – Migrated `mittwald_app_create_php` to the adapter path. _(commit f1ac9827b5c026e1cc1cd85256d3b25ccddf18a3)_
- **2025-09-30** – Migrated `mittwald_app_create_php_worker` to the adapter path. _(commit 4f4dd233f4150eac8261d66a53dda4d0e15fa12c)_
- **2025-09-30** – Migrated `mittwald_app_create_python` to the adapter path. _(commit ad1fe396ae2ee3cab713876580dc4f9eb579e40a)_
- **2025-09-30** – Migrated `mittwald_app_create_static` to the adapter path. _(commit 1230eb67d86972fd4ea5d47bca68975942b14a4e)_
- **2025-09-30** – Migrated `mittwald_app_download` to the adapter path. _(commit ece20a097b17440ace7a90bed5dbcad9cf5e77e2)_

- **2025-09-30** – Migrated `mittwald_app_get` to the adapter path. _(commit f3f1e5a62e10f08960a4b1a73b5b0ba3e29d673d)_

- **2025-09-30** – Migrated `mittwald_app_install_contao` to the adapter path. _(commit 85ec619f4fee8352f6d5a3e01f04bef0d6f0f8fb)_

- **2025-09-30** – Migrated `mittwald_app_install_joomla` to the adapter path. _(commit 4f136822c1a8efb4e0be6db833d91694a8d8c9aa)_

- **2025-09-30** – Migrated `mittwald_app_install_matomo` to the adapter path. _(commit 2dbf80169a3f17f3e450bcf6a38fca714e454a95)_

---
*Draft prepared 2025-09-29 by Codex (LLM).*
