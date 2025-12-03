# Documentation Upgrade Plan

Goal: consolidate and refresh documentation across `mittwald-mcp` and `mittwald-oauth` for end users, maintainers, and LLM agents; remove or archive stale planning docs; eliminate redundancy; preserve `kitty-specs` as-is.

## Target End-State (both repos)
- Single entrypoint README per repo with quickstart, env vars, and pointers to architecture/deploy/testing docs.
- Current architecture + flow diagrams (OAuth 2.1 + DCR + MCP bridge) in one canonical file.
- Clear operational runbooks: deploy (Fly/compose), health, secrets, rotation, migrations, backup/restore.
- Testing matrix: unit/integration/e2e/Playwright/DAST with commands and env setup.
- Security/LLM briefing: red-lines, scopes, safety constraints, and usage patterns for agents.
- Archive section for historical audits/plans; minimal clutter in root/docs.

## mittwald-mcp Actions
- **README.md**: update for current OAuth bridge behavior (PKCE-only, Mittwald authority, secret_post clients), link to DEPLOY/ARCHITECTURE; add pointer to LLM_CONTEXT.
- **ARCHITECTURE.md**: refresh diagrams and text to match stateless bridge + Redis usage; include cross-repo dataflows to `mittwald-oauth`.
- **DEPLOY.md**: reconcile with Fly configs and docker-compose.prod; add secret checklist; ensure HTTPS guidance is current.
- **LLM_CONTEXT.md**: update to reflect new scopes and safety limits; ensure CLI invocation constraints and token handling are accurate.
- **docs/INDEX.md**: make this the canonical nav; link only to live docs (README, ARCHITECTURE, DEPLOY, coverage, guides).
- **Guides (`docs/guides/*.md`)**: consolidate ChatGPT/Claude/Cursor guides into one “Client Integration Guide” with per-client sections; remove duplicate steps.
- **docs/coverage-automation.md` + `docs/mittwald-cli-coverage.md`**: merge into one coverage runbook; keep CLI version drift notes.
- **docs/interactive-commands-decision.md`, `docs/registry-tool-audit.md`, `docs/app-dependency-tools.md`, `docs/container-update-cli.md`, `docs/container-update-tool.md`, `docs/ddev-resources.md`, `docs/tool-concurrency.md`, `docs/tool-safety/*`, `docs/tool-examples/*`**: fold into a single “Tooling & Safety” guide with sections for capabilities, safety rules, examples; remove standalone files after merge.
- **docs/oauth-testing-tools.md`, `docs/oauth-scope-caching.md`, `docs/design/direct-token-sessions.md`, `docs/mcp-cli-gap-architecture.md`, `docs/cli-gap-analysis-1.12.md`**: integrate relevant, current material into ARCHITECTURE or Testing; archive the rest.
- **test-plan/**: convert actionable items into Testing section; archive the directory as legacy planning once merged.
- **upgrade-plan-2025-12/**: archive or delete after extracting any still-open tasks into backlog; remove from root.
- **docs/handover-audit-2025-10/** and `docs/archive/**` trees: move under a single `docs/archive/legacy/` index; keep for history but out of main nav.
- **legal/LEGAL_COMPLIANCE_REPORT.md**: link from INDEX under Compliance; verify currency, otherwise archive with a note.
- **CLAUDE.md**: replace with a short “LLM Agent Usage” doc linked from README/INDEX; archive the old file.
- **src/documentation/virtualhost-help.md`, `src/types/README.md`**: move into developer docs (types/CLI usage) or inline code comments; avoid stray docs in src/.

## mittwald-oauth Actions
- **README.md**: expand quickstart, env var explanations (security defaults, PKCE required), testing commands (jest/integration/Playwright), and link to architecture.
- **Architecture doc**: create one (none present) describing Mittwald ID integration, DCR, token storage/encryption, session/cookie settings, rate limits.
- **Specs/Plans (`specs/**`, `.specify/**`, `.claude/**`)**: archive as planning artifacts; extract any still-relevant requirements into architecture/roadmap; remove from main tree.
- **CLAUDE.md**: archive/replace with concise LLM agent guidance (what endpoints, red-lines).
- **Add Testing/Operations docs**: migrations/runbooks (knex), DB schemas, Fly deploy/run/health/rollback steps, secret rotation for JWT/encryption keys.

## Cross-Repo Cleanups
- Create a short `docs/CONTRIBUTING.md` per repo with coding standards, lint/test commands, and doc style.
- Add a shared “Doc Ownership + Update cadence” note in INDEX.
- Ensure all archived/planning docs (audits, prompts, tasklists) are moved under `docs/archive/legacy/` with a single README pointing to them.
- Leave `kitty-specs` untouched.

## Execution Steps
1) Update READMEs and INDEX to reflect current flows and point to canonical docs.
2) Refresh ARCHITECTURE/DEPLOY/LLM_CONTEXT with accurate flows/secrets/testing.
3) Merge safety/tooling/coverage docs; delete redundant standalone files after merge.
4) Archive planning/audit/prompts/specs trees; prune root clutter (upgrade-plan-2025-12, test-plan) after extracting live items.
5) Add missing architecture + ops docs for `mittwald-oauth`; add contributing notes.
6) Final pass to ensure nav (INDEX) only links to live docs; mark archive location clearly.
