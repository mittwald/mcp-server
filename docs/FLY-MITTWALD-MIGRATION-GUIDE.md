# Fly.io to Mittwald Infrastructure Migration Guide

**Date**: 2025-10-04
**Purpose**: Comprehensive guide for migrating Docker containers from Fly.io to Mittwald infrastructure
**Status**: Pre-Migration Planning

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Fly.io Architecture](#current-flyio-architecture)
3. [Fly.io-Specific Components Inventory](#flyio-specific-components-inventory)
4. [Migration Strategy](#migration-strategy)
5. [Environment Variable Mapping](#environment-variable-mapping)
6. [Infrastructure Requirements](#infrastructure-requirements)
7. [DNS and Domain Migration](#dns-and-domain-migration)
8. [Code Changes Required](#code-changes-required)
9. [CI/CD Pipeline Migration](#cicd-pipeline-migration)
10. [Testing and Validation](#testing-and-validation)
11. [Rollback Plan](#rollback-plan)
12. [Post-Migration Cleanup](#post-migration-cleanup)

---

## Executive Summary

### Current State
- **OAuth Bridge**: Deployed at `mittwald-oauth-server.fly.dev`
- **MCP Server**: Deployed at `mittwald-mcp-fly2.fly.dev`
- **Region**: Frankfurt (fra)
- **Infrastructure**: Fly.io with auto-scaling machines, health checks, TLS termination
- **Registry**: `registry.fly.io`
- **External Dependencies**: Redis (likely Upstash), Mittwald OAuth endpoints

### Migration Goals
1. Move both services to Mittwald container infrastructure
2. Preserve OAuth callback URLs (critical for Mittwald whitelist)
3. Migrate Redis to Mittwald-managed or self-hosted instance
4. Update CI/CD from Fly.io to Mittwald deployment
5. Zero-downtime migration with rollback capability

### Critical Constraints
⚠️ **BREAKING CHANGE RISK**: The OAuth bridge **MUST** remain accessible at `https://mittwald-oauth-server.fly.dev` or an equivalent domain that is whitelisted in Mittwald's OAuth configuration. Changing this URL will break all existing OAuth integrations.

---

## Current Fly.io Architecture

### Service Topology

```
┌─────────────────────────────────────────────────────────────┐
│                     Fly.io Global Network                   │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  OAuth Bridge (mittwald-oauth-server)               │    │
│  │  • Region: fra                                      │    │
│  │  • URL: https://mittwald-oauth-server.fly.dev      │    │
│  │  • Port: 3000 → 443 (TLS termination by Fly)       │    │
│  │  • Health: /health (15s intervals)                  │    │
│  │  • Auto-start/stop machines: enabled                │    │
│  │  • Min machines: 1                                  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  MCP Server (mittwald-mcp-fly2)                     │    │
│  │  • Region: fra                                      │    │
│  │  • URL: https://mittwald-mcp-fly2.fly.dev          │    │
│  │  • Port: 8080 → 443 (TLS termination by Fly)       │    │
│  │  • Health: /health (30s intervals)                  │    │
│  │  • Auto-start/stop machines: enabled                │    │
│  │  • Min machines: 1                                  │    │
│  │  • Concurrency: soft=80, hard=100                   │    │
│  │  • Kill timeout: 30s (graceful shutdown)            │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Redis (State)   │
                    │   • Bridge state  │
                    │   • MCP sessions  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Mittwald OAuth  │
                    │  Authorization   │
                    └──────────────────┘
```

### Resource Specifications

#### OAuth Bridge (`packages/oauth-bridge/fly.toml`)
```toml
app = "mittwald-oauth-server"
primary_region = "fra"

[http_service]
  internal_port = 3000
  force_https = true
  auto_start_machines = true
  auto_stop_machines = false
  min_machines_running = 1

  [[http_service.checks]]
    grace_period = "10s"
    interval = "15s"
    method = "GET"
    timeout = "10s"
    path = "/health"
```

**Environment Variables**:
- `PORT=3000`
- `BRIDGE_BASE_URL=https://mittwald-oauth-server.fly.dev`
- `BRIDGE_ISSUER=https://mittwald-oauth-server.fly.dev`

#### MCP Server (`packages/mcp-server/fly.toml`)
```toml
app = "mittwald-mcp-fly2"
primary_region = "fra"
kill_signal = "SIGINT"
kill_timeout = "30s"

[[vm]]
  memory = "512mb"
  cpu_kind = "shared"
  cpus = 1

[http_service]
  internal_port = 8080
  force_https = true
  auto_start_machines = true
  auto_stop_machines = true
  min_machines_running = 1
  kill_timeout = "30s"

  [[http_service.checks]]
    grace_period = "10s"
    interval = "30s"
    method = "GET"
    path = "/health"
    protocol = "http"
    timeout = "5s"

[services.concurrency]
  soft_limit = 80
  hard_limit = 100
```

**Environment Variables**:
- `NODE_ENV=production`
- `PORT=8080`
- `MCP_PUBLIC_BASE=https://mittwald-mcp-fly2.fly.dev`
- `OAUTH_AS_BASE=https://mittwald-oauth-server.fly.dev`
- `JWT_SIGNING_KEY=production-jwt-key-must-be-set-as-secret`

---

## Fly.io-Specific Components Inventory

### 1. Deployment Configuration Files

| File | Purpose | Migration Action |
|------|---------|------------------|
| `packages/oauth-bridge/fly.toml` | OAuth bridge Fly app config | **REPLACE** with Mittwald container config |
| `packages/mcp-server/fly.toml` | MCP server Fly app config | **REPLACE** with Mittwald container config |
| `packages/mcp-server/fly2.toml` | Alternate MCP config | **ARCHIVE** (unused) |

### 2. CI/CD Workflows

| File | Fly.io Dependencies | Migration Action |
|------|---------------------|------------------|
| `.github/workflows/deploy-fly.yml` | - `flyctl` CLI<br>- `FLY_API_TOKEN` secret<br>- `superfly/flyctl-actions@master`<br>- `registry.fly.io` login<br>- Fly remote builder<br>- `flyctl deploy --strategy immediate`<br>- `flyctl status` health checks<br>- `flyctl logs` diagnostics<br>- `flyctl machine destroy` cleanup | **REPLACE** with Mittwald deployment workflow |
| `.github/workflows/fly-logs.yml` | - `flyctl logs` command<br>- `flyctl status`<br>- `flyctl machines list` | **REPLACE** or **DELETE** (use Mittwald logging) |

### 3. Scripts with Fly.io Integration

| File | Fly.io Usage | Migration Action |
|------|--------------|------------------|
| `scripts/tail-registration-logs.sh` | `fly logs --json` piped to jq for OAuth registration monitoring | **REPLACE** with Mittwald log API or remove if logs accessible via dashboard |

### 4. Source Code with Fly.io Detection

| File:Line | Code | Purpose | Migration Action |
|-----------|------|---------|------------------|
| `src/server.ts:316-317` | `const runningOnFly = !!(process.env.FLY_ALLOC_ID \|\| process.env.FLY_APP_NAME);`<br>`const useHTTPS = (process.env.ENABLE_HTTPS === 'true' \|\| isProduction) && !runningOnFly;` | Detects Fly.io environment to disable internal HTTPS (Fly handles TLS termination at edge) | **UPDATE** to detect Mittwald environment or remove if Mittwald also handles edge TLS |
| `src/server.ts:322` | `if (isProduction && !useHTTPS && !runningOnFly) { ... }` | Security check: requires HTTPS unless on Fly.io | **UPDATE** to include Mittwald detection |

**Environment Variables Referenced**:
- `FLY_ALLOC_ID` - Unique Fly.io allocation ID (runtime)
- `FLY_APP_NAME` - Fly.io app name (runtime)
- `FLY_REGION` - Not currently used but available
- `FLY_PUBLIC_IP`, `FLY_PRIVATE_IP` - Not currently used

### 5. Hardcoded Fly.io URLs

**Critical OAuth URLs** (48 occurrences across codebase):
- `https://mittwald-oauth-server.fly.dev` - OAuth bridge base URL
- `https://mittwald-mcp-fly2.fly.dev` - MCP server base URL
- `registry.fly.io` - Docker registry

**Files Requiring URL Updates**:
1. `.env.example` (lines 57-61)
2. `.github/workflows/deploy-fly.yml` (lines 27, 32, 159-160, 199, 210-211, 226, 234-235)
3. `docs/oauth2c-end-to-end.md` (multiple examples)
4. `docs/oauth-testing-tools.md` (example commands)
5. `docs/CREDENTIAL-SECURITY.md` (line 57, 672)
6. `LLM_CONTEXT.md` (lines 40, 483)
7. `packages/oauth-bridge/.env.example` (lines 13, 16)
8. `packages/oauth-bridge/fly.toml` (lines 12-13)
9. `packages/mcp-server/fly.toml` (lines 17, 19)
10. `scripts/e2e-mcp-oauth.ts` (lines 16, 46)
11. `src/routes/oauth-metadata-routes.ts:171` (fallback value)
12. `src/server.ts:280` (fallback value)
13. `src/server/oauth-middleware.ts:184` (fallback value)
14. `src/middleware/session-auth.ts:138` (fallback value)

### 6. Docker Registry References

| Location | Reference | Migration Action |
|----------|-----------|------------------|
| `.github/workflows/deploy-fly.yml:62` | `docker login registry.fly.io -u x --password-stdin` | **REPLACE** with Mittwald container registry |
| Fly remote builder | Automatic image push to `registry.fly.io/<app>:deployment-<id>` | **REPLACE** with Mittwald registry push |

### 7. Health Check Configuration

| Service | Current Fly.io Config | Mittwald Equivalent |
|---------|----------------------|---------------------|
| **OAuth Bridge** | Grace: 10s, Interval: 15s, Timeout: 10s, Path: `/health` | Configure in Mittwald container health probe |
| **MCP Server** | Grace: 10s, Interval: 30s, Timeout: 5s, Path: `/health` | Configure in Mittwald container health probe |

Both services already implement `/health` endpoints - no code changes needed.

### 8. Auto-Scaling Configuration

| Feature | Fly.io Implementation | Mittwald Equivalent |
|---------|----------------------|---------------------|
| Auto-start machines | `auto_start_machines = true` | TBD: Mittwald auto-scaling config |
| Auto-stop machines | OAuth: `false`, MCP: `true` | TBD: Mittwald idle timeout config |
| Min machines running | `1` | TBD: Mittwald min replicas |
| Concurrency limits | MCP: soft=80, hard=100 | TBD: Mittwald request limits |
| Graceful shutdown | `kill_timeout = "30s"` | Already implemented in code (`src/index.ts:gracefulShutdown`, `src/server.ts:markServerShuttingDown`) |

### 9. Release Commands (Deployment Safety)

Both `fly.toml` files include:
```toml
[deploy]
  release_command = "sh -lc 'if [ \"${ALLOW_FLY_RELEASE:-}\" != \"true\" ]; then echo Deployment blocked: use GitHub Actions >&2; exit 1; fi'"
```

**Purpose**: Prevents manual `flyctl deploy` commands; enforces GitHub Actions workflow.

**Migration**: Remove this check or replace with Mittwald-specific deployment gate.

---

## Migration Strategy

### Phase 1: Pre-Migration Preparation (Week 1)

#### 1.1 Infrastructure Provisioning on Mittwald
- [ ] Provision 2 container instances (OAuth Bridge, MCP Server)
- [ ] Provision Redis instance or migrate to Mittwald-managed Redis
- [ ] Configure networking: internal communication between containers + Redis
- [ ] Obtain SSL/TLS certificates for custom domains (if not using Mittwald-managed)
- [ ] Set up container registry credentials
- [ ] Configure log aggregation/monitoring

#### 1.2 Domain and DNS Planning
- [ ] **Option A**: Keep existing `.fly.dev` domains via CNAME (if supported)
- [ ] **Option B**: Migrate to Mittwald domains (e.g., `mittwald-oauth-server.mittwald.cloud`)
- [ ] **Option C**: Use custom domains (requires DNS changes + Mittwald whitelist update)

**Critical**: Coordinate with Mittwald OAuth team to update redirect whitelist **before** changing domains.

#### 1.3 Secret Management
- [ ] Rotate all secrets for production (never reuse dev/test secrets):
  - `JWT_SIGNING_KEY` (generate: `openssl rand -base64 32`)
  - `OAUTH_BRIDGE_JWT_SECRET` (generate: `openssl rand -hex 32`)
  - `REDIS_URL` (new Mittwald Redis credentials)
- [ ] Document secret injection method (Mittwald Secrets Manager, env vars, etc.)
- [ ] Update `.env.example` with Mittwald-specific instructions

#### 1.4 Redis Migration
- [ ] Export current Fly.io Redis data (if preserving sessions)
- [ ] Test Redis connectivity from Mittwald containers
- [ ] Update `REDIS_URL` format if different from `redis://host:6379`
- [ ] Verify Redis performance (latency < 5ms for session lookups)

### Phase 2: Code Updates (Week 1-2)

#### 2.1 Environment Detection Logic
**File**: `src/server.ts`

**Current Code** (lines 314-322):
```typescript
const isProduction = process.env.NODE_ENV === 'production';
// On Fly.io or when behind a proxy, TLS terminates at the edge; always serve HTTP internally.
const runningOnFly = !!(process.env.FLY_ALLOC_ID || process.env.FLY_APP_NAME);
const useHTTPS = (process.env.ENABLE_HTTPS === 'true' || isProduction) && !runningOnFly;

// SECURITY: HTTPS is mandatory in production for OAuth
if (isProduction && !useHTTPS && !runningOnFly) {
  console.error('🚨 SECURITY ERROR: HTTPS is mandatory in production environments for OAuth security');
  console.error('🚨 Set ENABLE_HTTPS=true and provide SSL certificates');
  process.exit(1);
}
```

**Updated Code**:
```typescript
const isProduction = process.env.NODE_ENV === 'production';

// Detect if running behind a proxy that handles TLS termination
// (Fly.io, Mittwald, Kubernetes ingress, etc.)
const runningBehindProxy = !!(
  process.env.FLY_ALLOC_ID ||
  process.env.FLY_APP_NAME ||
  process.env.MITTWALD_CONTAINER_ID ||
  process.env.KUBERNETES_SERVICE_HOST
);

const useHTTPS = (process.env.ENABLE_HTTPS === 'true' || isProduction) && !runningBehindProxy;

// SECURITY: HTTPS is mandatory in production for OAuth
if (isProduction && !useHTTPS && !runningBehindProxy) {
  console.error('🚨 SECURITY ERROR: HTTPS is mandatory in production environments for OAuth security');
  console.error('🚨 Set ENABLE_HTTPS=true and provide SSL certificates, or deploy behind a TLS-terminating proxy');
  process.exit(1);
}
```

**Environment Variable to Add**:
- `MITTWALD_CONTAINER_ID` - Set by Mittwald runtime (TBD: confirm actual variable name)

#### 2.2 Fallback URL Updates
**Files to Update**:

1. `src/routes/oauth-metadata-routes.ts:171`
```typescript
// Before
|| 'https://mittwald-oauth-server.fly.dev';

// After
|| process.env.DEFAULT_OAUTH_SERVER_URL
|| 'https://mittwald-oauth-server.fly.dev'; // Keep as final fallback during transition
```

2. `src/server.ts:280`
3. `src/server/oauth-middleware.ts:184`
4. `src/middleware/session-auth.ts:138`

**Rationale**: Add `DEFAULT_OAUTH_SERVER_URL` env var for easier migration, keep Fly.io URL as final fallback.

#### 2.3 Documentation Updates
- [ ] Update all hardcoded Fly.io URLs in `/docs/*.md` to use variables or placeholders
- [ ] Add Mittwald deployment section to `ARCHITECTURE.md`
- [ ] Update `README.md` deployment instructions
- [ ] Revise `.env.example` with Mittwald-specific examples

#### 2.4 Docker Configuration
**No changes required** - Dockerfiles are platform-agnostic:
- `Dockerfile` (MCP Server)
- `packages/oauth-bridge/Dockerfile`
- `stdio.Dockerfile`
- `openapi.Dockerfile`

All use non-root `nodejs` user (UID 1001) - compatible with Mittwald.

### Phase 3: CI/CD Migration (Week 2)

#### 3.1 Create New Deployment Workflow
**File**: `.github/workflows/deploy-mittwald.yml`

**Key Changes from `deploy-fly.yml`**:
1. Replace `flyctl` with Mittwald deployment CLI/API
2. Replace `FLY_API_TOKEN` with `MITTWALD_API_TOKEN`
3. Replace Docker registry login:
   ```yaml
   # Before
   - name: Docker login to Fly registry
     run: echo "$FLY_API_TOKEN" | docker login registry.fly.io -u x --password-stdin

   # After
   - name: Docker login to Mittwald registry
     run: echo "$MITTWALD_REGISTRY_PASSWORD" | docker login <mittwald-registry-url> -u $MITTWALD_REGISTRY_USER --password-stdin
   ```
4. Replace deployment commands:
   ```yaml
   # Before
   - name: Deploy from source (remote builder)
     run: |
       flyctl deploy --config "${{ matrix.fly_config }}" --strategy immediate --detach --verbose \
         --env ALLOW_FLY_RELEASE=true

   # After
   - name: Deploy to Mittwald
     run: |
       # TBD: Mittwald-specific deployment command
       mittwald-deploy --app ${{ matrix.app }} --image ${{ env.IMAGE_TAG }} --config ${{ matrix.mittwald_config }}
   ```
5. Update health check verification:
   ```yaml
   # Replace fly.dev hostnames with Mittwald hostnames
   for host in mittwald-oauth-server.<mittwald-domain> mittwald-mcp.<mittwald-domain>; do
   ```
6. Update smoke tests:
   ```yaml
   env:
     OAUTH_SERVER_URL: https://mittwald-oauth-server.<mittwald-domain>
     MCP_SERVER_URL: https://mittwald-mcp.<mittwald-domain>
   ```

#### 3.2 Secrets Configuration
**GitHub Repository Secrets to Add**:
- `MITTWALD_API_TOKEN` - API token for Mittwald deployments
- `MITTWALD_REGISTRY_USER` - Container registry username
- `MITTWALD_REGISTRY_PASSWORD` - Container registry password
- `MITTWALD_OAUTH_JWT_SECRET` - JWT signing secret (production)
- `MITTWALD_REDIS_URL` - Redis connection string (production)

**Secrets to Archive**:
- `FLY_API_TOKEN` - Keep for rollback period, then delete

#### 3.3 Parallel Deployment Strategy
**Recommended Approach**: Deploy to both Fly.io and Mittwald simultaneously during transition.

```yaml
strategy:
  matrix:
    include:
      # Fly.io deployments (existing)
      - platform: fly
        app: mittwald-oauth-server
        config: packages/oauth-bridge/fly.toml
        hostname: mittwald-oauth-server.fly.dev

      # Mittwald deployments (new)
      - platform: mittwald
        app: mittwald-oauth-server-mw
        config: packages/oauth-bridge/mittwald.toml
        hostname: mittwald-oauth-server.<mittwald-domain>
```

**Transition Period**: Run dual deployments for 1-2 weeks before deprecating Fly.io.

### Phase 4: Migration Execution (Week 3)

#### 4.1 Blue-Green Deployment Steps

**Day 1: Mittwald Deployment**
1. Deploy OAuth Bridge to Mittwald (new domain)
2. Deploy MCP Server to Mittwald (new domain)
3. Verify health checks pass
4. Run smoke tests against Mittwald endpoints
5. Test OAuth flow end-to-end with test client

**Day 2-3: DNS Preparation**
6. Add DNS records for new domains (if using custom)
7. Configure SSL certificates
8. Test connectivity from external clients
9. Monitor logs for errors

**Day 4-5: Mittwald Whitelist Update**
10. **CRITICAL**: Submit request to Mittwald OAuth team to add new callback URLs:
    - `https://mittwald-oauth-server.<mittwald-domain>/mittwald/callback`
11. Wait for whitelist approval (may take 1-2 business days)
12. Test OAuth flow with real Mittwald OAuth endpoints

**Day 6-7: Traffic Cutover**
13. Update client integrations (ChatGPT, Claude, etc.) to use new URLs
14. Monitor error rates, response times, session creation
15. Verify Redis session persistence
16. Test token refresh flows

#### 4.2 Monitoring During Migration
**Key Metrics to Track**:
- HTTP 5xx error rate (target: < 0.1%)
- OAuth authorization success rate (target: > 99%)
- Token exchange latency (target: < 500ms p95)
- Redis connection failures (target: 0)
- Container restart count (target: 0 unexpected restarts)
- Memory usage (baseline: 512MB, alert: > 400MB sustained)
- CPU usage (alert: > 80% sustained)

**Logging**:
- Enable DEBUG logging for first 24 hours
- Monitor for authentication failures
- Track session creation/destruction rate
- Watch for Redis connection pool exhaustion

### Phase 5: Validation (Week 3-4)

#### 5.1 Automated Testing
```bash
# Run full test suite against Mittwald deployment
npm run test:e2e -- \
  --env OAUTH_SERVER_URL=https://mittwald-oauth-server.<mittwald-domain> \
  --env MCP_SERVER_URL=https://mittwald-mcp.<mittwald-domain>

# Run OAuth smoke tests
npm run test:smoke

# Run Postman collection
newman run tests/postman/Mittwald-MCP.postman_collection.json \
  -e tests/postman/Mittwald-MCP.postman_environment.json \
  --env-var mcp_base=https://mittwald-mcp.<mittwald-domain> \
  --env-var as_base=https://mittwald-oauth-server.<mittwald-domain>
```

#### 5.2 Manual Verification Checklist
- [ ] OAuth discovery endpoint returns correct metadata
- [ ] Dynamic client registration works
- [ ] Authorization flow completes successfully
- [ ] Token exchange returns valid JWT
- [ ] MCP initialize request succeeds
- [ ] MCP tools list returns all handlers
- [ ] Tool execution works (test 5 different tools)
- [ ] Session persistence across requests
- [ ] Token refresh works
- [ ] Graceful shutdown (send SIGTERM, verify 30s timeout)
- [ ] Health endpoint returns 200
- [ ] Version endpoint returns correct git SHA

#### 5.3 Load Testing
```bash
# Test concurrent OAuth flows (50 users, 5 min)
artillery run tests/load/oauth-flow.yml \
  --target https://mittwald-oauth-server.<mittwald-domain>

# Test MCP tool execution (100 rps, 10 min)
artillery run tests/load/mcp-tools.yml \
  --target https://mittwald-mcp.<mittwald-domain>
```

**Expected Performance**:
- OAuth authorization: < 2s p95
- Token exchange: < 500ms p95
- MCP tool execution: < 3s p95 (depends on Mittwald API)
- Health check: < 100ms p95

---

## Environment Variable Mapping

### OAuth Bridge Environment Variables

| Variable | Fly.io Value | Mittwald Value | Notes |
|----------|--------------|----------------|-------|
| `PORT` | `3000` | `3000` or Mittwald default | Internal port |
| `NODE_ENV` | `production` | `production` | No change |
| `BRIDGE_BASE_URL` | `https://mittwald-oauth-server.fly.dev` | `https://mittwald-oauth-server.<mittwald-domain>` | **CRITICAL**: Must match Mittwald whitelist |
| `BRIDGE_ISSUER` | `https://mittwald-oauth-server.fly.dev` | `https://mittwald-oauth-server.<mittwald-domain>` | JWT issuer claim |
| `BRIDGE_JWT_SECRET` | Fly secret | New secret (rotate) | Generate: `openssl rand -hex 32` |
| `BRIDGE_REDIS_URL` or `REDIS_URL` | Fly Redis or Upstash | Mittwald Redis | Format: `redis://host:6379` or `rediss://` for TLS |
| `MITTWALD_AUTHORIZATION_URL` | `https://studio.mittwald.de/api/oauth/authorize` | Same | No change |
| `MITTWALD_TOKEN_URL` | `https://studio.mittwald.de/api/oauth/token` | Same | No change |
| `MITTWALD_CLIENT_ID` | Existing value | Same | Public PKCE client |

### MCP Server Environment Variables

| Variable | Fly.io Value | Mittwald Value | Notes |
|----------|--------------|----------------|-------|
| `PORT` | `8080` | `8080` or Mittwald default | Internal port |
| `NODE_ENV` | `production` | `production` | No change |
| `MCP_PUBLIC_BASE` | `https://mittwald-mcp-fly2.fly.dev` | `https://mittwald-mcp.<mittwald-domain>` | Public MCP endpoint |
| `OAUTH_AS_BASE` | `https://mittwald-oauth-server.fly.dev` | `https://mittwald-oauth-server.<mittwald-domain>` | Points to OAuth bridge |
| `JWT_SIGNING_KEY` | Fly secret | New secret (rotate) | Generate: `openssl rand -base64 32` |
| `OAUTH_BRIDGE_JWT_SECRET` | Same as `BRIDGE_JWT_SECRET` | Same as `BRIDGE_JWT_SECRET` | **MUST MATCH** bridge secret |
| `OAUTH_BRIDGE_ISSUER` | `https://mittwald-oauth-server.fly.dev` | `https://mittwald-oauth-server.<mittwald-domain>` | Expected JWT issuer |
| `OAUTH_BRIDGE_BASE_URL` | `https://mittwald-oauth-server.fly.dev` | `https://mittwald-oauth-server.<mittwald-domain>` | Bridge base URL |
| `REDIS_URL` | Fly Redis or Upstash | Mittwald Redis | Session storage |
| `ENABLE_HTTPS` | `true` or omitted | `false` or omitted | Set `false` if Mittwald handles TLS |
| `MITTWALD_CONTAINER_ID` | N/A | Auto-set by Mittwald | Detect Mittwald environment |

### New Environment Variables to Add

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| `DEFAULT_OAUTH_SERVER_URL` | Fallback OAuth server during migration | `https://mittwald-oauth-server.<mittwald-domain>` |
| `PLATFORM` | Explicit platform detection | `mittwald` or `fly` |
| `CONTAINER_REGISTRY` | Override default registry | `registry.mittwald.cloud/my-org` |

---

## Infrastructure Requirements

### Mittwald Container Specifications

#### OAuth Bridge Container
**Minimum Requirements**:
- **CPU**: 0.5 vCPU (shared)
- **Memory**: 256 MB
- **Storage**: 1 GB (ephemeral, container image only)
- **Network**: Internal + external (HTTPS ingress)
- **Health Check**: HTTP GET `/health` every 15s
- **Restart Policy**: Always
- **Replicas**: 1 (can scale to 2+ for HA)

**Recommended Production**:
- **CPU**: 1 vCPU (dedicated)
- **Memory**: 512 MB
- **Replicas**: 2 (multi-zone for HA)

#### MCP Server Container
**Minimum Requirements**:
- **CPU**: 0.5 vCPU (shared)
- **Memory**: 512 MB (matches Fly.io `fly.toml`)
- **Storage**: 2 GB (container image + temp files)
- **Network**: Internal + external (HTTPS ingress)
- **Health Check**: HTTP GET `/health` every 30s
- **Restart Policy**: Always
- **Replicas**: 1

**Recommended Production**:
- **CPU**: 1 vCPU (dedicated)
- **Memory**: 1 GB (headroom for spikes)
- **Replicas**: 2-3 (handle concurrent MCP sessions)

### Redis Requirements

**Current Usage**:
- **OAuth Bridge State**: Authorization requests (TTL: 10 min), client registrations
- **MCP Sessions**: User sessions (TTL: 8 hours), Mittwald tokens

**Specifications**:
- **Memory**: 512 MB minimum (1 GB recommended)
- **Persistence**: RDB snapshots every 5 minutes + AOF (fsync every second)
- **Eviction**: `volatile-ttl` (only expire TTL'd keys)
- **Max Connections**: 100 (2 containers × ~10 connections each + buffer)
- **Latency SLA**: < 5ms p95 (critical for session lookups)
- **Availability**: HA setup with replica (optional but recommended)

**Migration Options**:
1. **Mittwald Managed Redis**: Preferred (if available)
2. **Self-Hosted Redis Container**: On Mittwald infrastructure
3. **External Redis**: Upstash, AWS ElastiCache (adds latency)

### Networking Requirements

```
┌─────────────────────────────────────────────────────┐
│           Mittwald Infrastructure                   │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  Ingress / Load Balancer (TLS Termination)   │  │
│  │  • HTTPS → HTTP                               │  │
│  │  • Health checks                              │  │
│  └───────────────┬──────────────────────────────┘  │
│                  │                                   │
│       ┌──────────┴────────────┐                     │
│       │                       │                     │
│  ┌────▼─────────┐       ┌────▼─────────┐           │
│  │ OAuth Bridge │       │  MCP Server  │           │
│  │    :3000     │◀─────▶│    :8080     │           │
│  └──────┬───────┘       └──────┬───────┘           │
│         │                      │                    │
│         └──────────┬───────────┘                    │
│                    │                                │
│              ┌─────▼──────┐                         │
│              │   Redis    │                         │
│              │   :6379    │                         │
│              └────────────┘                         │
│                                                      │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
          ┌───────────────────────┐
          │   Mittwald OAuth API  │
          │  studio.mittwald.de   │
          └───────────────────────┘
```

**Firewall Rules**:
- **Ingress**:
  - OAuth Bridge: 443 (HTTPS) from internet
  - MCP Server: 443 (HTTPS) from internet
  - Both: Allow health checks from Mittwald monitoring
- **Egress**:
  - OAuth Bridge: 443 to `studio.mittwald.de` (token exchange)
  - MCP Server: 443 to `api.mittwald.de` (CLI operations)
  - Both: 6379 to Redis (internal)
- **Internal**:
  - MCP Server → OAuth Bridge: Not required (clients call bridge directly)
  - Both → Redis: 6379 (unencrypted or 6380 TLS)

### DNS Configuration

#### Option A: Keep Fly.io Domains (CNAME Approach)
**If Fly.io supports CNAME to external targets**:
```
mittwald-oauth-server.fly.dev  CNAME  oauth-bridge.mittwald-infra.example.com
mittwald-mcp-fly2.fly.dev      CNAME  mcp-server.mittwald-infra.example.com
```

**Pros**:
- No Mittwald whitelist update needed
- Minimal client integration changes
- Gradual rollback possible

**Cons**:
- Fly.io may not support external CNAMEs
- Adds DNS lookup latency
- Dependency on Fly.io DNS

#### Option B: Migrate to Mittwald Domains
**New DNS Records**:
```
mittwald-oauth-server.mittwald.cloud   A      <mittwald-ingress-ip>
mittwald-mcp.mittwald.cloud             A      <mittwald-ingress-ip>
```

**Pros**:
- Full control over DNS
- No Fly.io dependency
- Simpler architecture

**Cons**:
- **REQUIRES** Mittwald whitelist update
- **REQUIRES** updating all client integrations
- Breaking change for existing users

#### Option C: Custom Domains
**If using custom domain (e.g., `mcp.example.com`)**:
```
oauth.mcp.example.com   A      <mittwald-ingress-ip>
api.mcp.example.com     A      <mittwald-ingress-ip>
```

**Pros**:
- Professional branding
- Full DNS control

**Cons**:
- SSL certificate management
- Mittwald whitelist update required
- Custom domain setup on Mittwald

**Recommendation**: Start with **Option B** (Mittwald domains) and request whitelist update early in migration process.

---

## DNS and Domain Migration

### Critical OAuth Callback URL
⚠️ **BREAKING CHANGE RISK**: The OAuth bridge callback URL is whitelisted by Mittwald OAuth.

**Current Whitelisted URL**:
```
https://mittwald-oauth-server.fly.dev/mittwald/callback
```

**If Changing Domain**:
1. Identify new callback URL (e.g., `https://oauth.mcp.example.com/mittwald/callback`)
2. Submit whitelist request to Mittwald OAuth team **at least 2 weeks before migration**
3. Wait for confirmation of whitelist update
4. Test OAuth flow with new URL in staging
5. Only then proceed with production cutover

**Whitelist Update Process** (TBD by Mittwald):
- Contact: TBD (Mittwald OAuth team email/ticket system)
- Required Info:
  - Current callback URL
  - New callback URL
  - Reason for change (migration to Mittwald infrastructure)
  - Requested effective date
  - Rollback plan
- SLA: TBD (estimated 3-5 business days)

### SSL Certificate Management

**Fly.io Current**:
- Automatic SSL via Let's Encrypt
- Wildcard certificates for `*.fly.dev`
- Auto-renewal

**Mittwald Options**:
1. **Mittwald-Managed SSL**: If using Mittwald domains (`.mittwald.cloud`), likely auto-provisioned
2. **Let's Encrypt Integration**: If Mittwald supports ACME, configure auto-renewal
3. **Manual Certificate Upload**: Upload custom SSL cert (requires renewal management)

**Certificate Requirements**:
- **OAuth Bridge**: Must match `BRIDGE_BASE_URL` hostname
- **MCP Server**: Must match `MCP_PUBLIC_BASE` hostname
- **Validity**: Minimum 90 days, auto-renewal recommended
- **SAN**: Consider adding `www.` variants if applicable

**Certificate Renewal**:
- Set up monitoring for expiration (alert 30 days before)
- Automate renewal via Mittwald or ACME client
- Test certificate update process in staging

---

## Code Changes Required

### Summary of Required Changes

| Category | Files Affected | Effort | Risk |
|----------|----------------|--------|------|
| Environment detection | 1 file (`src/server.ts`) | 1 hour | Low |
| Fallback URLs | 4 files | 2 hours | Low |
| Documentation | ~15 files | 4 hours | None |
| CI/CD | 2 workflows | 8 hours | Medium |
| Configuration | 2 TOML files (new) | 2 hours | Low |
| **Total** | ~24 files | **17 hours** | **Low-Medium** |

### Detailed Change List

#### 1. Source Code (`src/`)
**File**: `src/server.ts:314-322`
- **Change**: Add Mittwald environment detection
- **Commit**: Create separate commit for code changes
- **Testing**: Unit test for environment detection logic

#### 2. Source Code - Fallback URLs
**Files**:
- `src/routes/oauth-metadata-routes.ts:171`
- `src/server.ts:280`
- `src/server/oauth-middleware.ts:184`
- `src/middleware/session-auth.ts:138`

**Change**: Add `DEFAULT_OAUTH_SERVER_URL` env var, keep Fly.io URL as final fallback
**Example**:
```typescript
// Before
const oauthServerBase = process.env.OAUTH_AS_BASE
  || 'https://mittwald-oauth-server.fly.dev';

// After
const oauthServerBase = process.env.OAUTH_AS_BASE
  || process.env.DEFAULT_OAUTH_SERVER_URL
  || 'https://mittwald-oauth-server.fly.dev'; // Keep during transition
```

#### 3. Configuration Files (New)
**Files to Create**:
- `packages/oauth-bridge/mittwald.toml` (replace `fly.toml` equivalent)
- `packages/mcp-server/mittwald.toml` (replace `fly.toml` equivalent)

**Format TBD**: Depends on Mittwald deployment config format (likely Kubernetes YAML, Docker Compose, or proprietary format)

**Example `mittwald.toml` (hypothetical)**:
```toml
[app]
  name = "mittwald-oauth-server"
  region = "eu-central-1"

[container]
  image = "registry.mittwald.cloud/my-org/oauth-bridge:latest"
  port = 3000
  cpu = "1000m"
  memory = "512Mi"
  replicas = 1

[health]
  path = "/health"
  interval = 15
  timeout = 10
  grace_period = 10

[env]
  PORT = "3000"
  BRIDGE_BASE_URL = "https://mittwald-oauth-server.mittwald.cloud"
  BRIDGE_ISSUER = "https://mittwald-oauth-server.mittwald.cloud"
```

#### 4. Environment Examples
**Files**:
- `.env.example` (lines 57-61)
- `packages/oauth-bridge/.env.example` (lines 13, 16)

**Change**: Add Mittwald examples alongside Fly.io examples
**Example**:
```bash
# OAuth Bridge Base URL
# Fly.io deployment:
# BRIDGE_BASE_URL=https://mittwald-oauth-server.fly.dev
# Mittwald deployment:
BRIDGE_BASE_URL=https://mittwald-oauth-server.mittwald.cloud
```

#### 5. Documentation
**Files to Update** (15 files):
- `ARCHITECTURE.md:40` - Update deployment notes
- `LLM_CONTEXT.md:40, 483` - Update deployment requirements
- `docs/CREDENTIAL-SECURITY.md:57, 672` - Update example URLs
- `docs/oauth2c-end-to-end.md` (8 occurrences) - Update CLI examples
- `docs/oauth-testing-tools.md` (4 occurrences) - Update CLI examples
- `docs/PLAN-NODE20-FLY.md:71` - Archive or update rollback notes
- `README.md` - Add Mittwald deployment section

**Change Strategy**:
- Use variables instead of hardcoded URLs: `https://${OAUTH_SERVER_HOST}/...`
- Add "Deployment Options" section explaining Fly.io vs Mittwald
- Keep examples for both platforms during transition

#### 6. Scripts
**File**: `scripts/tail-registration-logs.sh`

**Current Dependencies**:
- `fly logs --json` command
- Parses Fly.io log format

**Options**:
1. **Replace** with Mittwald log API equivalent
2. **Delete** if logs accessible via Mittwald dashboard
3. **Make optional** with fallback:
   ```bash
   if command -v flyctl &> /dev/null; then
     fly logs --json "$@" | jq '...'
   elif command -v mittwald-cli &> /dev/null; then
     mittwald-cli logs --json "$@" | jq '...'
   else
     echo "Error: No log client available" >&2
     exit 1
   fi
   ```

**Recommendation**: Option 2 (delete) if Mittwald provides equivalent log filtering in dashboard.

---

## CI/CD Pipeline Migration

### Current Fly.io Deployment Workflow

**File**: `.github/workflows/deploy-fly.yml` (240 lines)

**Key Steps**:
1. **Setup** (lines 38-54):
   - Checkout code
   - Setup Node 20.11.1
   - Setup Docker Buildx
   - Install `flyctl`
   - Authenticate with Fly.io
   - Docker login to `registry.fly.io`

2. **Build Metadata** (lines 64-68):
   - Compute `GIT_SHA` and `BUILD_TIME`
   - Store in workflow outputs

3. **Pre-compile TypeScript** (lines 70-86):
   - Fail-fast compilation before Docker build
   - Run `npm ci && npm run build` in context directory

4. **Set Version Secrets** (lines 92-97):
   - Stage `GIT_SHA` and `BUILD_TIME` as Fly secrets
   - Visible to app after deployment

5. **Deploy** (lines 99-104):
   - `flyctl deploy --config <fly.toml> --strategy immediate --detach`
   - Uses Fly remote builder (no local Docker build/push)
   - Sets `ALLOW_FLY_RELEASE=true` to bypass release command gate

6. **Diagnostics on Failure** (lines 107-116):
   - `flyctl status --json`
   - `flyctl logs --max-lines 100`

7. **Cleanup Stale Machines** (lines 118-126):
   - Query `flyctl status --json` for stopped machines
   - Destroy non-started machines

8. **Smoke Tests** (lines 128-239):
   - Wait for health (up to 3 minutes)
   - Verify deployed version (`/version` endpoint)
   - Run Postman (Newman) smoke tests
   - Test dynamic client registration
   - Run OAuth E2E tests

**Deployment Strategy**:
- **Matrix Build**: 2 apps deployed in parallel (OAuth Bridge, MCP Server)
- **Concurrency Control**: `cancel-in-progress: true` per app
- **Timeout**: 30 minutes total
- **Failure Handling**: Continue on error for cleanup steps

### Proposed Mittwald Deployment Workflow

**File**: `.github/workflows/deploy-mittwald.yml` (new)

**Template** (adapt based on actual Mittwald deployment method):

```yaml
name: Deploy to Mittwald Container Platform

on:
  push:
    branches: [ main ]
    paths:
      - 'packages/**'
      - 'src/**'
      - '.github/workflows/deploy-mittwald.yml'
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    outputs:
      git_sha: ${{ steps.meta.outputs.sha }}
      build_time: ${{ steps.meta.outputs.build_time }}
      image_tag: ${{ steps.meta.outputs.image_tag }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node 20
        uses: actions/setup-node@v4
        with:
          node-version: '20.11.1'
          cache: 'npm'

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Compute build metadata
        id: meta
        run: |
          echo "sha=${GITHUB_SHA}" >> $GITHUB_OUTPUT
          echo "build_time=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> $GITHUB_OUTPUT
          echo "image_tag=${GITHUB_SHA::8}-$(date +%s)" >> $GITHUB_OUTPUT

      - name: Docker login to Mittwald registry
        run: |
          echo "${{ secrets.MITTWALD_REGISTRY_PASSWORD }}" | \
            docker login ${{ secrets.MITTWALD_REGISTRY_URL }} \
              -u ${{ secrets.MITTWALD_REGISTRY_USER }} \
              --password-stdin

      # Build OAuth Bridge
      - name: Build OAuth Bridge image
        uses: docker/build-push-action@v5
        with:
          context: packages/oauth-bridge
          file: packages/oauth-bridge/Dockerfile
          push: true
          tags: |
            ${{ secrets.MITTWALD_REGISTRY_URL }}/oauth-bridge:${{ steps.meta.outputs.image_tag }}
            ${{ secrets.MITTWALD_REGISTRY_URL }}/oauth-bridge:latest
          build-args: |
            GIT_SHA=${{ steps.meta.outputs.sha }}
            BUILD_TIME=${{ steps.meta.outputs.build_time }}
          cache-from: type=registry,ref=${{ secrets.MITTWALD_REGISTRY_URL }}/oauth-bridge:latest
          cache-to: type=inline

      # Build MCP Server
      - name: Build MCP Server image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: Dockerfile
          push: true
          tags: |
            ${{ secrets.MITTWALD_REGISTRY_URL }}/mcp-server:${{ steps.meta.outputs.image_tag }}
            ${{ secrets.MITTWALD_REGISTRY_URL }}/mcp-server:latest
          build-args: |
            GIT_SHA=${{ steps.meta.outputs.sha }}
            BUILD_TIME=${{ steps.meta.outputs.build_time }}
          cache-from: type=registry,ref=${{ secrets.MITTWALD_REGISTRY_URL }}/mcp-server:latest
          cache-to: type=inline

  deploy:
    needs: build
    runs-on: ubuntu-latest
    timeout-minutes: 30
    strategy:
      fail-fast: false
      matrix:
        include:
          - app: oauth-bridge
            hostname: mittwald-oauth-server.mittwald.cloud
            config: packages/oauth-bridge/mittwald.toml
          - app: mcp-server
            hostname: mittwald-mcp.mittwald.cloud
            config: packages/mcp-server/mittwald.toml

    concurrency:
      group: deploy-mittwald-${{ matrix.app }}
      cancel-in-progress: true

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      # OPTION A: Using Mittwald CLI (if available)
      - name: Install Mittwald CLI
        run: |
          # TBD: Install Mittwald deployment CLI
          curl -sSL https://cli.mittwald.de/install.sh | sh
          mittwald version

      - name: Authenticate with Mittwald
        env:
          MITTWALD_API_TOKEN: ${{ secrets.MITTWALD_API_TOKEN }}
        run: |
          mittwald auth login --token "$MITTWALD_API_TOKEN"

      - name: Deploy to Mittwald
        env:
          IMAGE_TAG: ${{ needs.build.outputs.image_tag }}
        run: |
          mittwald deploy \
            --app ${{ matrix.app }} \
            --image ${{ secrets.MITTWALD_REGISTRY_URL }}/${{ matrix.app }}:${IMAGE_TAG} \
            --config ${{ matrix.config }} \
            --env GIT_SHA=${{ needs.build.outputs.git_sha }} \
            --env BUILD_TIME=${{ needs.build.outputs.build_time }} \
            --wait

      # OPTION B: Using kubectl (if Mittwald exposes Kubernetes)
      - name: Setup kubectl
        uses: azure/setup-kubectl@v3

      - name: Deploy to Kubernetes
        env:
          KUBECONFIG: ${{ secrets.MITTWALD_KUBECONFIG }}
          IMAGE_TAG: ${{ needs.build.outputs.image_tag }}
        run: |
          kubectl set image deployment/${{ matrix.app }} \
            ${{ matrix.app }}=${{ secrets.MITTWALD_REGISTRY_URL }}/${{ matrix.app }}:${IMAGE_TAG} \
            --namespace=production
          kubectl rollout status deployment/${{ matrix.app }} \
            --namespace=production \
            --timeout=5m

      - name: Diagnostics on failure
        if: failure()
        continue-on-error: true
        run: |
          # TBD: Mittwald-specific status/log commands
          mittwald status --app ${{ matrix.app }}
          mittwald logs --app ${{ matrix.app }} --lines 100

  smoke:
    name: Post-Deploy Smoke Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: deploy

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install deps
        run: npm ci --no-audit --no-fund

      - name: Install Newman
        run: npm i -g newman

      - name: Wait for apps to be healthy
        run: |
          set -euo pipefail
          for host in mittwald-oauth-server.mittwald.cloud mittwald-mcp.mittwald.cloud; do
            echo "Waiting for $host/health"
            for attempt in $(seq 1 36); do
              if curl -fsS --max-time 6 "https://$host/health" >/dev/null 2>&1; then
                echo "✅ $host is healthy"
                break
              fi
              if [ $attempt -eq 36 ]; then
                echo "💥 Health check failed for $host" >&2
                exit 1
              fi
              sleep 5
            done
          done

      - name: Verify deployed version
        run: |
          set -euo pipefail
          sha="${{ needs.build.outputs.git_sha }}"
          for host in mittwald-oauth-server.mittwald.cloud mittwald-mcp.mittwald.cloud; do
            echo "Checking version on https://$host/version"
            body=$(curl -fsSL "https://$host/version")
            echo "$body" | jq -e --arg sha "$sha" '.gitSha == $sha'
            echo "✅ $host reports gitSha=$sha"
          done

      - name: Run Postman smoke tests
        run: |
          newman run tests/postman/Mittwald-MCP.postman_collection.json \
            -e tests/postman/Mittwald-MCP.postman_environment.json \
            --env-var mcp_base=https://mittwald-mcp.mittwald.cloud \
            --env-var as_base=https://mittwald-oauth-server.mittwald.cloud

      - name: Run OAuth E2E tests
        env:
          OAUTH_SERVER_URL: https://mittwald-oauth-server.mittwald.cloud
          MCP_SERVER_URL: https://mittwald-mcp.mittwald.cloud
        run: |
          npm run test:smoke
```

**Key Differences**:
1. **Explicit Docker Build**: Fly uses remote builder; Mittwald requires pushed images
2. **Registry Auth**: Mittwald registry instead of `registry.fly.io`
3. **Deployment Method**: TBD (CLI, kubectl, API) instead of `flyctl deploy`
4. **Health Checks**: Curl-based instead of `flyctl status --json` parsing
5. **Secrets**: Mittwald secrets instead of `flyctl secrets set`

### Secrets Migration Checklist

**GitHub Repository Secrets to Add**:
```
MITTWALD_API_TOKEN          # API token for deployments
MITTWALD_REGISTRY_URL       # e.g., registry.mittwald.cloud/my-org
MITTWALD_REGISTRY_USER      # Registry username
MITTWALD_REGISTRY_PASSWORD  # Registry password
MITTWALD_KUBECONFIG         # (Optional) If using kubectl

# Application secrets (set via Mittwald secrets manager)
MITTWALD_JWT_SIGNING_KEY            # Generate: openssl rand -base64 32
MITTWALD_OAUTH_BRIDGE_JWT_SECRET    # Generate: openssl rand -hex 32
MITTWALD_REDIS_URL                  # From Mittwald Redis provisioning
```

**Fly.io Secrets to Deprecate** (after migration complete):
```
FLY_API_TOKEN  # Keep for 30 days for rollback, then delete
```

### Workflow Activation Strategy

**Phase 1: Parallel Workflows** (Week 2-3)
- Keep `deploy-fly.yml` active
- Activate `deploy-mittwald.yml` alongside
- Both workflows deploy on `main` branch pushes
- Monitor both deployments for parity

**Phase 2: Mittwald Primary** (Week 3-4)
- Update client integrations to use Mittwald URLs
- Monitor traffic shift from Fly.io to Mittwald
- Keep Fly.io deployment as failover

**Phase 3: Fly.io Deprecation** (Week 4-5)
- Disable `deploy-fly.yml` (rename to `deploy-fly.yml.disabled`)
- Archive Fly.io apps (don't delete immediately)
- Remove `FLY_API_TOKEN` secret after 30-day retention

---

## Testing and Validation

### Pre-Migration Testing (Local)

#### 1. Docker Compose Simulation
**File**: `docker-compose.mittwald-sim.yml` (new)

Simulate Mittwald environment locally:
```yaml
version: '3.8'

services:
  oauth-bridge:
    build:
      context: packages/oauth-bridge
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      BRIDGE_BASE_URL: http://localhost:3000
      BRIDGE_ISSUER: http://localhost:3000
      BRIDGE_JWT_SECRET: test-secret-32-chars-minimum-required
      REDIS_URL: redis://redis:6379
      MITTWALD_AUTHORIZATION_URL: https://studio.mittwald.de/api/oauth/authorize
      MITTWALD_TOKEN_URL: https://studio.mittwald.de/api/oauth/token
      MITTWALD_CLIENT_ID: ${MITTWALD_CLIENT_ID}
      # Simulate Mittwald container environment
      MITTWALD_CONTAINER_ID: local-sim-oauth
    depends_on:
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 15s
      timeout: 10s
      retries: 3

  mcp-server:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      NODE_ENV: production
      PORT: 8080
      MCP_PUBLIC_BASE: http://localhost:8080
      OAUTH_AS_BASE: http://oauth-bridge:3000
      JWT_SIGNING_KEY: test-jwt-key-32-chars-minimum
      OAUTH_BRIDGE_JWT_SECRET: test-secret-32-chars-minimum-required
      OAUTH_BRIDGE_ISSUER: http://localhost:3000
      OAUTH_BRIDGE_BASE_URL: http://oauth-bridge:3000
      REDIS_URL: redis://redis:6379
      # Simulate Mittwald container environment
      MITTWALD_CONTAINER_ID: local-sim-mcp
    depends_on:
      - redis
      - oauth-bridge
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

**Test Procedure**:
```bash
# 1. Start simulated environment
docker-compose -f docker-compose.mittwald-sim.yml up --build

# 2. Wait for health checks
timeout 60s bash -c 'until curl -f http://localhost:3000/health; do sleep 2; done'
timeout 60s bash -c 'until curl -f http://localhost:8080/health; do sleep 2; done'

# 3. Verify environment detection
docker-compose -f docker-compose.mittwald-sim.yml logs mcp-server | grep -i "mittwald\|container"
# Should NOT see "HTTPS is mandatory" error

# 4. Run integration tests
npm run test:integration

# 5. Verify OAuth flow
curl http://localhost:3000/.well-known/oauth-authorization-server | jq .
curl http://localhost:8080/ | jq .

# 6. Cleanup
docker-compose -f docker-compose.mittwald-sim.yml down -v
```

**Expected Results**:
- Both services start without HTTPS errors
- Environment detection logs show Mittwald container ID
- Health checks return 200
- OAuth metadata endpoints return valid JSON
- Integration tests pass

#### 2. Unit Test Coverage
**New Tests to Add**:

**File**: `tests/unit/server/environment-detection.test.ts` (new)
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Environment detection', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('detects Fly.io environment via FLY_ALLOC_ID', () => {
    process.env.FLY_ALLOC_ID = '683903eb762d68';
    const runningBehindProxy = !!(
      process.env.FLY_ALLOC_ID ||
      process.env.FLY_APP_NAME ||
      process.env.MITTWALD_CONTAINER_ID
    );
    expect(runningBehindProxy).toBe(true);
  });

  it('detects Mittwald environment via MITTWALD_CONTAINER_ID', () => {
    process.env.MITTWALD_CONTAINER_ID = 'mw-container-abc123';
    const runningBehindProxy = !!(
      process.env.FLY_ALLOC_ID ||
      process.env.FLY_APP_NAME ||
      process.env.MITTWALD_CONTAINER_ID
    );
    expect(runningBehindProxy).toBe(true);
  });

  it('does not detect proxy in local development', () => {
    delete process.env.FLY_ALLOC_ID;
    delete process.env.FLY_APP_NAME;
    delete process.env.MITTWALD_CONTAINER_ID;
    const runningBehindProxy = !!(
      process.env.FLY_ALLOC_ID ||
      process.env.FLY_APP_NAME ||
      process.env.MITTWALD_CONTAINER_ID
    );
    expect(runningBehindProxy).toBe(false);
  });

  it('requires HTTPS when not behind proxy in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_HTTPS;
    delete process.env.FLY_ALLOC_ID;
    delete process.env.MITTWALD_CONTAINER_ID;

    const isProduction = process.env.NODE_ENV === 'production';
    const runningBehindProxy = false;
    const useHTTPS = (process.env.ENABLE_HTTPS === 'true' || isProduction) && !runningBehindProxy;

    expect(useHTTPS).toBe(true);
  });
});
```

**Run Tests**:
```bash
npm run test:unit -- tests/unit/server/environment-detection.test.ts
```

### Staging Environment Testing

**Staging Environment Setup**:
1. Deploy OAuth Bridge to Mittwald staging
2. Deploy MCP Server to Mittwald staging
3. Use separate Redis instance (or different DB number)
4. Configure staging-specific secrets
5. Use test Mittwald OAuth client (if available)

**Staging URLs**:
- OAuth Bridge: `https://mittwald-oauth-server-staging.mittwald.cloud`
- MCP Server: `https://mittwald-mcp-staging.mittwald.cloud`

**Test Scenarios**:

#### Scenario 1: OAuth Discovery
```bash
# Test OAuth authorization server metadata
curl https://mittwald-oauth-server-staging.mittwald.cloud/.well-known/oauth-authorization-server | jq .

# Expected response
{
  "issuer": "https://mittwald-oauth-server-staging.mittwald.cloud",
  "authorization_endpoint": "https://mittwald-oauth-server-staging.mittwald.cloud/authorize",
  "token_endpoint": "https://mittwald-oauth-server-staging.mittwald.cloud/token",
  "registration_endpoint": "https://mittwald-oauth-server-staging.mittwald.cloud/register",
  ...
}
```

#### Scenario 2: Dynamic Client Registration
```bash
# Register test client
curl -X POST https://mittwald-oauth-server-staging.mittwald.cloud/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Staging Test Client",
    "redirect_uris": ["http://localhost:8888/callback"],
    "token_endpoint_auth_method": "none",
    "grant_types": ["authorization_code", "refresh_token"]
  }' | jq . > /tmp/staging-client.json

# Verify client_id returned
jq -r '.client_id' /tmp/staging-client.json
```

#### Scenario 3: Authorization Flow (Manual)
```bash
# 1. Start authorization
CLIENT_ID=$(jq -r '.client_id' /tmp/staging-client.json)
oauth2c authorize https://mittwald-oauth-server-staging.mittwald.cloud \
  --client-id "$CLIENT_ID" \
  --redirect-uri http://localhost:8888/callback \
  --scope "user:read project:read" \
  --resource "https://mittwald-mcp-staging.mittwald.cloud/mcp" \
  --use-pkce \
  --browser \
  --save /tmp/staging-session.json

# 2. Complete Mittwald login in browser

# 3. Exchange code for token
oauth2c token https://mittwald-oauth-server-staging.mittwald.cloud \
  --session /tmp/staging-session.json \
  --format json | jq . > /tmp/staging-token.json

# 4. Verify JWT structure
jq -r '.access_token' /tmp/staging-token.json | \
  cut -d. -f2 | base64 -d | jq .

# Expected JWT payload
{
  "iss": "https://mittwald-oauth-server-staging.mittwald.cloud",
  "sub": "user-123",
  "aud": "https://mittwald-mcp-staging.mittwald.cloud",
  "exp": 1234567890,
  "iat": 1234567800,
  "mittwald": {
    "access_token": "mw_access_...",
    "refresh_token": "mw_refresh_...",
    "scope": "user:read project:read",
    "expires_in": 3600
  }
}
```

#### Scenario 4: MCP Tool Execution
```bash
# 1. Get token
TOKEN=$(jq -r '.access_token' /tmp/staging-token.json)

# 2. Initialize MCP session
curl -X POST https://mittwald-mcp-staging.mittwald.cloud/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "0.1.0",
      "clientInfo": {
        "name": "staging-test",
        "version": "1.0.0"
      }
    }
  }' | jq .

# 3. List tools
curl -X POST https://mittwald-mcp-staging.mittwald.cloud/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }' | jq '.result.tools | length'

# Expected: > 100 tools
```

#### Scenario 5: Session Persistence
```bash
# 1. Create session with first request
SESSION_ID=$(curl -X POST https://mittwald-mcp-staging.mittwald.cloud/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "0.1.0",
      "clientInfo": {"name": "test", "version": "1.0"}
    }
  }' | jq -r '.result.sessionId')

echo "Session ID: $SESSION_ID"

# 2. Make subsequent request with session ID
curl -X POST https://mittwald-mcp-staging.mittwald.cloud/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "mcp-session-id: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "mittwald_project_list",
      "arguments": {}
    }
  }' | jq .

# Expected: Successful tool execution using cached Mittwald token
```

#### Scenario 6: Graceful Shutdown
```bash
# 1. Send SIGTERM to container
mittwald container stop --app mcp-server-staging --graceful

# 2. Monitor logs for shutdown sequence
mittwald logs --app mcp-server-staging --follow | grep -i shutdown

# Expected log sequence:
# "SIGTERM received, starting graceful shutdown..."
# "Shutting down MCP server..."
# "HTTP server closed"
# "Redis client disconnected"
# "Graceful shutdown complete"

# 3. Verify shutdown completed within 30s timeout
# (no "Graceful shutdown timeout reached, forcing exit" message)
```

### Production Smoke Tests

**Post-Deployment Checklist** (automated in CI/CD):
- [ ] Health endpoints return 200
- [ ] Version endpoints return correct git SHA
- [ ] OAuth metadata endpoints return valid JSON
- [ ] Dynamic client registration succeeds
- [ ] Authorization flow completes
- [ ] Token exchange returns valid JWT
- [ ] MCP initialize succeeds
- [ ] MCP tools list returns > 100 tools
- [ ] Tool execution succeeds (test 5 random tools)
- [ ] Session persists across requests
- [ ] Logs show no errors for 5 minutes
- [ ] Redis connections stable
- [ ] Memory usage < 512 MB
- [ ] Response times < 1s p95

**Manual Production Verification**:
```bash
# 1. Test from external network (not Mittwald internal)
curl -I https://mittwald-oauth-server.mittwald.cloud/health
# Expected: HTTP/2 200

# 2. Test TLS certificate
echo | openssl s_client -connect mittwald-oauth-server.mittwald.cloud:443 -servername mittwald-oauth-server.mittwald.cloud 2>/dev/null | openssl x509 -noout -dates
# Expected: Valid certificate, not expired

# 3. Test OAuth flow with real client (ChatGPT or Claude)
# (Manual browser-based test)

# 4. Monitor error rate for 24 hours
mittwald metrics --app oauth-bridge --metric http_5xx_rate --duration 24h
# Expected: < 0.1%

# 5. Monitor latency
mittwald metrics --app mcp-server --metric http_request_duration_p95 --duration 24h
# Expected: < 1s
```

---

## Rollback Plan

### Rollback Triggers

**Automated Rollback Conditions**:
- Health checks fail for > 5 minutes
- 5xx error rate > 5% for > 2 minutes
- OAuth authorization failure rate > 10%
- Memory usage > 90% for > 5 minutes
- Redis connection failures > 10 in 1 minute

**Manual Rollback Scenarios**:
- Mittwald whitelist not updated (OAuth callbacks failing)
- Client integrations broken (ChatGPT/Claude cannot connect)
- Data loss detected (Redis session corruption)
- Performance degradation (latency > 3s p95)
- Security incident (credential leak, unauthorized access)

### Rollback Procedure

#### Phase 1: Immediate Traffic Revert (< 5 minutes)

**DNS Rollback** (if using custom domains):
```bash
# 1. Revert DNS to Fly.io
# Update A/CNAME records to point back to Fly.io
# TTL: Use low TTL (60s) during migration for fast rollback

# 2. Flush DNS cache (if possible)
# Contact DNS provider or wait for TTL expiration

# 3. Verify DNS propagation
dig mittwald-oauth-server.example.com +short
# Should return Fly.io IP/CNAME
```

**Environment Variable Rollback**:
```bash
# If using Mittwald but pointing back to Fly.io
mittwald env set --app oauth-bridge \
  BRIDGE_BASE_URL=https://mittwald-oauth-server.fly.dev \
  BRIDGE_ISSUER=https://mittwald-oauth-server.fly.dev

mittwald env set --app mcp-server \
  MCP_PUBLIC_BASE=https://mittwald-mcp-fly2.fly.dev \
  OAUTH_AS_BASE=https://mittwald-oauth-server.fly.dev

mittwald deploy restart --app oauth-bridge
mittwald deploy restart --app mcp-server
```

#### Phase 2: Verify Fly.io Services (5-10 minutes)

```bash
# 1. Check Fly.io app status
flyctl status -a mittwald-oauth-server
flyctl status -a mittwald-mcp-fly2

# 2. Check health endpoints
curl https://mittwald-oauth-server.fly.dev/health
curl https://mittwald-mcp-fly2.fly.dev/health

# 3. Check recent deployments
flyctl releases -a mittwald-oauth-server
flyctl releases -a mittwald-mcp-fly2

# 4. If apps stopped, scale up
flyctl scale count 1 -a mittwald-oauth-server
flyctl scale count 1 -a mittwald-mcp-fly2

# 5. Monitor logs for errors
flyctl logs -a mittwald-oauth-server --max-lines 50
flyctl logs -a mittwald-mcp-fly2 --max-lines 50
```

#### Phase 3: Redis Migration Back (10-15 minutes)

**If Redis was migrated to Mittwald**:
```bash
# 1. Export recent session data from Mittwald Redis
redis-cli -h <mittwald-redis-host> --scan --pattern "session:*" | \
  xargs redis-cli -h <mittwald-redis-host> DUMP | \
  gzip > /tmp/sessions-backup.rdb.gz

# 2. Import into Fly.io/Upstash Redis
gunzip < /tmp/sessions-backup.rdb.gz | \
  redis-cli -h <fly-redis-host> --pipe

# 3. Update Fly.io apps to use original Redis
flyctl secrets set REDIS_URL=<original-redis-url> -a mittwald-oauth-server
flyctl secrets set REDIS_URL=<original-redis-url> -a mittwald-mcp-fly2

# 4. Restart apps
flyctl deploy -a mittwald-oauth-server
flyctl deploy -a mittwald-mcp-fly2
```

#### Phase 4: Validate Rollback (15-30 minutes)

```bash
# 1. Run smoke tests against Fly.io
npm run test:smoke -- \
  --env OAUTH_SERVER_URL=https://mittwald-oauth-server.fly.dev \
  --env MCP_SERVER_URL=https://mittwald-mcp-fly2.fly.dev

# 2. Test OAuth flow manually
oauth2c authorize https://mittwald-oauth-server.fly.dev \
  --client-id <test-client-id> \
  --scope "user:read" \
  --use-pkce \
  --browser

# 3. Monitor metrics for 30 minutes
# - 5xx error rate should drop to < 0.1%
# - OAuth success rate should return to > 99%
# - Latency should return to baseline (< 500ms p95)

# 4. Verify with sample clients (ChatGPT, Claude)
```

#### Phase 5: Post-Rollback Analysis

```bash
# 1. Archive Mittwald logs for analysis
mittwald logs --app oauth-bridge --since 24h > /tmp/mittwald-oauth-rollback.log
mittwald logs --app mcp-server --since 24h > /tmp/mittwald-mcp-rollback.log

# 2. Export Mittwald metrics
mittwald metrics export --app oauth-bridge --duration 24h > /tmp/mittwald-oauth-metrics.json
mittwald metrics export --app mcp-server --duration 24h > /tmp/mittwald-mcp-metrics.json

# 3. Document root cause
# - What triggered the rollback?
# - What was the impact (duration, affected users, error count)?
# - What needs to be fixed before retry?

# 4. Schedule post-mortem
# - Review logs and metrics
# - Identify systemic issues
# - Update migration plan
# - Set new migration date
```

### Rollback Decision Tree

```
Is production broken?
├─ YES: Is it Mittwald-specific (DNS, config, deployment)?
│   ├─ YES: Can it be fixed in < 15 minutes?
│   │   ├─ YES: Fix and monitor
│   │   └─ NO: ROLLBACK TO FLY.IO
│   └─ NO: Is it a code/dependency issue?
│       ├─ YES: Revert last deployment, investigate
│       └─ NO: Investigate further, consider rollback
└─ NO: Is performance degraded by > 50%?
    ├─ YES: Investigate, rollback if no improvement in 30 min
    └─ NO: Monitor, document issues for next iteration
```

### Rollback Testing

**Pre-Migration Rollback Drill** (Week 2):
1. Deploy to Mittwald staging
2. Switch DNS to Mittwald staging
3. Verify services working
4. Trigger rollback (manually)
5. Verify Fly.io services still working
6. Measure rollback duration (target: < 15 minutes)
7. Document lessons learned

**Expected Rollback Duration**:
- DNS revert: 1-5 minutes (depends on TTL)
- Environment variable update: 2 minutes
- Service restart: 2-3 minutes
- Validation: 5-10 minutes
- **Total: 10-20 minutes**

---

## Post-Migration Cleanup

### Week 1 Post-Migration

**Monitoring Period**:
- Keep Fly.io apps running in parallel
- Monitor both platforms for anomalies
- Compare metrics (error rates, latency, throughput)
- Keep dual deployment CI/CD active

**Actions**:
- [ ] Verify all client integrations working
- [ ] Monitor error rates daily
- [ ] Check Redis session persistence
- [ ] Review logs for warnings
- [ ] Validate SSL certificate auto-renewal
- [ ] Test token refresh flows

### Week 2-4 Post-Migration

**Deprecation Phase**:
- [ ] Update documentation to remove Fly.io references
- [ ] Archive `deploy-fly.yml` workflow
- [ ] Scale down Fly.io apps to 0 (don't delete yet)
- [ ] Update client integration docs
- [ ] Remove Fly.io URLs from environment examples
- [ ] Update troubleshooting guides

**Code Cleanup**:
- [ ] Remove Fly.io-specific fallback URLs (keep Mittwald as primary)
- [ ] Optionally remove Fly.io environment detection (keep for historical context)
- [ ] Update comments referencing Fly.io
- [ ] Remove `packages/mcp-server/fly2.toml` (archived config)

### Month 2 Post-Migration

**Full Decommissioning**:
- [ ] Delete Fly.io apps (after 30-day retention)
  ```bash
  flyctl apps destroy mittwald-oauth-server --yes
  flyctl apps destroy mittwald-mcp-fly2 --yes
  ```
- [ ] Remove `FLY_API_TOKEN` GitHub secret
- [ ] Delete Fly.io account (if no other apps)
- [ ] Remove `.github/workflows/fly-logs.yml`
- [ ] Remove `scripts/tail-registration-logs.sh` (if Fly-specific)
- [ ] Archive `packages/oauth-bridge/fly.toml` to `docs/archive/`
- [ ] Archive `packages/mcp-server/fly.toml` to `docs/archive/`

**Documentation Updates**:
- [ ] Update `ARCHITECTURE.md` - Remove Fly.io references
- [ ] Update `README.md` - Mittwald deployment instructions only
- [ ] Update `LLM_CONTEXT.md` - Mittwald as default platform
- [ ] Create `docs/MIGRATION-POSTMORTEM.md` - Document lessons learned

### Final Cleanup Checklist

**Files to Archive** (`docs/archive/fly-migration-2025-10/`):
- [ ] `packages/oauth-bridge/fly.toml`
- [ ] `packages/mcp-server/fly.toml`
- [ ] `packages/mcp-server/fly2.toml`
- [ ] `.github/workflows/deploy-fly.yml`
- [ ] `.github/workflows/fly-logs.yml`
- [ ] `scripts/tail-registration-logs.sh` (if Fly-specific)
- [ ] This migration guide (`docs/FLY-MITTWALD-MIGRATION-GUIDE.md`)

**Files to Update** (remove Fly.io references):
- [ ] `.env.example` - Remove Fly.io URL examples
- [ ] `packages/oauth-bridge/.env.example` - Same
- [ ] `ARCHITECTURE.md` - Update deployment section
- [ ] `LLM_CONTEXT.md` - Update critical deployment requirement
- [ ] `docs/oauth2c-end-to-end.md` - Update CLI examples
- [ ] `docs/oauth-testing-tools.md` - Update CLI examples
- [ ] `docs/CREDENTIAL-SECURITY.md` - Update example URLs
- [ ] All docs in `docs/handover-audit-2025-10/` - Update references

**Files to Delete**:
- [ ] `.github/workflows/fly-logs.yml` (if not adapted for Mittwald)
- [ ] `scripts/tail-registration-logs.sh` (if not adapted)
- [ ] `packages/mcp-server/fly2.toml` (after archiving)

**Git Cleanup**:
```bash
# Create archive commit
git add docs/archive/fly-migration-2025-10/
git commit -m "docs: archive Fly.io configuration files after migration"

# Remove Fly.io workflows
git rm .github/workflows/deploy-fly.yml
git rm .github/workflows/fly-logs.yml
git commit -m "ci: remove Fly.io deployment workflows after migration"

# Update documentation
git add docs/ .env.example packages/*/  .env.example
git commit -m "docs: remove Fly.io references after migration to Mittwald"

# Tag migration completion
git tag -a migration-mittwald-v1.0 -m "Migration from Fly.io to Mittwald complete"
git push origin main --tags
```

---

## Migration Checklist Summary

### Pre-Migration (Week 1)
- [ ] Provision Mittwald containers (OAuth Bridge, MCP Server)
- [ ] Provision/migrate Redis
- [ ] Configure networking and SSL
- [ ] Rotate all production secrets
- [ ] Update code for Mittwald environment detection
- [ ] Create `deploy-mittwald.yml` workflow
- [ ] Test in local Docker Compose simulation
- [ ] Deploy to Mittwald staging
- [ ] Run full test suite against staging
- [ ] Conduct rollback drill

### Migration Week (Week 2-3)
- [ ] Request Mittwald OAuth whitelist update (if changing domains)
- [ ] Deploy to Mittwald production (parallel with Fly.io)
- [ ] Configure DNS for new domains
- [ ] Verify health checks and metrics
- [ ] Run smoke tests
- [ ] Monitor for 48 hours (dual deployment)
- [ ] Update client integrations (ChatGPT, Claude)
- [ ] Monitor traffic shift

### Post-Migration (Week 3-4)
- [ ] Validate all integrations working
- [ ] Monitor error rates and latency
- [ ] Run load tests
- [ ] Scale down Fly.io apps (don't delete)
- [ ] Update documentation
- [ ] Archive Fly.io configs
- [ ] Disable Fly.io deployment workflow

### Cleanup (Month 2)
- [ ] Delete Fly.io apps after 30-day retention
- [ ] Remove Fly.io GitHub secrets
- [ ] Remove Fly.io references from docs
- [ ] Archive migration guide
- [ ] Document lessons learned

---

## Appendix: Mittwald-Specific Configuration

### A. Required Information from Mittwald

**To be obtained before migration**:
1. **Container Platform Details**:
   - Deployment method (CLI, API, kubectl, web UI)
   - Container registry URL and authentication
   - Resource limits and scaling options
   - Health check configuration format
   - Logging and monitoring integration

2. **Redis Options**:
   - Managed Redis offering (if available)
   - Connection string format
   - TLS support (rediss://)
   - Persistence and backup options
   - HA/replica configuration

3. **Networking**:
   - Ingress/load balancer configuration
   - TLS termination (at edge or in container)
   - Internal DNS for container-to-container communication
   - IP whitelisting (if needed for Mittwald API)

4. **Domain and SSL**:
   - Default domain format (`.mittwald.cloud`, etc.)
   - Custom domain support
   - SSL certificate provisioning (auto Let's Encrypt, manual upload)
   - HTTPS enforcement

5. **Secrets Management**:
   - Secret injection method (env vars, files, API)
   - Secret rotation procedures
   - Access control (who can view/update secrets)

6. **Monitoring and Logging**:
   - Log aggregation (stdout/stderr, files)
   - Log retention period
   - Metrics collection (Prometheus, custom)
   - Alerting integration (email, Slack, PagerDuty)

7. **OAuth Whitelist Update**:
   - Contact person/team for whitelist requests
   - Request format and required information
   - SLA for whitelist updates
   - Testing procedure before production cutover

### B. Mittwald Configuration Template

**To be created once details are known**:

**File**: `packages/oauth-bridge/mittwald.toml`
```toml
# TBD: Actual format depends on Mittwald deployment system
```

**File**: `packages/mcp-server/mittwald.toml`
```toml
# TBD: Actual format depends on Mittwald deployment system
```

---

## Contact and Support

**Migration Team**:
- **Lead**: TBD
- **DevOps**: TBD
- **Backend**: TBD

**External Contacts**:
- **Mittwald OAuth Team**: TBD (for whitelist updates)
- **Mittwald Support**: TBD (for infrastructure questions)
- **Fly.io Support**: support@fly.io (for graceful shutdown questions)

**Escalation Path**:
1. Check this migration guide
2. Review Mittwald documentation
3. Contact Mittwald support
4. Escalate to migration lead
5. Execute rollback plan if unresolved within SLA

---

**Document Version**: 1.0
**Last Updated**: 2025-10-04
**Next Review**: After migration completion
**Status**: Pre-Migration Planning
