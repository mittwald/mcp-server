# MCP CLI Hardening Plan (2025-09-29)

## Context
- Claude Desktop tool invocation of `mittwald_project_list` surfaced `@oclif/core` errors (`Invalid regular expression flags`) before the CLI emitted business logic, implying an upstream command resolution issue (likely triggered by colon-delimited command ids under our runtime).
- The fallback tool `mittwald_user_accessible_projects` reuses the same CLI call but normalises errors to an empty array, masking the failure and giving the impression that zero projects exist.
- A quick audit (`rg "executeCli('mw'" src/handlers`) shows **90+** handlers issuing raw `mw …` commands via the low-level `executeCli` wrapper instead of the session-aware helper. Only the context-specific handlers currently use `sessionAwareCli`.

We need two coordinated workstreams:
1. **Oclif stability** – reproduce and patch the CLI/Oclif failure so that `mw project list` and friends succeed in our containerised runtime.
2. **Tool/handler cleanup** – consolidate all MCP handlers on the session-aware execution path, surface CLI errors consistently, and add regression coverage.

The streams are tracked separately, but share discovery data and release milestones.

---

## Workstream A – Oclif Stability & CLI Runtime Fix

| Item | Description | Owner | Target |
|------|-------------|-------|--------|
| A1 | Reproduce the Oclif `Invalid regular expression flags` crash in isolation (Node 20 Alpine, `mw` 1.11.1, CI env). Capture `DEBUG=*` / `--trace-warnings` output plus minimal repro steps. | Platform Eng | 2025-09-30 |
| A2 | Bisect CLI releases (1.10.x → 1.11.x) to confirm when the regression appeared and whether downgrading unblocks us short-term. | Platform Eng | 2025-10-01 |
| A3 | Inspect compiled `@oclif/core` resolver (likely in `findCommand`) to identify why colon-separated command ids produce bad regex flags under our env. Draft a fix or upstream issue. | CLI Dev | 2025-10-02 |
| A4 | Prototype mitigation: patch CLI to sanitise command ids before feeding them to `RegExp`, or set `OCLIF_LEGACY_COMMAND_FLAGS=1` (if available) and validate. | CLI Dev | 2025-10-03 |
| A5 | Ship hotfix (new CLI version or runtime patch) and update Docker base image + MCP env. Ensure smoke tests cover at least one colonised command (e.g., `extension:list`). | Release Eng | 2025-10-04 |
| A6 | Postmortem & monitoring – add logging to MCP to flag any future CLI stderr with `Invalid regular expression flags`. | Platform Eng | 2025-10-07 |

**Open Questions**
- Does the crash reproduce on Node 18, or only Node 20? (Impacts rollback plan.)
- Do we need to enforce a particular `LANG`/`LC_ALL` setting to avoid unexpected regex behaviour?

---

## Workstream B – Tool & Handler Cleanup

### Current Findings
- 90+ handlers call `executeCli('mw', …)` directly, only a handful (`context/session-aware-context.ts`) rely on `sessionAwareCli`.
- Duplicate tool coverage (e.g., “List Projects” vs “List Accessible Projects”) leads to inconsistent error handling.
- Many handlers interpret CLI failures with bespoke logic (e.g., substring checks for `authentication`), complicating shared behaviour and testing.

### Objectives
1. Single execution path for all CLI tools (session-aware, token-injecting, context-respecting).
2. Consistent error surfacing—CLI non-zero exits must propagate to the MCP response (no silent success with empty data).
3. Regression coverage that stubs CLI failures and validates responses.

| Item | Description | Owner | Target |
|------|-------------|-------|--------|
| B1 | Inventory all CLI-based tool registrations and map them to handlers; record which ones currently bypass session-aware execution. (Initial audit complete on 2025-09-29; maintain spreadsheet or doc.) | Tooling PM | 2025-09-30 |
| B2 | Design shared execution adapter: session-aware wrapper with pluggable post-processing (JSON parsing, text passthrough, quiet id). Define common error object. | Backend Eng | 2025-10-02 |
| B3 | Migrate high-traffic tools first (projects, servers, conversations) to the shared adapter; drop duplicate/fallback implementations. | Backend Eng | 2025-10-07 |
| B4 | Migrate remaining handlers (≈90) in batches, each with smoke verification. Track progress in checklist. | Backend Eng | 2025-10-18 |
| B5 | Update `sessionAwareCli` helpers to return structured errors instead of empty arrays; adjust context tools accordingly. | Backend Eng | 2025-10-05 |
| B6 | Add Vitest coverage that fakes CLI exit codes (success, auth failure, generic failure) and asserts uniform response formatting. | QA | 2025-10-09 |
| B7 | Update documentation (`README`, `ARCHITECTURE`, tool docs) to state that all CLI invocations run via session-aware wrapper and to describe error behaviour. | Tech Writer | 2025-10-10 |
| B8 | Remove legacy tooling once migration completes; ensure smoke tests exercise representative commands (read/write). | Backend Eng | 2025-10-20 |

### Risks & Mitigations
- **Volume of handlers** – 90+ migrations can regress behaviour. Use automated codemods or lint rules to enforce `sessionAwareCli` usage.
- **Token/context propagation** – ensure tests cover scenarios with/without context to avoid breaking existing workflows.
- **CLI stability dependency** – cleanup should follow Oclif fix so we don’t migrate onto a broken runtime.

---

## Coordination
- Track both workstreams in a shared project board in this document; link tasks A1/B1, etc., for context.
- Block handler migration (B3+) on completion of A4 unless a temporary CLI workaround is in place.
- Add periodic checkpoints (every minor milestone) to review progress and revise targets.

### Inventory Tracking
- The authoritative roster of CLI-backed tools lives in `docs/2025-09-29-cli-tool-inventory.json` (generated automatically; update as migrations land).

---

## Progress Log
- **2025-09-29** – Drafted the [CLI Refactor Architecture](./2025-09-29-cli-refactor-architecture.md) outlining the unified adapter design, error taxonomy, and phased migration plan (covers Workstream B2 and sets prerequisites for B3/B4). Pending review before implementation. _(commit d962978)_
- **2025-09-29** – Scaffolded the shared CLI adapter, structured error types, session-aware helper updates, and initial lint guardrail to launch Phase 1 infrastructure. Implementation captured in commit d7e4a329a57c4f81666d2a2d5f912a93a1fe6a94.
- **2025-09-30** – Exported comprehensive tool inventory for migration tracking (`docs/2025-09-29-cli-tool-inventory.json`). _(commit 97dadafb695a8f66b4039f0f1c6315839484bc19)_
- **2025-09-30** – Migrated `mittwald_app_copy` handler to the shared CLI adapter and recorded progress in the inventory. _(commit 13195fe6946880611c5d59fc011e21a2134ee14a)_
- **2025-09-30** – Migrated `mittwald_app_create_node` handler to the shared CLI adapter. _(commit 688ed9397389e6a8f2c65a984cbf6c67c8e40661)_
- **2025-09-30** – Migrated `mittwald_app_create_php` handler to the shared CLI adapter. _(commit f1ac9827b5c026e1cc1cd85256d3b25ccddf18a3)_
- **2025-09-30** – Migrated `mittwald_app_create_php_worker` handler to the shared CLI adapter. _(commit 4f4dd233f4150eac8261d66a53dda4d0e15fa12c)_
- **2025-09-30** – Migrated `mittwald_app_create_python` handler to the shared CLI adapter. _(commit ad1fe396ae2ee3cab713876580dc4f9eb579e40a)_
- **2025-09-30** – Migrated `mittwald_app_create_static` handler to the shared CLI adapter. _(commit 1230eb67d86972fd4ea5d47bca68975942b14a4e)_
- **2025-09-30** – Migrated `mittwald_app_download` handler to the shared CLI adapter. _(commit ece20a097b17440ace7a90bed5dbcad9cf5e77e2)_

- **2025-09-30** – Migrated `mittwald_app_get` handler to the shared CLI adapter. _(commit f3f1e5a62e10f08960a4b1a73b5b0ba3e29d673d)_

- **2025-09-30** – Migrated `mittwald_app_install_contao` handler to the shared CLI adapter. _(commit 85ec619f4fee8352f6d5a3e01f04bef0d6f0f8fb)_

- **2025-09-30** – Migrated `mittwald_app_install_joomla` handler to the shared CLI adapter. _(commit 4f136822c1a8efb4e0be6db833d91694a8d8c9aa)_

- **2025-09-30** – Migrated `mittwald_app_install_matomo` handler to the shared CLI adapter. _(commit 2dbf80169a3f17f3e450bcf6a38fca714e454a95)_

- **2025-09-30** – Migrated `mittwald_app_install_nextcloud` handler to the shared CLI adapter. _(commit 1c90f3355e41aac552f825c021f5fd91208f4dd3)_

- **2025-09-30** – Migrated `mittwald_app_install_shopware5` handler to the shared CLI adapter. _(commit 9b2a205e4712eef79f6f70e969a1356a4b8bc6bf)_

- **2025-09-30** – Migrated `mittwald_app_install_shopware6` handler to the shared CLI adapter. _(commit bd619eff1110c5e7cb482b3f16c66a729d982c31)_

- **2025-09-30** – Migrated `mittwald_app_install_typo3` handler to the shared CLI adapter. _(commit 4103c6fac0befc931093d24d5e7775f8efe28a81)_

- **2025-09-30** – Migrated `mittwald_app_install_wordpress` handler to the shared CLI adapter. _(commit 97ef1cce5893ada00d0d44e310a1b5e1bd8630db)_

- **2025-09-30** – Migrated `mittwald_app_list` handler to the shared CLI adapter. _(commit 9f3c84b803c0e16907e098fe3a6ba7331c2e8d30)_

- **2025-09-30** – Migrated `mittwald_app_list_upgrade_candidates` handler to the shared CLI adapter. _(commit 7d71c73a4ed6d2261fd444fcacd25cdb840a41b4)_

- **2025-09-30** – Migrated `mittwald_app_open` handler to the shared CLI adapter. _(commit c4a54d7378608450755c57dc4ff264f2c20d55b2)_

- **2025-09-30** – Migrated `mittwald_app_ssh` handler to the shared CLI adapter. _(commit 935a1456e956fe8e53c384a042657bfb9dba04ea)_

- **2025-09-30** – Migrated `mittwald_app_uninstall` handler to the shared CLI adapter. _(commit 2452eee1919078fa1a68ae8a40e7cc5701c0fe48)_

- **2025-09-30** – Migrated `mittwald_app_update` handler to the shared CLI adapter. _(commit d171b1d76107323b599631e7608a71331b26a91b)_

- **2025-09-30** – Migrated `mittwald_app_upgrade` handler to the shared CLI adapter. _(commit 92b60f9969588b7ea557ece836d7415b52e17a7b)_

- **2025-09-30** – Migrated `mittwald_app_upload` handler to the shared CLI adapter. _(commit 4fc811706ae24f2048a73b977e8b538a775f5abb)_

_Last updated: 2025-09-30_
