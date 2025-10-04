# OpenAI Connector OAuth Guidance (2025-09-27)

## Fact-Check Summary
- ✅ User-driven authorization, scope minimisation, encrypted token storage, admin controls/RBAC, and Business/Enterprise/Edu data usage statements are confirmed by current OpenAI help articles.
- ⚠️ 2025 MCP updates require additional implementation notes: OAuth 2.1 + PKCE, HTTPS-only endpoints, `.well-known` discovery resources, platform-specific redirect URIs, and token-handling rules.

## Key Takeaways from OpenAI Documentation

- Mittwald treats our bridge as a **public PKCE client**. There is no Mittwald client secret to manage or distribute; all exchanges rely on PKCE and server-to-server credentials only. The bridge now mints **its own** secrets for downstream MCP clients that register as confidential (e.g., Claude Desktop) so we can authenticate those clients without forwarding any Mittwald credentials.

### User-Driven Authorization
- Every end user must authenticate their own account with a connector. Admins can enable or preconfigure connectors, but individual users must complete the OAuth login and grant permissions before accessing the connector.
- Tokens must remain per user; connectors should not share credentials across users.

### Scopes and Permissions
- ChatGPT operates strictly within the scopes granted in OAuth. The documentation enumerates the exact Microsoft Entra ID scopes for Outlook, Teams, SharePoint, etc. Only request what the connector requires.
- ChatGPT receives read-only access wherever possible, honoring the user’s existing permissions in the third-party system.

### Token Handling and Security
- OpenAI stores OAuth tokens using encrypted storage and audited key-management practices. Tokens are never shared across users.
- Chats that use connectors run in restricted network environments with encryption in transit and at rest, and additional defenses against prompt injection.

### Admin Controls and RBAC
- Enterprise/Edu: connectors are disabled by default. Workspace owners/admins enable specific connectors in Settings → Connectors and can gate access by role (RBAC).
- Business: connectors are enabled by default but remain controllable. Admins decide who can use or create connectors, including custom MCP connectors.
- Custom connectors can only be added by admins/owners (or members explicitly granted that permission). Each user still needs to authenticate individually.

### Connector Modes
- Chat and Deep Research connectors fetch live data on demand through OAuth.
- Synced connectors pre-index content. Indexed data lives in OpenAI’s Azure US region and obeys the workspace retention policy.
- Some Google connectors (Gmail, Calendar, Contacts) support automatic usage. Admins can disable the auto flag to require manual selection.

### Compliance and Data Use
- Business, Enterprise, and Edu data from connectors is not used to train OpenAI models. Free/Plus/Pro users may opt in via “Improve the model for everyone.”
- Connector conversations flow into the Compliance API (citations captured for synced connectors; live Chat/Deep Research citations are not yet included).

### Troubleshooting and Operational Notes
- IdP approval (“Admin approval required”) must be granted before OAuth succeeds. Additional domain/IP allowlisting may be necessary.
- Dependencies exist between connectors (e.g., Google Contacts disables if Gmail and Calendar are disabled).

## 2025 MCP OAuth 2.1 Requirements

### OAuth 2.1 + PKCE Baseline
- MCP now mandates OAuth 2.1. Authorization Code with PKCE (`S256`) is required for **all** clients; no legacy grants are accepted.
- Every request must include `code_challenge`/`code_verifier`; refresh tokens (if issued) must follow rotation guidance from OAuth 2.1.
- Endpoints must be served over HTTPS (localhost exceptions allowed only for development).

### Resource-Server Model & Discovery
- MCP servers expose Mittwald as the upstream authorization server and act as resource servers.
- Required discovery endpoints:
  - `/.well-known/oauth-authorization-server` → include standard metadata **plus** an `mcp` block (client_id, redirect URI).
  - `/.well-known/oauth-protected-resource` → advertise resource URI and supported scopes.
- Resource indicator support is optional but must degrade gracefully if omitted by the client.

### Token Delivery Rules
- ChatGPT and the MCP spec require bearer tokens in the `Authorization: Bearer` header only; reject query-string tokens.
- Always return JSON RFC 6750-compliant responses; never leak tokens in redirects.

## Platform-Specific Requirements (ChatGPT vs Claude)

- **Redirect URIs**:
  - ChatGPT: `https://chatgpt.com/connector_platform_oauth_redirect` (and Deep Research variant).
  - Claude: `https://claude.ai/api/mcp/auth_callback` and `https://claude.com/api/mcp/auth_callback`.
- **Bridge configuration**: Set `BRIDGE_REDIRECT_URIS` to include every ChatGPT and Claude callback variant (prod + Deep Research + staging) so `/authorize` validation passes without redeploys.
- **Registration Patterns**: ChatGPT supports Dynamic Client Registration; Claude often expects static client IDs. Support both workflows.
- **Client Authentication**: Claude Desktop requests `token_endpoint_auth_method=client_secret_post`. The bridge must return a `client_secret` during registration and enforce the secret on `/token` to avoid Claude treating the connector as broken.
- **Token Presentation**: Both platforms send the access token via `Authorization` header only; never expect form-encoded secrets.

## Enterprise & IdP Considerations

- Azure AD/Entra ID and other enterprise IdPs may block DCR; pre-registration of client ID + redirect URIs is required.
- Maintain explicit allow lists for each redirect URI variant (ChatGPT, Claude, internal testing URLs).
- TLS termination must preserve HTTPS through the full OAuth loop; misconfigured proxies cause immediate connector failures.

### Enterprise Onboarding Playbook (Azure AD / Entra ID)

1. **Register Mittwald MCP bridge** – Enterprise admin creates an Entra ID app registration that represents the Mittwald OAuth proxy. Use the existing Mittwald static client where possible to avoid new secrets.
2. **Configure redirect URIs** – Add `https://chatgpt.com/connector_platform_oauth_redirect`, `https://chatgpt.com/deep_research_connector_platform_oauth_redirect`, `https://claude.ai/api/mcp/auth_callback`, and `https://claude.com/api/mcp/auth_callback` (plus customer staging URIs if requested). Mirror the list in `BRIDGE_REDIRECT_URIS`.
3. **Grant scopes & admin consent** – Enable the Mittwald API scopes required by the connector and grant tenant-wide admin consent so end users only see the OAuth prompt.
4. **Share metadata with Mittwald** – Provide the enterprise tenant ID, client ID, and redirect URI list to the Mittwald team. Record the app registration details in the customer onboarding runbook alongside expected callback domains and support contacts.

## Known Client Compatibility Issues

- ChatGPT and Claude act as **cookie-less OAuth clients**. Any flow that depends on `_interaction/_session` cookies from `oidc-provider` will loop until the authorization request expires.
- Community reports highlight OAuth proxy quirks (dropped redirects, cached discovery data). A stateless OAuth bridge that stores state keyed by `state` or `code` is the pragmatic workaround.
- Claude and ChatGPT differ in discovery strictness: ChatGPT rejects connectors unless the MCP metadata is present; Claude may still succeed, masking config errors.

## Recommended Next Steps for Our Deployment

### Phase 0 – Preparation
1. **Confirm requirements**: inventory Mittwald OAuth capabilities (discovery metadata, token exchange endpoints, scope catalogue).
2. **Draft architecture diagram**: show ChatGPT/Claude → OAuth bridge → Mittwald AS + MCP resource server interactions.
3. **Choose implementation stack**: decide whether the bridge lives in this repo (Fastify/Koa) or a standalone package (Next.js, FastMCP fork, etc.).

### Phase 1 – Minimal Stateless Bridge
1. **Treat ChatGPT as a stateless OAuth client** – design flows keyed by `state`/`code` with no cookies.
2. **Implement `/authorize`**:
   - Accept standard OAuth 2.1 parameters + PKCE.
   - Persist interaction record (`state`, redirect URI, code challenge, Mittwald login status) in Redis or an in-memory map (later backed by Redis for HA).
   - Redirect the user to Mittwald authorization (our static client) with PKCE data.
3. **Implement Mittwald callback handler**:
   - Exchange authorization code with Mittwald.
   - Store Mittwald tokens temporarily linked to `state`.
   - Redirect back to ChatGPT/Claude using the saved redirect URI and a one-time authorization `code`.
4. **Implement `/token`**:
   - Validate PKCE verifier, look up stored Mittwald tokens by authorization `code`.
   - Mint our MCP JWT embedding Mittwald tokens/scopes; return JSON RFC 6749 tokens.
   - Mark the auth code as used and clean up persisted state.
5. **Add `/register`** supporting DCR for ChatGPT while optionally allowing pre-registered clients for Claude. *(Completed 2025-09-27 – bridge now issues client IDs, access tokens, and MCP metadata without oidc-provider.)*
6. **Emit `.well-known` metadata** with MCP extension fields (client_id, redirect URIs, protected resource metadata).

### Phase 2 – MCP Server Integration
1. **Repoint MCP server** to trust JWTs minted by the bridge (update JWKS/config loaders).
2. **Retain Mittwald token embedding** so downstream CLI invocations keep working.
3. **Remove `oidc-provider`** code paths no longer needed; ensure legacy clients (Inspector) still authenticate through the new bridge.

### Phase 3 – Platform & Enterprise Support
1. **Add platform-specific logic**: handle ChatGPT vs Claude redirect URIs, DCR quirks, and error messages. *(Bridge discovery now advertises the MCP extension block; next iteration should tune per-platform validation errors.)*
2. **Document onboarding flows** for enterprise IdPs (Entra ID) including redirect URIs, scopes, and pre-registration steps; provide scripts/Terraform as needed.
3. **Implement optional token introspection/caching** if Mittwald exposes those endpoints.
4. **Promote Redis-backed state store** – replace the in-memory bridge store with Redis (shared with MCP) so /authorize ↔ /token flows survive multi-instance deployments and restarts; document key layout and TTL strategy. *(Initial implementation landed via `BRIDGE_STATE_STORE=redis`; production rollouts should flip the flag and supply `BRIDGE_REDIS_URL`.)*

### Phase 4 – Testing & Hardening
1. **Automate regression tests** simulating the full flow with cookie persistence disabled (`curl --cookie-jar /dev/null`).
2. **Add integration tests** that validate Mittwald token exchange, JWT issuance, and MCP access.
3. **Introduce monitoring** (logs/metrics) for OAuth error rates and latency.
4. **Pen-test / security review** of the bridge endpoints.

### Phase 5 – Rollout
1. **Stage deployment** on Fly staging apps (mittwald-mcp-fly2 / mittwald-oauth-server staging pair).
2. **Dogfood** with internal ChatGPT and Claude connectors; collect logs for any redirected-loop reoccurrences.
3. **Production rollout** once staging passes acceptance tests.

### Fly.io Deployment Checklist (2025-09-27)

1. **Secrets & Environment Alignment**
   - Bridge: set `BRIDGE_ISSUER`, `BRIDGE_BASE_URL`, `BRIDGE_JWT_SECRET`, `BRIDGE_REDIRECT_URIS`, `MITTWALD_AUTHORIZATION_URL`, `MITTWALD_TOKEN_URL`, `MITTWALD_CLIENT_ID`, `BRIDGE_ACCESS_TOKEN_TTL_SECONDS`, `BRIDGE_REFRESH_TOKEN_TTL_SECONDS`, plus `BRIDGE_STATE_STORE=redis`, `BRIDGE_REDIS_URL`, and optional `BRIDGE_STATE_TTL_SECONDS`.
   - MCP server: set `OAUTH_BRIDGE_JWT_SECRET`, `OAUTH_BRIDGE_ISSUER`, `OAUTH_BRIDGE_BASE_URL`, `OAUTH_BRIDGE_AUTHORIZATION_URL`, `OAUTH_BRIDGE_TOKEN_URL`, and matching Mittwald credentials (`MITTWALD_*`). Decommission `OAUTH_AS_BASE` once traffic shifts to the bridge.

2. **Redis Provisioning**
   - Deploy Fly Redis (or another managed Redis) reachable by both apps.
   - Verify connectivity (`fly ssh console` → `redis-cli`) and confirm TTL policy aligns with `SessionManager` refresh behaviour (`src/server/session-manager.ts`).

3. **Build & Release Pipelines**
   - Update Docker/Fly deploy workflows to build the bridge service with new dependencies (`ioredis`).
   - Ensure both bridge and MCP server images run `npm run build && node dist/server.js` (bridge) / `npm run build && node dist/server.js` (MCP) with latest assets.

4. **Staging Rollout**
   - Deploy bridge to `mittwald-oauth-server` staging app; seed secrets.
   - Deploy MCP server with updated bridge URLs; restart to pick up new configuration.
   - Run `npx vitest run` pipelines and stage smoke tests (Postman / oauth2c) against staging endpoints.

5. **Functional Validation**
   - POST `/register` using ChatGPT redirect URIs—confirm 201 response and stored metadata.
   - Execute `/authorize` → `/mittwald/callback` → `/token` w/ PKCE S256; inspect logs for state lookups, JWT issuance, and Mittwald token exchange.
   - Exercise refresh path: force session expiry (set TTL small) and verify MCP server refreshes tokens automatically through Redis.
   - Fetch `.well-known/oauth-authorization-server` & `/oauth-protected-resource`—confirm MCP block lists redirect URIs & registration endpoint.

6. **Cutover Plan**
   - Update production Fly secrets to match bridging config.
   - Update discovery headers to reference `https://mittwald-oauth-server.fly.dev` (bridge-hosted) so clients see the correct issuer and callback.
   - Monitor `fly logs` (bridge + MCP) for `/register`, `/authorize`, `/token`, and Redis errors; keep rollback plan (switch env vars back) ready until validation completes.

7. **Regression & Client Testing**
   - Re-run ChatGPT HAR capture to ensure cookie loop resolved.
   - Validate Claude & MCP Inspector flows using new endpoints.
   - Execute representative MCP CLI commands to ensure `sessionManager` refresh keeps tokens current.

8. **Post-Deploy Tasks**
   - Archive oauth-server deployment once stable.
   - Document client onboarding steps (Azure AD / Entra ID) with new endpoints and share with Customer Success.
   - Set up monitoring/alerts for bridge latency, 4xx/5xx rates, `/register` volume, and Redis health; review daily during rollout week.

## Updated Implications for Our OAuth Design

1. **Per-user OAuth** – Every user runs the authorization code flow; tokens remain per-user and per-connector.
2. **Scope Hygiene** – Request only the Mittwald scopes needed; document each scope so admins can vet risk.
3. **Secure Storage** – Encrypt tokens, rotate secrets, and audit key usage similar to OpenAI’s practices.
4. **Role-based Controls** – Provide admin settings mirroring OpenAI’s RBAC expectations.
5. **Sync vs Live Strategy** – Declare retention windows and residency for any indexed content; default to live queries when in doubt.
6. **MCP Compatibility** – Keep `.well-known` endpoints compliant and tested; include the MCP metadata block.
7. **Transparent Usage** – Log which Mittwald resources we query and expose documentation for customers.
8. **Stateless ChatGPT Bridge** – Implement and maintain the new OAuth bridge to replace cookie-dependent flows.
9. **Platform Variants** – Handle ChatGPT vs Claude redirect URIs, DCR differences, and error behavior gracefully.
10. **Enterprise Registration Workflow** – Provide step-by-step guidance, scripts, and support for customers who must pre-register our connector.

## Architectural Debate Notes

### Why Not “Pure” Resource-Server Validation Only?

During September 2025 design discussions an alternative proposal argued for removing our OAuth proxy entirely and validating Mittwald-issued tokens directly. We rejected that plan for the following reasons:

- **Mittwald does not onboard third-party clients** – ChatGPT and Claude cannot register redirect URIs or obtain client secrets within Mittwald’s OAuth programme. Our proxy exists precisely to shield Mittwald from dozens of downstream clients.
- **We must embed Mittwald tokens in our MCP JWTs** – The MCP server still needs the Mittwald access/refresh tokens so it can call `mw … --token`. If ChatGPT obtained tokens directly, our server would lose that ability.
- **Spec alignment** – MCP servers *act* as resource servers when protecting `/mcp`, but the specification does not forbid them from also operating an authorization facade. Every production example we surveyed (Auth0 adapters, `chatgpt-deep-research-connector-example`, FastMCP) fronts the upstream IdP with a stateless proxy for this reason.
- **Cookie-less clients remain the core problem** – Direct validation does not solve the fact that ChatGPT drops cookies during `/auth`. We still need a component that tracks state via `state`/`code` rather than relying on browser cookies.

### Bridge Requirements (Stateless by Design)

- The bridge only persists transient state keyed by `state` or authorization `code`; no user session cookies are required.
- It exchanges Mittwald tokens server-side and mints the JWTs our MCP server already understands, preserving existing CLI behaviour.
- If future enterprise requirements mandate deeper integration (token exchange, refresh orchestration) we can evolve the bridge incrementally without reintroducing heavy `oidc-provider` machinery.

## Sources
- OpenAI Help Center: [Connectors in ChatGPT](https://help.openai.com/en/articles/11487775-connectors-in-chatgpt)
- OpenAI Help Center: [Admin Controls, Security, and Compliance in Connectors](https://help.openai.com/en/articles/11509118-admin-controls-security-and-compliance-in-connectors-enterprise-edu-and-team)
- Auth0 Blog: [Integrate Your Auth0 Secured MCP Server in ChatGPT](https://auth0.com/blog/add-remote-mcp-server-chatgpt/)
- GitHub: [chatgpt-deep-research-connector-example](https://github.com/OBannon37/chatgpt-deep-research-connector-example)
- OpenAI Community threads on ChatGPT connector OAuth challenges (Nov 2023 – Sep 2025)

## Remaining Risks
- **Mittwald refresh configuration** – The MCP server depends on `MITTWALD_TOKEN_URL` and `MITTWALD_CLIENT_ID`. Mittwald treats our bridge as a public PKCE client, so no client secret is expected or used during refresh; ensure these two values are present in every environment.
- **Enterprise redirect drift** – Entra ID tenants must keep the ChatGPT and Claude redirect URIs in sync with `BRIDGE_REDIRECT_URIS`. A missing URI produces `redirect_uri mismatch` errors that are difficult for admins to diagnose without the onboarding playbook.
- **Client management lifecycle** – `/register` now supports GET/DELETE with registration access tokens; monitor ChatGPT and Claude for automatic rotation/deletion behaviour and extend coverage if new verbs (PATCH/PUT) are required.

## Bridge Endpoint Reference (2025-09-27 update)
- `/register` now supports **dynamic client registration** (POST) and **management operations** (GET/DELETE `/register/:client_id`).
  - Management operations require the `Authorization: Bearer <registration_access_token>` header that was returned during registration.
  - GET returns the persisted metadata, including the current `registration_access_token` and `registration_client_uri`.
  - DELETE revokes the client; requests with mismatched or missing tokens are rejected with `401 invalid_token`.
- `/health` exposes bridge status with Redis metrics:
  - `stateStore.health` reports Redis connectivity (`PING`) or in-memory readiness.
  - `stateStore.metrics` publishes counts for authorization requests, grants, and registered clients along with the configured TTL.

## Redis Deployment Hardening
1. **Environment variables**
   - Set `BRIDGE_STATE_STORE=redis` and `BRIDGE_REDIS_URL=redis://<user>:<pass>@<host>:<port>` on both staging and production Fly apps.
   - `BRIDGE_STATE_TTL_SECONDS` defaults to `300`; tune per environment if longer-lived `state`/`code` windows are required.
   - Continue exporting `BRIDGE_STATE_PREFIX` when sharing Redis between environments.
2. **Health checks + metrics**
   - `/health` now exercises Redis via `PING`. Fly can use this endpoint for `services.http_checks`.
   - Metrics from `stateStore.metrics` provide a cheap signal for stuck authorizations; alert when counts plateau or creep upward between deploys.
3. **Operational logging**
   - All bridge routes now log validation failures and server errors with contextual fields (`clientId`, `redirectUri`) to simplify dashboard searches.
   - Upstash private endpoints only publish IPv6 AAAA records; set `BRIDGE_REDIS_URL` to the bracket-wrapped IPv6 address (e.g. `redis://user:pass@[fdaa:...]:6379`) or append `family=6` so Node/ioredis resolve correctly inside Fly.

## Fly.io Cutover Checklist
1. Deploy bridge image with `BRIDGE_STATE_STORE=redis` and `BRIDGE_REDIS_URL` configured.
2. Mirror `BRIDGE_JWT_SECRET` & Mittwald client credentials between the bridge and MCP server apps.
3. Run `/health` smoke checks on staging → production; confirm Redis metrics increment during manual auth flows.
4. Migrate secrets from the legacy oidc-provider app (`fly secrets import`) and destroy unused Redis keys (`bridge:*`).
5. Update CI/CD pipelines to deploy the bridge service (replace `oauth-server` workflows) and trigger integration tests post-deploy.
6. After ChatGPT / Claude validation, scale the oidc-provider app to zero and remove it from traffic routers.

## CI/CD Migration Plan (Bridge Cutover)
1. Swap the GitHub Actions Fly deployment matrix to build and deploy `mittwald-oauth-server` (context `packages/oauth-bridge`) instead of the legacy oidc-provider. Keep the MCP server entry so both apps publish on every push to `main`.
2. Point CI smoke tests, Newman collections, and version checks at `https://mittwald-oauth-server.fly.dev`; exercise `/register` (POST/GET/DELETE) rather than `/reg`.
3. Update `packages/mcp-server/fly.toml` and any integration envs so `OAUTH_AS_BASE` / `as_base` refer to the bridge URL, ensuring `WWW-Authenticate` challenges and docs match the new endpoints.
4. Once the bridge deploys cleanly via GitHub Actions, retire any legacy bridge Fly apps so all traffic and automation run exclusively through `mittwald-oauth-server`.

## Immutable Redirect Requirement
- Mittwald’s OAuth client treats `https://mittwald-oauth-server.fly.dev/mittwald/callback` as the canonical redirect URI. The bridge **must** continue to serve this callback hostname.
- Any Fly deployment or DNS change must retain that exact URL (including scheme and path) or the Mittwald authorization endpoint will reject the flow.
- All bridge deploys must run through the GitHub Actions “Deploy to Fly.io” workflow to preserve build provenance and secret management; manual `fly deploy` commands are no longer permitted.

## Bridge Host Migration Plan (Back to `mittwald-oauth-server`)
1. **Recreate Fly App** – provision `mittwald-oauth-server` (Fly) again; this will host the stateless OAuth bridge.
2. **Deploy Bridge Image** – use `packages/oauth-bridge/Dockerfile` and `packages/oauth-bridge/fly.toml`, overriding `app` to `mittwald-oauth-server`. Set secrets (`BRIDGE_*`, `MITTWALD_*`, Redis) so `BRIDGE_BASE_URL=https://mittwald-oauth-server.fly.dev`.
3. **Update CI/CD (Mandatory)** – change `.github/workflows/deploy-fly.yml` so the bridge entry deploys `mittwald-oauth-server` and **require all Fly deploys to run through this GitHub Action** (no manual `fly deploy`). The matrix must continue deploying the MCP server in the same run.
4. **Adjust Config Consumers** – update `tests/postman` env, scripts, docs, and `packages/mcp-server/fly.toml` so every reference points to `mittwald-oauth-server`.
5. **Redeploy & Validate via GitHub Action** – push to `main`, let the pipeline build and ship both MCP and bridge apps; confirm `/health`, `/register`, `/version`, and `/jwks` respond and that the GitHub Action smoke suite passes.
6. **End-to-End Test** – run a full OAuth flow via `https://mittwald-mcp-fly2.fly.dev/mcp`; verify Mittwald redirects to `https://mittwald-oauth-server.fly.dev/mittwald/callback`, that the bridge returns tokens, and the MCP server refreshes them.
7. **Retire Legacy App** – once traffic is confirmed on `mittwald-oauth-server`, destroy or scale down the deprecated bridge staging app to avoid confusion.

## Reference Context
- **ARCHITECTURE.md** – canonical bridge + MCP design, now updated to call out the `mittwald-oauth-server` hostname requirement.
- **LLM_CONTEXT.md** – consolidated reading order for bridge, MCP server, and Redis state.
- **docs/2025-09-27-openai-connector-oauth-guidance.md** (this file) – deployment log, checklist, migration plan, and troubleshooting notes.
- **docs/archive/2025-09-27-chatgpt-oauth-expired-interactions.md** – historical analysis of cookie issues (legacy oidc-provider); useful for regression context.
- **tests/postman/Mittwald-MCP.postman_collection.json** – canonical smoke tests hitting MCP + bridge endpoints.

## Azure AD / Entra ID Onboarding Runbook
1. **Pre-flight**: Ensure tenant admins provision the redirect URIs from `BRIDGE_REDIRECT_URIS` and the MCP metadata endpoints are reachable.
2. **Bridge configuration**: provide tenant-specific `client_id`, scopes, and resource indicators if non-default Mittwald scopes are required.
3. **Dynamic Client Registration**: register the ChatGPT connector through `/register`; retain the `registration_access_token` for later self-service updates.
4. **Validation**: complete the OAuth code + PKCE flow in ChatGPT using the new bridge endpoints; capture `/health` metrics and logs for auditing.
5. **Handover**: document the registration metadata and run `/register/:client_id` GET/DELETE to demonstrate lifecycle operations to tenant admins.

## Testing & Verification Strategy
1. Run `pnpm vitest --filter "OAuth bridge"` to exercise the `/authorize → /token` flow and the new registration management tests.
2. Use the Redis-backed deployment with `BRIDGE_STATE_STORE=redis` and confirm `/health` reflects Redis metrics in staging.
3. For ChatGPT/Claude emulation, use `oauth2c` scripts (see `tests/postman/`) to verify registration rotation and deletion flows.
4. The GitHub Actions post-deploy smoke now performs a confidential-client DCR round-trip and asserts that `/token` returns `invalid_grant` (not `invalid_client`) when a bad code is presented with valid credentials.

## Implementation Log
- 2025-09-27 15:25 UTC — Kick-off: scaffolded `packages/oauth-bridge` (`70abcf7`).
- 2025-09-27 15:46 UTC — Added pluggable state-store abstraction with in-memory default (`12e9e14`).
- 2025-09-27 16:05 UTC — Implemented `/authorize` flow with PKCE validation (`060edb3`).
- 2025-09-27 16:32 UTC — Added Mittwald callback + `/token` exchange (`408d2e1`).
- 2025-09-27 16:58 UTC — Signed bridge JWTs and added Supertest coverage (`b1c162a`).
- 2025-09-27 17:32 UTC — MCP server now verifies bridge JWTs (`3938aff`).
- 2025-09-27 18:05 UTC — Session middleware hydrates Redis-backed auth (`de63a80`).
