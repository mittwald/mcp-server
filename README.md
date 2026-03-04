# Mittwald MCP Server
[![Coverage Check](https://github.com/robertDouglass/mittwald-mcp/actions/workflows/coverage-check.yml/badge.svg)](https://github.com/robertDouglass/mittwald-mcp/actions/workflows/coverage-check.yml)

The Mittwald MCP server lets external MCP clients (Claude, ChatGPT, MCP Inspector) run Mittwald CLI commands on behalf of users. Authentication now flows through a stateless OAuth bridge that fronts Mittwald’s OAuth 2.1 endpoints using Authorization Code + PKCE only. Mittwald treats our bridge as a **public client**: there is no Mittwald-issued client secret to manage. The bridge mints its own secrets for downstream confidential MCP clients (e.g. Claude Desktop) and verifies them before issuing JWTs. Each CLI invocation receives the user's Mittwald access token via `mw ... --token <mittwald_access_token>`.

## Active Production Deployment (Verified 2026-02-17)
- `mittwald-mcp-fly2` (MCP server) is deployed from this repository root (`Dockerfile` + `src/`).
- `mittwald-oauth-server` (OAuth service) is deployed from this repository's `packages/oauth-bridge/`.
- The separate repository at `../mittwald-oauth/mittwald-oauth` is currently inactive/deprecated for production and is not the source of the running Fly.io OAuth service.

## What Changed (2025-09-25)
- **Mittwald is authoritative for scopes and consent.** Our proxy no longer maintains its own scope catalogue or renders consent pages.
- **Dynamic client registration remains open.** Clients register through `/register`; we store their metadata and rely on Mittwald to validate scopes during the downstream exchange.
- **JWT payloads include Mittwald tokens verbatim.** The scope string inside each issued JWT comes directly from Mittwald's token response.
- **Confidential MCP clients are supported.** The bridge returns `client_secret_post` credentials during registration and enforces them on `/token`, allowing Claude Desktop to complete OAuth without custom configuration.

For the full design see `ARCHITECTURE.md`.

## Repository Layout

```
packages/
  oauth-bridge/      # stateless OAuth proxy to Mittwald OAuth
src/
  ...               # MCP server (JWT validation + CLI wrapper)
docs/               # Supplemental documentation
```

## Development Setup

> **Prerequisite**: Node.js 24.11.0 or higher (see `.nvmrc` / `.node-version`). Earlier LTS releases (e.g. Node 18, Node 20) cannot run `@mittwald/cli@1.12.0` because its dependencies require the new `/v` regular-expression flag.

### Building Locally

This is a monorepo with workspace packages that must be built in order.

1. Install all dependencies:
   ```bash
   npm ci
   ```

2. Build the project (including all workspace dependencies):
   ```bash
   npm run build:all
   ```

   Or build workspace packages individually:
   ```bash
   cd packages/mittwald-cli-core && npm run build && cd ../..
   cd packages/oauth-bridge && npm run build && cd ../..
   npm run build
   ```

**OR** use Docker (recommended for production builds):
```bash
docker build --no-cache -t mittwald/mcp .
```

### Local SSL Certificates

For local HTTPS development, generate certificates using [mkcert](https://github.com/FiloSottile/mkcert):

```bash
# Install mkcert (macOS)
brew install mkcert
mkcert -install

# Generate certificates
mkdir -p ssl
mkcert -key-file ssl/localhost+2-key.pem -cert-file ssl/localhost+2.pem localhost 127.0.0.1 ::1
```

The server uses these paths by default, or set `SSL_KEY_PATH` and `SSL_CERT_PATH` to override.

### Running for Development

1. Configure scopes and Mittwald OAuth details:
   ```bash
   export MITTWALD_ISSUER=https://id.mittwald.de
   export MITTWALD_CLIENT_ID=mittwald-mcp-server
   export MITTWALD_REDIRECT_URI=https://your-local-proxy/mittwald/callback
   ```
   The OAuth and MCP services both read their scope catalogue from `config/mittwald-scopes.json`.
   Update that file (or point `MITTWALD_SCOPE_CONFIG_PATH` at an override) to change supported or
   default scopes—no code changes required.

2. Run the OAuth bridge:
   ```bash
   npm run --workspace=packages/oauth-bridge dev
   ```

3. Run the MCP server:
   ```bash
   npm run dev
   ```

Each service exposes health and debugging endpoints; consult `ARCHITECTURE.md` for flow diagrams and environment specifics.

## Prometheus Metrics

Both the MCP Server and OAuth Bridge expose Prometheus-compatible metrics at `/metrics`.

### Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `METRICS_ENABLED` | Enable/disable metrics collection and `/metrics` endpoint | `true` |
| `METRICS_USER` | Basic auth username for /metrics | (none - no auth) |
| `METRICS_PASS` | Basic auth password for /metrics | (none - no auth) |

Set `METRICS_ENABLED=false` to completely disable metrics collection and the `/metrics` endpoint.

When both `METRICS_USER` and `METRICS_PASS` are set, Basic Authentication is required to access the metrics endpoint.

### Available Metrics

#### MCP Server

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `mcp_tool_calls_total` | Counter | `tool_name`, `status` | Total MCP tool invocations |
| `mcp_tool_duration_seconds` | Histogram | `tool_name` | Tool execution duration |
| `mcp_active_connections` | Gauge | - | Current active MCP connections |
| `mittwald_cli_calls_total` | Counter | `command`, `status` | Mittwald CLI invocations |

#### OAuth Bridge

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `oauth_authorization_requests_total` | Counter | `client_id`, `status` | Authorization requests |
| `oauth_token_requests_total` | Counter | `grant_type`, `status` | Token exchange requests |
| `oauth_dcr_registrations_total` | Counter | `status` | DCR registrations |
| `oauth_pending_authorizations` | Gauge | - | Pending authorization requests |
| `oauth_pending_grants` | Gauge | - | Pending grants |
| `oauth_registered_clients` | Gauge | - | Registered OAuth clients |
| `oauth_state_store_size` | Gauge | - | Total Redis state store entries |

Both services also expose default Node.js metrics (`nodejs_*`, `process_*`).

### Prometheus Scrape Configuration

```yaml
scrape_configs:
  - job_name: 'mittwald-mcp-server'
    static_configs:
      - targets: ['mcp-server:3000']
    # Uncomment if authentication is enabled:
    # basic_auth:
    #   username: prometheus
    #   password: your-secret

  - job_name: 'mittwald-oauth-bridge'
    static_configs:
      - targets: ['oauth-bridge:3001']
```

### Example PromQL Queries

```promql
# Tool call rate per minute
rate(mcp_tool_calls_total[1m])

# Tool error rate
sum(rate(mcp_tool_calls_total{status="error"}[5m])) / sum(rate(mcp_tool_calls_total[5m]))

# 95th percentile tool latency
histogram_quantile(0.95, rate(mcp_tool_duration_seconds_bucket[5m]))

# OAuth token success rate
sum(rate(oauth_token_requests_total{status="success"}[5m])) / sum(rate(oauth_token_requests_total[5m]))
```

## Operational Notes
- Revoke access in Mittwald Studio to force downstream clients to re-authorize.
- The OAuth bridge logs the loaded scope configuration (counts, defaults, config file path). Any
  mismatch between Mittwald discovery and the configured list is surfaced there.
- Ensure Redis is available to both the bridge and MCP server (`BRIDGE_STATE_STORE=redis`, shared
  session store).

## Testing
- Run `npm run lint`, `npm run type-check`, and `npm run test:unit` for fast local feedback.
- `npm run test:integration` exercises Redis-backed session flows and bridge JWT verification.
- `npm run test:e2e:mcp` (when available) drives a full OAuth + MCP tool cycle against the mock stack.
- See `tests/README.md` for the complete matrix and environment requirements.

## Security

This repository uses GitHub's native security features:

- **Dependabot**: Automatically creates PRs for vulnerable dependencies (configured in `.github/dependabot.yml`)
- **CodeQL**: Static analysis for security vulnerabilities on PRs and weekly scans (`.github/workflows/codeql.yml`)
- **Secret Scanning**: Prevents accidental commit of secrets (enable in repository Settings → Security)

### Responding to Security Alerts

1. **Dependabot alerts**: Review and merge dependency update PRs promptly. Security updates are grouped and labeled for easy identification.
2. **CodeQL findings**: Address issues before merging PRs. The workflow blocks PRs with HIGH/CRITICAL severity findings.
3. **Secret scanning alerts**: Rotate any compromised secrets immediately and revoke associated access.

## Coverage Reports

- `mw-cli-coverage.json` contains machine-readable coverage stats for the Mittwald CLI.
- Validate the artifact with `config/mw-cli-coverage.schema.json` (e.g. `npx ajv validate -s config/mw-cli-coverage.schema.json -d mw-cli-coverage.json`).
- Regeneration is automated via the Workstream A script (`npm run coverage:generate`); commit both the JSON and `docs/mittwald-cli-coverage.md` after running it. Only rerun when tool metadata, exclusion lists, or the Mittwald CLI version change—routine commits that don’t touch those inputs can skip regeneration.
- Intentional gaps live in `config/mw-cli-exclusions.json`. Update this allowlist (with rationale) whenever a missing CLI command is acceptable—CI fails if `stats.missingCount` is greater than zero.
- Quick commands:
  - `npm run coverage:generate` – rebuild artifacts when coverage inputs change.
  - `npm run check:cli-version` – warn when Dockerfile pins drift from npm.
- See `docs/coverage-automation.md` for the full runbook covering CI guards and allowlist policy.

## Documentation

End-user docs are split across two static sites:

- **Setup & Guides** in `docs/setup-and-guides/` (human-perspective onboarding, how-to, tutorials, runbooks, explainers)
- **Tool Reference** in `docs/reference/` (tool-by-tool reference pages and API-level details)

Operator runbooks:

- `docs/OPERATIONS-START-HERE.md` (customer handover entrypoint)
- `docs/DOCS-SITES-OPERATIONS.md` (build and verify both documentation sites)
- `docs/FUNCTIONAL-TESTING-OPERATIONS.md` (run functional MCP testing in real agents against deployed endpoints)

One-command build for both sites:

```bash
cd docs
./build-all.sh local
```

For deployment-specific details, see `DEPLOY.md` and `docs/DEPLOYMENT-GUIDE.md`.

---

For questions or onboarding guidance, start with `ARCHITECTURE.md` and `docs/INDEX.md` (docs navigation). LLM/agent operators should read `docs/LLM-AGENTS.md`.

For developer documentation on integrating with Mittwald MCP, see the setup guides in `docs/setup-and-guides/` or visit the deployed documentation site.
