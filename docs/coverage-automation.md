# Coverage Automation Runbook

> Canonical overview now lives in `docs/coverage.md`. Keep this file for historical detail on automation steps.

This document explains how to maintain the Mittwald CLI coverage artifacts and the CI checks that enforce them.

## Generated Artifacts

| Artifact | Source command | Purpose |
| --- | --- | --- |
| `mw-cli-coverage.json` | `npm run coverage:generate` | Machine-readable record of CLI commands, MCP tool matches, exclusions, and aggregate statistics. |
| `docs/mittwald-cli-coverage.md` | `npm run coverage:generate` | Human-readable coverage matrix grouped by CLI topic (mirrors the JSON data). |

The generator reads the installed `@mittwald/cli`, scans MCP tool registrations, and merges exclusion metadata from `config/mw-cli-exclusions.json`.

## Maintainer Commands

- `npm run coverage:generate` – Rebuild both artifacts. Run after modifying tools, exclusions, or updating the CLI; no need to run for unrelated commits.
- `npm run check:cli-version` – Warn when Dockerfiles pin an older CLI than the npm registry. (CI treats this as non-blocking.)

## Allowlist Management

Intentional gaps are tracked centrally in `config/mw-cli-exclusions.json`.

- **`interactive`** – Commands that require streaming/TTY (e.g., SSH exec). They share a category-level rationale.
- **`intentional`** – Command-specific backlog exclusions with detailed reasons (referencing Workstream plans).

When adding or removing exclusions:
1. Update the appropriate array and provide/adjust the rationale.
2. Re-run `npm run coverage:generate` to embed the metadata into both artifacts.
3. Commit the JSON, Markdown, and config updates together.

The generator annotates excluded commands in the Markdown table (`Allowed missing (…)`) and stores the category/reason in `mw-cli-coverage.json`.

## CI Enforcement

The `Coverage Check` workflow (`.github/workflows/coverage-check.yml`) enforces three gates:
1. `npm run coverage:generate` must leave no uncommitted changes (`git diff --exit-code`).
2. `stats.missingCount` must remain zero; any uncovered commands need a wrapper or an explicit exclusion update before merging.
3. `npm run check:cli-version` runs in warning mode to highlight Docker version drift.

## When to Update the Allowlist vs. Add Coverage

- **Interactive features** – Keep under `interactive` until streaming transport lands (Workstream D).
- **Domain backlogs** – Map to the corresponding Workstream (C1–C6, B1/B2, etc.). Remove the exclusion once the wrapper ships.
- **Unexpected CLI additions** – Prefer implementing wrappers; only extend the allowlist if there is a committed backlog entry with rationale.

Maintaining this workflow keeps the coverage baseline trustworthy while allowing deliberate, documented gaps.
