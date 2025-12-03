# Mittwald MCP Documentation Index

**Purpose**: Single navigation point for current docs. Historical content lives under `docs/archive/legacy/` (see below).

---

## Core
- `../README.md` – overview, setup, quick start
- `../ARCHITECTURE.md` – OAuth bridge + MCP design (update when flows change)
- `docs/LLM-AGENTS.md` – guidance for LLM/agent users
- `../DEPLOY.md` – deployment/runbook (Fly/compose)
- `docs/testing.md` – test matrix and commands
- `docs/coverage.md` + `docs/mittwald-cli-coverage.md` – wrapper coverage policy and report
- `docs/CREDENTIAL-SECURITY.md` – required credential-handling standard

## Guides
- `docs/guides/chatgpt.md`, `docs/guides/claude-desktop.md`, `docs/guides/cursor.md` – client setup
- `docs/guides/virtualhost.md` – virtual host/ingress usage
- `docs/tooling-and-safety.md` – consolidated tool authoring and safety rules

## Operations & Config
- `docs/FLY-MITTWALD-MIGRATION-GUIDE.md` (+ addendum) – Fly-specific notes
- `docs/PLAN-NODE20-FLY.md` – platform versioning guidance
- Config references: `config/mittwald-scopes.json`, `config/mw-cli-exclusions.json`
- Maintainer process: `docs/MAINTAINERS-HANDBOOK.md`

## Testing & Security
- Tests: `docs/testing.md`, `tests/README.md`
- Security: `docs/CREDENTIAL-SECURITY.md`, CI security workflow `.github/workflows/security-check.yml`
- Lint/typecheck commands in `package.json`

## Archives / Legacy
- Historical planning/audit/specs moved to `docs/archive/legacy/` (includes former test-plan, upgrade-plan-2025-12, handover-audit-2025-10, tooling examples/safety docs, CLAUDE.md).
- Older archives remain under `docs/archive/` for reference.
- Keep `kitty-specs` untouched (historical).

## Keep Updated
- When flows, secrets, or scope catalogs change, update: README, ARCHITECTURE, LLM-AGENTS, testing, coverage.
- Archive superseded docs promptly to avoid conflicting guidance.
