# Mittwald MCP Server
[![Coverage Check](https://github.com/mittwald/mcp-server/actions/workflows/coverage-check.yml/badge.svg)](https://github.com/mittwald/mcp-server/actions/workflows/coverage-check.yml)

The Mittwald MCP server exposes 116 tools that let MCP clients (Claude, ChatGPT, MCP Inspector, Cursor, Codex CLI) manage Mittwald hosting infrastructure on behalf of a user. Authentication flows through an OAuth bridge that fronts Mittwald's OAuth 2.1 endpoints using Authorization Code + PKCE only. Mittwald treats the bridge as a **public client**: there is no Mittwald-issued client secret to manage. The bridge mints its own secrets for downstream confidential MCP clients (e.g. Claude Desktop) and verifies them before issuing JWTs.

Mittwald remains authoritative for scopes and consent — the bridge renders no consent page of its own, and the scope string inside each issued JWT comes straight from Mittwald's token response. Clients register their redirect URI through `/register` (Dynamic Client Registration); see `ARCHITECTURE.md` for why that is mandatory.

## Production Deployment

| Service | URL | Image | Source |
|---------|-----|-------|--------|
| MCP server | https://mcp.mittwald.de | `mittwald/mcp-server-http` | `Dockerfile` + `src/` |
| OAuth bridge | https://auth.mcp.mittwald.de | `mittwald/mcp-server-oauth` | `packages/oauth-bridge/` |

Both run as containers in one mittwald container stack alongside a managed Redis, described by the
Terraform config in `deploy/`. Pushing a `v*` tag builds both images and applies that config — see
`DEPLOY.md`.

Connect a client with:

```bash
claude mcp add --transport http mittwald https://mcp.mittwald.de/mcp
```

## Repository Layout

```
src/                        # MCP server (JWT validation, sessions, tool handlers + definitions)
packages/
  oauth-bridge/             # OAuth 2.1 proxy to Mittwald OAuth (Koa)
  mittwald-cli-core/        # Mittwald CLI business logic as an importable library
deploy/                     # Terraform config for the production container stack
docs/                       # Operator runbooks and the two documentation sites
tests/                      # Unit, integration, e2e, security, smoke, functional suites
evals/                      # Agent-native E2E harness and prompt corpus
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
   npm run build && node build/index.js
   ```
   Use `npm run watch` in a second shell to recompile on change.

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
| `mcp_tool_memory_delta_mb` | Histogram | `tool_name` | Heap growth across a tool call |
| `mcp_active_connections` | Gauge | - | Current active MCP connections |
| `mcp_memory_pressure_percent` | Gauge | - | Heap used as a percentage of the limit |
| `mcp_cli_inflight` | Gauge | - | `mw` subprocesses currently running |
| `mcp_cli_queue_depth` | Gauge | - | Calls waiting for a CLI slot |
| `mcp_cli_queue_wait_seconds` | Histogram | - | Time spent waiting for a CLI slot |
| `mcp_client_versions_total` | Counter | - | Connecting client names/versions |
| `mcp_client_capabilities_total` / `_active` | Counter / Gauge | - | Capabilities negotiated by clients |
| `mcp_experimental_features_total` | Counter | - | Experimental capability usage |
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
| `oauth_forced_reauth_total` | Counter | - | Flows that forced a re-authentication |
| `oauth_mittwald_token_refresh_total` | Counter | `status` | Upstream token refreshes |
| `oauth_mittwald_token_refresh_duration_seconds` | Histogram | - | Upstream refresh duration |

Both services also expose default Node.js metrics (`nodejs_*`, `process_*`).

### Prometheus Scrape Configuration

In production both containers require Basic auth (`METRICS_USER` / `METRICS_PASS` are set by
Terraform). Ports are 8080 for the MCP server and 3000 for the bridge:

```yaml
scrape_configs:
  - job_name: 'mittwald-mcp-server'
    static_configs:
      - targets: ['mcp-server:8080']
    basic_auth:
      username: metrics
      password: your-secret

  - job_name: 'mittwald-oauth-bridge'
    static_configs:
      - targets: ['oauth-bridge:3000']
    basic_auth:
      username: metrics
      password: your-secret
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
- Revoke access in mStudio to force downstream clients to re-authorize.
- The OAuth bridge logs the loaded scope configuration (counts, defaults, config file path). Any
  mismatch between Mittwald discovery and the configured list is surfaced there.
- Ensure Redis is available to both the bridge and MCP server (`BRIDGE_STATE_STORE=redis`, shared
  session store).

## Testing
- Run `npm run lint`, `npm run type-check`, and `npm run test:unit` for fast local feedback.
- `npm run test:integration` exercises Redis-backed session flows and bridge JWT verification.
- `npm run test:e2e:mcp` drives a full OAuth + MCP tool cycle against the mock stack.
- See `tests/README.md` for the complete matrix and environment requirements.

## Security

This repository uses GitHub's native security features:

- **Dependabot**: Automatically creates PRs for vulnerable dependencies (configured in `.github/dependabot.yml`)
- **CodeQL**: Static analysis for security vulnerabilities on PRs and weekly scans (`.github/workflows/codeql.yml`)
- **Secret Scanning**: Prevents accidental commit of secrets (enable in repository Settings → Security)
- **npm audit**: `.github/workflows/security-check.yml` fails PRs with high/critical advisories

### Responding to Security Alerts

1. **Dependabot alerts**: Review and merge dependency update PRs promptly. Security updates are grouped and labeled for easy identification.
2. **CodeQL findings**: Address issues before merging PRs. The workflow blocks PRs with HIGH/CRITICAL severity findings.
3. **Secret scanning alerts**: Rotate any compromised secrets immediately and revoke associated access.

## Coverage Reports

- `mw-cli-coverage.json` contains machine-readable coverage stats for the Mittwald CLI.
- Validate the artifact with `config/mw-cli-coverage.schema.json` (e.g. `npx ajv validate -s config/mw-cli-coverage.schema.json -d mw-cli-coverage.json`).
- Regenerate with `npm run coverage:generate` and commit both the JSON and `docs/mittwald-cli-coverage.md`. Only rerun when tool metadata, exclusion lists, or the Mittwald CLI version change—routine commits that don’t touch those inputs can skip regeneration.
- Intentional gaps live in `config/mw-cli-exclusions.json`. Update this allowlist (with rationale) whenever a missing CLI command is acceptable—CI fails if `stats.missingCount` is greater than zero.
- Quick commands:
  - `npm run coverage:generate` – rebuild artifacts when coverage inputs change.
  - `npm run check:cli-version` – warn when Dockerfile pins drift from npm.
- See `docs/coverage.md` for the full runbook covering CI guards and allowlist policy.

## Documentation

End-user docs are split across two static sites:

- **Setup & Guides** in `docs/setup-and-guides/` (human-perspective onboarding, how-to, tutorials, runbooks, explainers)
- **Tool Reference** in `docs/reference/` (tool-by-tool reference pages and API-level details)

The Tool Reference is **generated** from the tool registry; see `docs/reference/README.md` before
editing it.

Operator runbooks:

- `docs/OPERATIONS-START-HERE.md` (operator entrypoint)
- `docs/DOCS-SITES-OPERATIONS.md` (build and verify both documentation sites)
- `docs/FUNCTIONAL-TESTING-OPERATIONS.md` (run functional MCP testing in real agents against deployed endpoints)

One-command build for both sites:

```bash
cd docs
./build-all.sh local
```

For deployment-specific details, see `DEPLOY.md`.

---

For questions or onboarding guidance, start with `ARCHITECTURE.md` and `docs/INDEX.md` (docs navigation). LLM/agent operators should read `docs/LLM-AGENTS.md`.

For developer documentation on integrating with Mittwald MCP, see the setup guides in `docs/setup-and-guides/` or visit the deployed documentation site.
