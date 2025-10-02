# MCP Wrapper Enhancement Architecture

## 1. Context and Purpose
The Mittwald MCP server exposes Mittwald CLI capabilities to MCP clients by dynamically scanning tool registrations under `src/constants/tool/mittwald-cli/**` and invoking the `mw` binary through session-aware wrappers. With the latest CLI release (v1.11.2), a number of commands, topics, and subcommands are either uncovered or partially covered by the MCP integration. This document summarizes the current architecture, the misalignment between the MCP wrapper and the CLI surface, and the strategy for closing that gap.

## 2. Current Situation
- **Tool discovery**: `src/utils/tool-scanner.ts` loads every `*-cli.ts` file, building registries for tool metadata, handlers, and schemas. Tools rely on dynamic imports at runtime and are cached for subsequent calls.
- **Tool execution flow**: `src/tools/cli-adapter.ts` delegates execution to `src/utils/session-aware-cli.ts`, which reads Redis-backed session context, injects `--token`, and calls `mw` via `executeCli()`. Output is parsed by handler-specific logic before being formatted for MCP responses.
- **Session auth and routing**: `src/server/mcp.ts` creates per-session `Server` instances, passing OAuth tokens and context to handlers. Sampling, prompts, and resources are wired alongside tool listing/invocation.
- **Existing coverage**: 137 of 178 CLI commands are wrapped (≈77 % coverage). Coverage is strong for projects, apps, cronjobs, backups, domains, mail, servers, SSH/SFTP users, and conversation topics. MCP-only helpers (e.g., context session tools) extend beyond the CLI’s native taxonomy.

## 3. Gap Analysis
- **Missing wrappers**: 41 CLI commands lack MCP coverage. Significant clusters include:
  - *App*: dependency insights and interactive `app exec` / `version-info`.
  - *Container*: `cp`, `exec`, `port-forward`, `ssh`, `update`.
  - *Database*: MySQL user management and all Redis lifecycle commands.
  - *DDEV*: `init`, `render-config` defined but absent from the tool registry.
  - *Org*: organisation CRUD and membership operations (only invite tools exist).
  - *Registry/Stack/Volume*: CLI topics renamed/added; existing wrappers live under `mittwald_container_*` naming, leaving CLI commands unmatched.
  - *Login status*: intentionally disabled because the MCP server injects tokens per command rather than persisting CLI auth state.
- **Version drift**: Docker images pinned to CLI 1.11.1; now updated to 1.11.2, but the codepath lacks automated checks to detect version deltas or missing wrappers when the CLI updates.
- **Execution capability gaps**: Interactive or streaming operations (SSH, port-forward, cp) require TTY/streaming support not yet available via MCP tool responses, so they were omitted.
- **Tool registration inconsistencies**: Some TypeScript files (e.g., `ddev/init-cli.ts`) define `Tool` metadata but do not export a `ToolRegistration`, preventing inclusion by the scanner.

## 4. Target State
- **Complete taxonomy alignment**: Every CLI topic/command/subcommand released in `mw` is either explicitly wrapped or explicitly rejected with documented rationale. Registry artifacts align with CLI naming (e.g., `mittwald_registry_*` instead of `mittwald_container_registry_*`).
- **Executable coverage**: Non-interactive CLI commands have full MCP wrappers, including Redis, MySQL user management, Volume, Org, Registry, Stack, DDEV, and App dependency metadata. Interactive commands have a documented decision (implemented with streaming support or clearly excluded with guard rails).
- **Sustained parity**: Automated diff tooling highlights new/changed CLI commands on release bumps. CI gates prevent deploying with uncovered additions unless explicitly acknowledged.
- **Operational robustness**: Session-aware execution gracefully handles new command scopes, maintains audit logging, and surfaces actionable error messages equivalent to direct CLI usage.

## 5. Design Principles and Justification
- **Security first**: Maintain explicit exclusions for commands that require raw SSH shells or port forwards until streaming and policy enforcement are available. Documented deny list avoids accidental exposure.
- **Consistency**: Align naming and tool schemas with the CLI to reduce cognitive load and simplify automated verification. This limits the cost of future CLI releases.
- **Modularity**: Organize implementation work by topic area (e.g., Registry, Database, Org) so teams can deliver wrappers independently without merge conflicts. Each tool lives in topic-specific folders with dedicated handlers.
- **Observability**: Provide generated coverage reports (`mw-cli-coverage.json`, `docs/mittwald-cli-coverage.md`) and incorporate them into CI to track progress and regressions.
- **Automation**: Script extraction of CLI commands and comparison with registry contents to catch drift as part of release tooling.

## 6. Constraints and Open Questions
- **Interactive commands**: Decide whether to invest in an MCP-compatible streaming transport for SSH-like commands, or explicitly scope them out. Requires coordination with platform security and UX.
- **Redis session store**: Existing session manager must handle any new permissions (e.g., organisation scope). Confirm token scopes cover new endpoints.
- **CLI evolution cadence**: Need a process to monitor `@mittwald/cli` releases and trigger the coverage diff routine.

## 7. Success Criteria
- Coverage matrix shows 0 missing commands or a documented allowlist of intentional exclusions.
- Automated checks fail if a new CLI command lacks a corresponding tool or exclusion rationale.
- All Docker images ship the latest CLI version within one release cycle of upstream updates.
- Documentation clearly states which commands are unsupported and why.

