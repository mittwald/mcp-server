# OAuth 2.1 + MCP Authentication Debugging Context
*Generated: 2025-09-18*

## 🎯 Top Level Goals

### Primary Objective
Implement **OAuth 2.1 + CLI-centric MCP architecture** for Mittwald MCP Server v2 as outlined in:
- **Main Architecture**: `/CLAUDE.md` - OAuth 2.1 compliant authorization with PKCE (public client)
- **Project Plan**: `/OAUTH_PROJECT_PLAN.md` - CLI-centric approach wrapping `mw` CLI with `--token <access_token>`

### Target Architecture
```
MCP Server:    https://mittwald-mcp-fly2.fly.dev
OAuth Server:  https://mittwald-oauth-server.fly.dev
MCP Endpoint:  https://mittwald-mcp-fly2.fly.dev/mcp
```

**Service Communication Flow:**
1. MCP Client → OAuth Server (OAuth 2.1 flow)
2. OAuth Server → Mittwald Studio (user authentication)
3. Mittwald Studio → OAuth Server (authorization code)
4. OAuth Server → MCP Client (JWT token)
5. MCP Client → MCP Server (JWT authenticated requests)
6. MCP Server → Mittwald API (CLI with `--token`)

## 🧪 Testing Methodology

### Deployment Process
- **GitHub Actions CI/CD**: All deployments via `git push origin main` triggering `.github/workflows/deploy-fly.yml`
- **Fly.io Apps**:
  - `mittwald-oauth-server` (OAuth provider)
  - `mittwald-mcp-fly2` (MCP server with OAuth middleware)
- **No-cache deployments**: Added `--no-cache` flag to prevent Docker layer caching issues

### Testing Clients Used
1. **MCP Jam Inspector** (localhost:6274) - Primary testing client
2. **ChatGPT with MCP OAuth support** - Secondary validation client
3. **Incognito browser sessions** - To avoid state contamination
4. **Multiple fresh client instances** - To rule out client-side issues

### Evidence Collection
- **Fly.io Logs**: Comprehensive monitoring with `fly logs --json --verbose --debug`
- **HAR Files**: Browser network capture for client-side analysis
  - `/Users/robert/Downloads/studio.mittwald.de-*.har` (1-8)
  - `/Users/robert/Downloads/client*.har`
- **Real-time log monitoring**: Multiple concurrent log streams for immediate debugging

## 🔍 Current Status & Findings

### ✅ Confirmed Working Components
1. **OAuth Scope Configuration**: Centralized in `src/config/oauth-scopes.ts`
   - Removed `openid` scope (Mittwald doesn't support OIDC)
   - Using `profile user:read customer:read project:read`
2. **Token Exchange**: Using `client.oauthCallback()` instead of `client.callback()`
   - Bypasses `id_token not present in TokenSet` validation errors
3. **Redirect URI Configuration**:
   - Mittwald correctly configured with `https://mittwald-oauth-server.fly.dev/mittwald/callback`
   - Confirmed deployed by Martin Helmich on 2025-09-11
4. **Authorization Code Generation**: Custom OAuth completion bypassing oidc-provider sessions

### ❌ Current Issue: "Interaction Expired or Already Used"

**Consistent Pattern Observed:**
```
1. Client starts OAuth flow
2. OAuth server stores interaction record
3. User authenticates with Mittwald
4. First callback: Status 302 + "OAuth flow completed successfully" ✅
5. Second callback: Same state, different code + "interaction expired" ❌
6. User sees error from second callback
```

**Evidence from logs:**
- **Multiple successful completions**: "OAuth flow completed successfully" messages
- **Status 302 responses**: Indicating successful redirects
- **Duplicate callbacks**: Mittwald sending 2+ callbacks with same state but different codes
- **Timing**: Both callbacks within seconds, ruling out expiration

## 🧠 Theories & Hypotheses

### Theory 1: Mittwald Duplicate Callbacks ✅ (Most Likely)
**Hypothesis**: Mittwald's OAuth implementation sends multiple callbacks with different authorization codes but same state parameter.

**Evidence**:
- Same state (`c2-tyt2Zj-nS79crMl7FGXGS`) with different codes
- First callback succeeds, subsequent fail
- Consistent across multiple clients (MCP Jam, ChatGPT)

**Status**: CONFIRMED

### Theory 2: Client Redirect Failure ✅ (Secondary Issue)
**Hypothesis**: OAuth server successfully completes but client redirect doesn't work properly.

**Evidence**:
- "Redirecting to client with authorization code" logs
- Clients land back on Mittwald auth screen instead of callback
- Both MCP Jam Inspector and ChatGPT exhibit same behavior

**Status**: LIKELY - Redirect implementation needs verification

### Theory 3: Session Cookie Issues ❌ (Resolved)
**Hypothesis**: oidc-provider session cookies lost during external redirect to Mittwald.

**Evidence**:
- "SessionNotFound" errors in earlier testing
- "interaction session and authentication session mismatch"

**Status**: RESOLVED via custom OAuth completion bypassing oidc-provider

### Theory 4: Docker Caching Issues ❌ (Resolved)
**Hypothesis**: Code changes not taking effect due to Docker layer caching.

**Evidence**:
- OAuth scope changes not appearing in deployed code
- `--no-cache` flag resolved deployment inconsistencies

**Status**: RESOLVED via GitHub Actions with `--no-cache`

### Theory 5: Environment Variable Overrides ❌ (Resolved)
**Hypothesis**: Hardcoded values overridden by Fly.io secrets.

**Evidence**:
- `MITTWALD_SCOPE` secret contained `openid` overriding code changes
- Multiple scope definitions across codebase

**Status**: RESOLVED via centralized scope configuration

## 🔧 Technical Fixes Implemented

### 1. Scope Configuration Centralization
- **Created**: `src/config/oauth-scopes.ts` as single source of truth
- **Removed**: `openid` scope from all locations (incompatible with Mittwald)
- **Centralized**: All scope references use `getSupportedScopes()` and `getDefaultScopeString()`

### 2. Token Exchange Fix
- **Changed**: `client.callback()` → `client.oauthCallback()`
- **Reason**: Skip OpenID Connect `id_token` validation
- **Result**: Eliminated "id_token not present in TokenSet" errors

### 3. Custom OAuth Completion
- **Implementation**: Direct authorization code generation and client redirect
- **Bypass**: oidc-provider session complexity entirely
- **Components**:
  - Generate nanoid authorization code
  - Store token mapping (currently in-memory)
  - Direct redirect to client callback

### 4. Redirect URI Corrections
- **Mittwald Authorization**: `redirect_uri: 'https://mittwald-oauth-server.fly.dev/mittwald/callback'`
- **Client Redirect**: `config.redirectUri` (from client registration)
- **Environment**: `MITTWALD_REDIRECT_URI` secret updated

## 📊 Error Analysis Timeline

### Initial Issue: `id_token not present in TokenSet`
- **Root Cause**: Requesting `openid` scope with Mittwald (non-OIDC provider)
- **Resolution**: Remove `openid` scope entirely

### Session Issues: `SessionNotFound` errors
- **Root Cause**: oidc-provider session cookies lost during external redirect
- **Resolution**: Custom OAuth completion bypassing session system

### Redirect Issues: Landing on `studio.mittwald.de`
- **Root Cause**: Wrong redirect_uri sent to Mittwald
- **Resolution**: Corrected redirect_uri in authorization requests

### Current Issue: `interaction expired or already used`
- **Pattern**: First callback succeeds, second fails
- **Root Cause**: Mittwald duplicate callbacks + interaction record consumption
- **Status**: OAuth working, but redirect to client failing

## 🏗️ Architecture Components

### OAuth Server (`mittwald-oauth-server.fly.dev`)
- **Framework**: oidc-provider v9 with Koa
- **Storage**: In-memory interaction store (Redis planned for production)
- **Security**: PKCE required, signed cookies, HTTPS only
- **Endpoints**:
  - `/auth` - Authorization endpoint
  - `/token` - Token endpoint
  - `/mittwald/callback` - Mittwald OAuth callback
  - `/.well-known/oauth-authorization-server` - Metadata

### MCP Server (`mittwald-mcp-fly2.fly.dev`)
- **Framework**: Express with OAuth middleware
- **Integration**: Wraps `mw` CLI with `--token` parameter
- **Security**: JWT token validation for all MCP requests
- **Endpoints**:
  - `/mcp` - MCP protocol endpoint
  - `/.well-known/oauth-protected-resource` - Resource metadata

## 🚧 Production TODO Items
1. **Implement proper Redis/database storage for authorization codes**
2. **Replace temporary in-memory auth code mapping with production storage**
3. **Add proper auth code expiration and cleanup mechanisms**
4. **Fix client redirect implementation** to ensure successful OAuth completion reaches clients
5. **Handle Mittwald duplicate callbacks gracefully** (ignore subsequent callbacks with consumed state)

## 🎯 Next Steps
1. **Investigate client redirect implementation** - Why "OAuth flow completed successfully" doesn't reach clients
2. **Add duplicate callback handling** - Gracefully handle Mittwald's multiple callbacks
3. **Verify redirect URL generation** - Ensure client callbacks receive proper authorization codes
4. **Implement production storage** - Replace in-memory interaction store with Redis

## 📈 Success Metrics
- ✅ **Token exchange**: Consistently successful with Mittwald
- ✅ **Scope compatibility**: No more `openid`/`id_token` errors
- ✅ **Deployment reliability**: GitHub Actions with `--no-cache`
- ✅ **Redirect URI**: Mittwald correctly configured and deployed
- ❌ **End-to-end flow**: Client redirect completion needs fixing

The OAuth 2.1 infrastructure is functional - remaining work is client integration completion and production hardening.
## 🧪 Full Project Testing Plan

### Objective
- Validate the complete OAuth 2.1 + MCP stack (Express resource server, standalone OAuth server, Redis session storage, and CLI token injection) so regressions such as the duplicate Mittwald callbacks cannot recur.
- Drive confidence through layered automation (unit → integration → end-to-end) plus lightweight Fly.io staging smoke checks before production deploys.

### Testing Foundations
- Add `npm run lint`, `npm run type-check`, and `npm run test:unit` as a fast pre-push/CI gate to catch TypeScript or ESLint drift introduced by OAuth changes.
- Create a shared Vitest config extension that both the root project and `packages/oauth-server` can inherit for reporters, coverage thresholds, and Redis mocking utilities.
- Update `tests/README.md` to describe the OAuth-focused testing workflow instead of the deprecated Reddit tooling narrative, so contributors follow the new plan by default.

### Unit Coverage Targets
- `src/server/oauth-middleware.ts`: Stub `jwt.verify` to ensure 401 challenges surface correct WWW-Authenticate metadata when secrets or scopes are invalid.
- `src/server/session-manager.ts`: Cover TTL refresh, `destroyUserSessions`, corrupted payload cleanup, and concurrent session creation semantics.
- `src/utils/cli-wrapper.ts`: Validate token injection, argument escaping, and redacted error output when `mw` fails or times out.
- `src/utils/session-aware-cli.ts`: Fake Redis results to assert context parameters are injected only once and that access validation short-circuits on missing sessions.
- `src/routes/oauth-metadata-routes.ts`: Confirm authorization/protected resource metadata honor overridden `OAUTH_AS_BASE` and environmental public base URLs.

### Component & Integration Tests
- Use Supertest against `createApp` to cover the `/mcp` handshake: initial 401 with metadata, authenticated call with a valid JWT, and graceful 404 on missing sessions.
- Run Redis-backed integration suites (via `ioredis-mock` or Testcontainers) to validate session persistence, expiry, and cleanup tick behavior under load.
- Mock the `mw` binary with a fixture that records arguments to prove `--token` is always appended; wire it into representative handlers such as `domain/virtualhost-create`.
- Exercise `responseLoggerMiddleware` to guarantee single-send semantics and large-response warnings without crashing inspector clients.

### OAuth Server Validation (`packages/oauth-server`)
- Spin up the Koa provider in-memory to cover discovery metadata, dynamic client registration, JWKS rotation, and Redis adapter fallback paths.
- Simulate Mittwald duplicate callbacks by invoking interaction handlers twice to ensure the custom logic ignores replayed states.
- Add negative PKCE/nonce/state tests using `openid-client` so oidc-provider yields `invalid_grant` instead of leaking stack traces.

### End-to-End Workflow Tests
- Automated harness: launch OAuth server (memory JWKS), MCP server, Mittwald auth stub, and `openid-client` flow to obtain JWT → call `/mcp` → verify CLI invocation uses the issued token.
- Reproduce the “duplicate callback” scenario from this doc by firing two callbacks with the same state and asserting the second returns a no-op/204.
- Implement a refresh-token path: expire a JWT, trigger CLI 401, refresh via Mittwald mock, and confirm the retry succeeds.
- Replay HAR fixtures (`studio.mittwald.de-*.har`, `client*.har`) to assert metadata endpoints and redirects stay compatible with Jam Inspector and ChatGPT flows.

### Regression & Edge-Case Coverage
- Ensure `sendOAuthChallenge` emits production-ready URLs when `MCP_PUBLIC_BASE` is provided, preventing environment misconfigurations.
- Stress-test `MCPHandler` session creation beyond 100 concurrent sessions to verify cleanup warnings without crashes.
- Validate CLI timeout/signal handling so failed commands produce deterministic MCP error surfaces.
- Fault-inject Redis outages to confirm the resource server emits 503s and preserves observability instead of silently failing.

### CI / Automation Pipeline
1. **Stage 1 (fast):** lint, type-check, unit suites across root and OAuth server.
2. **Stage 2 (integration):** docker-compose Redis, run integration suites, archive logs/HAR snapshots on failure.
3. **Stage 3 (nightly/pre-release):** full e2e harness plus Fly.io staging smoke (`mittwald-mcp-fly2`, `--no-cache`) to ensure manifests remain deployable.
- Publish coverage reports and enforce thresholds (≥80% statements for critical OAuth/CLI modules).

### Manual & Exploratory Testing
- Maintain a quick checklist for testing Claude Desktop, Jam Inspector, and ChatGPT MCP clients against staging after major OAuth changes.
- Include `fly logs --json --verbose --debug` in the release checklist to detect duplicate callbacks or redirect anomalies in production.

### Test Data & Fixtures
- Provide a fake `mw` script and JSON fixtures under `tests/helpers` to emulate CLI responses without touching real Mittwald accounts.
- Seed Redis fixtures (valid, expired, and corrupt sessions) for deterministic suite setup.
- Store Mittwald OAuth mock responses and HAR snapshots alongside tests to quickly reproduce historic bugs.
- Parameterize test environment variables via `.env.test` so secrets, issuer URLs, and CLI paths remain consistent across contributors.
