---
work_package_id: WP05
title: Metrics Authentication Middleware
lane: done
history:
- timestamp: '2025-12-04T00:00:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
- timestamp: '2025-12-04T09:53:44Z'
  lane: done
  agent: chatgpt
  shell_pid: ''
  action: Review accepted via /spec-kitty.review – Basic Auth behavior verified on both services
agent: claude
assignee: claude
phase: Phase 2 - Security (P2)
shell_pid: ''
subtasks:
- T018
- T019
- T020
- T021
---

# Work Package Prompt: WP05 – Metrics Authentication Middleware

## Objectives & Success Criteria

- **Primary Objective**: Add optional Basic Auth protection to `/metrics` endpoints
- **Success Criteria**:
  - Returns 401 with `WWW-Authenticate: Basic` header when auth fails
  - Returns metrics when valid credentials provided
  - Allows access without authentication when env vars not set
  - Same behavior on both MCP Server and OAuth Bridge

## Context & Constraints

- **Spec Reference**: `kitty-specs/004-prometheus-metrics-integration/spec.md` - FR-012, FR-014, FR-016
- **Depends On**: WP01 (MCP Server endpoint), WP03 (OAuth Bridge endpoint)

**Architectural Constraints**:
- Environment variables: `METRICS_USER`, `METRICS_PASS`
- Auth is optional - only enforced when both env vars are set
- Standard HTTP Basic Authentication (RFC 7617)
- Code duplicated in both services (per planning decision)

## Subtasks & Detailed Guidance

### Subtask T018 – Create MCP Server auth middleware

**Purpose**: Implement Basic Auth middleware for MCP Server metrics.

**Steps**:
1. Create `src/metrics/auth-middleware.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';

const METRICS_USER = process.env.METRICS_USER;
const METRICS_PASS = process.env.METRICS_PASS;

/**
 * Optional Basic Auth middleware for /metrics endpoint.
 * Only enforces authentication if both METRICS_USER and METRICS_PASS are set.
 */
export function metricsAuth(req: Request, res: Response, next: NextFunction): void {
  // If no credentials configured, allow access
  if (!METRICS_USER || !METRICS_PASS) {
    return next();
  }

  const authHeader = req.headers.authorization;

  // No auth header provided
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.status(401)
      .set('WWW-Authenticate', 'Basic realm="metrics"')
      .send('Unauthorized');
    return;
  }

  // Decode and validate credentials
  try {
    const base64Credentials = authHeader.slice(6); // Remove 'Basic '
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [user, pass] = credentials.split(':');

    if (user === METRICS_USER && pass === METRICS_PASS) {
      return next();
    }
  } catch {
    // Invalid base64 or format
  }

  // Invalid credentials
  res.status(401)
    .set('WWW-Authenticate', 'Basic realm="metrics"')
    .send('Unauthorized');
}
```

2. Update exports in `src/metrics/index.ts`:

```typescript
export { register } from './registry';
export * from './mcp-metrics';
export { metricsAuth } from './auth-middleware';
```

**Files**:
- CREATE: `src/metrics/auth-middleware.ts`
- MODIFY: `src/metrics/index.ts`

**Parallel?**: No (T020 depends on this)

**Notes**:
- Use constant-time comparison in production to prevent timing attacks (optional enhancement)
- Don't log credentials or reveal which part (user/pass) was wrong

### Subtask T019 – Create OAuth Bridge auth middleware

**Purpose**: Implement Basic Auth middleware for OAuth Bridge metrics (same logic).

**Steps**:
1. Create `packages/oauth-bridge/src/metrics/auth-middleware.ts` with the same code as T018:

```typescript
import { Request, Response, NextFunction } from 'express';

const METRICS_USER = process.env.METRICS_USER;
const METRICS_PASS = process.env.METRICS_PASS;

export function metricsAuth(req: Request, res: Response, next: NextFunction): void {
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

  try {
    const base64Credentials = authHeader.slice(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [user, pass] = credentials.split(':');

    if (user === METRICS_USER && pass === METRICS_PASS) {
      return next();
    }
  } catch {
    // Invalid base64 or format
  }

  res.status(401)
    .set('WWW-Authenticate', 'Basic realm="metrics"')
    .send('Unauthorized');
}
```

2. Update exports in `packages/oauth-bridge/src/metrics/index.ts`:

```typescript
export { register } from './registry';
export * from './oauth-metrics';
export { metricsAuth } from './auth-middleware';
```

**Files**:
- CREATE: `packages/oauth-bridge/src/metrics/auth-middleware.ts`
- MODIFY: `packages/oauth-bridge/src/metrics/index.ts`

**Parallel?**: Yes (can proceed alongside T018)

### Subtask T020 – Update MCP Server /metrics route

**Purpose**: Apply auth middleware to MCP Server metrics endpoint.

**Steps**:
1. Locate the `/metrics` route in `src/index.ts`
2. Import middleware: `import { register, metricsAuth } from './metrics';`
3. Update route to use middleware:

```typescript
// Before (from WP01):
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// After (with auth):
app.get('/metrics', metricsAuth, async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error instanceof Error ? error.message : 'Unknown error');
  }
});
```

**Files**:
- MODIFY: `src/index.ts`

**Parallel?**: No (depends on T018)

### Subtask T021 – Update OAuth Bridge /metrics route

**Purpose**: Apply auth middleware to OAuth Bridge metrics endpoint.

**Steps**:
1. Locate the `/metrics` route in `packages/oauth-bridge/src/index.ts`
2. Import middleware: `import { register, metricsAuth } from './metrics';`
3. Update route to use middleware:

```typescript
app.get('/metrics', metricsAuth, async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error instanceof Error ? error.message : 'Unknown error');
  }
});
```

**Files**:
- MODIFY: `packages/oauth-bridge/src/index.ts`

**Parallel?**: Yes (can proceed alongside T020)

## Test Strategy

Manual verification:
```bash
# Test without auth configured (should allow access)
unset METRICS_USER METRICS_PASS
curl http://localhost:3000/metrics  # Should return metrics

# Test with auth configured
export METRICS_USER=prometheus
export METRICS_PASS=secret123

# Restart servers, then:
curl http://localhost:3000/metrics
# Expected: 401 Unauthorized

curl http://localhost:3000/metrics -I
# Expected: WWW-Authenticate: Basic realm="metrics"

curl -u prometheus:secret123 http://localhost:3000/metrics
# Expected: metrics output

curl -u wrong:wrong http://localhost:3000/metrics
# Expected: 401 Unauthorized
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing metrics access | Auth is optional - only enabled when env vars set |
| Credentials in logs | Never log the Authorization header or credentials |
| Timing attacks | Consider constant-time comparison (optional enhancement) |

## Definition of Done Checklist

- [x] MCP Server auth middleware created
- [x] OAuth Bridge auth middleware created
- [x] MCP Server `/metrics` route uses middleware
- [x] OAuth Bridge `/metrics` route uses middleware
- [x] Returns 401 without credentials when auth enabled
- [x] Returns 401 with invalid credentials
- [x] Returns metrics with valid credentials
- [x] Allows access without auth when env vars not set

## Review Guidance

- Verify 401 response includes `WWW-Authenticate: Basic realm="metrics"` header
- Check that invalid base64 or malformed credentials return 401 (not 500)
- Ensure credentials are not logged anywhere
- Test both with and without env vars set

## Activity Log

- 2025-12-04T00:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
- 2025-12-04T14:00:00Z – claude – lane=doing – Started WP05 implementation
- 2025-12-04T14:15:00Z – claude – lane=done – Completed all subtasks (T018-T021). Note: OAuth Bridge uses Koa (not Express as spec assumed). Created separate auth middleware for each framework with identical security logic. Used timingSafeEqual for constant-time comparison. Committed as fa0f85a.
- 2025-12-04T09:53:44Z – chatgpt – lane=done – Review accepted via /spec-kitty.review – Basic Auth behavior verified on both services

## Review Report (2025-12-04T09:53:44Z by chatgpt)

**Outcome**: ACCEPTED (remains in done)

### Findings
- FR-012/FR-014/FR-016 satisfied: both services wrap `/metrics` with Basic Auth that requires `METRICS_USER` and `METRICS_PASS`, responds with 401 + `WWW-Authenticate` on failure, and falls through when creds absent.
- Middleware implementations are framework-appropriate (Express + Koa) and use `timingSafeEqual` for credential comparison.
- Optional behavior respected: when env vars are unset, `/metrics` remains open.

### Notes
- When `METRICS_ENABLED` gating is added for WP01/WP03, ensure auth middleware still short-circuits cleanly when metrics are disabled.
