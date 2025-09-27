# OpenAI Connector OAuth Guidance (2025-09-27)

## Fact-Check Summary
- ✅ User-driven authorization, scope minimisation, encrypted token storage, admin controls/RBAC, and Business/Enterprise/Edu data usage statements are confirmed by current OpenAI help articles.
- ⚠️ 2025 MCP updates require additional implementation notes: OAuth 2.1 + PKCE, HTTPS-only endpoints, `.well-known` discovery resources, platform-specific redirect URIs, and token-handling rules.

## Key Takeaways from OpenAI Documentation

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
- **Registration Patterns**: ChatGPT supports Dynamic Client Registration; Claude often expects static client IDs. Support both workflows.
- **Token Presentation**: Both platforms send the access token via `Authorization` header only; never expect form-encoded secrets.

## Enterprise & IdP Considerations

- Azure AD/Entra ID and other enterprise IdPs may block DCR; pre-registration of client ID + redirect URIs is required.
- Maintain explicit allow lists for each redirect URI variant (ChatGPT, Claude, internal testing URLs).
- TLS termination must preserve HTTPS through the full OAuth loop; misconfigured proxies cause immediate connector failures.

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
5. **Add `/register`** supporting DCR for ChatGPT while optionally allowing pre-registered clients for Claude.
6. **Emit `.well-known` metadata** with MCP extension fields (client_id, redirect URIs, protected resource metadata).

### Phase 2 – MCP Server Integration
1. **Repoint MCP server** to trust JWTs minted by the bridge (update JWKS/config loaders).
2. **Retain Mittwald token embedding** so downstream CLI invocations keep working.
3. **Remove `oidc-provider`** code paths no longer needed; ensure legacy clients (Inspector) still authenticate through the new bridge.

### Phase 3 – Platform & Enterprise Support
1. **Add platform-specific logic**: handle ChatGPT vs Claude redirect URIs, DCR quirks, and error messages.
2. **Document onboarding flows** for enterprise IdPs (Entra ID) including redirect URIs, scopes, and pre-registration steps; provide scripts/Terraform as needed.
3. **Implement optional token introspection/caching** if Mittwald exposes those endpoints.

### Phase 4 – Testing & Hardening
1. **Automate regression tests** simulating the full flow with cookie persistence disabled (`curl --cookie-jar /dev/null`).
2. **Add integration tests** that validate Mittwald token exchange, JWT issuance, and MCP access.
3. **Introduce monitoring** (logs/metrics) for OAuth error rates and latency.
4. **Pen-test / security review** of the bridge endpoints.

### Phase 5 – Rollout
1. **Stage deployment** on Fly staging apps (mittwald-mcp-fly2 / mittwald-oauth-server staging pair).
2. **Dogfood** with internal ChatGPT and Claude connectors; collect logs for any redirected-loop reoccurrences.
3. **Production rollout** once staging passes acceptance tests.

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

## Implementation Log
- 2025-09-27 15:25 UTC — Created feature branch `oauth-bridge-phase1-20250927` and stubbed new `packages/oauth-bridge` service (health route + logging) to kick off Phase 1. Commit: `70abcf7`.
- 2025-09-27 15:34 UTC — Wired environment-driven configuration loader and injected bridge config into the Koa app skeleton. Commit: `e7e3bfe`.
- 2025-09-27 15:46 UTC — Added pluggable state-store abstraction with a default in-memory implementation and injected it into the bridge app context. Commit: `12e9e14`.
- 2025-09-27 16:05 UTC — Implemented `/authorize` endpoint that validates PKCE parameters, persists interaction state, and redirects to Mittwald with an internal state token. Commit: `060edb3`.
- 2025-09-27 16:32 UTC — Added Mittwald callback + `/token` flow: store Mittwald authorization codes, verify PKCE, exchange tokens, and return bridge-issued access tokens. Commit: `408d2e1`.
