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

- **2025-09-30** – Migrated `mittwald_app_install_nextcloud` to the adapter path. _(commit 1c90f3355e41aac552f825c021f5fd91208f4dd3)_

- **2025-09-30** – Migrated `mittwald_app_install_shopware5` to the adapter path. _(commit 9b2a205e4712eef79f6f70e969a1356a4b8bc6bf)_

- **2025-09-30** – Migrated `mittwald_app_install_shopware6` to the adapter path. _(commit bd619eff1110c5e7cb482b3f16c66a729d982c31)_

- **2025-09-30** – Migrated `mittwald_app_install_typo3` to the adapter path. _(commit 4103c6fac0befc931093d24d5e7775f8efe28a81)_

- **2025-09-30** – Migrated `mittwald_app_install_wordpress` to the adapter path. _(commit 97ef1cce5893ada00d0d44e310a1b5e1bd8630db)_

- **2025-09-30** – Migrated `mittwald_app_list` to the adapter path. _(commit 9f3c84b803c0e16907e098fe3a6ba7331c2e8d30)_

- **2025-09-30** – Migrated `mittwald_app_list_upgrade_candidates` to the adapter path. _(commit 7d71c73a4ed6d2261fd444fcacd25cdb840a41b4)_

- **2025-09-30** – Migrated `mittwald_app_open` to the adapter path. _(commit c4a54d7378608450755c57dc4ff264f2c20d55b2)_

- **2025-09-30** – Migrated `mittwald_app_ssh` to the adapter path. _(commit 935a1456e956fe8e53c384a042657bfb9dba04ea)_

- **2025-09-30** – Migrated `mittwald_app_uninstall` to the adapter path. _(commit 2452eee1919078fa1a68ae8a40e7cc5701c0fe48)_

- **2025-09-30** – Migrated `mittwald_app_update` to the adapter path. _(commit d171b1d76107323b599631e7608a71331b26a91b)_

- **2025-09-30** – Migrated `mittwald_app_upgrade` to the adapter path. _(commit 92b60f9969588b7ea557ece836d7415b52e17a7b)_

- **2025-09-30** – Migrated `mittwald_app_upload` to the adapter path. _(commit 4fc811706ae24f2048a73b977e8b538a775f5abb)_

- **2025-09-30** – Migrated `mittwald_app_versions` to the adapter path. _(commit 871b2d3d6ca2789a14d898feb6b562a92ccd1d58)_

- **2025-09-30** – Migrated `mittwald_backup_create` to the adapter path. _(commit 308d906f2e796b79436d12a21b0b754bd3b6054b)_

- **2025-09-30** – Migrated `mittwald_backup_delete` to the adapter path. _(commit c26fb23a2cf4ed137b5df86657b1b5ca15ee7fc6)_

- **2025-09-30** – Migrated `mittwald_backup_download` to the adapter path. _(commit 44344cf88537b0e3f3d15f976b5d3d45db7ab55b)_

- **2025-09-30** – Migrated `mittwald_backup_get` to the adapter path. _(commit c7be3b5aedb4b8336a69858c026445f5243c1a3d)_

- **2025-09-30** – Migrated `mittwald_backup_list` to the adapter path. _(commit f051f034b64982e01fb4f5c5fb30732ef845e695)_

- **2025-09-30** – Migrated `mittwald_backup_schedule_create` to the adapter path. _(commit 0f5fe89c99b1bcd803dd0b03f133eb4b56026e11)_

- **2025-09-30** – Migrated `mittwald_backup_schedule_delete` to the adapter path. _(commit db747fa6296bf1885ebbb34d87c472168461a0ad)_

- **2025-09-30** – Migrated `mittwald_backup_schedule_list` to the adapter path. _(commit b7551f36f83aecc0fd7db181ee1bcfb7b1ba49c9)_

- **2025-09-30** – Migrated `mittwald_backup_schedule_update` to the adapter path. _(commit 9239c3e47b13e07293f9829c8a0e5b2e41c9a39f)_

- **2025-09-30** – Migrated container handlers (`delete`, `list`, `logs`, `recreate`, `registry_create`) to the adapter path. _(commit 3bafcee1f668d26515083998c2e44593b06dce31)_

- **2025-09-30** – Migrated container registry (`delete`, `list`, `update`) and container lifecycle (`restart`, `run`) to the adapter path. _(commit 0103cac7d76bed9dfed23b5730bb7419fcd10826)_

- **2025-09-30** – Migrated container stack (`delete`, `deploy`, `list`, `ps`) and container start/stop to the adapter path. _(commit dd11ce3f0412e3f893f02cc8667c5180930a3275)_

- **2025-09-30** – Migrated `mittwald_conversation_reply` to the adapter path. _(commit c6bf7d8fa7fc1716ecf4bcf500544e8a1f11d6a1)_

- **2025-09-30** – Migrated `mittwald_conversation_show` to the adapter path. _(commit b21aa910b293671525ea96aa1a3243fa57502d3e)_

- **2025-09-30** – Migrated `mittwald_domain_list` to the adapter path. _(commit 14e9148ae77dc79d5e403e5caeefe34697503faf)_

- **2025-09-30** – Migrated `mittwald_context_get` to the adapter path. _(commit 1919d326c8dba352286720d58325d5adf7628c43)_

- **2025-09-30** – Migrated `mittwald_context_reset` to the adapter path. _(commit 5f00be28cc2927ace46c96d9f142d5e0e3aabf90)_

---
*Draft prepared 2025-09-29 by Codex (LLM).*
