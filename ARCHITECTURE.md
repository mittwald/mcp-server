# Mittwald MCP Proxy Architecture (2025-09-25)

## Executive Summary

The Mittwald MCP deployment now operates as an OAuth 2.1 proxy. External MCP clients (Claude, ChatGPT, MCP Inspector, etc.) talk to our oidc-provider instance, which in turn authenticates users against Mittwald's static OAuth client (`mittwald-mcp-server`). We no longer curate scopes or present consent screens locally. Mittwald remains the system of record for user approval and scope issuance, while our proxy fulfills OIDC/DCR requirements and embeds the Mittwald tokens into MCP-facing JWTs.

### Key Decisions
- **Mittwald supplies scopes**: Discover `scopes_supported` via OIDC discovery (`MITTWALD_ISSUER`). If discovery is unavailable, operate in passthrough mode: forward client-requested scopes without filtering so Mittwald can accept or reject them. A single optional fallback variable `MITTWALD_SCOPE_FALLBACK` exists only for bootstrap environments.
- **No local consent screen**: Our oidc-provider no longer renders HTML approval pages. After the Mittwald callback succeeds we immediately complete the interaction, creating the grant silently. Users see only Mittwald's login/consent flow.
- **Dynamic client registration stays open**: `/reg` continues to accept new MCP clients without an initial access token. We store the registered metadata and rely on Mittwald to enforce scope validity and redirect URI correctness.
- **Trust model**: When a user grants access in Mittwald Studio they authorize the `mittwald-mcp-server` static client. All downstream MCP clients share that approval through our proxy. Revocation happens in Mittwald Studio, not via our proxy.

## Components

| Component | Role |
|-----------|------|
| **oidc-provider (packages/oauth-server)** | Acts as OAuth AS for MCP clients. Handles DCR, builds Mittwald authorization requests, exchanges Mittwald codes, issues JWTs containing Mittwald tokens. |
| **Mittwald OAuth** | Authoritative IdP. Provides login UI and consent, enforces scopes, and supplies access/refresh tokens. |
| **MCP Server** | Validates JWTs from oidc-provider, extracts Mittwald tokens, and invokes the `mw` CLI with `--token`. Stateless aside from JWKS cache. |
| **Redis (session/state cache)** | Shared, low-latency store for MCP session records and PKCE/OAuth state; accessed by the MCP server and OAuth helper utilities. |
| **SQLite (oauth-server persistence)** | File-backed database (`better-sqlite3`) used by oidc-provider to persist tokens, grants, registrations, and confidential client secrets across restarts. |
| **MCP Clients** | Claude, ChatGPT, MCP Inspector etc. Register dynamically, follow OAuth 2.1 + PKCE, and use the JWTs to call our MCP server. |

## Stateful Services

### Redis session cache (MCP runtime)
- **Where**: Node SDK wrapper in `src/utils/redis-client.ts` encapsulates a singleton `ioredis` client. The MCP handler persists Mittwald access/refresh tokens and per-user context through `sessionManager` (`src/server/session-manager.ts`), while `src/middleware/session-auth.ts` reads the same keys to auth incoming HTTP requests.
- **When**: Entries are written whenever a session is created or refreshed (e.g., JWT handshake in `src/server/mcp.ts`), and read on every MCP request or during PKCE round-trips managed by `src/auth/oauth-state-manager.ts`. TTLs ensure data ages out automatically.
- **Why**: MCP workers must share short-lived state (tokens, context, OAuth `state` values) without coupling to a single process. Redis gives sub-millisecond access with expirations so horizontal scaling stays stateless outside this cache.

### SQLite persistence (oidc-provider)
- **Where**: The oauth-server package selects the SQLite adapter (`packages/oauth-server/src/config/adapters.ts`) which stores rows in `/app/jwks/oauth-sessions.db` via `better-sqlite3`. Client secrets reuse the same file in `packages/oauth-server/src/services/client-secrets.ts`.
- **When**: oidc-provider writes to SQLite during dynamic client registration, authorization code issuance, refresh token grants, grant revocation, and confidential-client secret lifecycle. Reads happen on every token introspection and grant lookup.
- **Why**: The OAuth authority needs durable storage that survives Fly restarts and supports open registration. SQLite provides persistence without introducing another external service, aligning with the deployment mount already used for JWKS.

## OAuth Flow (High Level)

1. **Dynamic Client Registration**: MCP client POSTs `/reg`. We persist the registration unmodified. No scope filtering or redirect URI rewriting. We log the request and warn if discovery metadata was unavailable.
2. **Authorization Request**: Client hits `/auth`. oidc-provider creates an interaction and redirects the user to Mittwald's authorization endpoint. Requested scopes come from the client's request; if absent, we send no `scope` parameter (Mittwald applies its defaults) or the optional fallback string.
3. **Mittwald Login & Consent**: User authenticates and approves scopes in Mittwald Studio. Mittwald redirects back to `/mittwald/callback` with an authorization code.
4. **Token Exchange (Mittwald)**: Our proxy exchanges the Mittwald code for Mittwald access/refresh tokens using the static client credentials. We store the tokens in `userAccountStore` keyed by the Mittwald subject.
5. **Interaction Completion**: We immediately call `provider.interactionFinished` with the authenticated account. No consent UI is shown in our proxy; the existing grant is created or updated to include the scopes Mittwald returned. Until Mittwald authentication succeeds there is no local account, so `loadExistingGrant` must return `undefined` during the initial `/auth` request to let oidc-provider proceed to our `/interaction/:uid` handler.
6. **Token Issuance (Proxy)**: When the MCP client calls `/token`, oidc-provider issues JWT access/refresh tokens. The JWT payload embeds the Mittwald tokens and the exact scope string returned from Mittwald.
7. **MCP Access**: The client presents the JWT to the MCP server. The MCP server verifies the signature, extracts the Mittwald access token, and executes the requested CLI command with `mw ... --token <mittwald_access_token>`.

## Scope Management

- **Discovery-first**: At startup `packages/oauth-server` attempts OIDC discovery against `MITTWALD_ISSUER`. If the metadata includes `scopes_supported` or `default_scope`, we cache those values and expose them through `/openid-configuration`.
- **Passthrough mode**: If discovery fails or the metadata omits scope details, we operate without a local allow-list. DCR requests and authorization prompts retain whatever scope string clients present. Mittwald's token endpoint is authoritative; any invalid scope is rejected during the Mittwald exchange.
- **Fallback**: Optional `MITTWALD_SCOPE_FALLBACK` allows an operations team to specify a bootstrap scope string for environments where Mittwald is unreachable. Once discovery succeeds, the fallback is ignored.
- **Token propagation**: The scope string we embed in issued JWTs comes from `tokenSet.scope` returned by Mittwald. Audit logs reference this value rather than a recomputed list.

## Grant Handling

- **Deferred grant creation**: `loadExistingGrant` must only persist a grant after Mittwald has authenticated the user and oidc-provider has an `accountId` on the session. During the first `/auth` request we return `undefined` so oidc-provider advances to `/interaction/:uid` and redirects the browser to Mittwald.
- **Mittwald-scoped grants**: Once the Mittwald callback completes we build the grant using the stored `mittwaldScope`, ensuring downstream tokens mirror the Mittwald-issued permissions.

## Consent & Trust

- Our proxy is transparent: users experience Mittwald's UI only.
- Grants map Mittwald subjects to MCP clients; revoking access requires removing the Mittwald authorization in Mittwald Studio.
- Because downstream clients rely on the Mittwald grant, onboarding new clients must be communicated to users so they understand the shared-trust model.

## Implementation Checklist

### Completed
- ✅ Document the proxy-first architecture and removal of local scope lists.
- ✅ Define passthrough behavior and fallback environment variables.
- ✅ Document consent short-circuiting and trust implications.

### In Progress / Planned Code Changes
- ✅ Replace `src/config/oauth-scopes.ts` and `packages/oauth-server/src/config/oauth-scopes.ts` with a discovery-based metadata helper.
- ✅ Update `/reg`, `/auth`, and Mittwald authorization builder to stop filtering scopes and reuse the client-provided values.
- ✅ Modify interaction handlers to bypass local consent and immediately call `interactionFinished` after Mittwald success.
- ✅ Ensure JWT issuance captures Mittwald's `scope` string and stores grants accordingly.
- Add automated tests to exercise the scope passthrough and consent short-circuit (forthcoming).

## Documentation Strategy

- **ARCHITECTURE.md** is now the single source of truth.
- Supporting documents (README, audits, client guides) must reference this file and should not reintroduce local scope lists or consent screens.
- Historical analyses that contradict this design should be removed from the repository to avoid confusion.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `MITTWALD_ISSUER` | OIDC discovery URL for Mittwald. Enables automatic scope and endpoint discovery. |
| `MITTWALD_AUTHORIZATION_URL`, `MITTWALD_TOKEN_URL`, `MITTWALD_USERINFO_URL` | Manual endpoints when discovery is unavailable. |
| `MITTWALD_CLIENT_ID` | Mittwald static client ID (`mittwald-mcp-server`). |
| `MITTWALD_REDIRECT_URI` | Callback URI registered with Mittwald for our proxy. |
| `MITTWALD_SCOPE_FALLBACK` | Optional bootstrap scope string when discovery is offline. |
