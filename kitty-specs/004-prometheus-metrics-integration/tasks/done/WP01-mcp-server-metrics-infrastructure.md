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

## Review Guidance

- Verify Content-Type header is correct Prometheus format
- Check that default labels include `service="mcp-server"`
- Ensure error handling doesn't expose sensitive information
- Confirm route is accessible without authentication (auth added in WP05)

## Activity Log

- 2025-12-04T00:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
- 2025-12-04T10:20:00Z – claude – shell_pid=36921 – lane=doing – Started implementation
- 2025-12-04T09:27:00Z – claude – lane=done – Completed all subtasks (T001-T004), committed 0f6ae3e
