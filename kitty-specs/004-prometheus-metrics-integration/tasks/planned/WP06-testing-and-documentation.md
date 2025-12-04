---
work_package_id: "WP06"
subtasks:
  - "T022"
  - "T023"
  - "T024"
  - "T025"
  - "T026"
title: "Testing & Documentation"
phase: "Phase 3 - Polish (P2)"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
history:
  - timestamp: "2025-12-04T00:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP06 – Testing & Documentation

## Objectives & Success Criteria

- **Primary Objective**: Add comprehensive tests and documentation for metrics functionality
- **Success Criteria**:
  - Unit tests pass for registry and middleware
  - Integration tests verify endpoint behavior
  - README documents all metrics and configuration
  - .env.example includes metrics environment variables

## Context & Constraints

- **Spec Reference**: `kitty-specs/004-prometheus-metrics-integration/spec.md` - All success criteria
- **Depends On**: WP01-WP05 (all functionality must be implemented)

**Architectural Constraints**:
- Use existing test framework (likely Vitest or Jest)
- Follow existing test patterns in the codebase
- Documentation should match existing README style

## Subtasks & Detailed Guidance

### Subtask T022 – Create unit tests for registry

**Purpose**: Verify registry creates default metrics and applies labels correctly.

**Steps**:
1. Create `tests/unit/metrics/registry.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { register } from '../../../src/metrics/registry';

describe('Metrics Registry', () => {
  it('should create a registry with default labels', async () => {
    const metrics = await register.metrics();

    // Verify service label is present
    expect(metrics).toContain('service="mcp-server"');
  });

  it('should collect default Node.js metrics', async () => {
    const metrics = await register.metrics();

    // Verify default metrics are present
    expect(metrics).toContain('nodejs_version_info');
    expect(metrics).toContain('process_cpu_seconds_total');
    expect(metrics).toContain('nodejs_heap_size_total_bytes');
  });

  it('should return valid Prometheus text format', async () => {
    const metrics = await register.metrics();

    // Verify format includes HELP and TYPE comments
    expect(metrics).toMatch(/# HELP \w+ .+/);
    expect(metrics).toMatch(/# TYPE \w+ (counter|gauge|histogram|summary)/);
  });
});
```

**Files**:
- CREATE: `tests/unit/metrics/registry.test.ts`

**Parallel?**: Yes (can proceed alongside T023)

**Notes**:
- Create similar test for OAuth Bridge at `packages/oauth-bridge/tests/metrics/registry.test.ts`

### Subtask T023 – Create unit tests for auth middleware

**Purpose**: Verify auth middleware correctly handles all authentication scenarios.

**Steps**:
1. Create `tests/unit/metrics/auth-middleware.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

describe('Metrics Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      send: vi.fn()
    };
    mockNext = vi.fn();
  });

  describe('when auth is not configured', () => {
    beforeEach(() => {
      delete process.env.METRICS_USER;
      delete process.env.METRICS_PASS;
    });

    it('should allow access without credentials', async () => {
      // Re-import to pick up env changes
      const { metricsAuth } = await import('../../../src/metrics/auth-middleware');

      metricsAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('when auth is configured', () => {
    beforeEach(() => {
      process.env.METRICS_USER = 'testuser';
      process.env.METRICS_PASS = 'testpass';
    });

    afterEach(() => {
      delete process.env.METRICS_USER;
      delete process.env.METRICS_PASS;
    });

    it('should return 401 without credentials', async () => {
      const { metricsAuth } = await import('../../../src/metrics/auth-middleware');

      metricsAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.set).toHaveBeenCalledWith('WWW-Authenticate', 'Basic realm="metrics"');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 with invalid credentials', async () => {
      const { metricsAuth } = await import('../../../src/metrics/auth-middleware');
      const invalidAuth = Buffer.from('wrong:wrong').toString('base64');
      mockReq.headers = { authorization: `Basic ${invalidAuth}` };

      metricsAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow access with valid credentials', async () => {
      const { metricsAuth } = await import('../../../src/metrics/auth-middleware');
      const validAuth = Buffer.from('testuser:testpass').toString('base64');
      mockReq.headers = { authorization: `Basic ${validAuth}` };

      metricsAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});
```

**Files**:
- CREATE: `tests/unit/metrics/auth-middleware.test.ts`

**Parallel?**: Yes (can proceed alongside T022)

**Notes**:
- May need to reset module cache between tests due to env var changes
- Create similar test for OAuth Bridge

### Subtask T024 – Create integration tests for /metrics endpoint

**Purpose**: Verify the complete metrics endpoint works end-to-end.

**Steps**:
1. Create `tests/integration/metrics-endpoint.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index'; // Adjust import path

describe('GET /metrics', () => {
  it('should return 200 with Prometheus text format', async () => {
    const response = await request(app)
      .get('/metrics')
      .expect(200);

    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.text).toContain('# HELP');
    expect(response.text).toContain('# TYPE');
  });

  it('should include service label on all metrics', async () => {
    const response = await request(app)
      .get('/metrics')
      .expect(200);

    // Every metric line should have service label
    const lines = response.text.split('\n')
      .filter(line => !line.startsWith('#') && line.trim() !== '');

    for (const line of lines) {
      expect(line).toContain('service="mcp-server"');
    }
  });

  it('should include default Node.js metrics', async () => {
    const response = await request(app)
      .get('/metrics')
      .expect(200);

    expect(response.text).toContain('nodejs_version_info');
    expect(response.text).toContain('process_');
  });
});
```

**Files**:
- CREATE: `tests/integration/metrics-endpoint.test.ts`

**Parallel?**: No (may need app setup coordination)

**Notes**:
- Install supertest if not already present: `npm install -D supertest @types/supertest`
- Create similar test for OAuth Bridge

### Subtask T025 – Update README.md with metrics documentation

**Purpose**: Document all metrics and configuration for operators.

**Steps**:
1. Add a new section to `README.md`:

```markdown
## Prometheus Metrics

Both the MCP Server and OAuth Bridge expose Prometheus-compatible metrics at `/metrics`.

### Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `METRICS_USER` | Basic auth username for /metrics | (none - no auth) |
| `METRICS_PASS` | Basic auth password for /metrics | (none - no auth) |

When both `METRICS_USER` and `METRICS_PASS` are set, Basic Authentication is required to access the metrics endpoint.

### Available Metrics

#### MCP Server

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `mcp_tool_calls_total` | Counter | `tool_name`, `status` | Total MCP tool invocations |
| `mcp_tool_duration_seconds` | Histogram | `tool_name` | Tool execution duration |
| `mcp_active_connections` | Gauge | - | Current active connections |
| `mittwald_cli_calls_total` | Counter | `command`, `status` | Mittwald CLI invocations |

#### OAuth Bridge

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `oauth_authorization_requests_total` | Counter | `client_id`, `status` | Authorization requests |
| `oauth_token_requests_total` | Counter | `grant_type`, `status` | Token exchange requests |
| `oauth_dcr_registrations_total` | Counter | `status` | DCR registrations |
| `oauth_state_store_size` | Gauge | - | Redis state entries |

Both services also expose default Node.js metrics (`nodejs_*`, `process_*`).

### Prometheus Scrape Configuration

```yaml
scrape_configs:
  - job_name: 'mittwald-mcp-server'
    static_configs:
      - targets: ['mcp-server:3000']
    # Uncomment if authentication is enabled:
    # basic_auth:
    #   username: prometheus
    #   password: your-secret

  - job_name: 'mittwald-oauth-bridge'
    static_configs:
      - targets: ['oauth-bridge:3001']
```

### Example PromQL Queries

```promql
# Tool call rate per minute
rate(mcp_tool_calls_total[1m])

# Tool error rate
sum(rate(mcp_tool_calls_total{status="error"}[5m])) / sum(rate(mcp_tool_calls_total[5m]))

# 95th percentile tool latency
histogram_quantile(0.95, rate(mcp_tool_duration_seconds_bucket[5m]))

# OAuth token success rate
sum(rate(oauth_token_requests_total{status="success"}[5m])) / sum(rate(oauth_token_requests_total[5m]))
```
```

**Files**:
- MODIFY: `README.md`

**Parallel?**: Yes (can proceed alongside T022-T024)

### Subtask T026 – Update .env.example

**Purpose**: Document metrics environment variables for developers.

**Steps**:
1. Add to `.env.example`:

```bash
# Prometheus Metrics Authentication (optional)
# When both are set, Basic Auth is required for /metrics endpoint
# METRICS_USER=prometheus
# METRICS_PASS=your-secret-password
```

**Files**:
- MODIFY: `.env.example`

**Parallel?**: Yes (can proceed alongside other documentation tasks)

## Test Strategy

Run all tests:
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# All tests
npm test

# Verify documentation renders correctly
# Review README.md in GitHub/editor preview
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Test framework differences | Check existing tests for patterns |
| Supertest not installed | Add as dev dependency |
| Module caching in tests | Use dynamic imports or vi.resetModules() |

## Definition of Done Checklist

- [ ] Registry unit tests created and passing
- [ ] Auth middleware unit tests created and passing
- [ ] Integration tests for /metrics endpoint created and passing
- [ ] README.md updated with metrics documentation
- [ ] .env.example updated with metrics variables
- [ ] All tests pass in CI (if applicable)

## Review Guidance

- Verify tests cover all documented acceptance criteria
- Check documentation matches actual implementation
- Ensure example PromQL queries work with actual metric names
- Verify .env.example comments are clear

## Activity Log

- 2025-12-04T00:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
