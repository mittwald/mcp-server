# Deployment Guide

This guide covers both how the hosted deployment is produced and how to run the same stack on your
own infrastructure. Use it alongside `.env.example`, `packages/oauth-bridge/.env.example` and
`deploy/main.tf`.

## Production Deployment (mcp.mittwald.de)

Production is a single mittwald container stack, fully described by the Terraform config in
`deploy/` and applied from CI. **Do not run `terraform apply` locally** — state lives in the HCP
Terraform workspace `mittwald/mcp-server`, and a local apply can ship an image that was never built.

To release:

```bash
git tag v1.2.3
git push origin v1.2.3
```

`.github/workflows/build-and-publish.yml` then:

1. builds `mittwald/mcp-server-http` from the root `Dockerfile` and `mittwald/mcp-server-oauth`
   from `packages/oauth-bridge/Dockerfile`, tagging both with the released version, and pushes them
   to Docker Hub;
2. runs `terraform apply -auto-approve -var="image_tag=<version>"` in `deploy/`.

Watch the run with `gh run watch`, then verify:

```bash
curl -s https://mcp.mittwald.de/health | jq
curl -s https://auth.mcp.mittwald.de/health | jq
```

What `deploy/main.tf` provisions:

| Resource | Purpose |
|----------|---------|
| `mittwald_project.mcp_project` | Project holding the whole deployment |
| `mittwald_container_registry.mcp_registry` | Docker Hub credentials for pulling both images |
| `mittwald_container_stack.mcp_stack` | The `mcp-server` (8080) and `oauth-server` (3000) containers and all their environment |
| `mittwald_redis_database.mcp_redis` | Shared session/state store |
| `mittwald_virtualhost.mcp_domain` / `oauth_domain` | `mcp.mittwald.de` and `auth.mcp.mittwald.de` routing |

`random_string.jwt_secret` feeds both `BRIDGE_JWT_SECRET` and `OAUTH_BRIDGE_JWT_SECRET`, which is
what keeps the two services' JWT verification in sync. Never set either by hand.

Both containers must stay at **one replica**: the MCP transport keeps per-session state in memory.

## Self-Hosting

The rest of this document describes running the same two services on your own infrastructure
(Kubernetes, VMs, plain Docker).

## 1. Components & Responsibilities

| Component | Location | Purpose |
|-----------|----------|---------|
| **MCP Server** | `Dockerfile`, `src/` | Exposes `/mcp`, `/health`, and OAuth metadata endpoints. Validates JWTs, handles direct bearer tokens, manages MCP sessions. |
| **OAuth Bridge** | `packages/oauth-bridge/` | Implements the OAuth 2.1 proxy that Claude Desktop and other clients rely on. Hosts registration, authorization, and token endpoints. |
| **Redis** | External service | Shared cache/session store. Required for both the MCP server and bridge (authorization codes, sessions, rate limiting). |
| **Mittwald APIs** | External | The OAuth bridge exchanges codes against Mittwald; the MCP server calls the Mittwald API through `@mittwald-mcp/cli-core`. Configure tenant-specific URLs and the client ID. |

## 2. Networking & TLS

1. **Routing**
   - `mcp.<your-domain>` → MCP server container (port `PORT`, default 8080).
   - `oauth.<your-domain>` → OAuth bridge container (port defined by bridge `PORT`).
   - Both services need a shared Redis instance reachable at `REDIS_URL` / `BRIDGE_REDIS_URL`.

2. **TLS Termination**
   - If TLS terminates _before_ the containers (e.g. managed ingress), set
     `ENABLE_HTTPS=false` for the MCP server. This now overrides the production
     default.
   - If the container terminates TLS itself, provide cert/key paths (`SSL_CERT_PATH`,
     `SSL_KEY_PATH`) and set `ENABLE_HTTPS=true`.
   - The bridge doesn’t self-manage TLS; place it behind the same ingress/edge you
     use for the MCP server.

3. **Verification Targets** (after routing is configured)
   ```bash
   curl https://mcp.<your-domain>/              # JSON metadata with endpoints.mcp
   curl -i https://mcp.<your-domain>/mcp        # 401 with WWW-Authenticate header
   curl https://mcp.<your-domain>/.well-known/oauth-protected-resource
   curl https://oauth.<your-domain>/.well-known/oauth-authorization-server
   ```

## 3. Environment Variables

### 3.1 MCP Server (see `.env.example`)

| Variable | Purpose | Notes |
|----------|---------|-------|
| `NODE_ENV` | Set to `production` for live deployments. | Determines logging + defaults. |
| `PORT` | HTTP listen port (default `8080`). | Match container/ingress mapping. |
| `CORS_ORIGIN` | Allowed CORS origins. | **Required in production**. E.g. `https://claude.ai,https://chatgpt.com`. |
| `ENABLE_HTTPS` | `true` to terminate TLS in-container, `false` to serve HTTP. | Explicit `false` now respected. |
| `SSL_CERT_PATH`, `SSL_KEY_PATH` | Paths to TLS cert/key when `ENABLE_HTTPS=true`. | Optional if TLS terminates upstream. |
| `REDIS_URL` | Redis connection string. | Must match bridge’s Redis. |
| `OAUTH_BRIDGE_JWT_SECRET` | Secret shared with bridge. | Must equal bridge’s `BRIDGE_JWT_SECRET`. |
| `JWT_SIGNING_KEY` | Signing key for internal sessions. | Rotate per environment. |
| `MCP_PUBLIC_BASE` | Public base URL (e.g. `https://mcp.<domain>`). | Used for metadata & challenge headers. |
| `OAUTH_BRIDGE_BASE_URL`, `OAUTH_BRIDGE_AUTHORIZATION_URL`, `OAUTH_BRIDGE_TOKEN_URL` | Point at your own bridge domain. |
| `OAUTH_BRIDGE_ISSUER`, `OAUTH_BRIDGE_AUDIENCE` | Expected issuer/audience for bridge JWTs. |
| `MITTWALD_*` (`MITTWALD_TOKEN_URL`, `MITTWALD_CLIENT_ID`, etc.) | Tenant-specific Mittwald OAuth endpoints & credentials. |
| `OAUTH_REDIRECT_URI` | Redirect URL registered with Mittwald. |
| `ENABLE_DIRECT_BEARER_TOKENS` | `true` to allow direct bearer token validation. |
| `DIRECT_TOKEN_*` | Optional tuning for direct-token caching & timeouts. |
| `METRICS_ENABLED` | `true` (default) to enable `/metrics` endpoint. Set `false` to disable. |
| `METRICS_USER`, `METRICS_PASS` | Basic auth credentials for `/metrics`. Optional; unprotected if not set. |

### 3.2 OAuth Bridge (`packages/oauth-bridge/.env.example`)

| Variable | Purpose | Notes |
|----------|---------|-------|
| `PORT` | Bridge listen port (default `8080`). |
| `BRIDGE_BASE_URL`, `BRIDGE_ISSUER` | External URL + issuer (e.g. `https://oauth.<domain>`). |
| `MITTWALD_AUTHORIZATION_URL`, `MITTWALD_TOKEN_URL` | Tenant Mittwald endpoints. |
| `MITTWALD_CLIENT_ID` | Mittwald OAuth client ID. The bridge is a **public** PKCE client — there is no client secret. |
| `BRIDGE_JWT_SECRET` | Must match MCP server’s `OAUTH_BRIDGE_JWT_SECRET`. |
| `BRIDGE_STATE_STORE` | `redis` recommended. |
| `BRIDGE_REDIS_URL` | Redis connection string, same instance as MCP server. |
| `BRIDGE_SESSION_TTL`, `BRIDGE_RATE_LIMIT_*` | Optional tuning knobs. |
| `ENABLE_REGISTRATION` | `true` if you allow dynamic client registration (Claude). |
| `METRICS_ENABLED` | `true` (default) to enable `/metrics` endpoint. Set `false` to disable. |
| `METRICS_USER`, `METRICS_PASS` | Basic auth credentials for `/metrics`. Optional; unprotected if not set. |

### 3.3 Shared / Operational

- **Redis**: ensure ACL/credentials allow both services to connect.
- **Ingress**: forward `Authorization` header and `WWW-Authenticate` responses intact.
- **Reference configuration**: `deploy/main.tf` lists every environment variable the hosted
  deployment sets, and is the most reliable starting point for a new environment.

## 4. Deployment Workflow Outline

1. **Build images**
   ```bash
   docker build -t mittwald-mcp-server .
   docker build -t mittwald-oauth-bridge packages/oauth-bridge
   ```

2. **Provision supporting services**
   - Redis instance accessible from both deployments.
   - Secrets store / config map for env vars.

3. **Configure runtime env**
   - Populate MCP server and bridge environment variables (see tables above).
   - Set `ENABLE_HTTPS=false` if TLS is terminated upstream.
   - Ensure `MCP_PUBLIC_BASE`, `OAUTH_BRIDGE_*` all reference your domains.
   - Register your bridge callback (`<bridge-url>/mittwald/callback`) with Mittwald. Mittwald's
     redirect list is immutable from our side, so this must be arranged up front.

4. **Deploy containers**
   - Use Kubernetes (`Deployment` + `Service`), Docker Compose, or other orchestrator.
   - Mount TLS certificates if terminating in container.

5. **Verify**
   ```bash
   curl https://mcp.<domain>/.well-known/oauth-protected-resource | jq
   curl -i -H "Accept: application/json, text/event-stream" \
     https://mcp.<domain>/mcp
   # Expect 401 with WWW-Authenticate pointing at oauth.<domain>
   ```
   - Run the OAuth “smoke” sequence: registration → authorization → token exchange.
   - Exercise direct bearer token path: `curl -H "Authorization: Bearer <token>"`.

## 5. Troubleshooting Checklist

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `404` on `https://mcp.<domain>/` | Routing hits OAuth bridge instead of MCP server. | Update ingress to point root path to MCP server. |
| `502 Bad Gateway` from proxy | MCP server still serves HTTPS internally while ingress expects HTTP. | Set `ENABLE_HTTPS=false` (now honored even in production). |
| `401` whose `WWW-Authenticate` points at the wrong host | `OAUTH_BRIDGE_*` variables still reference another deployment. | Override them with your domains. |
| Direct bearer tokens ignored | Missing `Authorization` header or `ENABLE_DIRECT_BEARER_TOKENS=false`. | Ensure header forwarding and env flag. |
| Bridge + MCP JWT mismatch | `BRIDGE_JWT_SECRET` ≠ `OAUTH_BRIDGE_JWT_SECRET`. | Use same secret for both. |

For deeper diagnostics:
- Container logs via your orchestrator (`kubectl logs`, `docker logs`, `mw container logs <id>`).
- Increase log verbosity via `LOG_LEVEL=debug` (MCP) or enabling request logging in the bridge.

## 6. Documentation Sites

The project includes two Astro/Starlight documentation sites:

- `docs/setup-and-guides/`
- `docs/reference/`

Canonical build and verification instructions live in:

- `docs/DOCS-SITES-OPERATIONS.md`
- `docs/FUNCTIONAL-TESTING-OPERATIONS.md` (for post-deploy functional validation inside agent CLIs)

### 6.1 Quick Build (Both Sites)

```bash
cd docs
./build-all.sh local
```

### 6.2 Build Configuration

`docs/build-all.sh` supports:

- `local`
- `production`
- `github-pages`
- `custom` (with `BASE_URL`, `SETUP_SITE_URL`, `REFERENCE_SITE_URL`)

Example:

```bash
cd docs
BASE_URL=/docs SETUP_SITE_URL=/docs REFERENCE_SITE_URL=/docs/reference ./build-all.sh custom
```

### 6.3 Local Dev Servers

```bash
cd docs/setup-and-guides && npm run dev
cd docs/reference && npm run dev
```

### 6.4 Production Static Hosting

Serve each built `dist/` directory as a static site (nginx/Caddy/S3/CDN all fine). Use `try_files`/SPA fallback behavior so deep links resolve to `index.html`.

## 7. Further Reading

- `.env.example` and `packages/oauth-bridge/.env.example` – authoritative list of supported variables.
- `docker-compose.yml` – local orchestration reference (MCP server, bridge, Redis, mock OAuth).
- `docker-compose.prod.yml` – Redis durability settings; see `docs/operations/redis.md`.
- `ARCHITECTURE.md` – flow diagrams and component responsibilities.
