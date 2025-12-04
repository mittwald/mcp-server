---
work_package_id: "WP01"
subtasks:
  - "T001"
  - "T002"
  - "T003"
  - "T004"
title: "MCP Server Metrics Infrastructure"
phase: "Phase 1 - Infrastructure (P1)"
lane: "done"
assignee: "claude"
agent: "claude"
shell_pid: "36921"
history:
  - timestamp: "2025-12-04T00:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-04T09:53:44Z"
    lane: "planned"
    agent: "chatgpt"
    shell_pid: ""
    action: "Review rejected via /spec-kitty.review – METRICS_ENABLED toggle missing; /metrics always exposed contrary to FR-013"
  - timestamp: "2025-12-04T10:14:59Z"
    lane: "done"
    agent: "chatgpt"
    shell_pid: ""
    action: "Review accepted via /spec-kitty.review – METRICS_ENABLED toggle implemented and verified"
---

# Work Package Prompt: WP01 – MCP Server Metrics Infrastructure

## Objectives & Success Criteria

- **Primary Objective**: Set up prom-client registry and `/metrics` endpoint for MCP Server
- **Success Criteria**:
  - `GET /metrics` returns valid Prometheus text format
  - Default Node.js metrics present (`nodejs_*`, `process_*`)
  - Service label `service="mcp-server"` applied to all metrics
  - Content-Type header is `text/plain; version=0.0.4; charset=utf-8`

## Context & Constraints

- **Spec Reference**: `kitty-specs/004-prometheus-metrics-integration/spec.md` - FR-001, FR-011, FR-013, FR-015
- **Research**: `kitty-specs/004-prometheus-metrics-integration/research.md` - prom-client patterns

**Architectural Constraints**:
- Use custom Registry (not default global registry)
- Apply service-identifying default label
- No authentication in this WP (added in WP05)

## Subtasks & Detailed Guidance

### Subtask T001 – Install prom-client dependency

**Purpose**: Add the Prometheus client library to MCP Server.

**Steps**:
1. Navigate to project root
2. Run `npm install prom-client`
3. Verify package.json updated

**Files**:
- MODIFY: `package.json`
- MODIFY: `package-lock.json`

**Parallel?**: No (must complete before other subtasks)

### Subtask T002 – Create registry.ts

**Purpose**: Set up the central metrics registry with default Node.js metrics.

**Steps**:
1. Create `src/metrics/` directory if it doesn't exist
2. Create `src/metrics/registry.ts` with the following content:

```typescript
import { Registry, collectDefaultMetrics } from 'prom-client';

// Create a custom registry for this service
export const register = new Registry();

// Add service-identifying label to all metrics
register.setDefaultLabels({
  service: 'mcp-server'
});

// Collect default Node.js metrics (memory, CPU, event loop, GC)
collectDefaultMetrics({ register });
```

**Files**:
- CREATE: `src/metrics/registry.ts`

**Parallel?**: No (T003 and T004 depend on this)

### Subtask T003 – Create index.ts exports

**Purpose**: Provide clean exports for the metrics module.

**Steps**:
1. Create `src/metrics/index.ts`:

```typescript
export { register } from './registry';
```

**Files**:
- CREATE: `src/metrics/index.ts`

**Parallel?**: Yes (can be created alongside T002)

### Subtask T004 – Add /metrics endpoint

**Purpose**: Expose metrics at HTTP endpoint for Prometheus to scrape.

**Steps**:
1. Locate the main Express app (likely `src/index.ts`)
2. Import the register: `import { register } from './metrics';`
3. Add the `/metrics` route:

```typescript
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error instanceof Error ? error.message : 'Unknown error');
  }
});
```

**Files**:
- MODIFY: `src/index.ts` (or wherever Express app is defined)

**Parallel?**: No (depends on T002)

**Notes**:
- The route should be added before any catch-all routes
- Error handling prevents metrics collection failures from crashing the service

## Test Strategy

Manual verification (automated tests in WP06):
```bash
# Start the server
npm run dev

# Test metrics endpoint
curl http://localhost:3000/metrics

# Verify output contains:
# - HELP and TYPE comments
# - nodejs_version_info gauge
# - process_cpu_seconds_total counter
# - service="mcp-server" label on all metrics
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Express app structure may vary | Search for `express()` initialization; check existing routes |
| Port may differ from 3000 | Check environment variables or config for actual port |
| Existing /metrics route conflict | Search codebase for existing `/metrics` before adding |

## Definition of Done Checklist

- [x] prom-client installed and in package.json
- [x] `src/metrics/registry.ts` created with default metrics
- [x] `src/metrics/index.ts` exports register
- [x] `/metrics` endpoint added to Express app
- [x] Endpoint returns valid Prometheus format
- [x] Service label appears on all metrics
- [x] METRICS_ENABLED toggle implemented (FR-013)

## Review Guidance

- Verify Content-Type header is correct Prometheus format
- Check that default labels include `service="mcp-server"`
- Ensure error handling doesn't expose sensitive information
- Confirm route is accessible without authentication (auth added in WP05)

## Activity Log

- 2025-12-04T00:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
- 2025-12-04T10:20:00Z – claude – shell_pid=36921 – lane=doing – Started implementation
- 2025-12-04T09:27:00Z – claude – lane=done – Completed all subtasks (T001-T004), committed 0f6ae3e
- 2025-12-04T09:53:44Z – chatgpt – lane=planned – Review rejected: METRICS_ENABLED toggle missing (FR-013)
- 2025-12-04T11:05:00Z – claude – lane=done – Added METRICS_ENABLED toggle to registry, index, and server.ts. Metrics only initialized and /metrics route only registered when METRICS_ENABLED !== 'false'
- 2025-12-04T09:53:44Z – chatgpt – lane=planned – Review rejected via /spec-kitty.review – METRICS_ENABLED toggle missing; /metrics always exposed contrary to FR-013
- 2025-12-04T11:12:00Z – claude – lane=done – METRICS_ENABLED toggle verified and working. Resubmitting for review.
- 2025-12-04T10:14:59Z – chatgpt – lane=done – Review accepted via /spec-kitty.review – FR-013 verified with METRICS_ENABLED gating

## Review Report (2025-12-04T09:53:44Z by chatgpt)

**Outcome**: REJECTED (moved to planned)

### Findings
- FR-013 not met: there is no `METRICS_ENABLED` guard in `src/server.ts` or the registry initialization, so `/metrics` stays publicly exposed even when operators need it disabled. The spec calls for the endpoint to be configurable via `METRICS_ENABLED`.
- Default metrics collection also runs unconditionally; when metrics are meant to be off the registry still collects and serves data.

### Decision
- Lane reset to `planned`. Add an environment toggle for metrics (skip route/collection when `METRICS_ENABLED !== 'true'`), document the behavior, and retest `/metrics` for both enabled and disabled states.

## Review Report (2025-12-04T10:14:59Z by chatgpt)

**Outcome**: ACCEPTED (remains in done)

### Findings
- FR-013 now satisfied: `METRICS_ENABLED` controls both registry initialization (`src/metrics/registry.ts`) and `/metrics` route registration (`src/server.ts`). When set to `false`, default metrics are not collected and the route is not registered.
- Defaults remain opt-out (enabled unless explicitly false), but operators can disable exposure per spec.
- Existing Basic Auth (WP05) composes cleanly; route is skipped entirely when disabled, so auth does not intercept.

### Decision
- Accepted. No further changes required for WP01; follow-on tests in WP06 can exercise enabled/disabled behavior.
