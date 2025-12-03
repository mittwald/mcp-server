# Plan: Operationalize Test Suites in CI

## Agent Brief
You are the LLM engineer tasked with wiring the enhanced test suites into continuous integration. Implement scripts, workflows, and documentation updates exactly as listed so future changes automatically run the right suites.

## Goal
Integrate the enhanced unit, integration, and E2E suites into continuous integration workflows so regressions are detectable automatically and test execution is sustainable.

## Deliverables
1. Updated `package.json` scripts orchestrating granular test runs (unit, session, bridge, e2e).
2. CI pipeline definition (GitHub Actions or equivalent) that runs appropriate suites on PR, nightly, and pre-release triggers.
3. Developer documentation for running suites locally with consistent tooling.

## Work Breakdown

### Phase 1: Script & Config Cleanup
- [ ] **Add npm scripts**
  - `test:unit` (existing) – ensure still fast.
  - `test:bridge` – executes `pnpm --filter @mittwald/oauth-bridge test`.
  - `test:session` – runs new session lifecycle suite.
  - `test:e2e` – stands up Compose stack and runs E2E tests.
  - `test:all` – aggregates the above with sensible sequencing.
- [ ] **Parameterize environment**
  - Create `.env.test` templates for bridge and MCP to ensure consistent configuration.
  - Add Docker network name constants for Compose-based tests.

### Phase 2: GitHub Actions Workflow
- [ ] **Define job matrix in `.github/workflows/tests.yml`**:
  - Job `unit`: run `pnpm install`, cache dependencies, execute `pnpm test:unit`.
  - Job `bridge`: run `pnpm test:bridge` (mock Mittwald endpoints only).
  - Job `session`: run `pnpm test:session` with Redis service (use `services: redis` in GHA).
  - Job `e2e` (conditional, e.g., nightly or manual):
    - Spin up Docker Compose stack.
    - Run `pnpm test:e2e`.
    - Upload logs on failure.
- [ ] **Add gating**
  - PRs must pass `unit`, `bridge`, `session`.
  - `e2e` flagged `optional` (nightly) but fails pipeline on scheduled runs.

### Phase 3: Tooling & Diagnostics
- [ ] Configure vitest to output JUnit XML for `unit` job (use `--reporter=junit` + upload artifact) to ease trend tracking.
- [ ] Capture coverage summary artifacts for `bridge` and `session` jobs.
- [ ] Add step to collect Docker logs on E2E failures (attach to workflow run).

### Phase 4: Developer Experience
- [ ] Update repository `README.md` and `tests/README.md` with:
  - Commands for running each suite locally.
  - Prerequisites (Docker, pnpm, etc.).
  - How to debug failing E2E runs (log locations).
- [ ] Provide `make` or `justfile` convenience targets mirroring npm scripts (optional but helpful).

### Phase 5: Monitoring
- [ ] Set up GitHub Action status badge(s) for key jobs.
- [ ] Schedule nightly run (cron) for the full `test:all` pipeline.
- [ ] Document escalation path for flaky tests (who owns, how to quarantine temporarily).

## Definition of Done
- CI consistently runs the enhanced suites with clear pass/fail signals.
- Developers can reproduce CI locally with documented commands.
- Nightly jobs alert the team when integration/E2E regressions occur.
