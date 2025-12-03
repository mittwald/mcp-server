# Coverage & CLI Wrappers

## Expectations
- Mittwald CLI wrappers should remain in sync with `@mittwald/cli@1.12.0`.
- Coverage gaps (`stats.missingCount`) must be zero unless explicitly allowlisted.
- Auto-generated artifacts: `mw-cli-coverage.json` and `docs/mittwald-cli-coverage.md`.

## Commands
- Regenerate coverage: `npm run coverage:generate`
- Validate gaps: part of `coverage:generate` and CI (`coverage-check.yml`)
- Check CLI version drift: `npm run check:cli-version` (warning-only in CI)

## Policy
- Add wrappers for new CLI commands; if intentionally excluded, document rationale in `config/mw-cli-exclusions.json`.
- Commit regenerated artifacts when CLI metadata or exclusions change.
- Do not edit `docs/mittwald-cli-coverage.md` manually.

## References
- CI workflow: `.github/workflows/coverage-check.yml`
- Schema: `config/mw-cli-coverage.schema.json`
- Historical details: `docs/archive/legacy/tooling/tool-examples/mcp-cli-gap-project-plan.md` (archived)
