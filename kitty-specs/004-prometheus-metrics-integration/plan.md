# Implementation Plan: Prometheus Metrics Integration

**Feature Branch**: `004-prometheus-metrics-integration`
**Created**: 2025-12-04
**Status**: Planning Complete

## Technical Context

| Decision | Choice | Source |
|----------|--------|--------|
| Metrics Library | `prom-client` | User requirement |
| Code Organization | Duplicated per service | Planning discussion |
| Authentication | Basic Auth (optional) | Planning discussion |
| Registry Pattern | Custom registry per service | Best practice |

## Constitution Check

No project constitution defined. Proceeding with standard best practices:
- Test coverage for new code
- No breaking changes to existing APIs
- Documentation for new environment variables

## Work Package Overview

| WP | Title | Priority | Dependencies | Estimated Effort |
|----|-------|----------|--------------|------------------|
| WP01 | MCP Server Metrics Infrastructure | P1 | None | Small |
| WP02 | MCP Server Application Metrics | P1 | WP01 | Medium |
| WP03 | OAuth Bridge Metrics Infrastructure | P1 | None | Small |
| WP04 | OAuth Bridge Application Metrics | P1 | WP03 | Medium |
| WP05 | Metrics Authentication Middleware | P2 | WP01, WP03 | Small |
| WP06 | Testing & Documentation | P2 | WP01-WP05 | Medium |

## Work Packages

---

### WP01 - MCP Server Metrics Infrastructure

**Objective**: Set up prom-client registry and `/metrics` endpoint for MCP Server

**Requirements Addressed**: FR-001, FR-011, FR-013, FR-015

**Files to Create/Modify**:
- CREATE: `src/metrics/registry.ts` - Registry setup with default metrics
- CREATE: `src/metrics/index.ts` - Exports
- MODIFY: `src/index.ts` - Add `/metrics` route

**Implementation Steps**:

1. Install prom-client dependency:
   ```bash
   npm install prom-client
   ```

2. Create metrics registry with default Node.js metrics:
   ```typescript
   // src/metrics/registry.ts
   import { Registry, collectDefaultMetrics } from 'prom-client';

   export const register = new Registry();
   register.setDefaultLabels({ service: 'mcp-server' });
   collectDefaultMetrics({ register });
   ```

3. Add `/metrics` endpoint to Express app:
   ```typescript
   app.get('/metrics', async (req, res) => {
     res.set('Content-Type', register.contentType);
     res.end(await register.metrics());
   });
   ```

**Acceptance Criteria**:
- [ ] `GET /metrics` returns valid Prometheus text format
- [ ] Default Node.js metrics present (nodejs_*, process_*)
- [ ] Service label `service="mcp-server"` applied to all metrics

---

### WP02 - MCP Server Application Metrics

**Objective**: Instrument MCP tool calls with counters, histograms, and gauges

**Requirements Addressed**: FR-002, FR-003, FR-004, FR-005

**Files to Create/Modify**:
- CREATE: `src/metrics/mcp-metrics.ts` - MCP-specific metrics
- MODIFY: `src/handlers/tool-handler.ts` - Instrument tool calls
- MODIFY: `src/utils/cli-wrapper.ts` - Instrument CLI calls
- MODIFY: `src/transports/*.ts` - Track active connections

**Metrics to Implement**:

```typescript
// src/metrics/mcp-metrics.ts
import { Counter, Histogram, Gauge } from 'prom-client';
import { register } from './registry';

export const toolCallsTotal = new Counter({
  name: 'mcp_tool_calls_total',
  help: 'Total number of MCP tool invocations',
  labelNames: ['tool_name', 'status'],
  registers: [register]
});

export const toolDuration = new Histogram({
  name: 'mcp_tool_duration_seconds',
  help: 'Duration of MCP tool executions',
  labelNames: ['tool_name'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register]
});

export const activeConnections = new Gauge({
  name: 'mcp_active_connections',
  help: 'Number of active MCP connections',
  registers: [register]
});

export const cliCallsTotal = new Counter({
  name: 'mittwald_cli_calls_total',
  help: 'Total calls to Mittwald CLI',
  labelNames: ['command', 'status'],
  registers: [register]
});
```

**Instrumentation Pattern**:
```typescript
const end = toolDuration.startTimer({ tool_name: toolName });
try {
  const result = await executeTool(toolName, args);
  toolCallsTotal.inc({ tool_name: toolName, status: 'success' });
  end();
  return result;
} catch (error) {
  toolCallsTotal.inc({ tool_name: toolName, status: 'error' });
  end();
  throw error;
}
```

**Acceptance Criteria**:
- [ ] `mcp_tool_calls_total` increments on each tool call
- [ ] `mcp_tool_duration_seconds` records accurate timing
- [ ] `mcp_active_connections` reflects actual connection count
- [ ] `mittwald_cli_calls_total` tracks CLI invocations

---

### WP03 - OAuth Bridge Metrics Infrastructure

**Objective**: Set up prom-client registry and `/metrics` endpoint for OAuth Bridge

**Requirements Addressed**: FR-006, FR-011, FR-013, FR-015

**Files to Create/Modify**:
- CREATE: `packages/oauth-bridge/src/metrics/registry.ts`
- CREATE: `packages/oauth-bridge/src/metrics/index.ts`
- MODIFY: `packages/oauth-bridge/src/index.ts` - Add `/metrics` route

**Implementation Steps**:

Same pattern as WP01, with service label `service="oauth-bridge"`.

**Acceptance Criteria**:
- [ ] `GET /metrics` returns valid Prometheus text format
- [ ] Default Node.js metrics present
- [ ] Service label `service="oauth-bridge"` applied

---

### WP04 - OAuth Bridge Application Metrics

**Objective**: Instrument OAuth flows with counters and gauges

**Requirements Addressed**: FR-007, FR-008, FR-009, FR-010

**Files to Create/Modify**:
- CREATE: `packages/oauth-bridge/src/metrics/oauth-metrics.ts`
- MODIFY: `packages/oauth-bridge/src/routes/authorize.ts`
- MODIFY: `packages/oauth-bridge/src/routes/token.ts`
- MODIFY: `packages/oauth-bridge/src/routes/register.ts`
- MODIFY: `packages/oauth-bridge/src/services/state-store.ts`

**Metrics to Implement**:

```typescript
// packages/oauth-bridge/src/metrics/oauth-metrics.ts
import { Counter, Gauge } from 'prom-client';
import { register } from './registry';

export const authorizationRequests = new Counter({
  name: 'oauth_authorization_requests_total',
  help: 'Total authorization requests',
  labelNames: ['client_id', 'status'],
  registers: [register]
});

export const tokenRequests = new Counter({
  name: 'oauth_token_requests_total',
  help: 'Total token exchange requests',
  labelNames: ['grant_type', 'status'],
  registers: [register]
});

export const dcrRegistrations = new Counter({
  name: 'oauth_dcr_registrations_total',
  help: 'Total DCR registrations',
  labelNames: ['status'],
  registers: [register]
});

export const stateStoreSize = new Gauge({
  name: 'oauth_state_store_size',
  help: 'Current entries in OAuth state store',
  registers: [register]
});
```

**Acceptance Criteria**:
- [ ] `oauth_authorization_requests_total` tracks auth requests by client
- [ ] `oauth_token_requests_total` tracks token exchanges by grant type
- [ ] `oauth_dcr_registrations_total` tracks DCR activity
- [ ] `oauth_state_store_size` reflects Redis state count

---

### WP05 - Metrics Authentication Middleware

**Objective**: Add optional Basic Auth protection to `/metrics` endpoints

**Requirements Addressed**: FR-012, FR-014, FR-016

**Files to Create/Modify**:
- CREATE: `src/metrics/auth-middleware.ts`
- CREATE: `packages/oauth-bridge/src/metrics/auth-middleware.ts`
- MODIFY: Both `/metrics` routes to use middleware

**Implementation**:

```typescript
// src/metrics/auth-middleware.ts
import { Request, Response, NextFunction } from 'express';

const METRICS_USER = process.env.METRICS_USER;
const METRICS_PASS = process.env.METRICS_PASS;

export function metricsAuth(req: Request, res: Response, next: NextFunction) {
  // If no credentials configured, allow access
  if (!METRICS_USER || !METRICS_PASS) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.status(401)
      .set('WWW-Authenticate', 'Basic realm="metrics"')
      .send('Unauthorized');
    return;
  }

  const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
  const [user, pass] = credentials.split(':');

  if (user !== METRICS_USER || pass !== METRICS_PASS) {
    res.status(401)
      .set('WWW-Authenticate', 'Basic realm="metrics"')
      .send('Unauthorized');
    return;
  }

  next();
}
```

**Acceptance Criteria**:
- [ ] Returns 401 with WWW-Authenticate header when auth fails
- [ ] Returns metrics when valid credentials provided
- [ ] Allows access without auth when env vars not set

---

### WP06 - Testing & Documentation

**Objective**: Add tests and documentation for metrics functionality

**Requirements Addressed**: All success criteria

**Files to Create/Modify**:
- CREATE: `tests/unit/metrics/registry.test.ts`
- CREATE: `tests/unit/metrics/auth-middleware.test.ts`
- CREATE: `tests/integration/metrics-endpoint.test.ts`
- CREATE: `packages/oauth-bridge/tests/metrics.test.ts`
- MODIFY: `README.md` - Add metrics documentation
- MODIFY: `.env.example` - Add metrics env vars

**Test Cases**:

1. **Registry Tests**:
   - Default metrics are collected
   - Service label is applied
   - Custom metrics are registered

2. **Auth Middleware Tests**:
   - Allows access when no credentials configured
   - Returns 401 without credentials when configured
   - Returns 401 with invalid credentials
   - Allows access with valid credentials

3. **Integration Tests**:
   - `/metrics` endpoint returns valid Prometheus format
   - Content-Type is correct
   - Metrics increment on tool calls

**Documentation**:

```markdown
## Prometheus Metrics

Both services expose Prometheus metrics at `/metrics`.

### Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `METRICS_USER` | Basic auth username | (none) |
| `METRICS_PASS` | Basic auth password | (none) |

### Available Metrics

**MCP Server**:
- `mcp_tool_calls_total{tool_name, status}`
- `mcp_tool_duration_seconds{tool_name}`
- `mcp_active_connections`
- `mittwald_cli_calls_total{command, status}`

**OAuth Bridge**:
- `oauth_authorization_requests_total{client_id, status}`
- `oauth_token_requests_total{grant_type, status}`
- `oauth_dcr_registrations_total{status}`
- `oauth_state_store_size`

### Prometheus Scrape Config

```yaml
scrape_configs:
  - job_name: 'mittwald-mcp'
    basic_auth:
      username: ${METRICS_USER}
      password: ${METRICS_PASS}
    static_configs:
      - targets: ['mcp-server:3000', 'oauth-bridge:3001']
```
```

**Acceptance Criteria**:
- [ ] Unit tests pass for registry and middleware
- [ ] Integration tests verify endpoint behavior
- [ ] README documents all metrics and configuration
- [ ] .env.example includes metrics variables

---

## Implementation Order

```
Phase 1 (Parallel):
   WP01: MCP Server Infrastructure
   WP03: OAuth Bridge Infrastructure

Phase 2 (Parallel, after Phase 1):
   WP02: MCP Application Metrics (depends on WP01)
   WP04: OAuth Application Metrics (depends on WP03)
   WP05: Auth Middleware (depends on WP01, WP03)

Phase 3 (Sequential):
   WP06: Testing & Documentation (depends on all)
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Label cardinality explosion | Low | Medium | Bounded tool names; monitor client_id growth |
| Performance impact | Low | Low | Metrics collection is lightweight |
| Breaking existing tests | Low | Medium | Add metrics as optional, test in isolation |

## Definition of Done

- [ ] All work packages completed
- [ ] All acceptance criteria met
- [ ] Tests passing (unit + integration)
- [ ] Documentation updated
- [ ] PR reviewed and merged
