# MCP–MW CLI Parity Project Plan

## 0. Program Overview
- **Objective**: Close the parity gap between the Mittwald MCP server tools and the Mittwald CLI (`mw`), ensuring every CLI command is either supported or explicitly excluded with justification.
- **Reference Architecture**: See `docs/mcp-cli-gap-architecture.md` for system context, gap analysis, and design principles guiding this plan.
- **Workstream Structure**: Tasks are grouped so they can be executed by independent agents with minimal overlap. Each workstream includes deliverables, dependencies, and ready-to-start tasks.

## 1. Workstream A — Coverage Tooling & Automation
**Goal**: Provide automated insight into CLI coverage and guardrails for future releases.

1.1 **Stabilize coverage data artifacts**  
- Adopt `mw-cli-coverage.json` as canonical machine-readable output.  
- Add schema definition (e.g., JSON Schema) for validation.  
- Document generation steps (`npm run` script) in README.

1.2 **Integrate coverage report generation into CI**  
- Create script to regenerate coverage (`scripts/generate-mw-coverage.ts`).  
- Wire CI job to run script, fail on diff vs committed outputs.

1.3 **Automated CLI release detector**  
- Add step in CI to compare `npm view @mittwald/cli version` vs pinned Dockerfiles.  
- Fail build when mismatch detected; emit instructions.

1.4 **Enforce allowlist for intentional exclusions**  
- Introduce config file (e.g., `config/mw-cli-exclusions.json`).  
- Update coverage script to treat listed commands as "allowed missing".  
- CI fails only on unlisted gaps.

Dependencies: none (can start immediately). Outputs feed other workstreams.

## 2. Workstream B — Taxonomy Alignment & Registry Refactor
**Goal**: Align MCP tool naming/structure with the latest CLI topics to reduce false negatives.

2.1 **Rename registry wrappers**  
- Update tool files/handlers from `container/registry-*` to `registry/*`.  
- Adjust tool names (`mittwald_registry_*`).  
- Provide migration notes for existing users (if any).

2.2 **Rename stack wrappers**  
- Move `container/stack-*` to `stack/*`; update handlers and tests.  
- Update tool names (`mittwald_stack_*`).

2.3 **Update tool scanner default base path**  
- Ensure renamed folders are discovered; adjust import paths.  
- Regenerate coverage report to confirm commands marked covered.

2.4 **Documentation refresh**  
- Update `docs/mittwald-cli-coverage.md` notes for renamed tools.  
- Add mapping table (old → new names) to release notes.

Dependencies: Workstream A automation helpful but not required. Can run parallel to other streams.

## 3. Workstream C — Missing Wrapper Implementation
**Goal**: Implement wrappers for non-interactive commands lacking coverage. Split per domain to parallelize.

### 3.1 Sub-workstream C1 — App dependency metadata
- Add tool registration + handler for `mw app dependency list/update/versions`.  
- Parse CLI JSON output (if available) or text fallback.  
- Extend coverage tests.

### 3.2 Sub-workstream C2 — Container lifecycle updates
- Implement `container update` wrapper (non-interactive).  
- Evaluate feasibility of `container cp` (maybe read-only operations).  
- Document blockers for interactive commands (delegate to Workstream D).

### 3.3 Sub-workstream C3 — Database extensions
- Add MySQL user management tools (create/list/get/update/delete).  
- Add Redis database commands (create/list/get/versions); evaluate `redis shell` viability (Workstream D).  
- Ensure session context includes required IDs.

### 3.4 Sub-workstream C4 — Organisation management
- Implement `org list/get/delete`, `org invite`, `org membership list/list-own/revoke`.  
- Reuse existing invite handlers as patterns.  
- Add schema definitions and error mapping.

### 3.5 Sub-workstream C5 — Volume management
- Add wrappers for `volume create/delete/list`.  
- Ensure project context injection.

### 3.6 Sub-workstream C6 — DDEV tooling
- Convert existing definitions to `ToolRegistration` exports.  
- Implement handlers using `invokeCliTool`.  
- Add tests for command output parsing.

Dependencies: Workstreams A & B should land first to avoid renaming conflicts; otherwise tasks can be parallelized per sub-stream.

## 4. Workstream D — Interactive Command Strategy
**Goal**: Decide and implement handling for commands requiring SSH/streaming.

4.1 **Feasibility assessment**  
- Evaluate MCP transport support for streaming/TTY.  
- Prototype minimal streaming handler using `StreamableHTTPServerTransport` (if possible).

4.2 **Security review**  
- Engage security team to review exposing SSH/port-forward operations via MCP.  
- Define policy (allow/deny/conditional).

4.3 **Implementation or exclusion**  
- If feasible: implement wrappers for `app exec`, `container exec/ssh/port-forward`, `database redis shell`, etc., including user prompts/progress tokens.  
- If out of scope: add explicit exclusions to Workstream A’s allowlist with justification in docs.

Dependencies: Workstream A (exclusion framework) must exist; can proceed once policy direction is known.

## 5. Workstream E — QA, Testing, and Documentation
**Goal**: Ensure quality, traceability, and user clarity.

5.1 **Unit/integration tests**  
- Expand tests for new handlers (mock CLI output).  
- Add regression tests for tool scanner renames.

5.2 **End-to-end smoke tests**  
- Script sample invocations for high-impact commands (project list, org list, database mysql user list).  
- Run in CI nightly using mocked CLI outputs or dockerized CLI.

5.3 **Documentation updates**  
- Update README + `docs/mittwald-cli-coverage.md` after each workstream.  
- Produce change log entry for release.

5.4 **Knowledge transfer**  
- Record architecture upgrades, coverage tooling usage, and operational runbook for future CLI releases.

Dependencies: runs alongside other workstreams; final documentation merges once feature work is complete.

## 6. Milestones & Sequencing
1. **M1 (Week 1)**: Workstream A complete (automation in place).
2. **M2 (Week 2)**: Workstream B renames merged; coverage matrix reflects real status.
3. **M3 (Weeks 3–5)**: Workstream C sub-streams deliver wrappers (ship per topic as ready).  
   - Prioritize C3 (database) and C4 (org) due to user impact.
4. **M4 (Week 6)**: Workstream D decision finalized (implemented or exclusions documented).
5. **M5 (Week 7)**: Workstream E QA/docs finalized; release candidate tagged.

## 7. Roles & Ownership Suggestions
- **Tech Lead**: Oversees architecture alignment, signs off on exclusions (Workstreams A & D coordination).
- **Automation Engineer**: Drives Workstream A and assists E2E tests in Workstream E.
- **Domain Engineers**: Own specific sub-workstreams under C (e.g., DB specialist for C3, Platform engineer for C2 + C5).
- **Security Liaison**: Consulted for Workstream D decisions.
- **Technical Writer**: Maintains docs (Workstream E3/5.4).

