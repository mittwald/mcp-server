# Mittwald MCP Connector Architecture

## Executive Summary

An **OAuth bridge** fronts Mittwald's OAuth endpoints and issues HS256 JWTs to downstream MCP clients (ChatGPT, Claude, Inspector, etc.). The bridge stores interaction state in Redis, exchanges authorization codes with Mittwald, and embeds Mittwald access/refresh tokens in the JWT payload. The MCP server verifies the bridge JWT, persists the Mittwald tokens in Redis, and uses them to authenticate every Mittwald API call it makes on the user's behalf.

## Deployment Topology

Both services run as containers in a single mittwald container stack, defined by the Terraform
config in `deploy/` and applied by `.github/workflows/build-and-publish.yml` on every `v*` tag:

| Service | Public hostname | Container port | Image | Built from |
|---------|-----------------|----------------|-------|------------|
| MCP server | `mcp.mittwald.de` | 8080 | `mittwald/mcp-server-http` | repository root `Dockerfile` |
| OAuth bridge | `auth.mcp.mittwald.de` | 3000 | `mittwald/mcp-server-oauth` | `packages/oauth-bridge/Dockerfile` |

A mittwald-managed Redis (`mittwald_redis_database.mcp_redis`) in the same project backs both.
The mittwald ingress terminates TLS, so both containers run with `ENABLE_HTTPS=false`.

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
   - When `ENABLE_DIRECT_BEARER_TOKENS=true`, MCP clients may instead send a Mittwald API token directly. `src/server/direct-token-validator.ts` validates it with a `GET /users/self` call against the Mittwald API, caches the result briefly, and seeds `req.auth.extra` without invoking the OAuth bridge.
6. **Session Persistence** – MCP server stores the Mittwald credentials, scopes, and resource in Redis via `sessionManager`. Subsequent requests reuse the cached tokens; `session-auth` middleware hydrates `req.auth` and `req.user` from Redis.
7. **Tool Execution** – Handlers call `@mittwald-mcp/cli-core` library functions with the Mittwald access token from `req.auth.extra.mittwaldAccessToken`, so every operation runs on behalf of the user. A small number of legacy handlers still shell out to `mw` and inject the same token as `--token`.

## Components

| Component | Role |
|-----------|------|
| **OAuth Bridge (`packages/oauth-bridge`)** | Koa service handling `/authorize`, `/mittwald/callback`, `/token`, client registration lifecycle, `/health` metrics, JWT signing, and Redis-backed state. The bridge authenticates as a public Mittwald PKCE client (no Mittwald client secret) and **must** be reachable at `https://auth.mcp.mittwald.de` so Mittwald’s redirect whitelist continues to match. Dynamic client registration now supports both public clients (`token_endpoint_auth_method=none`) and confidential clients (`client_secret_post` / `client_secret_basic`) by minting bridge-side client secrets. |
| **Mittwald OAuth** | Authoritative IdP (static client `mittwald-mcp-server`). Provides login UI, enforces scopes, and issues access/refresh tokens. |
| **MCP Server (`src/`)** | Validates bridge JWTs, persists sessions in Redis, and drives tool execution via Mittwald tokens. |
| **`@mittwald-mcp/cli-core` (`packages/mittwald-cli-core`)** | Mittwald CLI business logic extracted as an importable library, so tool handlers make API calls in-process instead of spawning `mw`. |
| **Redis** | Session/state cache storing authorization requests (bridge) and user sessions (MCP server). |
| **MCP Clients** | ChatGPT, Claude, Inspector, etc. – consume discovery, execute OAuth 2.1 + PKCE using bridge endpoints. |

## Stateful Data

### Bridge Authorization Store
- Implemented in `packages/oauth-bridge/src/state/`. `BRIDGE_STATE_STORE` selects the backend: `memory` for local development, `redis` in production.
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
- `MITTWALD_AUTHORIZATION_URL`, `MITTWALD_TOKEN_URL`, `MITTWALD_CLIENT_ID` – Mittwald endpoints and static client identifier (public PKCE client; no client secret required). Mittwald's redirect whitelist is immutable, so the bridge callback must stay at `https://auth.mcp.mittwald.de/mittwald/callback`.
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

Reusable utilities enforce these layers consistently:
- `src/utils/credential-generator.ts` – `generateSecurePassword()` / `generateSecureToken()`
- `src/utils/credential-redactor.ts` – `redactCredentialsFromCommand()` / `redactMetadata()`
- `src/utils/credential-response.ts` – `buildSecureToolResponse()` / `buildUpdatedAttributes()`
- `tests/security/credential-leakage.test.ts` – regression suite ensuring redaction + sanitization

### Destructive Operation Safety (REQUIRED)
All tools that perform destructive operations (delete, revoke, terminate, etc.) MUST follow this safety pattern, which prevents accidental data loss and provides audit trails:

1. **Required Confirm Flag**: Schema must include `confirm: boolean` (required) with explicit validation
2. **Audit Logging**: Use `logger.warn()` before execution with sessionId, userId, and resource identifier
3. **Clear Error Messages**: Validation failure must explain the operation is "destructive and cannot be undone"
4. **Tool Annotations**: Set `destructiveHint: true` (see the annotation rules in `CLAUDE.md`)

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

## Security Architecture

### Authentication Flow

```
User → MCP Client → OAuth Bridge → Mittwald ID
                         ↓
                     Redis (sessions, state, tokens)
                         ↓
                     MCP Server → Mittwald API
```

### Security Controls

#### OAuth Security
- **PKCE**: Required for all authorization flows (RFC 7636)
- **State**: Single-use with delete-on-read semantics (prevents replay attacks)
- **Registration Tokens**: DCR endpoints protected by registration_access_token (RFC 7592)
- **Token Storage**: Registration tokens stored as SHA-256 hashes with timing-safe comparison

#### Runtime Security
- **Startup Validation**: Placeholder secrets blocked in production mode
- **CORS**: Wildcard origins blocked in production mode
- **Shell Execution**: `spawn()` with argument arrays and no shell (prevents injection)
- **Non-interactive Mode**: CLI runs with `MITTWALD_NONINTERACTIVE=1` and `CI=1`

#### Infrastructure Security
- **Redis Persistence**: AOF (Append Only File) with 1-second sync interval
- **Memory Policy**: `volatile-lru` - only TTL keys evictable under memory pressure
- **Secret Storage**: Tokens stored as SHA-256 hashes, never plaintext
- **Key TTLs**: Sessions 24h, OAuth state 10min, registration tokens 30 days

### Security Testing

| Layer | Tests | Location |
|-------|-------|----------|
| Unit | Token validation, placeholder detection, shell injection | `tests/unit/`, `packages/oauth-bridge/tests/unit/` |
| Integration | DCR token flow, OAuth state handling | `packages/oauth-bridge/tests/` |
| E2E | Full OAuth flow, MCP tool execution | `tests/e2e/` |

### CI Security Pipeline

- **Dependabot**: Weekly dependency vulnerability scans
- **CodeQL**: SAST analysis on PRs and weekly
- **Secret Scanning**: Prevents accidental credential commits

### Risk Register

See `docs/security/risk-register.md` for the full list of identified, remediated, and accepted risks.

## Session-Aware Context Flag Injection

### Problem Solved

When users set session context (e.g., via `context/set-session`), the system previously injected `--project-id`, `--server-id`, and `--org-id` flags to ALL CLI commands. However, not all commands support these flags:

- **49 tools** support `projectId`
- **1 tool** supports `serverId`
- **1 tool** supports `orgId`
- **110 tools** support no context parameter at all

Commands like `mw app versions`, `mw server list`, and `mw project list` would fail with CLI parameter errors when context was set.

### Solution: Schema-Aware Context Injection

The system now uses a build-time generated map to determine which flags each tool supports:

```
scripts/generate-context-flag-map.ts
         │
         ▼ scans
src/constants/tool/mittwald-cli/**/*-cli.ts (161 tool definitions)
         │
         ▼ generates
src/utils/context-flag-support.ts (161 tools mapped)
         │
         ▼ used by
src/utils/session-aware-cli.ts (injectSessionContext method)
```

### Key Files

| File | Purpose |
|------|---------|
| `scripts/generate-context-flag-map.ts` | Generator script that scans tool schemas |
| `src/utils/context-flag-support.ts` | Generated map: tool name → supported flags |
| `src/utils/session-aware-cli.ts` | Context injection with flag filtering |
| `src/tools/cli-adapter.ts` | Passes `toolName` to session-aware CLI |

### Maintenance

When adding new CLI tools, regenerate the context flag map:

```bash
npm run generate:context-flags
```

This will:
1. Scan all `*-cli.ts` files in `src/constants/tool/mittwald-cli/`
2. Extract `inputSchema.properties` for each tool
3. Check for `projectId`, `serverId`, `orgId` properties
4. Generate an updated `src/utils/context-flag-support.ts`

### How It Works

1. **CLI Adapter** passes `toolName` when calling `sessionAwareCli.executeWithSession()`
2. **Session-Aware CLI** looks up the tool in `CONTEXT_FLAG_SUPPORT` map
3. **Context Injection** only adds flags that the tool schema declares:

```typescript
// Only injects --project-id if tool supports it
if (context.projectId &&
    !this.hasContextParam(args, '--project-id') &&
    (flagSupport?.projectId ?? false)) {
  enhancedArgs.push('--project-id', context.projectId);
}
```

4. **Fail-safe default**: Unknown tools get no flags injected (prevents errors)
