<!--
Sync Impact Report
==================
Version change: 0.0.0 → 1.0.0
Added sections:
- I. Environment Separation
- II. Fly.io Test Environment Deployment
- III. Secret Management
- IV. JWT Secret Synchronization
Templates requiring updates: N/A (no dependent templates exist yet)
Follow-up TODOs: None
-->

# Mittwald MCP Server Constitution

## Core Principles

### I. Environment Separation

This project has TWO environments with different deployment strategies:

| Environment | Platform | URL Pattern | Deployment |
|-------------|----------|-------------|------------|
| **TEST** | Fly.io | `*.fly.dev` | Automated via GitHub Actions |
| **PRODUCTION** | Mittwald | `*.mittwald.cloud` | NOT managed by this repo |

**The critical distinction:**
- **Fly.io is the TEST environment** - used for development, testing, and validation
- **Mittwald is PRODUCTION** - we do NOT deploy there from this repository
- All CI/CD in this repo targets Fly.io ONLY

**DO NOT:**
- Confuse Fly.io URLs with production
- Attempt to deploy to Mittwald from GitHub Actions
- Test production features against `*.fly.dev` URLs and assume production parity

### II. Fly.io Test Environment Deployment

All deployments to the Fly.io TEST environment MUST go through the GitHub Actions workflow (`.github/workflows/deploy-fly.yml`). Manual `flyctl deploy` commands are **explicitly blocked** by the release command gate in `fly.toml`.

**What this means:**
- Push to `main` branch triggers automated deployment to Fly.io (TEST)
- The workflow sets `ALLOW_FLY_RELEASE=true` to bypass the release gate
- Manual `flyctl deploy` will fail with: "Deployment blocked: use GitHub Actions"

**Why this exists:**
- Ensures all test deployments are auditable via GitHub Actions history
- Guarantees consistent build/test/deploy pipeline execution
- Prevents accidental deployments with wrong configuration or secrets
- Smoke tests run automatically after every deployment

**DO:**
- Merge PRs to `main` to trigger deployment
- Use `gh workflow run deploy-fly.yml` for manual dispatch if needed
- Monitor deployment via GitHub Actions logs

**DO NOT:**
- Run `flyctl deploy` directly from your terminal
- Bypass the release gate by setting `ALLOW_FLY_RELEASE=true` locally
- Deploy without running the full CI pipeline

### III. Secret Management

Secrets are stored in Fly.io's secret manager, NOT in environment variables or source code.

**Critical secrets (Fly.io TEST environment):**
- `BRIDGE_JWT_SECRET` (OAuth Bridge)
- `OAUTH_BRIDGE_JWT_SECRET` (MCP Server) - MUST match `BRIDGE_JWT_SECRET`
- `REDIS_URL` (both services)

**How to manage secrets:**
```bash
# View secrets (names only, values are hidden)
flyctl secrets list -a mittwald-oauth-server

# Set a secret
flyctl secrets set SECRET_NAME="value" -a mittwald-oauth-server

# Verify a secret value (SSH into the machine)
flyctl ssh console -a mittwald-oauth-server -C "printenv SECRET_NAME"
```

**DO:**
- Use `flyctl secrets set` for all sensitive configuration
- Rotate secrets periodically
- Document secret purposes in `CLAUDE.md`

**DO NOT:**
- Commit secrets to source code (even in `.env` files)
- Store secrets in `fly.toml` `[env]` section
- Share secrets via Slack, email, or other insecure channels

### IV. JWT Secret Synchronization

The OAuth Bridge and MCP Server MUST share the same JWT signing secret. This is **NON-NEGOTIABLE** for authentication to work.

**The rule:**
```
BRIDGE_JWT_SECRET (OAuth Server) === OAUTH_BRIDGE_JWT_SECRET (MCP Server)
```

**If they don't match:**
- JWT signature verification fails on the MCP server
- The MCP server falls back to Mittwald CLI validation
- This causes OOM (Out of Memory) errors and service crashes

**Verification procedure:**
```bash
# Compare the secrets
SECRET_OAUTH=$(flyctl ssh console -a mittwald-oauth-server -C "printenv BRIDGE_JWT_SECRET" 2>/dev/null | tail -1)
SECRET_MCP=$(flyctl ssh console -a mittwald-mcp-fly2 -C "printenv OAUTH_BRIDGE_JWT_SECRET" 2>/dev/null | tail -1)

if [ "$SECRET_OAUTH" = "$SECRET_MCP" ]; then
  echo "Secrets are synchronized"
else
  echo "CRITICAL: Secrets are NOT synchronized!"
fi
```

**Synchronization procedure (if different):**
```bash
# Get the OAuth server's secret
SECRET=$(flyctl ssh console -a mittwald-oauth-server -C "printenv BRIDGE_JWT_SECRET" 2>/dev/null | tail -1)

# Set it on the MCP server
flyctl secrets set OAUTH_BRIDGE_JWT_SECRET="$SECRET" -a mittwald-mcp-fly2
```

**DO:**
- Check secret synchronization after any secret rotation
- Use the verification procedure above before major releases

**DO NOT:**
- Generate different secrets for each service
- Rotate one secret without updating the other

## Health Verification (TEST Environment)

After any deployment to Fly.io, verify services are healthy:

**Health check URLs (TEST):**
- OAuth Server: https://mittwald-oauth-server.fly.dev/health
- MCP Server: https://mittwald-mcp-fly2.fly.dev/health

**Logs (if issues):**
```bash
flyctl logs -a mittwald-oauth-server --no-tail | tail -50
flyctl logs -a mittwald-mcp-fly2 --no-tail | tail -50
```

## Governance

This constitution governs deployment practices for the Mittwald MCP Server project. All contributors MUST follow these principles. Violations may result in broken test services.

**Amendment procedure:**
1. Propose changes via PR to `.kittify/memory/constitution.md`
2. Require approval from project maintainer
3. Test changes in staging before merging
4. Update version number (MAJOR for breaking changes, MINOR for additions, PATCH for clarifications)

**Version**: 1.0.0 | **Ratified**: 2025-12-17 | **Last Amended**: 2025-12-17
