# Mittwald MCP Connector Architecture (2025-09-27)

## Executive Summary

We replaced the legacy `oidc-provider` deployment with a **stateless OAuth bridge** that fronts Mittwald’s OAuth endpoints and issues HS256 JWTs to downstream MCP clients (ChatGPT, Claude, Inspector, etc.). The bridge stores interaction state in Redis, exchanges authorization codes with Mittwald, and embeds Mittwald access/refresh tokens in the JWT payload. The MCP server verifies the bridge JWT, persists the Mittwald tokens in Redis, and uses them for CLI calls (`mw … --token <mittwald_access_token>`).

Key goals:
- Support cookie-less OAuth clients (ChatGPT/Claude) with Authorization Code + PKCE flows.
- Keep Mittwald as the system of record for user consent and token issuance.
- Share session state between MCP workers via Redis (no reliance on browser cookies).

## High-Level Flow

1. **Discovery** – Bridge serves `.well-known/oauth-authorization-server` with MCP metadata (`mcp.client_id`, redirect URIs) and `.well-known/oauth-protected-resource` for resource indicators. MCP clients fetch this first.
2. **Authorization** – Client calls `GET /authorize` on the bridge. We validate PKCE parameters, persist state in Redis (keyed by `state`), and redirect to Mittwald (`MITTWALD_AUTHORIZATION_URL`).
3. **Mittwald Callback** – Mittwald redirects back to `/mittwald/callback`. We look up the original request using an internal state token, generate our own bridge authorization code, and redirect the MCP client back to its callback with that code.
4. **Token Exchange** – Client calls `POST /token` on the bridge with PKCE verifier. We verify the grant, exchange the stored Mittwald authorization code for access/refresh tokens (`MITTWALD_TOKEN_URL`), mint a JWT (`HS256`) embedding the Mittwald tokens, and return the JWT + refresh token to the MCP client.
5. **MCP Request** – Client presents the bridge JWT to the MCP server (`Authorization: Bearer`). Our OAuth middleware verifies the signature using `OAUTH_BRIDGE_JWT_SECRET`, extracts Mittwald access/refresh tokens, and populates `req.auth.extra`.
6. **Session Persistence** – MCP server stores the Mittwald credentials, scopes, and resource in Redis via `sessionManager`. Subsequent requests reuse the cached tokens; `session-auth` middleware hydrates `req.auth` and `req.user` from Redis.
7. **CLI Execution** – When tools invoke the Mittwald CLI (`mw`), we inject the Mittwald access token from `req.auth.extra.mittwaldAccessToken` ensuring every command authenticates on behalf of the user.

## Components

| Component | Role |
|-----------|------|
| **OAuth Bridge (`packages/oauth-bridge`)** | Koa service handling `/authorize`, `/mittwald/callback`, `/token`, client registration lifecycle, `/health` metrics, JWT signing, and Redis-backed state. The bridge authenticates as a public Mittwald PKCE client (no Mittwald client secret) and **must** listen on `https://mittwald-oauth-server.fly.dev` so Mittwald’s redirect whitelist continues to match. Dynamic client registration now supports both public clients (`token_endpoint_auth_method=none`) and confidential clients (`client_secret_post` / `client_secret_basic`) by minting bridge-side client secrets. |
| **Mittwald OAuth** | Authoritative IdP (static client `mittwald-mcp-server`). Provides login UI, enforces scopes, and issues access/refresh tokens. |
| **MCP Server (`src/server`)** | Validates bridge JWTs, persists sessions in Redis, and drives tool execution via Mittwald tokens. |
| **Redis** | Session/state cache storing authorization requests (bridge) and user sessions (MCP server). |
| **MCP Clients** | ChatGPT, Claude, Inspector, etc. – consume discovery, execute OAuth 2.1 + PKCE using bridge endpoints. |

## Stateful Data

### Bridge Authorization Store
- Implemented in `packages/oauth-bridge/src/state/` (in-memory for now, backed by Redis in deployment).
- Tracks `state` → client metadata, PKCE challenge, Mittwald authorization code, tokens, refresh tokens.
- TTL-driven cleanup to avoid leaked state.

### MCP Sessions (Redis)
- Managed by `src/server/session-manager.ts`.
- Keys: `session:<id>` containing Mittwald access/refresh tokens, scope, resource, context, expiration.
- `session-auth` middleware reads these records for each request; `mcp.ts` updates them whenever new auth arrives.

## Configuration

### Bridge Environment Variables
- `PORT` – Bridge HTTP port (default 3000).
- `BRIDGE_ISSUER`, `BRIDGE_BASE_URL`, `BRIDGE_JWT_SECRET` – JWT metadata and signing key (shared with MCP server via `OAUTH_BRIDGE_JWT_SECRET`).
- `BRIDGE_REDIRECT_URIS` – Comma-separated list (ChatGPT `https://chatgpt.com/connector_platform_oauth_redirect`, Claude `https://claude.ai/api/mcp/auth_callback`, etc.).
- `MITTWALD_AUTHORIZATION_URL`, `MITTWALD_TOKEN_URL`, `MITTWALD_CLIENT_ID` – Mittwald endpoints and static client identifier (public PKCE client; no client secret required). Deployments must ensure the bridge callback remains `https://mittwald-oauth-server.fly.dev/mittwald/callback`.
- Optional TTL overrides: `BRIDGE_ACCESS_TOKEN_TTL_SECONDS`, `BRIDGE_REFRESH_TOKEN_TTL_SECONDS`.

### MCP Environment Variables
- `OAUTH_BRIDGE_JWT_SECRET` – Must match the bridge signing secret.
- `OAUTH_BRIDGE_ISSUER`, `OAUTH_BRIDGE_AUDIENCE` (optional) – Expected JWT issuer/audience.
- `OAUTH_AS_BASE`, `MCP_PUBLIC_BASE` – Used for `WWW-Authenticate` metadata and OAuth challenges.
- Redis credentials – `REDIS_URL` (see `docker-compose.yml`).

## Key Modules

### Bridge
- `src/app.ts` – Koa setup, health endpoint, middleware.
- `src/routes/authorize.ts` – Validates PKCE, persists authorization requests, redirects to Mittwald.
- `src/routes/mittwald-callback.ts` – Receives Mittwald auth code, maps back to external state.
- `src/routes/token.ts` – PKCE verification, token exchange, JWT signing via `services/bridge-tokens.ts`; enforces client authentication for confidential registrations before exchanging Mittwald codes.
- `src/routes/register.ts` – Dynamic client registration plus GET/DELETE lifecycle endpoints gated by the registration access token. Generates bridge-managed client secrets for confidential clients and returns them alongside registration access tokens for self-service lifecycle.
- `src/services/mittwald.ts` – HTTP client for Mittwald token exchanges (public client: PKCE only, no client secret).
- Tests: `tests/token-flow.test.ts` uses Supertest to exercise the full flow.

### MCP Server
- `src/server/oauth-middleware.ts` – Verifies bridge JWTs with `jose`, extracts Mittwald tokens, sets `req.auth.extra`.
- `src/server/session-manager.ts` – Persists sessions in Redis (access token, refresh token, scope, resource, context).
- `src/middleware/session-auth.ts` – Hydrates `req.user`/`req.auth` from Redis for every tool request.
- `src/server/mcp.ts` – Manages session lifecycle, persists auth via `sessionManager`, ensures CLI commands use the right tokens.
- Tests: `tests/unit/server/oauth-middleware.test.ts`, `tests/unit/middleware/session-auth.test.ts`.

## Security Standards

### Credential Security (REQUIRED)
All tools that handle passwords, tokens, API keys, or secrets MUST follow the credential security standard documented in [`docs/CREDENTIAL-SECURITY.md`](./docs/CREDENTIAL-SECURITY.md). This three-layer defense-in-depth model prevents credential leakage in multi-tenant environments:

1. **Layer 1**: Cryptographic password generation (`crypto.randomBytes()`)
2. **Layer 2**: Command redaction before logging (`--password [REDACTED]`)
3. **Layer 3**: Response sanitization (boolean flags, not values)

See also:
- [Agent S1 Implementation Prompt](./docs/agent-prompts/STANDARD-S1-credential-security.md)
- [Agent C3 Review (Security Champion)](./docs/agent-reviews/AGENT-C3-REVIEW.md)

### Destructive Operation Safety (REQUIRED)
All tools that perform destructive operations (delete, revoke, terminate, etc.) MUST follow the safety pattern established by Agent C4. This pattern prevents accidental data loss and provides audit trails:

1. **Required Confirm Flag**: Schema must include `confirm: boolean` (required) with explicit validation
2. **Audit Logging**: Use `logger.warn()` before execution with sessionId, userId, and resource identifier
3. **Clear Error Messages**: Validation failure must explain the operation is "destructive and cannot be undone"
4. **CLI Force Flags**: Use `--force` and `--quiet` flags for clean execution with ID capture

**Implementation Pattern**:
```typescript
// 1. Schema validation
if (args.confirm !== true) {
  return formatToolResponse(
    'error',
    'This operation is destructive and cannot be undone. Set confirm=true to proceed.'
  );
}

// 2. Audit logging
logger.warn('[ToolName] Destructive operation attempted', {
  resourceId: args.id,
  sessionId: context?.sessionId,
  userId: context?.userId,
});

// 3. CLI execution with force flags
const argv = ['resource', 'delete', args.id, '--force', '--quiet'];
```

See also:
- [Agent C4 Review (Safety Pattern)](./docs/agent-reviews/AGENT-C4-REVIEW.md)
- [Destructive Operations Safety Guide](./docs/tool-safety/destructive-operations.md)

## Remaining Work / Considerations
- Token refresh orchestration (optional) – bridge currently mints refresh tokens; MCP server may use Mittwald refresh tokens in future.
- Enterprise IdPs without DCR – may require a separate onboarding flow.
- Redis persistence for bridge state – in production we should swap the in-memory store for Redis.
- Additional error logging around `/token` exchange for better diagnostics.
- Consider rotating bridge-issued client secrets and surfacing revocation flows once confidential client usage increases.
- **Coverage automation** – The Workstream A tooling generates `mw-cli-coverage.json` / `docs/mittwald-cli-coverage.md`, validates them in CI, and applies exclusion policy via `config/mw-cli-exclusions.json`. See `docs/coverage-automation.md` for maintainer workflow details.

## Changelog Snapshot
- 2025-09-27 15:25 UTC – Created `packages/oauth-bridge`, scaffolded Koa service.
- 2025-09-27 16:32 UTC – Implemented Mittwald callback + `/token` flow, embedded Mittwald tokens in JWT (`408d2e1`).
- 2025-09-27 17:32 UTC – MCP server verifies bridge JWT via `jose`, sessions carry Mittwald tokens (`3938aff`).
- 2025-09-27 18:05 UTC – Session middleware hydrates `req.auth` from Redis; unit tests updated (`de63a80`).
- 2025-09-29 11:45 UTC – Bridge dynamic registration issues secrets for Claude Desktop confidential clients and validates client authentication on `/token`.

This document should be used alongside `docs/2025-09-27-openai-connector-oauth-guidance.md` for the latest implementation log.
