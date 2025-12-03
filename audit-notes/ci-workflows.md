# CI/CD Workflow Inventory

## mittwald-mcp (.github/workflows)
- `tests.yml`: unit, bridge, session jobs (Node 20, npm ci). E2E runs only on schedule/dispatch with 45m timeout and uses docker buildx; uses repo env only (no secrets shown).
- `coverage-check.yml`: regenerates coverage artifacts, enforces git clean, validates missingCount == 0, checks CLI version drift (continue-on-error); relies on npm ci and repo contents.
- `security-check.yml`: scoped to src handlers/utils on PR and main; runs npm run test:security and lint:credential-leak; crude grep for credentials in `src/`.
- `deploy-fly.yml`: matrix deploys bridge and MCP to Fly using secrets.FLY_API_TOKEN; stages git sha/build time secrets; prebuilds packages; health + smoke tests with Newman and DCR request; performs bridge registration test with public redirect; releases gated by ALLOW_FLY_RELEASE env. Cleanup step removes stopped machines.
- `fly-logs.yml`: on-demand Fly logs/status; uses secrets.FLY_API_TOKEN.

Observations/todos:
- [ ] Confirm least-privilege for FLY_API_TOKEN and whether per-app tokens possible.
- [ ] Check cache scope for npm (repo-level) and potential for poisoned cache.
- [ ] Ensure coverage workflow cannot leak secrets via artifact checks; verify actions pinning (uses @v4 etc).
- [ ] Consider adding secret scanning (Gitleaks/Trufflehog) and dependency scanning (npm audit/Snyk) in CI.

## mittwald-oauth (.github/workflows)
- `deploy.yml`: on push to main deploys to Fly with secrets.FLY_API_TOKEN; remote-only, no cache; simple health check. Post-deploy runs npm ci, installs Playwright deps, runs `npm run test:inspector` and curl OPTIONS to /oauth/register.

Observations/todos:
- [ ] No dedicated lint/test on PR; consider adding unit/integration + SAST/dep/secret scans.
- [ ] Placeholder secrets likely overridden in Fly secrets; verify not baked into image/build logs.
- [ ] Evaluate need for protected env or manual approvals for prod deploys.
