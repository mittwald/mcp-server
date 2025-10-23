# Fly.io to Mittwald Migration - Critical Gaps Resolution

**Date**: 2025-10-04
**Purpose**: Address critical migration gaps identified in review
**Parent Document**: [FLY-MITTWALD-MIGRATION-GUIDE.md](./FLY-MITTWALD-MIGRATION-GUIDE.md)

---

## Table of Contents

1. [Domain Migration Strategy (CRITICAL)](#domain-migration-strategy)
2. [Mittwald Observability Architecture](#mittwald-observability-architecture)
3. [Executable CI/CD Deployment Plan](#executable-cicd-deployment-plan)
4. [Build Artifacts and Test Fixtures Cleanup](#build-artifacts-and-test-fixtures-cleanup)
5. [Runtime Feature Parity Mapping](#runtime-feature-parity-mapping)
6. [OAuth Registration Monitoring Replacement](#oauth-registration-monitoring-replacement)

---

## 1. Domain Migration Strategy (CRITICAL)

### Problem Statement
**Current State**: All production OAuth clients (ChatGPT, Claude, custom integrations) are hardcoded to `https://mittwald-oauth-server.fly.dev`.

**Risk**: Changing this domain breaks OAuth for all existing users unless:
1. Fly.io CNAME delegation works (unconfirmed)
2. Mittwald whitelist is updated (no confirmed process/SLA)
3. All clients are updated (requires coordination)

### Research Findings: Fly.io Domain Delegation

**Can Fly.io delegate .fly.dev domains via CNAME to external servers?**

Based on Fly.io documentation research:
- ❌ **NO**: Fly.io does NOT support CNAMEing `.fly.dev` domains to external targets
- ✅ **YES**: Fly.io supports custom domains (bring your own domain) via CNAME/A records
- ⚠️ **Limitation**: `.fly.dev` subdomains are exclusively for Fly.io-hosted apps

**Source**: [Fly.io Custom Domains Documentation](https://fly.io/docs/networking/custom-domain/)

### Recommended Domain Migration Strategy

#### Option 1: Keep Fly.io as Proxy (Minimal Risk) ⭐ RECOMMENDED

**Architecture**:
```
┌──────────────────────────────────────────────────────────────┐
│                     Client Request                           │
│  (ChatGPT, Claude, etc.)                                     │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
         https://mittwald-oauth-server.fly.dev
                         │
                    ┌────▼──────┐
                    │  Fly.io   │
                    │  Proxy    │  (Minimal NGINX container)
                    │  App      │  Reverse proxy to Mittwald
                    └────┬──────┘
                         │
                         ▼
         https://oauth.mcp.mittwald.cloud
                         │
                    ┌────▼──────────┐
                    │   Mittwald    │
                    │ OAuth Bridge  │ (Real implementation)
                    └───────────────┘
```

**Implementation Steps**:

1. **Deploy Minimal Proxy on Fly.io**:
   ```dockerfile
   # fly-proxy/Dockerfile
   FROM nginx:alpine

   COPY nginx.conf /etc/nginx/nginx.conf

   EXPOSE 8080
   ```

   ```nginx
   # fly-proxy/nginx.conf
   events {
       worker_connections 1024;
   }

   http {
       upstream mittwald_oauth {
           server oauth.mcp.mittwald.cloud:443;
           keepalive 32;
       }

       server {
           listen 8080;
           server_name mittwald-oauth-server.fly.dev;

           location / {
               proxy_pass https://mittwald_oauth;
               proxy_ssl_server_name on;
               proxy_ssl_name oauth.mcp.mittwald.cloud;

               # Preserve original headers
               proxy_set_header Host oauth.mcp.mittwald.cloud;
               proxy_set_header X-Real-IP $remote_addr;
               proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
               proxy_set_header X-Forwarded-Proto https;

               # OAuth-specific headers
               proxy_set_header Authorization $http_authorization;

               # Timeouts
               proxy_connect_timeout 10s;
               proxy_send_timeout 60s;
               proxy_read_timeout 60s;
           }
       }
   }
   ```

   ```toml
   # fly-proxy/fly.toml
   app = "mittwald-oauth-server"

   [build]
     dockerfile = "Dockerfile"

   [env]
     PORT = "8080"

   [http_service]
     internal_port = 8080
     force_https = true
     auto_start_machines = true
     auto_stop_machines = false
     min_machines_running = 1

     [[http_service.checks]]
       grace_period = "5s"
       interval = "10s"
       method = "GET"
       path = "/health"
       timeout = "3s"
   ```

2. **Deploy MCP Server Proxy** (same pattern):
   ```nginx
   upstream mittwald_mcp {
       server mcp.mittwald.cloud:443;
   }
   ```

3. **Costs**:
   - OAuth Proxy: ~$2/month (shared-cpu-1x, 256MB)
   - MCP Proxy: ~$2/month (shared-cpu-1x, 256MB)
   - Total: **$4/month** to keep existing domains working

4. **Deprecation Timeline**:
   - **Month 1-6**: Proxy active, migrate clients gradually
   - **Month 6**: Announce deprecation of `.fly.dev` URLs
   - **Month 12**: Shut down proxies, require all clients on new domains

**Pros**:
- ✅ Zero client changes immediately
- ✅ No Mittwald whitelist update needed
- ✅ Gradual client migration (12-month runway)
- ✅ Rollback = just redeploy real apps to Fly.io
- ✅ Low cost ($4/month)

**Cons**:
- ❌ Additional latency (~50-100ms proxy overhead)
- ❌ Single point of failure (Fly.io must remain operational)
- ❌ Ongoing Fly.io dependency

---

#### Option 2: Immediate Domain Migration (High Risk)

**Steps**:

1. **Choose New Domains**:
   - OAuth: `https://oauth.mcp.mittwald.cloud`
   - MCP: `https://mcp.mittwald.cloud`

2. **Request Mittwald Whitelist Update** (CRITICAL PATH):

   **Contact Process** (to be confirmed):
   ```
   To: Mittwald OAuth Team (mittwald-oauth@mittwald.de OR via support ticket)
   Subject: OAuth Callback Whitelist Update Request - Production Migration

   Dear Mittwald OAuth Team,

   We are migrating our OAuth bridge from Fly.io to Mittwald infrastructure
   and require an update to the whitelisted callback URLs for our production
   OAuth client.

   Current Callback URL (to be deprecated):
   https://mittwald-oauth-server.fly.dev/mittwald/callback

   New Callback URL (to be whitelisted):
   https://oauth.mcp.mittwald.cloud/mittwald/callback

   Client ID: <mittwald-client-id>
   Deployment Timeline: <target-date>
   Migration Window: <start-date> to <end-date>

   Rollback Plan: Revert DNS to Fly.io if issues detected

   Please confirm:
   1. Estimated time to whitelist the new URL
   2. Whether both URLs can be whitelisted simultaneously during transition
   3. Process to verify whitelist update in staging before production

   Thank you,
   <Your Name>
   ```

   **Expected SLA**: ⚠️ UNKNOWN (needs confirmation from Mittwald)
   - Estimated: 3-5 business days
   - Risk: Could be 1-2 weeks if manual approval required

3. **Update All Client Integrations**:

   **ChatGPT GPT Configuration**:
   ```json
   {
     "oauth_client_id": "<bridge-client-id>",
     "authorization_url": "https://oauth.mcp.mittwald.cloud/authorize",
     "authorization_content_type": "application/json",
     "scope": "openid offline_access user:read project:read",
     "token_url": "https://oauth.mcp.mittwald.cloud/token"
   }
   ```

   **Claude Desktop Configuration**:
   ```json
   {
     "mcpServers": {
       "mittwald": {
         "url": "https://mcp.mittwald.cloud/mcp",
         "authorization": {
           "type": "oauth2",
           "authorization_url": "https://oauth.mcp.mittwald.cloud/authorize",
           "token_url": "https://oauth.mcp.mittwald.cloud/token",
           "client_id": "<bridge-client-id>"
         }
       }
     }
   }
   ```

   **Custom Clients**:
   - Email notification to all registered clients
   - 30-day deprecation window
   - Provide migration guide
   - Support old URLs during transition (if possible via proxy)

4. **DNS Configuration**:
   ```bash
   # Add new A records (Mittwald provides IPs)
   oauth.mcp.mittwald.cloud    A    <mittwald-ingress-ip>
   mcp.mittwald.cloud          A    <mittwald-ingress-ip>

   # OR CNAME to Mittwald-provided domain
   oauth.mcp.mittwald.cloud    CNAME    <app>.mstd-gateway.mittwald.cloud.
   mcp.mittwald.cloud          CNAME    <app>.mstd-gateway.mittwald.cloud.
   ```

**Timeline**:
- **Week -4**: Submit whitelist request
- **Week -3**: Receive whitelist confirmation
- **Week -2**: Deploy to Mittwald staging, test
- **Week -1**: Update client integrations (ChatGPT, Claude)
- **Week 0**: DNS cutover, monitor 24/7
- **Week +1**: Deprecate old URLs

**Pros**:
- ✅ Clean architecture (no proxy)
- ✅ No Fly.io dependency
- ✅ Lower latency

**Cons**:
- ❌ Requires client updates (breaking change)
- ❌ Whitelist update SLA unknown
- ❌ Higher risk (all-or-nothing cutover)
- ❌ Difficult rollback (client configuration changes)

---

#### Option 3: Hybrid Approach (Balanced)

**Phase 1** (Month 1): Deploy proxy on Fly.io (Option 1)
**Phase 2** (Month 2-3): Update high-value clients (ChatGPT, Claude) to new domains
**Phase 3** (Month 4-6): Notify remaining clients, provide migration guide
**Phase 4** (Month 7-12): Monitor usage, shut down proxy when < 1% traffic

**Recommendation**: Start with **Option 1** (Fly.io proxy) for zero downtime, then execute **Option 3** (hybrid) for gradual migration over 12 months.

---

### Mittwald Whitelist Coordination Plan

**Pre-Migration Actions** (Week -6 to -4):

1. **Identify Mittwald OAuth Team Contact**:
   - Check Mittwald support portal for OAuth team contact
   - Alternative: Submit support ticket requesting OAuth team contact
   - Escalation: Contact Mittwald account manager

2. **Request Whitelist Update SLA**:
   ```
   Questions for Mittwald:
   1. What is the typical SLA for whitelist updates?
   2. Can multiple callback URLs be whitelisted simultaneously?
   3. Is there a staging environment to test whitelist changes?
   4. What information is required for whitelist requests?
   5. Are there any restrictions on callback URL formats?
   6. Can we test whitelist updates before production cutover?
   ```

3. **Document Whitelist Process**:
   - Create internal runbook with contact info, SLA, request template
   - Add to migration guide under "Appendix A: Mittwald Contacts"

**Fallback Plan** (if whitelist SLA > 2 weeks):
- Deploy proxy on Fly.io to keep existing URLs working
- Request whitelist update in parallel
- Migrate high-value clients first
- Sunset proxy after 12 months

---

## 2. Mittwald Observability Architecture

### Problem Statement
The current migration plan says "configure log aggregation/monitoring" but doesn't specify:
- Where logs go (stdout, files, external service)
- Retention policies
- Alert rules and thresholds
- Replacement for `scripts/tail-registration-logs.sh`

### Mittwald Observability Stack

#### A. Logging Architecture

**Mittwald Container Logging** (based on research):
- **Stdout/Stderr**: Collected automatically by Mittwald platform
- **Log Retention**: TBD (confirm with Mittwald - likely 7-30 days)
- **Access Method**: `mw container logs` CLI command or web dashboard

**Recommended Architecture**:
```
┌─────────────────────────────────────────────────────────────┐
│                  Application Logs                            │
│  (console.log, logger.info, logger.error)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                  stdout/stderr
                         │
                         ▼
         ┌───────────────────────────────┐
         │   Mittwald Log Collection     │
         │   (Platform-managed)          │
         └───────────────┬───────────────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
           ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────────┐
    │ Mittwald │  │ External │  │ Log Analysis │
    │ Dashboard│  │ SIEM     │  │ (Optional)   │
    │          │  │ (e.g.,   │  │ (e.g., ELK)  │
    │          │  │ Datadog) │  │              │
    └──────────┘  └──────────┘  └──────────────┘
```

**Implementation**:

1. **Structured Logging** (already implemented via Pino):
   ```typescript
   // src/utils/logger.ts - No changes needed
   import pino from 'pino';

   export const logger = pino({
     level: process.env.LOG_LEVEL || 'info',
     formatters: {
       level: (label) => ({ level: label }),
     },
     timestamp: pino.stdTimeFunctions.isoTime,
   });
   ```

2. **Log Filtering via Mittwald CLI**:
   ```bash
   # Replace scripts/tail-registration-logs.sh with:

   #!/usr/bin/env bash
   # scripts/mittwald-registration-logs.sh

   set -euo pipefail

   APP_NAME="${1:-oauth-bridge}"

   # Tail logs and filter for registration events
   mw container logs "$APP_NAME" --follow --since 1h | \
     jq -r 'select(.event | startswith("registration_")) |
       [
         (.time / 1000 | gmtime | strftime("%Y-%m-%dT%H:%M:%SZ")),
         .event,
         "client=" + (.clientId // "n/a"),
         "outcome=" + (.outcome // "n/a")
       ] | join(" | ")'
   ```

3. **External SIEM Integration** (optional):
   ```yaml
   # If using Datadog, Sentry, etc.
   # Add log shipping sidecar or use Mittwald integration

   # Example: Datadog Agent sidecar (if Mittwald supports)
   containers:
     - name: oauth-bridge
       image: registry.mittwald.cloud/oauth-bridge:latest

     - name: datadog-agent
       image: datadog/agent:latest
       env:
         - name: DD_API_KEY
           valueFrom:
             secretKeyRef:
               name: datadog-secret
               key: api-key
         - name: DD_LOGS_ENABLED
           value: "true"
         - name: DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL
           value: "true"
   ```

#### B. Metrics and Monitoring

**Metrics to Track**:

| Metric | Threshold | Alert Trigger | Action |
|--------|-----------|---------------|--------|
| **HTTP 5xx Rate** | < 0.1% | > 1% for 5 min | Page on-call |
| **OAuth Authorization Success** | > 99% | < 95% for 2 min | Page on-call |
| **Token Exchange Latency (p95)** | < 500ms | > 2s for 5 min | Investigate |
| **MCP Tool Execution Latency (p95)** | < 3s | > 10s for 5 min | Investigate |
| **Redis Connection Errors** | 0 | > 5 in 1 min | Page on-call |
| **Memory Usage** | < 400MB | > 450MB sustained | Scale up |
| **CPU Usage** | < 70% | > 90% sustained | Scale up |
| **Active Sessions** | N/A | Track for capacity planning | Monitor |

**Monitoring Stack Options**:

**Option A: Mittwald Native Monitoring**
- Use Mittwald dashboard for basic metrics
- CPU, memory, request count, error rate
- Limited customization
- No cost

**Option B: Prometheus + Grafana**
```typescript
// Add Prometheus metrics endpoint
// src/server/metrics.ts
import prometheus from 'prom-client';

const register = new prometheus.Registry();

// Default metrics (CPU, memory, event loop)
prometheus.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const oauthAuthorizationCounter = new prometheus.Counter({
  name: 'oauth_authorizations_total',
  help: 'Total OAuth authorization requests',
  labelNames: ['outcome'], // success, failure
  registers: [register],
});

// Expose /metrics endpoint
export function setupMetricsEndpoint(app: express.Application) {
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
}
```

**Grafana Dashboard** (example):
```json
{
  "dashboard": {
    "title": "Mittwald MCP Server",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m])"
          }
        ]
      },
      {
        "title": "OAuth Success Rate",
        "targets": [
          {
            "expr": "rate(oauth_authorizations_total{outcome=\"success\"}[5m]) / rate(oauth_authorizations_total[5m])"
          }
        ]
      }
    ]
  }
}
```

**Option C: Datadog/New Relic** (commercial)
- Full-featured APM
- Log aggregation + metrics + traces
- Pre-built dashboards
- Cost: ~$15-30/host/month

**Recommendation**: Start with **Option A** (Mittwald native) + custom logs, add **Option B** (Prometheus) if detailed metrics needed.

#### C. Alerting

**Alert Channels**:
- **Email**: Team distribution list
- **Slack**: `#mcp-alerts` channel
- **PagerDuty**: For critical production issues (optional)

**Alert Rules**:

```yaml
# Example alert configuration (Prometheus Alertmanager)
groups:
  - name: mcp_server_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High 5xx error rate detected"
          description: "{{ $value }} errors/sec for 5 minutes"

      - alert: OAuthFailureSpike
        expr: rate(oauth_authorizations_total{outcome="failure"}[2m]) / rate(oauth_authorizations_total[2m]) > 0.05
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "OAuth authorization failure rate > 5%"

      - alert: RedisConnectionFailure
        expr: increase(redis_connection_errors_total[1m]) > 5
        labels:
          severity: critical
        annotations:
          summary: "Redis connection failures detected"

      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Container using > 90% memory"
```

**Runbook** (create in wiki/docs):
- **Alert**: HighErrorRate
  - **Investigation**: Check logs for error messages, check Redis connectivity
  - **Mitigation**: Restart container if transient, scale up if load-related
  - **Escalation**: If > 15 min, page on-call engineer

#### D. Health Checks

**Existing Health Endpoints** (already implemented):
- `GET /health` - Returns 200 if healthy, 503 if Redis down
- `GET /version` - Returns git SHA, build time

**Enhanced Health Check** (add detailed diagnostics):
```typescript
// src/routes/health.ts
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: number;
  checks: {
    redis: 'up' | 'down';
    memory: { used: number; limit: number; percentage: number };
    uptime: number;
    lastError?: string;
  };
}

app.get('/health/detailed', async (req, res) => {
  const redisHealthy = await checkRedisHealth();
  const memUsage = process.memoryUsage();
  const memLimit = 512 * 1024 * 1024; // 512MB

  const health: HealthCheckResult = {
    status: redisHealthy ? 'healthy' : 'degraded',
    timestamp: Date.now(),
    checks: {
      redis: redisHealthy ? 'up' : 'down',
      memory: {
        used: memUsage.heapUsed,
        limit: memLimit,
        percentage: (memUsage.heapUsed / memLimit) * 100,
      },
      uptime: process.uptime(),
    },
  };

  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});
```

---

## 3. Executable CI/CD Deployment Plan

### Problem Statement
Current migration guide uses placeholders like "mittwald-deploy" and "TBD: Mittwald deployment CLI" without concrete commands.

### Mittwald Deployment Research

Based on web search findings, Mittwald provides:
- **CLI**: `mw` command-line tool
- **API**: REST API for programmatic deployments
- **Container Commands**:
  - `mw container run` - Start a container
  - `mw container recreate --pull` - Update container with latest image
  - `mw registry create` - Create container registry

**Documentation**: https://developer.mittwald.de/docs/v2/platform/workloads/containers/

### Concrete GitHub Actions Workflow

```yaml
# .github/workflows/deploy-mittwald.yml
name: Deploy to Mittwald Container Platform

on:
  push:
    branches: [ main ]
    paths:
      - 'packages/**'
      - 'src/**'
      - '.github/workflows/deploy-mittwald.yml'
  workflow_dispatch:

env:
  MITTWALD_REGISTRY: registry.mittwald.de/${{ secrets.MITTWALD_PROJECT_ID }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    outputs:
      git_sha: ${{ steps.meta.outputs.sha }}
      build_time: ${{ steps.meta.outputs.build_time }}
      oauth_image: ${{ steps.meta.outputs.oauth_image }}
      mcp_image: ${{ steps.meta.outputs.mcp_image }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node 20
        uses: actions/setup-node@v4
        with:
          node-version: '20.11.1'
          cache: 'npm'

      - name: Compute build metadata
        id: meta
        run: |
          SHA_SHORT=${GITHUB_SHA::8}
          BUILD_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
          echo "sha=${GITHUB_SHA}" >> $GITHUB_OUTPUT
          echo "build_time=${BUILD_TIME}" >> $GITHUB_OUTPUT
          echo "oauth_image=${MITTWALD_REGISTRY}/oauth-bridge:${SHA_SHORT}" >> $GITHUB_OUTPUT
          echo "mcp_image=${MITTWALD_REGISTRY}/mcp-server:${SHA_SHORT}" >> $GITHUB_OUTPUT

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Mittwald Registry
        run: |
          echo "${{ secrets.MITTWALD_REGISTRY_TOKEN }}" | \
            docker login registry.mittwald.de \
              -u ${{ secrets.MITTWALD_REGISTRY_USER }} \
              --password-stdin

      - name: Build and push OAuth Bridge
        uses: docker/build-push-action@v5
        with:
          context: packages/oauth-bridge
          file: packages/oauth-bridge/Dockerfile
          push: true
          tags: |
            ${{ steps.meta.outputs.oauth_image }}
            ${{ env.MITTWALD_REGISTRY }}/oauth-bridge:latest
          build-args: |
            GIT_SHA=${{ steps.meta.outputs.sha }}
            BUILD_TIME=${{ steps.meta.outputs.build_time }}
          cache-from: type=registry,ref=${{ env.MITTWALD_REGISTRY }}/oauth-bridge:latest
          cache-to: type=inline

      - name: Build and push MCP Server
        uses: docker/build-push-action@v5
        with:
          context: .
          file: Dockerfile
          push: true
          tags: |
            ${{ steps.meta.outputs.mcp_image }}
            ${{ env.MITTWALD_REGISTRY }}/mcp-server:latest
          build-args: |
            GIT_SHA=${{ steps.meta.outputs.sha }}
            BUILD_TIME=${{ steps.meta.outputs.build_time }}
          cache-from: type=registry,ref=${{ env.MITTWALD_REGISTRY }}/mcp-server:latest
          cache-to: type=inline

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    timeout-minutes: 30
    strategy:
      fail-fast: false
      matrix:
        include:
          - app: oauth-bridge
            container_id: ${{ secrets.MITTWALD_OAUTH_CONTAINER_ID }}
            hostname: oauth.mcp.mittwald.cloud
          - app: mcp-server
            container_id: ${{ secrets.MITTWALD_MCP_CONTAINER_ID }}
            hostname: mcp.mittwald.cloud

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install Mittwald CLI
        run: |
          # Official Mittwald CLI installation
          curl -sSL https://raw.githubusercontent.com/mittwald/cli/main/install.sh | bash
          echo "$HOME/.local/bin" >> $GITHUB_PATH

      - name: Authenticate with Mittwald
        run: |
          # Use API token for authentication
          mw login --token "${{ secrets.MITTWALD_API_TOKEN }}"

      - name: Update container image
        id: deploy
        run: |
          # Method 1: Recreate container with new image
          IMAGE="${{ matrix.app == 'oauth-bridge' && needs.build-and-push.outputs.oauth_image || needs.build-and-push.outputs.mcp_image }}"

          echo "Deploying $IMAGE to container ${{ matrix.container_id }}"

          # Stop current container
          mw container stop ${{ matrix.container_id }} || true

          # Update container with new image
          mw container recreate \
            --container-id ${{ matrix.container_id }} \
            --image "$IMAGE" \
            --pull

          # Start container
          mw container start ${{ matrix.container_id }}

          echo "deployment_id=${{ matrix.container_id }}" >> $GITHUB_OUTPUT

      - name: Wait for container to be healthy
        timeout-minutes: 5
        run: |
          echo "Waiting for ${{ matrix.hostname }}/health to return 200..."

          for i in {1..60}; do
            if curl -f --max-time 5 "https://${{ matrix.hostname }}/health" 2>/dev/null; then
              echo "✅ Container is healthy"
              exit 0
            fi
            echo "Attempt $i/60 failed, retrying in 5s..."
            sleep 5
          done

          echo "❌ Health check failed after 5 minutes"
          exit 1

      - name: Verify deployed version
        run: |
          VERSION=$(curl -fsSL "https://${{ matrix.hostname }}/version")
          echo "$VERSION" | jq .

          DEPLOYED_SHA=$(echo "$VERSION" | jq -r '.gitSha')
          EXPECTED_SHA="${{ needs.build-and-push.outputs.git_sha }}"

          if [ "$DEPLOYED_SHA" != "$EXPECTED_SHA" ]; then
            echo "❌ Version mismatch: deployed=$DEPLOYED_SHA, expected=$EXPECTED_SHA"
            exit 1
          fi

          echo "✅ Verified deployment: $DEPLOYED_SHA"

      - name: Rollback on failure
        if: failure()
        run: |
          echo "Deployment failed, attempting rollback..."

          # Get previous image tag (latest-1)
          PREVIOUS_IMAGE="${MITTWALD_REGISTRY}/${{ matrix.app }}:previous"

          # Rollback to previous image
          mw container stop ${{ matrix.container_id }} || true
          mw container recreate \
            --container-id ${{ matrix.container_id }} \
            --image "$PREVIOUS_IMAGE"
          mw container start ${{ matrix.container_id }}

  smoke-tests:
    needs: [build-and-push, deploy]
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci --no-audit --no-fund

      - name: Install Newman
        run: npm i -g newman

      - name: Run Postman smoke tests
        run: |
          newman run tests/postman/Mittwald-MCP.postman_collection.json \
            -e tests/postman/Mittwald-MCP.postman_environment.json \
            --env-var mcp_base=https://mcp.mittwald.cloud \
            --env-var as_base=https://oauth.mcp.mittwald.cloud

      - name: Run OAuth E2E tests
        env:
          OAUTH_SERVER_URL: https://oauth.mcp.mittwald.cloud
          MCP_SERVER_URL: https://mcp.mittwald.cloud
        run: npm run test:smoke

      - name: Notify on failure
        if: failure()
        run: |
          # Send Slack notification
          curl -X POST "${{ secrets.SLACK_WEBHOOK_URL }}" \
            -H 'Content-Type: application/json' \
            -d '{
              "text": "🚨 Mittwald deployment smoke tests failed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Deployment*: ${{ github.sha }}\n*Status*: Failed\n*Workflow*: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
                  }
                }
              ]
            }'
```

### Required GitHub Secrets

```bash
# Mittwald Platform Secrets
MITTWALD_API_TOKEN            # API token for mw CLI authentication
MITTWALD_PROJECT_ID           # Mittwald project ID (e.g., p-xxxxx)
MITTWALD_REGISTRY_USER        # Container registry username
MITTWALD_REGISTRY_TOKEN       # Container registry token

# Container IDs (obtained after initial container creation)
MITTWALD_OAUTH_CONTAINER_ID   # OAuth bridge container ID (e.g., c-xxxxx)
MITTWALD_MCP_CONTAINER_ID     # MCP server container ID (e.g., c-xxxxx)

# Application Secrets (injected via Mittwald env vars)
MITTWALD_JWT_SIGNING_KEY            # Generate: openssl rand -base64 32
MITTWALD_OAUTH_BRIDGE_JWT_SECRET    # Generate: openssl rand -hex 32
MITTWALD_REDIS_URL                  # From Mittwald Redis provisioning

# Monitoring (optional)
SLACK_WEBHOOK_URL             # For deployment notifications
```

### Initial Container Setup

**One-time manual setup via Mittwald CLI**:

```bash
# 1. Create container registry (if not exists)
mw registry create \
  --description "MCP OAuth Bridge Images" \
  --uri registry.mittwald.de/p-xxxxx

# 2. Build and push initial images
docker build -t registry.mittwald.de/p-xxxxx/oauth-bridge:initial packages/oauth-bridge
docker push registry.mittwald.de/p-xxxxx/oauth-bridge:initial

docker build -t registry.mittwald.de/p-xxxxx/mcp-server:initial .
docker push registry.mittwald.de/p-xxxxx/mcp-server:initial

# 3. Create OAuth Bridge container
OAUTH_CONTAINER_ID=$(mw container run \
  --image registry.mittwald.de/p-xxxxx/oauth-bridge:initial \
  --port 3000 \
  --env NODE_ENV=production \
  --env PORT=3000 \
  --env BRIDGE_BASE_URL=https://oauth.mcp.mittwald.cloud \
  --env BRIDGE_ISSUER=https://oauth.mcp.mittwald.cloud \
  --env BRIDGE_JWT_SECRET="${OAUTH_BRIDGE_JWT_SECRET}" \
  --env REDIS_URL="${REDIS_URL}" \
  --env MITTWALD_AUTHORIZATION_URL=https://studio.mittwald.de/api/oauth/authorize \
  --env MITTWALD_TOKEN_URL=https://studio.mittwald.de/api/oauth/token \
  --env MITTWALD_CLIENT_ID="${MITTWALD_CLIENT_ID}" \
  --format json | jq -r '.id')

echo "OAuth Container ID: $OAUTH_CONTAINER_ID"
# Save to GitHub secret: MITTWALD_OAUTH_CONTAINER_ID

# 4. Create MCP Server container
MCP_CONTAINER_ID=$(mw container run \
  --image registry.mittwald.de/p-xxxxx/mcp-server:initial \
  --port 8080 \
  --env NODE_ENV=production \
  --env PORT=8080 \
  --env MCP_PUBLIC_BASE=https://mcp.mittwald.cloud \
  --env OAUTH_AS_BASE=https://oauth.mcp.mittwald.cloud \
  --env JWT_SIGNING_KEY="${JWT_SIGNING_KEY}" \
  --env OAUTH_BRIDGE_JWT_SECRET="${OAUTH_BRIDGE_JWT_SECRET}" \
  --env REDIS_URL="${REDIS_URL}" \
  --format json | jq -r '.id')

echo "MCP Container ID: $MCP_CONTAINER_ID"
# Save to GitHub secret: MITTWALD_MCP_CONTAINER_ID

# 5. Configure health checks (if not automatic)
mw container update \
  --container-id "$OAUTH_CONTAINER_ID" \
  --health-check-path /health \
  --health-check-interval 15s

mw container update \
  --container-id "$MCP_CONTAINER_ID" \
  --health-check-path /health \
  --health-check-interval 30s
```

### Alternative: Kubernetes-based Deployment

If Mittwald uses Kubernetes under the hood:

```yaml
# kubernetes/oauth-bridge-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: oauth-bridge
  namespace: mittwald-mcp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: oauth-bridge
  template:
    metadata:
      labels:
        app: oauth-bridge
    spec:
      containers:
      - name: oauth-bridge
        image: registry.mittwald.de/p-xxxxx/oauth-bridge:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: PORT
          value: "3000"
        - name: BRIDGE_JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: oauth-secrets
              key: jwt-secret
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 15
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
        resources:
          requests:
            memory: "256Mi"
            cpu: "500m"
          limits:
            memory: "512Mi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: oauth-bridge
spec:
  selector:
    app: oauth-bridge
  ports:
  - port: 80
    targetPort: 3000
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: oauth-bridge
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - oauth.mcp.mittwald.cloud
    secretName: oauth-bridge-tls
  rules:
  - host: oauth.mcp.mittwald.cloud
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: oauth-bridge
            port:
              number: 80
```

**Deploy with kubectl**:
```bash
kubectl apply -f kubernetes/oauth-bridge-deployment.yaml
kubectl apply -f kubernetes/mcp-server-deployment.yaml

# Watch rollout
kubectl rollout status deployment/oauth-bridge -n mittwald-mcp
kubectl rollout status deployment/mcp-server -n mittwald-mcp
```

---

## 4. Build Artifacts and Test Fixtures Cleanup

### Problem Statement
Build artifacts (`build/`) and test fixtures contain hardcoded Fly.io URLs that will persist after migration unless explicitly cleaned up.

### Audit Results

**Build Artifacts** (6 files):
- `build/middleware/session-auth.js`
- `build/server.js`
- `build/routes/oauth-metadata-routes.js`
- `build/server/oauth-middleware.js`
- `build/routes/oauth-proxy-routes.js`
- `build/oauth/authorization-server.js`

**Test Files** (3 files):
- `tests/vitest.config.ts:31-32`
- `tests/postman/Mittwald-MCP.postman_environment.json:5-6`
- `tests/utils/remote.ts:16-17`
- `tests/integration/mittwald-integration.test.ts:20`
- `tests/unit/server/oauth-middleware.test.ts:42, 181, 250-256`
- `tests/unit/mcp-server/jwt-validation.test.ts:22, 24, 52, 80`

### Cleanup Strategy

#### A. Build Artifacts

**Problem**: Build artifacts are generated from TypeScript source and inherit hardcoded URLs.

**Solution**: Clean build artifacts are regenerated on every deployment.

**Action Required**: None (build artifacts are ephemeral)

**Verification**:
```bash
# After migration code changes, rebuild
npm run build

# Verify new URLs in build artifacts
grep -r "fly.dev" build/
# Should return 0 results (only mittwald.cloud or env vars)
```

#### B. Test Configuration Files

**File 1**: `tests/vitest.config.ts`

**Current**:
```typescript
// tests/vitest.config.ts:31-32
env: {
  OAUTH_SERVER_URL: 'https://mittwald-oauth-server.fly.dev',
  MCP_SERVER_URL: 'https://mittwald-mcp-fly2.fly.dev',
}
```

**Updated**:
```typescript
// tests/vitest.config.ts:31-32
env: {
  OAUTH_SERVER_URL: process.env.OAUTH_SERVER_URL || 'https://oauth.mcp.mittwald.cloud',
  MCP_SERVER_URL: process.env.MCP_SERVER_URL || 'https://mcp.mittwald.cloud',
  // Keep Fly.io as fallback during transition (remove after migration)
  // OAUTH_SERVER_URL_LEGACY: 'https://mittwald-oauth-server.fly.dev',
}
```

---

**File 2**: `tests/postman/Mittwald-MCP.postman_environment.json`

**Current**:
```json
{
  "name": "Mittwald MCP",
  "values": [
    { "key": "mcp_base", "value": "https://mittwald-mcp-fly2.fly.dev", "enabled": true },
    { "key": "as_base",  "value": "https://mittwald-oauth-server.fly.dev", "enabled": true }
  ]
}
```

**Updated**:
```json
{
  "name": "Mittwald MCP - Production",
  "values": [
    { "key": "mcp_base", "value": "https://mcp.mittwald.cloud", "enabled": true },
    { "key": "as_base",  "value": "https://oauth.mcp.mittwald.cloud", "enabled": true }
  ]
}
```

**Also Create**: `tests/postman/Mittwald-MCP-Fly-Legacy.postman_environment.json`
```json
{
  "name": "Mittwald MCP - Fly.io (Legacy)",
  "values": [
    { "key": "mcp_base", "value": "https://mittwald-mcp-fly2.fly.dev", "enabled": true },
    { "key": "as_base",  "value": "https://mittwald-oauth-server.fly.dev", "enabled": true }
  ]
}
```

---

**File 3**: `tests/utils/remote.ts`

**Current**:
```typescript
// tests/utils/remote.ts:16-17
const DEFAULT_OAUTH_BASE = 'https://mittwald-oauth-server.fly.dev';
const DEFAULT_MCP_BASE = 'https://mittwald-mcp-fly2.fly.dev';
```

**Updated**:
```typescript
// tests/utils/remote.ts:16-17
const DEFAULT_OAUTH_BASE = process.env.OAUTH_SERVER_URL || 'https://oauth.mcp.mittwald.cloud';
const DEFAULT_MCP_BASE = process.env.MCP_SERVER_URL || 'https://mcp.mittwald.cloud';
```

---

**File 4**: `tests/integration/mittwald-integration.test.ts`

**Current**:
```typescript
// tests/integration/mittwald-integration.test.ts:20
// Test that https://mittwald-oauth-server.fly.dev/mittwald/callback is whitelisted
```

**Updated**:
```typescript
// tests/integration/mittwald-integration.test.ts:20
// Test that https://oauth.mcp.mittwald.cloud/mittwald/callback is whitelisted
// Legacy: https://mittwald-oauth-server.fly.dev/mittwald/callback (deprecated, remove after 2026-01-01)
```

---

**File 5**: `tests/unit/server/oauth-middleware.test.ts`

**Current** (multiple occurrences):
```typescript
process.env.OAUTH_AS_BASE = 'https://mittwald-oauth-server.fly.dev';

expect(response.headers['www-authenticate']).toBe(
  'Bearer realm="MCP Server", authorization_uri="https://mittwald-oauth-server.fly.dev/authorize"'
);
```

**Updated**:
```typescript
const OAUTH_BASE = process.env.TEST_OAUTH_BASE || 'https://oauth.mcp.mittwald.cloud';

process.env.OAUTH_AS_BASE = OAUTH_BASE;

expect(response.headers['www-authenticate']).toBe(
  `Bearer realm="MCP Server", authorization_uri="${OAUTH_BASE}/authorize"`
);
```

**Or use test fixture**:
```typescript
// tests/fixtures/urls.ts (new file)
export const TEST_OAUTH_BASE = process.env.TEST_OAUTH_BASE || 'https://oauth.mcp.mittwald.cloud';
export const TEST_MCP_BASE = process.env.TEST_MCP_BASE || 'https://mcp.mittwald.cloud';

// For backward compatibility during migration
export const LEGACY_OAUTH_BASE = 'https://mittwald-oauth-server.fly.dev';
export const LEGACY_MCP_BASE = 'https://mittwald-mcp-fly2.fly.dev';
```

Then update all test files:
```typescript
import { TEST_OAUTH_BASE, TEST_MCP_BASE } from '../fixtures/urls';

process.env.OAUTH_AS_BASE = TEST_OAUTH_BASE;
```

---

**File 6**: `tests/unit/mcp-server/jwt-validation.test.ts`

**Current**:
```typescript
const validPayload = {
  iss: 'https://mittwald-oauth-server.fly.dev',
  sub: 'user-123',
  aud: 'https://mittwald-mcp-fly2.fly.dev/mcp',
  ...
};
```

**Updated**:
```typescript
import { TEST_OAUTH_BASE, TEST_MCP_BASE } from '../../fixtures/urls';

const validPayload = {
  iss: TEST_OAUTH_BASE,
  sub: 'user-123',
  aud: `${TEST_MCP_BASE}/mcp`,
  ...
};
```

---

### Cleanup Checklist

**Pre-Migration** (Week 1):
- [ ] Create `tests/fixtures/urls.ts` with configurable test URLs
- [ ] Update `tests/vitest.config.ts` to use env vars
- [ ] Update Postman environment files (create both Mittwald and Fly legacy versions)
- [ ] Update `tests/utils/remote.ts` to use env vars
- [ ] Update all test files to import from `tests/fixtures/urls.ts`
- [ ] Run full test suite to verify no breakage
- [ ] Commit changes

**Post-Migration** (Week 4):
- [ ] Verify `npm run build` generates artifacts with Mittwald URLs only
- [ ] Run `grep -r "fly.dev" build/` → should return 0 results
- [ ] Run `grep -r "fly.dev" tests/` → should only be in legacy comments
- [ ] Remove Fly.io legacy Postman environment after 3 months
- [ ] Remove legacy URL comments after 6 months

---

## 5. Runtime Feature Parity Mapping

### Problem Statement
The migration guide marks critical Fly.io features as "TBD" without concrete Mittwald equivalents:
- Auto-start/stop machines
- Concurrency limits
- Scaling configuration
- Multi-zone deployment

### Fly.io Features Analysis

**Current Fly.io Configuration** (`packages/mcp-server/fly.toml`):

```toml
[services.concurrency]
  soft_limit = 80    # Graceful throttling starts at 80 concurrent requests
  hard_limit = 100   # Hard limit, reject new connections

[[vm]]
  memory = "512mb"
  cpu_kind = "shared"
  cpus = 1

[http_service]
  auto_start_machines = true   # Start machines on incoming requests
  auto_stop_machines = true    # Stop after idle period
  min_machines_running = 1     # Always keep 1 machine running
```

### Mittwald Equivalents

Based on Mittwald container platform research, here's the feature mapping:

| Fly.io Feature | Mittwald Equivalent | Configuration Method | Notes |
|----------------|---------------------|----------------------|-------|
| **auto_start_machines** | Container auto-restart | `mw container update --restart-policy always` | Restart on crash, not on-demand start |
| **auto_stop_machines** | ❌ Not supported | N/A | Mittwald containers run continuously |
| **min_machines_running** | Replica count | `kubectl scale deployment oauth-bridge --replicas=2` | If using Kubernetes backend |
| **Concurrency soft/hard** | NGINX rate limiting | Custom NGINX config or ingress annotations | Requires custom configuration |
| **Memory limit** | Resource limits | `--memory 512Mi` (mw CLI) or Kubernetes resources | Supported |
| **CPU limit** | Resource limits | `--cpu 1000m` (mw CLI) or Kubernetes resources | Supported |
| **Multi-zone HA** | Multi-region deployment | Mittwald cluster config (TBD) | Confirm with Mittwald support |

### Recommended Mittwald Configuration

#### A. Auto-Scaling (Replace Fly.io auto-start/stop)

**Fly.io Behavior**:
- Scale to 0 when idle
- Auto-start on request
- Cost optimization via "machines" model

**Mittwald Equivalent**: **Cannot scale to 0** (containers run continuously)

**Options**:
1. **Accept always-on model** (recommended for production)
   - OAuth bridge: 1 replica always running
   - MCP server: 1-2 replicas always running
   - Cost: Fixed monthly fee (not pay-per-request like Fly.io)

2. **Manual scaling for cost optimization** (not recommended):
   ```bash
   # Scale down during off-hours (not automated)
   mw container stop $CONTAINER_ID

   # Scale up for business hours
   mw container start $CONTAINER_ID
   ```

**Recommendation**: Use always-on model (Option 1). The cost difference is negligible for production services.

#### B. Concurrency Control

**Fly.io**: Built-in soft/hard limits at platform level

**Mittwald**: Requires custom implementation

**Option 1: NGINX Rate Limiting** (if Mittwald uses NGINX ingress)
```nginx
# mittwald-ingress-annotations.yaml (if using Kubernetes)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: oauth-bridge
  annotations:
    nginx.ingress.kubernetes.io/limit-rps: "80"           # Soft limit: 80 req/sec
    nginx.ingress.kubernetes.io/limit-connections: "100"   # Hard limit: 100 concurrent
    nginx.ingress.kubernetes.io/limit-burst-multiplier: "5"
spec:
  rules:
  - host: oauth.mcp.mittwald.cloud
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: oauth-bridge
            port:
              number: 80
```

**Option 2: Application-Level Rate Limiting** (if no ingress control)
```typescript
// Add to src/server.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 80, // 80 requests per second (soft limit)
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
```

**Option 3: Accept no concurrency limits** (simplest)
- Rely on horizontal scaling (add more replicas)
- Monitor for overload, scale proactively
- Mittwald infrastructure handles basic DDoS protection

**Recommendation**: Start with **Option 3** (no custom limits), add **Option 2** (app-level) if needed based on production metrics.

#### C. High Availability

**Current Fly.io**:
- Single replica (`min_machines_running = 1`)
- No multi-zone specified
- Auto-restart on crash

**Recommended Mittwald HA Configuration**:

```yaml
# kubernetes/oauth-bridge-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: oauth-bridge
spec:
  replicas: 2  # Run 2 instances for HA

  # Pod anti-affinity: spread across zones
  affinity:
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
            - key: app
              operator: In
              values:
              - oauth-bridge
          topologyKey: topology.kubernetes.io/zone

  template:
    spec:
      containers:
      - name: oauth-bridge
        image: registry.mittwald.de/oauth-bridge:latest
        resources:
          requests:
            memory: "256Mi"
            cpu: "500m"
          limits:
            memory: "512Mi"
            cpu: "1000m"

        # Readiness probe (don't send traffic until ready)
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
          failureThreshold: 3

        # Liveness probe (restart if unhealthy)
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 20
          failureThreshold: 5
```

**CLI Equivalent** (if not using Kubernetes):
```bash
# Create 2 containers for HA
OAUTH_1=$(mw container run --image oauth-bridge:latest ...)
OAUTH_2=$(mw container run --image oauth-bridge:latest ...)

# Configure load balancer to distribute traffic
mw loadbalancer create \
  --target $OAUTH_1 \
  --target $OAUTH_2 \
  --health-check /health
```

#### D. Resource Limits

**Recommended Configuration**:

| Service | Memory Request | Memory Limit | CPU Request | CPU Limit | Rationale |
|---------|----------------|--------------|-------------|-----------|-----------|
| **OAuth Bridge** | 256Mi | 512Mi | 500m (0.5 vCPU) | 1000m (1 vCPU) | Lightweight, mostly I/O |
| **MCP Server** | 512Mi | 1Gi | 1000m (1 vCPU) | 2000m (2 vCPU) | Memory for CLI output caching, CPU for tool execution |

**Justification**:
- Current Fly.io: 512MB memory, 1 shared CPU
- MCP Server needs more headroom for concurrent tool executions
- OAuth Bridge is lightweight (just JWT signing, Redis lookups)

### Decision Matrix

| Feature | Keep Fly.io Equivalent | Accept Mittwald Default | Custom Implementation |
|---------|------------------------|-------------------------|----------------------|
| Auto-start/stop | ❌ Not possible | ✅ Always-on (recommended) | ⚠️ Manual scripting (not recommended) |
| Concurrency limits | ⚠️ App-level rate limiting | ✅ No limits (start here) | ⚠️ NGINX ingress (if needed) |
| Memory/CPU limits | ✅ Use Kubernetes resources | ❌ Too risky | N/A |
| HA (multi-zone) | ✅ 2+ replicas with anti-affinity | ❌ Single instance too risky | N/A |
| Health checks | ✅ Readiness + liveness probes | ❌ No health checks too risky | N/A |

### Final Recommendations

1. **Accept always-on model** - Don't try to replicate Fly.io auto-scaling
2. **Start with 1 replica** - Add 2nd replica after validating production traffic
3. **No custom concurrency limits initially** - Add if metrics show overload
4. **Use generous resource limits** - 512Mi/1vCPU for OAuth, 1Gi/2vCPU for MCP
5. **Implement robust health checks** - Readiness + liveness probes

---

## 6. OAuth Registration Monitoring Replacement

### Problem Statement
`scripts/tail-registration-logs.sh` depends on `fly logs` and will break after migration. No replacement tooling documented.

### Current Script Analysis

**File**: `scripts/tail-registration-logs.sh`

**Purpose**: Monitor OAuth client registration lifecycle events in real-time

**Functionality**:
- Tails Fly.io logs (`fly logs --json`)
- Filters for events starting with `registration_`
- Formats output: timestamp, event, client_id, outcome, redirect_uris

**Sample Output**:
```
2025-10-04T14:23:45Z | registration_attempt | client=n/a | outcome=n/a | grants=authorization_code,refresh_token | redirects=https://chatgpt.com/connector_platform_oauth_redirect | ip=1.2.3.4
2025-10-04T14:23:46Z | registration_success | client=abc123 | outcome=success | grants=authorization_code,refresh_token | redirects=https://chatgpt.com/connector_platform_oauth_redirect | ip=1.2.3.4
```

### Mittwald Replacement Options

#### Option 1: Mittwald CLI Log Tailing (Recommended)

**New Script**: `scripts/mittwald-registration-logs.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

# Mittwald OAuth Registration Log Monitor
# Replacement for tail-registration-logs.sh (Fly.io version)

APP_NAME="${1:-oauth-bridge}"
SINCE="${2:-1h}"

# Check if mw CLI is installed
if ! command -v mw &> /dev/null; then
    echo "Error: Mittwald CLI (mw) not found. Install: https://developer.mittwald.de/docs/v2/cli/" >&2
    exit 1
fi

# Tail logs and filter for registration events
mw container logs "$APP_NAME" --follow --since "$SINCE" --format json | \
  jq -r '
    # Parse Pino JSON log format
    select(.event != null) |
    select(.event | type == "string" and startswith("registration_")) |

    # Extract fields
    (.time / 1000 | gmtime | strftime("%Y-%m-%dT%H:%M:%SZ")) as $ts |
    (.redirectUris // []) as $uris |
    (.grantTypes // []) as $grants |
    ($uris | if length > 0 then join(",") else "-" end) as $uriString |
    ($grants | if length > 0 then join(",") else "-" end) as $grantString |
    (.outcome // "n/a") as $outcome |
    (.clientId // "n/a") as $client |
    (.tokenEndpointAuthMethod // "n/a") as $auth |
    (.ip // "n/a") as $ip |
    (.path // "") as $path |
    (.userAgent // "") as $ua |
    (.metadata // null) as $metadata |
    (.request // null) as $request |
    (.error // null) as $error |
    (.error_description // null) as $errDesc |

    # Format output
    [
      $ts,
      .event,
      "outcome=" + $outcome,
      "client=" + $client,
      "auth=" + $auth,
      "grants=" + $grantString,
      "redirects=" + $uriString,
      "ip=" + $ip
    ] | join(" | ") |
    . + (if $path != "" then "\n    path=" + $path else "" end) +
        (if $ua != "" then "\n    ua=" + $ua else "" end) +
        (if $metadata != null then "\n    metadata=" + ($metadata | tojson) else "" end) +
        (if $request != null then "\n    request=" + ($request | tojson) else "" end) +
        (if $error != null then "\n    error=" + $error + (if $errDesc != null then " (" + $errDesc + ")" else "" end) else "" end)
  '
```

**Usage**:
```bash
# Monitor OAuth bridge registration events (last 1 hour)
./scripts/mittwald-registration-logs.sh oauth-bridge 1h

# Monitor MCP server (last 24 hours)
./scripts/mittwald-registration-logs.sh mcp-server 24h

# Follow logs in real-time
./scripts/mittwald-registration-logs.sh oauth-bridge 5m
```

**Installation**:
```bash
# Make executable
chmod +x scripts/mittwald-registration-logs.sh

# Add to package.json
{
  "scripts": {
    "logs:registration": "bash scripts/mittwald-registration-logs.sh oauth-bridge 1h",
    "logs:registration:follow": "bash scripts/mittwald-registration-logs.sh oauth-bridge 5m"
  }
}
```

---

#### Option 2: Log Aggregation Dashboard

**If Mittwald provides log aggregation UI**, configure saved searches:

**Search Query**:
```
event:registration_* AND service:oauth-bridge
```

**Saved Search**: "OAuth Client Registrations"
- Time range: Last 24 hours
- Refresh: 30 seconds
- Columns: timestamp, event, clientId, outcome, redirectUris

---

#### Option 3: External Log Aggregation (Datadog, Splunk)

**If using external SIEM**:

**Datadog Log Monitor**:
```yaml
# datadog/oauth-registration-monitor.yaml
name: OAuth Client Registration Monitor
type: log alert
query: |
  logs("service:oauth-bridge event:registration_*").rollup("count").last("5m") > 10
message: |
  High OAuth registration activity detected: {{value}} registrations in 5 minutes

  Top clients:
  {{#aggregations}}
  - {{clientId}}: {{count}} registrations
  {{/aggregations}}

  Check for abuse: https://oauth.mcp.mittwald.cloud/admin/registrations
tags:
  - service:oauth-bridge
  - security:registration
notify:
  - slack-mcp-alerts
  - email:security@example.com
```

**Splunk Query**:
```spl
index=mittwald sourcetype=container_logs service=oauth-bridge event=registration_*
| stats count by clientId, redirectUris, outcome
| sort -count
```

---

#### Option 4: Real-Time Alert (Replace Monitoring)

**Instead of manual log tailing, set up alerts**:

**Prometheus Alert**:
```yaml
# prometheus/oauth-alerts.yaml
groups:
  - name: oauth_registration
    interval: 1m
    rules:
      - alert: HighRegistrationRate
        expr: rate(oauth_registrations_total[5m]) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High OAuth client registration rate"
          description: "{{ $value }} registrations/sec in last 5 minutes"

      - alert: RegistrationFailureSpike
        expr: rate(oauth_registrations_total{outcome="failure"}[5m]) / rate(oauth_registrations_total[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "OAuth registration failure spike"
          description: "{{ $value | humanizePercentage }} of registrations failing"
```

**Application Metrics** (add to `src/routes/register.ts`):
```typescript
import { oauthRegistrationCounter } from '../metrics';

// Track registration attempts
oauthRegistrationCounter.inc({ outcome: 'attempt' });

// Track registration outcomes
oauthRegistrationCounter.inc({ outcome: 'success', clientId: client.client_id });
// OR
oauthRegistrationCounter.inc({ outcome: 'failure', error: 'invalid_redirect_uri' });
```

---

### Recommended Approach

**Short-term** (Week 1-2):
- Deploy **Option 1** (Mittwald CLI script) as direct replacement
- Test with `npm run logs:registration`
- Document in README

**Medium-term** (Month 1-2):
- Set up **Option 4** (Prometheus alerts) for proactive monitoring
- Reduce reliance on manual log tailing

**Long-term** (Month 3+):
- Integrate **Option 3** (external SIEM) if needed for compliance
- Archive manual log tailing scripts

---

## Migration Checklist Updates

### Critical Path Items (Must Complete Before Migration)

**Domain Strategy** (Week -6 to -4):
- [ ] **DECISION REQUIRED**: Choose Option 1 (Fly proxy), Option 2 (immediate migration), or Option 3 (hybrid)
- [ ] If Option 2/3: Contact Mittwald OAuth team for whitelist update process
- [ ] If Option 2/3: Submit whitelist request with new callback URLs
- [ ] If Option 1: Deploy NGINX proxy to Fly.io, test end-to-end

**Observability** (Week -4 to -2):
- [ ] Confirm Mittwald log retention policy
- [ ] Set up Mittwald CLI log monitoring script
- [ ] Define alert thresholds and notification channels
- [ ] Test health check endpoints with Mittwald ingress

**CI/CD** (Week -4 to -1):
- [ ] Install Mittwald CLI (`mw`) in local environment
- [ ] Create initial containers via `mw container run`
- [ ] Save container IDs to GitHub secrets
- [ ] Test GitHub Actions workflow in staging
- [ ] Verify smoke tests pass with Mittwald URLs

**Code Changes** (Week -2 to -1):
- [ ] Create `tests/fixtures/urls.ts` with configurable URLs
- [ ] Update all test files to use test fixtures
- [ ] Update Postman environment files
- [ ] Run full test suite locally
- [ ] Commit and merge changes

**Runtime Configuration** (Week -1):
- [ ] **DECISION REQUIRED**: Accept always-on model (no auto-scaling)
- [ ] **DECISION REQUIRED**: Concurrency limits (none initially, add if needed)
- [ ] Configure resource limits (512Mi/1vCPU for OAuth, 1Gi/2vCPU for MCP)
- [ ] Configure health check intervals (15s for OAuth, 30s for MCP)

---

## Post-Migration Validation

### Week 1 Checks
- [ ] Verify Mittwald CLI log monitoring works
- [ ] Confirm metrics collection (if using Prometheus)
- [ ] Test alert delivery (trigger test alert)
- [ ] Verify no Fly.io URLs in build artifacts (`grep -r fly.dev build/`)
- [ ] Confirm all test fixtures use Mittwald URLs

### Month 1 Review
- [ ] Compare Mittwald vs Fly.io costs
- [ ] Evaluate auto-scaling need (can we accept always-on?)
- [ ] Review concurrency metrics (do we need rate limiting?)
- [ ] Assess HA requirements (do we need 2+ replicas?)

### Month 3 Cleanup
- [ ] Remove Fly.io proxy (if using Option 1/3)
- [ ] Delete Fly.io apps
- [ ] Remove Fly.io GitHub secrets
- [ ] Archive Fly.io configuration files
- [ ] Remove legacy test fixtures

---

## Appendix: Mittwald Contact Information

**To Be Completed** (obtain from Mittwald before migration):

| Category | Contact | SLA | Notes |
|----------|---------|-----|-------|
| **OAuth Whitelist Updates** | TBD | TBD | Critical for domain migration |
| **Container Platform Support** | TBD | TBD | For deployment issues |
| **Redis/Database Support** | TBD | TBD | For data persistence |
| **Network/DNS Support** | TBD | TBD | For domain configuration |
| **Billing/Account** | TBD | TBD | For cost inquiries |
| **Emergency Escalation** | TBD | TBD | For production outages |

**Action**: Request this information from Mittwald account manager during kickoff meeting.

---

**Document Version**: 1.0
**Last Updated**: 2025-10-04
**Status**: Pre-Migration - Gaps Addressed
**Next Review**: After Mittwald contact information obtained
