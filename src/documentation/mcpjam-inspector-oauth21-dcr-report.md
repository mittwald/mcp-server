MCPJam Inspector OAuth 2.1 + DCR Integration Report

Summary

- Goal: Describe exactly how MCPJam Inspector performs OAuth 2.1 with Dynamic Client Registration (DCR), and what workflow and endpoints our MCP + external OAuth Authorization Server (AS) must provide for seamless interoperability.
- Outcome: Our server already exposes the two critical well-known endpoints; interoperability mainly depends on correct AS metadata, working DCR, PKCE, resource indicator support, and CORS on browser-facing endpoints.

How MCPJam Inspector Drives The Flow

1) Protected Resource Discovery (optional but preferred)
- Probe: GET {serverUrl}/.well-known/oauth-protected-resource
- Purpose: Find the external Authorization Server(s) and supported scopes; optionally choose a specific `resource` URI.
- Inspector behavior: 
  - Calls `discoverOAuthProtectedResourceMetadata(serverUrl)`.
  - If `authorization_servers` is present, uses the first entry as the AS base.
  - If `scopes_supported` is present, uses it to build the scope string.
  - Tries `selectResourceURL(...)` to choose a resource; non-fatal if not provided.

2) Authorization Server Metadata
- Probe: GET {authServerBase}/.well-known/oauth-authorization-server
- Purpose: Standard RFC 8414 AS metadata for authorization, token, JWKS and DCR endpoints.
- Inspector behavior:
  - Calls `discoverOAuthMetadata(authServerBase)` and expects typical fields:
    - `authorization_endpoint`, `token_endpoint`, `jwks_uri`, `registration_endpoint`
    - `code_challenge_methods_supported` includes `S256`
    - `token_endpoint_auth_methods_supported` includes `none` (for public clients)

3) Dynamic Client Registration (DCR)
- Request: POST to `registration_endpoint` with JSON `client_metadata`:
  - Example Inspector client metadata:
    - `redirect_uris`: ["{origin}/oauth/callback/debug"]
    - `token_endpoint_auth_method`: "none"
    - `grant_types`: ["authorization_code","refresh_token"]
    - `response_types`: ["code"]
    - `client_name`: "MCPJam"
- Inspector behavior:
  - Calls `registerClient(serverUrl, { metadata, clientMetadata })`.
  - On failure, falls back to pre-registered credentials (if provided) or synthesizes a static client for the guided UI. For real auth (“Quick OAuth/Refresh”), DCR or pre-registered credentials are expected to be valid.

4) Authorization Request (PKCE + optional Resource Indicator)
- Build URL: Use `authorization_endpoint` with params:
  - `response_type=code`
  - `client_id` (from DCR or pre-registered)
  - `redirect_uri` (as registered)
  - `scope` (derived from `scopes_supported` if present)
  - `state` (random)
  - `code_challenge` + `code_challenge_method=S256`
  - `resource` (if a specific resource URL is selected via resource metadata)
- Inspector behavior:
  - Calls `startAuthorization(...)`, saves PKCE verifier, shows the authorization URL, and (outside the guided UI) can perform a browser redirect.

5) Redirect With Code
- AS redirects to the registered `redirect_uri` with `code` and `state`.
- Inspector behavior:
  - In guided UI: user pastes the `code` manually.
  - In “Quick OAuth”: uses a real browser redirect and handles the callback to continue.

6) Token Exchange
- Request: POST to `token_endpoint` with JSON/x-www-form-urlencoded:
  - `grant_type=authorization_code`
  - `code`
  - `client_id` (and `client_secret` if applicable; usually none)
  - `redirect_uri`
  - `code_verifier` (PKCE)
- Response: access token (+ optional refresh token). Inspector stores tokens and uses `Authorization: Bearer <access_token>` for MCP calls.

7) Refresh Token (optional)
- Request: POST to `token_endpoint` with `grant_type=refresh_token` and the `refresh_token`.
- Behavior: Inspector `refreshOAuthTokens(...)` calls the SDK which performs the refresh flow if a refresh token exists.

Key Endpoint Expectations (Inspector)

- Resource metadata: `/.well-known/oauth-protected-resource` at the MCP server origin
  - Must be CORS-accessible (browser GET). Should include:
    - `resource`: URL of the protected resource (e.g., {base}/mcp)
    - `authorization_servers`: ["https://<as-host>"]
    - `scopes_supported`: ["openid","profile",...]
    - Optional MCP fields are ignored by OAuth logic but OK to include (e.g., `mcp_version`, `mcp_capabilities`).

- Authorization server metadata: `/.well-known/oauth-authorization-server` at the AS origin
  - Fields Inspector/SKD rely on:
    - `authorization_endpoint`, `token_endpoint`, `jwks_uri`, `registration_endpoint`
    - `code_challenge_methods_supported: ["S256"]`
    - `token_endpoint_auth_methods_supported` includes `"none"`
    - `scopes_supported` (to help populate `scope`)

- Registration endpoint (DCR)
  - Accepts the Inspector’s `client_metadata` above; returns `client_id` (and optionally `client_secret`).
  - Must allow the Inspector’s `redirect_uri` (e.g., `{origin}/oauth/callback/debug` in guided UI; in quick flow `{origin}/oauth/callback`).
  - Must be CORS-enabled (browser POST).

- Authorization endpoint
  - Accepts PKCE S256 and optional `resource` parameter (RFC 8707 Resource Indicators).
  - Redirects back to the exact registered `redirect_uri` with `code` + `state`.

- Token endpoint
  - Supports `authorization_code` + PKCE and `refresh_token` grants.
  - Must be CORS-enabled (browser POST).

How Our Server Maps To These Requirements

- MCP well-known endpoints (already implemented)
  - `GET /.well-known/oauth-protected-resource` → points to external AS and includes scopes.
  - `GET /.well-known/oauth-authorization-server` → convenience endpoint returning AS metadata (we also provide a 302 at `/.well-known/oauth-authorization-server/mcp`).
  - Files: `src/routes/oauth-metadata-routes.ts` and mounting in `src/server.ts`.

- Recommended environment/config
  - `OAUTH_AS_BASE`: Base URL of your external AS (e.g., https://mittwald-oauth-server.fly.dev).
  - `MCP_PUBLIC_BASE` (or `BASE_URL`): Used as the protected `resource` URL in the resource metadata.

- CORS
  - Our MCP server enables CORS globally for GET routes and exposes `WWW-Authenticate` (OK for resource metadata).
  - Ensure your Authorization Server enables CORS for:
    - `/.well-known/oauth-authorization-server` (optional due to Inspector proxy, but recommended)
    - `registration_endpoint` (DCR), `token_endpoint` (token + refresh)

- AS metadata fidelity
  - Include: `authorization_endpoint`, `token_endpoint`, `jwks_uri`, `registration_endpoint`.
  - `code_challenge_methods_supported` includes `S256`.
  - `token_endpoint_auth_methods_supported` includes `none` (public clients).
  - `scopes_supported` matches what you expect clients to request.

- DCR acceptance
  - Accept Inspector’s `client_metadata` and the `redirect_uris` it provides.
  - For guided UI, Inspector uses `{origin}/oauth/callback/debug` as redirect; for quick flows `{origin}/oauth/callback`.
  - Whitelist both if you validate redirect URIs strictly.

- Resource indicator
  - If you advertise a specific `resource` URL in `/.well-known/oauth-protected-resource`, Inspector may pass `resource` to the authorization request. The AS should accept it or ignore gracefully.

End-to-End Workflow That Works With MCPJam Inspector

1. Inspector (guided or quick) fetches `/.well-known/oauth-protected-resource` from our MCP server. Our response contains:
   - `authorization_servers: [OAUTH_AS_BASE]`
   - `scopes_supported: [...]`
   - `resource: {MCP_PUBLIC_BASE}/mcp`

2. Inspector fetches `/.well-known/oauth-authorization-server` from the AS (via its proxy) and reads endpoints + capabilities.

3. Inspector attempts DCR against `registration_endpoint` with public client metadata (auth method `none`) and redirect URI on its origin.

4. Inspector generates the authorization URL (with PKCE S256, optional `resource`) and either displays it (guided) or redirects (quick).

5. AS completes user auth and redirects back with `code` + `state` to the registered Inspector callback.

6. Inspector exchanges the `code` at the AS `token_endpoint` using `code_verifier`, and stores tokens.

7. Inspector sends MCP requests to our `GET/POST /mcp` with `Authorization: Bearer <access_token>`.

Practical Checks / Troubleshooting

- Resource metadata 200 + CORS: Verify `GET /.well-known/oauth-protected-resource` from a browser origin other than the MCP server.
- AS metadata: Ensure the URL in `authorization_servers` resolves and serves RFC 8414 JSON.
- DCR: If 4xx, allow `token_endpoint_auth_method: none` and the Inspector redirect URIs; return `client_id`.
- PKCE: Confirm `code_challenge_methods_supported` contains `S256`.
- Token CORS: Ensure `token_endpoint` accepts browser POST with CORS.
- Resource parameter: If you advertise a `resource`, accept `resource` on the authorization request or remove it from metadata.

References (implementation points in Inspector)

- Guided flow state machine: `client/src/lib/oauth-state-machine.ts`
- OAuth metadata + DCR calls: `@modelcontextprotocol/sdk/client/auth.js` (used by Inspector)
- Debug client provider (redirect URI + storage): `client/src/lib/debug-oauth-provider.ts`
- Browser metadata proxy (avoids CORS on metadata only): `server/routes/mcp/oauth.ts`

Mapping To Our Codebase

- MCP resource metadata: `src/routes/oauth-metadata-routes.ts::handleProtectedResourceMetadata`
- AS metadata passthrough/definition: `src/routes/oauth-metadata-routes.ts::handleAuthorizationServerMetadata`
- Mounting routes: `src/server.ts::setupUtilityRoutes`

Action Items (if needed)

- Ensure the external AS:
  - Exposes accurate RFC 8414 metadata including `registration_endpoint`.
  - Supports DCR for public clients and our chosen redirect URIs.
  - Supports PKCE S256 and (optionally) `resource` parameter.
  - Has CORS enabled for registration and token endpoints.

