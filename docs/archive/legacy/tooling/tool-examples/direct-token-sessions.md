# Direct Bearer Token Sessions

## Summary
- Allow MCP clients that already possess a Mittwald access token to authenticate by sending it directly in the `Authorization: Bearer …` header, skipping the OAuth bridge handshake.
- Validate those tokens on first use by probing the Mittwald CLI (`mw auth status --token`) rather than calling Mittwald’s OAuth introspection endpoint.
- Reuse the existing session infrastructure so downstream CLI invocations still receive `--token <mittwald_access_token>`, while keeping sessions short-lived because we cannot refresh directly supplied tokens.

## Scope
- Applies to HTTP MCP transport only.
- Keeps the existing OAuth bridge flow as default; direct bearer tokens are an additive capability gated behind `ENABLE_DIRECT_BEARER_TOKENS`.
- Out of scope: token introspection endpoint support, upstream API token passthrough beyond the Mittwald CLI, or changes to STDIO transports.

## Research Notes
- **Access token usage:** MCP spec requires clients to send `Authorization: Bearer <token>` on every HTTP request; servers act as OAuth 2.1 resource servers and must validate tokens before responding.[^mcp-access-token-usage]
- **Token validation:** Servers must ensure tokens were issued for the MCP resource and reject invalid/expired tokens with 401 responses.[^mcp-token-handling]
- **Token passthrough risks:** Spec warns against blindly forwarding client tokens to downstream services; controlled passthrough is allowed only with strict validation and audience checks.[^mcp-token-passthrough]
- In practice, LLM clients (Claude Desktop, ChatGPT) store per-server access tokens in `.env` or app config and resend them on every request, so we can rely on the header for each call and avoid long-lived refresh cycles.

## Decisions
1. **CLI-based validation:** When a bearer token fails bridge JWT verification, run `mw auth status --token <value>` (configurable command). Success indicates the token is usable; failure returns `401 invalid_token`. Cache results for ~60 s to avoid repeated CLI calls for the same token burst.
2. **Session lifetime:** Persist validated tokens in Redis with a TTL derived from one of:
   - An `expires_in` value parsed from CLI output (if available), or
   - A configurable default (e.g., 30 minutes) when no expiry hint exists.
   Sessions lack refresh tokens, so expiration forces revalidation using the header on the next request.
3. **Session persistence:** Maintain Redis storage (instead of purely in-memory) so server restarts or concurrent workers share validation state. Each HTTP request still sends the header, so we can recreate the session if a cache miss occurs.
4. **Security hygiene:** Extend existing credential redaction to cover new log paths; ensure metrics differentiate `bridge-jwt` vs `direct-token`. No token data should reach logs or telemetry.
5. **Configuration flags:** Introduce `ENABLE_DIRECT_BEARER_TOKENS`, plus optional `DIRECT_TOKEN_VALIDATION_COMMAND`/`DIRECT_TOKEN_CACHE_TTL_MS` for operational tuning.

## Implementation Plan
### 1. Auth Middleware Enhancements (`src/server/oauth-middleware.ts`)
- Detect bearer tokens that fail bridge verification but match Mittwald token heuristics.
- Call new validator (see §2); on success, populate `req.auth` with claims (user id, scope, expiry) and tag `auth.extra.authenticationMode = 'direct-bearer'`.
- On failure, emit `401 {"error":"invalid_token"}` without `WWW-Authenticate` challenge to avoid confusing direct-token clients.

### 2. Mittwald Token Validator (`src/server/mittwald-token-service.ts`)
- Implement `validateMittwaldTokenViaCli(token: string)` that:
  - Executes configured CLI command with sanitized arguments.
  - Parses stdout for user identity, scopes, and optional expiry.
  - Uses `DEFAULT_CREDENTIAL_PATTERNS` to redact tokens in logs.
- Wrap in `MittwaldTokenValidator` helper providing short-term caching keyed by token hash to minimize CLI calls.

### 3. Session Bootstrapping (`src/server/mcp.ts`, `src/server/session-manager.ts`)
- When middleware flags a direct token, create/persist a session with:
  - `mittwaldAccessToken` set to the raw token.
  - `mittwaldRefreshToken` absent; mark `auth.extra.hasRefreshToken = false`.
  - `expiresAt` derived as in §2.
- Avoid storing an OAuth bridge JWT (`oauthToken` undefined).
- Ensure `SessionManager.ensureSessionFresh` handles sessions without refresh tokens gracefully (already true but add regression tests).

### 4. Request Handling Defaults
- Update `MCPHandler` telemetry to log authentication mode and to skip “missing token” warnings for direct sessions.
- When a request arrives without cached session but with bearer token, rebuild the session on the fly (leveraging §1 + §3) before dispatching to tools.

### 5. CLI Invocation & Logging
- No changes required in `SessionAwareCli`/`executeCli`; verify tests confirm `--token` injection still occurs.
- Extend redaction to cover any new direct-token log messages.

### 6. Configuration & Docs
- Add new env vars to `CONFIG` and documentation (`README.md`, `docs/CREDENTIAL-SECURITY.md`, `docs/container-update-cli.md`) explaining direct token usage, storage considerations, and security guidance.
- Document in `ARCHITECTURE.md` that direct tokens bypass the bridge but still run through the CLI execution stack.

### 7. Testing
- **Unit tests:** Validator command success/failure, middleware branching, session manager TTL.
- **Integration tests:** Simulate MCP request with `Authorization: Bearer mwat_test_token`, assert 200 response and CLI command includes `--token mwat_test_token`.
- **Regression:** Ensure existing OAuth JWT path still operates and continues to refresh tokens as before.

### 8. Operations
- Add observability counters: `auth.direct_bearer.accepted`, `auth.direct_bearer.failed`.
- Update runbooks with instructions for rotating tokens stored in client `.env` files and clearing Redis sessions if leaks suspected.

## Open Items
- Confirm which `mw` subcommand returns sufficient metadata (user id, scopes, expiry). Fallback: accept partial data and set conservative TTL.
- Decide default TTL for tokens without expiry hints (initial proposal: 30 minutes).
- Determine whether to hash tokens before caching (recommended) to avoid storing raw strings in memory.

[^mcp-access-token-usage]: Model Context Protocol — Authorization (2025-06-18), “Access Token Usage”.
[^mcp-token-handling]: Model Context Protocol — Authorization (2025-06-18), “Token Handling”.
[^mcp-token-passthrough]: Model Context Protocol — Security Best Practices (2025-06-18), “Token Passthrough”.
