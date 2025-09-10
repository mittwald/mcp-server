# OAuth Project Plan (node-oidc-provider Integration)

This plan details step‑by‑step implementation tasks for integrating **node-oidc-provider** as the OAuth Authorization Server (AS) for MCP clients while the MCP server acts as a Resource Server and OAuth Client to Mittwald. This approach leverages a production-ready, OpenID Certified™ OAuth 2.0 server instead of building AS endpoints from scratch.

## Phase 0 – Baseline & Context ✅
- ✅ Confirm CLI‑centric execution is in place (central `--token`):
  - Files: `src/utils/cli-wrapper.ts`, `src/handlers/tool-handlers.ts`, `src/utils/execution-context.ts`
  - Criteria: All CLI calls work without env PATs and redact token in logs.
  - **Git Hash:** `4764511` - Removed remaining MITTWALD_API_TOKEN usage
- ✅ Verify node-oidc-provider compatibility with existing TypeScript toolchain
  - node-oidc-provider v9.5.1 confirmed compatible with Node.js/TypeScript
- ✅ Review MCP client requirements for OAuth 2.1 + DCR support
  - MCP specification supports OAuth 2.1 + DCR flows

## Phase 1 – node-oidc-provider OAuth AS Setup

1) OAuth Server Package Creation ✅
- ✅ Create new `packages/oauth-server/` with node-oidc-provider dependency
- ✅ Configure TypeScript build and Docker container
- Files:
  - ✅ New: `packages/oauth-server/package.json`
  - ✅ New: `packages/oauth-server/Dockerfile`
  - ⏳ New: `packages/oauth-server/src/server.ts`
- **Git Hash:** `0f7a900` - Created oauth-server package structure
- Criteria: node-oidc-provider starts successfully; basic health check endpoint works

2) node-oidc-provider Configuration ✅ RESOLVED
- ✅ Configure PKCE-only flows, DCR support, JWT signing
- ✅ Set up OpenID Connect features with custom claims
- ✅ Resolve runtime compatibility issue
- Files:
  - ✅ New: `packages/oauth-server/src/config/provider.ts`
  - ✅ New: `packages/oauth-server/src/config/adapters.ts`
  - ✅ New: `packages/oauth-server/src/server.ts`
- **Git Hash:** `8c46115` - OAuth server successfully starting with oidc-provider v8.5.0
- **Solution:** Downgraded to oidc-provider v8.5.0, fixed configuration compatibility
- **Status:** Server running on http://localhost:3001, health endpoint functional
- Criteria: ✅ Basic server operational, ⏳ DCR endpoint testing needed, ⏳ JWKS setup needed

3) Fly.io Deployment Setup ✅ COMPLETED
- ✅ Configure fly.toml for auth.mittwald-mcp-fly.fly.dev
- ✅ Set up persistent JWKS storage using Fly volumes
- ✅ Configure environment variables and secrets
- ✅ Deploy OAuth server to production
- Files:
  - ✅ New: `packages/oauth-server/fly.toml`
  - ✅ New: `packages/oauth-server/.env.example`
  - ✅ Updated: `packages/oauth-server/tsconfig.json` (fixed Docker build)
- **Git Hash:** `14ebca9` - OAuth server successfully deployed to Fly.io
- **Status:** Server running on https://mittwald-oauth-server.fly.dev, health endpoint functional
- **Production URL:** https://mittwald-oauth-server.fly.dev/health
- Criteria: ✅ Deployed to Fly.io; ✅ HTTPS endpoints accessible; ✅ JWKS persistence works

4) Mittwald Studio Integration (Production Interactions) — Detailed TODO

Goal: Disable devInteractions in production and serve our own interaction routes that orchestrate Mittwald login/consent and complete the AS flow.

- Interaction routes & lifecycle
  - [ ] GET `/interaction/:uid`
    - [ ] Fetch details via `provider.interactionDetails(req, res)`
    - [ ] If already authenticated in current session, skip to consent step
    - [ ] Otherwise, generate PKCE (code_verifier/challenge), `state`, `nonce` and persist in short‑lived store (Redis)
    - [ ] Redirect user to Mittwald Studio authorize URL with PKCE + correct `redirect_uri`
  - [ ] GET `/mittwald/callback`
    - [ ] Validate returned `state`, lookup and consume PKCE material (one‑time)
    - [ ] Exchange `code` using `openid-client` (public client, PKCE)
    - [ ] Resolve/create AS accountId for the user (e.g., Mittwald user id/email)
    - [ ] Call `provider.interactionFinished(req, res, { login: { accountId } }, { mergeWithLastSubmission: true })`
  - [ ] POST `/interaction/:uid/confirm`
    - [ ] Parse requested scopes/claims from `interactionDetails`
    - [ ] Call `interactionFinished` with consent result
  - [ ] POST `/interaction/:uid/abort`
    - [ ] Call `interactionFinished` with an access_denied error object

- Upstream Mittwald OAuth client
  - [ ] Configure `openid-client` issuer discovery for Mittwald Studio
  - [ ] Public client with PKCE; no client secret
  - [ ] `redirect_uri` endpoint: `/mittwald/callback`
  - [ ] Normalize/user bind: map Mittwald identity → AS `accountId`

- Storage & session state
  - [ ] Use Redis for interaction session: PKCE material, `state`, `nonce`, correlation ids
  - [ ] TTLs: interaction 10–15 minutes, strict one‑time use on consume
  - [ ] Encrypt any at‑rest tokens (Mittwald access/refresh) before persistence

- Cookies & CSRF
  - [ ] Configure `cookies` per env: `secure=true` in prod, SameSite `lax` (or `none` if cross‑site is required)
  - [ ] CSRF token for POST `/confirm` and `/abort`, bound to interaction

- Error handling & UX
  - [ ] Clear JSON errors when `Accept: application/json`, minimal HTML fallback otherwise
  - [ ] Graceful handling for expired/consumed interactions (link back to client)

- Provider configuration (v9)
  - [ ] Keep `pkce.required = () => true`
  - [ ] Consider disabling DPoP unless required
  - [ ] Ensure `provider.proxy = true` (done), app proxy (done)

- Files:
  - New: `packages/oauth-server/src/handlers/interactions.ts`
  - New: `packages/oauth-server/src/handlers/mittwald-auth.ts`
  - New: `packages/oauth-server/src/services/interaction-store.ts` (Redis wrapper)
  - Update: `packages/oauth-server/src/server.ts` (mount interaction routes)
  - Update: `packages/oauth-server/src/config/provider.ts` (features.devInteractions=false in prod)

- Acceptance criteria:
  - [ ] devInteractions disabled in production, flows complete via our routes
  - [ ] Login/consent performed against Mittwald; authorization code issued to MCP clients
  - [ ] One‑time PKCE/state enforcement; replay attempts rejected
  - [ ] End‑to‑end tested with Claude Desktop and Jam Inspector

5) Testing & Validation — Detailed TODO

- Integration tests (oauth-server)
  - [ ] Synthetic client → authorize (PKCE) → interaction → Mittwald mock → token exchange
  - [ ] `/jwks`, discovery metadata shape
  - [ ] Error paths: missing client_id, invalid redirect_uri, unknown client
  - [ ] Security: state/nonce mismatch, PKCE verifier mismatch, replayed code

- Performance & concurrency
  - [ ] Parallel interactions; isolated state; cleanup on completion/expiry

- Files:
  - New: `packages/oauth-server/tests/integration/*.test.ts`

- Criteria:
  - [ ] All OAuth 2.1 + PKCE flows pass integration tests
  - [ ] Replay/state/PKCE negative cases fail safely

## Phase 2 – MCP Resource Server Integration

6) JWT Validation Middleware
- Implement JWT validation against node-oidc-provider JWKS
- Add token caching and signature verification
- Files: 
  - New: `src/middleware/jwt-validation.ts`
  - Update: `src/server/mcp.ts`
- Criteria: Valid tokens from oauth-server accepted; invalid tokens rejected with 401

7) WWW-Authenticate Headers
- Return proper OAuth discovery information on 401 responses
- Point to node-oidc-provider discovery endpoint
- Files: `src/middleware/jwt-validation.ts`
- Criteria: Unauthenticated `/mcp` requests get proper WWW-Authenticate header

8) Mittwald Token Storage & Binding
- Map JWT `sub` claims to server-side Mittwald tokens
- Implement encrypted token storage with Redis
- Files:
  - New: `src/services/token-store.ts`
  - Update: `src/utils/cli-wrapper.ts`
- Criteria: Each valid JWT resolves to a Mittwald token; CLI gets `--token` parameter

8.1) Token lifecycle & refresh — Detailed TODO
- [ ] Implement Mittwald token refresh via `openid-client`
- [ ] Single retry on CLI 401 → refresh → re‑invoke
- [ ] Secure at‑rest encryption and key rotation plan
- [ ] Audit logging: token issued/refresh/invalidated (no secrets logged)

9) Mittwald OAuth Client Integration
- Implement server-side OAuth client to Mittwald Studio
- Handle token refresh and single retry on CLI failures
- Files:
  - New: `src/services/mittwald-oauth-client.ts`
  - Update: `src/utils/cli-wrapper.ts`
- Criteria: Mittwald tokens refreshed automatically; CLI 401s trigger refresh once

## Phase 3 – Integration Testing & Refinement

10) End-to-End Flow Testing
- Test complete DCR → authorize → token → MCP request flow
- Validate multi-user isolation and concurrent access
- Files:
  - New: `tests/integration/oauth-mcp-flow.test.ts`
- Criteria: MCP clients can complete full OAuth flow; multiple users isolated

10.1) Real client validation
- [ ] Validate with Claude Desktop
- [ ] Validate with Jam Inspector
- [ ] Document required redirect URI patterns (incl. custom schemes)

11) Error Handling & Edge Cases
- Test token expiration, refresh failures, invalid clients
- Implement proper error responses per OAuth 2.1 spec
- Files:
  - Update: `src/middleware/jwt-validation.ts`
  - Update: `packages/oauth-server/src/handlers/interactions.ts`
- Criteria: All error conditions handled gracefully; clear error messages

12) Performance Optimization
- Implement JWKS caching and efficient token validation
- Optimize Redis storage patterns
- Files:
  - Update: `src/middleware/jwt-validation.ts`
  - Update: `src/services/token-store.ts`
- Criteria: JWT validation < 50ms; token lookups < 10ms

## Phase 4 – Production Hardening

13) Security Hardening
- Configure node-oidc-provider security policies (rate limiting, CORS)
- Implement Mittwald token encryption and rotation
- Files:
  - Update: `packages/oauth-server/src/config/provider.ts`
  - Update: `src/services/token-store.ts`
- Criteria: DCR rate-limited; tokens encrypted at rest; security headers enforced

13.1) Redirect URI & schemes policy
- [ ] Restrict allowlist patterns to production‑needed hosts/schemes (e.g., `claude://*`, `https://*.claude.ai/*`)
- [ ] Enforce HTTPS for http(s) schemes in prod; allow custom schemes only if explicitly whitelisted

13.2) CORS & client-based policies
- [ ] Implement/verify `clientBasedCORS` if needed for per‑client origin checks
- [ ] Ensure `Vary: Origin` and no accidental wildcard exposure where not intended

13.3) Rate limiting & abuse controls
- [ ] Registration (DCR) rate limit
- [ ] Interaction start, token, and userinfo throttles
- [ ] Basic bot/automation mitigations on interaction screens (honeypot/time‑based)

14) Monitoring & Observability
- Add structured logging for OAuth flows and MCP requests
- Implement metrics for token validation and CLI performance
- Files:
  - New: `src/utils/metrics.ts`
  - Update: `packages/oauth-server/src/middleware/logging.ts`
- Criteria: Full request tracing; performance metrics available; no secrets logged

15) Deployment Automation
- Set up CI/CD for both oauth-server and mcp-server
- Configure Fly.io auto-deployment and health checks
- Files:
  - New: `.github/workflows/deploy-oauth-server.yml`
  - New: `.github/workflows/deploy-mcp-server.yml`
- Criteria: Automated deployments work; health checks prevent bad deployments

## Phase 5 – Documentation & Launch

16) Documentation Updates
- Update architecture documentation with node-oidc-provider details
- Create deployment and configuration guides
- Files:
  - Update: `ARCHITECTURE.md` (✓ completed)
  - Update: `README.md`
  - New: `packages/oauth-server/README.md`
- Criteria: Complete setup instructions; troubleshooting guides; API documentation

17) Production Launch
- Deploy both services to production Fly.io apps
- Configure custom domains and SSL certificates
- Validate production OAuth flows
- Files:
  - Production deployment configs
- Criteria: Services running in production; OAuth flows work; monitoring active

## Appendix – File Reference Map

### OAuth Server (node-oidc-provider)
- Main server: `packages/oauth-server/src/server.ts`
- Configuration: `packages/oauth-server/src/config/provider.ts`
- Mittwald integration: `packages/oauth-server/src/handlers/mittwald-auth.ts`
- User flows: `packages/oauth-server/src/handlers/interactions.ts`
- Storage adapters: `packages/oauth-server/src/config/adapters.ts`
- Interaction state store: `packages/oauth-server/src/services/interaction-store.ts`
- Deployment: `packages/oauth-server/fly.toml`, `packages/oauth-server/Dockerfile`

### MCP Server (Resource Server)
- JWT validation: `src/middleware/jwt-validation.ts`
- Token storage: `src/services/token-store.ts`
- Mittwald client: `src/services/mittwald-oauth-client.ts`
- CLI integration: `src/utils/cli-wrapper.ts`
- MCP endpoints: `src/server/mcp.ts`

### Shared/Common
- Logging: `src/utils/logger.ts`
- Metrics: `src/utils/metrics.ts`
- Types: `shared/types/oauth.ts`, `shared/types/mittwald.ts`

### Status Tracking
- Use TODOs with `// TODO(OAUTH-SERVER)` or `// TODO(MCP-SERVER)` tags
- Remove TODOs upon completion
- Track progress via implementation phases above
