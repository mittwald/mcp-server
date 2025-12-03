# Config & Secret Inventory (Initial)

## mittwald-mcp
- Root `.env.example`: NODE_ENV/PORT/MCP transport, logging flags; Redis URL/TTL for sessions and OAuth state; shared `OAUTH_BRIDGE_JWT_SECRET`; optional bridge metadata overrides; JWT signing key/expiry for MCP-issued tokens; Mittwald OAuth endpoints + client id/secret; CLI resource caps (`MCP_CLI_MAX_BUFFER_MB`, `MCP_TOOL_MAX_PAYLOAD_MB`, heap limits, NODE_OPTIONS); direct bearer token feature flags; redirect URI; tool filtering; test harness values.
- `packages/oauth-bridge/.env.example`: PORT, BRIDGE_ISSUER/BASE_URL, Mittwald auth/token URLs, public Mittwald client ID, optional redirect URI allowlist; bridge JWT secret + TTLs; state store selection + Redis URL/TTL/prefix; log level.
- Compose files:
  - `docker-compose.yml` (dev): uses .env; overrides NODE_ENV=dev, DEBUG=true, REDIS_URL=redis://redis; enables HTTPS; mock OAuth issuer/redirect; hardcoded JWT_SECRET for testing; mounts logs/ssl. Redis maxmemory 256mb LRU.
  - `docker-compose.prod.yml`: NODE_ENV=prod, DEBUG=false, HTTPS mandatory; uses redis service; JWT_SECRET from env; requires ssl mount; exposes only MCP port.
- Dockerfiles:
  - `Dockerfile`/`stdio.Dockerfile`/`openapi.Dockerfile`: node:20.12.2-alpine; install openssh-client; global @mittwald/cli@1.12.0; npm ci fallback to npm install; builds; non-root user; openapi/stdio variants expose port defaults.
  - `packages/oauth-bridge/Dockerfile`: two-stage build; copies shared tsconfig + scopes JSON; installs deps, builds, prunes dev deps; runtime Node 20 alpine, NODE_ENV=production; exposes 3000; copies scopes config into image.
- Fly configs:
  - `packages/mcp-server/fly.toml`: app mittwald-mcp-fly2, PORT=8080, public base URLs set, JWT signing key placeholder; auto-start/stop machines; concurrency limits.
  - `packages/oauth-bridge/fly.toml`: app mittwald-oauth-server, PORT=3000, base URLs set; health check; HTTPS enforced.
- Other files to inspect next: Dockerfile/openapi.Dockerfile/stdio.Dockerfile for ARG/ENV defaults; docker-compose*.yml for runtime secrets; config/mittwald-scopes.json and overrides; CI workflows for injected secrets.

## mittwald-oauth
- `.env.example`: app URL/port; Postgres creds/DB names; OAuth issuer and token lifetimes; JWT secret/alg/issuer; encryption key + bcrypt rounds for client secrets; PKCE required/method; Mittwald endpoints + client credentials + callback; token encryption key/id/retention and refresh retry settings; admin API token; MCP server URLs; logging/cors/helmet/trust proxy; rate limiting windows (overall + DCR-specific); session secret/cookie flags; Fly app/region; GitHub repo var.
- Compose/Fly:
  - `docker-compose.yml`: dev + postgres/postgres-test with default creds; mounts init-db.sql; exposes 3000/5432/5433.
  - `fly.toml`: prod env includes hardcoded placeholder secrets (JWT/ENCRYPTION/SESSION/ADMIN); TLS enforced; concurrency limits; static files served from /app/public; single shared VM 1 CPU/1GB.
- Dockerfile: multi-stage Node 20 alpine; prod uses npm ci --only=production plus ts-node/tsconfig-paths; runner copies dist + node_modules; non-root user oauth; healthcheck hitting /health.
- Other files to inspect next: docker-compose.yml/Dockerfile/fly.toml for env defaults; knex migrations for schema-level constraints; CI workflows for secrets.

## Follow-ups
- Validate key lengths/entropy requirements and rotation hooks for JWT/signing/encryption secrets.
- Confirm defaults are safe for production (CORS `*`, HTTP-only/secure cookies, trust proxy, HS256 usage).
- Map where secrets are persisted (Redis/DB) and whether encryption is applied (e.g., Mittwald tokens, client secrets).
- Cross-check env names between repos for consistency (bridge secrets/shared values).
