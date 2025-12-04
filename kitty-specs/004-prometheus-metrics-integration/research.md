# Research: Prometheus Metrics Integration

**Feature**: 004-prometheus-metrics-integration
**Date**: 2025-12-04

## Technology Decisions

### Decision 1: Metrics Library

**Decision**: Use `prom-client` (https://github.com/siimon/prom-client)

**Rationale**:
- De facto standard for Prometheus metrics in Node.js
- Supports all four Prometheus metric types (Counter, Gauge, Histogram, Summary)
- Built-in default metrics for Node.js runtime (memory, CPU, event loop, GC)
- Active maintenance, widely adopted
- No external dependencies for core functionality

**Alternatives considered**:
- `prometheus-client` - Less maintained, fewer features
- Custom implementation - Unnecessary complexity, reinventing the wheel
- OpenTelemetry - Overkill for this use case, adds significant complexity

### Decision 2: Code Organization

**Decision**: Duplicate metrics code per service (no shared package)

**Rationale**:
- Services may eventually be in separate repositories
- Metrics code is small (~100 lines per service)
- Avoids cross-service dependencies
- Simpler deployment and versioning
- Pattern can be copied and adapted

**Alternatives considered**:
- Shared `packages/metrics/` workspace package - Added complexity for minimal benefit
- Shared npm package - Overkill for ~100 lines of code

### Decision 3: Authentication Method

**Decision**: Basic Authentication (optional, configurable via environment variables)

**Rationale**:
- Simple to implement and configure
- Widely supported by Prometheus scrape configs
- Can be disabled for internal-network deployments
- No additional infrastructure required (vs. mTLS)

**Alternatives considered**:
- mTLS (Mutual TLS) - More secure but requires certificate management
- Bearer token - Similar complexity to Basic Auth, less standard for Prometheus
- No auth (network-level only) - Insufficient for some deployment scenarios

### Decision 4: Registry Pattern

**Decision**: One custom registry per service with default metrics enabled

**Rationale**:
- Isolates application metrics from any third-party library metrics
- Allows adding service-identifying labels to all metrics
- Default metrics provide valuable runtime observability

**Implementation pattern**:
```typescript
import { Registry, collectDefaultMetrics } from 'prom-client';

const register = new Registry();
register.setDefaultLabels({ service: 'mcp-server' });
collectDefaultMetrics({ register });
```

## Best Practices Applied

### Metric Naming Conventions

Following Prometheus naming conventions:
- Use snake_case for metric names
- Include unit in name suffix (`_seconds`, `_bytes`, `_total`)
- Use `_total` suffix for counters
- Prefix with service/subsystem name

**Examples**:
- `mcp_tool_calls_total` (counter)
- `mcp_tool_duration_seconds` (histogram)
- `oauth_authorization_requests_total` (counter)

### Label Cardinality

**Risk**: High cardinality labels can cause memory/performance issues.

**Mitigations**:
- `tool_name`: Limited to ~170 known MCP tools (bounded)
- `client_id`: Should be monitored; could grow unbounded with DCR
- `status`: Only `success`/`error` (2 values)
- `grant_type`: Limited OAuth grant types (bounded)

### Histogram Buckets

**Decision**: Use buckets optimized for API/CLI response times

```typescript
const buckets = [0.1, 0.5, 1, 2, 5, 10, 30];  // seconds
```

**Rationale**:
- 0.1s: Fast responses (cached, simple operations)
- 0.5s-2s: Typical API calls
- 5s-30s: Slow operations (complex CLI commands, network delays)

### Timer Pattern

Use `startTimer()` for accurate duration measurement:

```typescript
const end = histogram.startTimer({ tool_name: 'app_list' });
try {
  const result = await executeToolCall();
  end({ status: 'success' });
  return result;
} catch (error) {
  end({ status: 'error' });
  throw error;
}
```

## Express Integration Pattern

prom-client does not include web framework integration. Implement as middleware:

```typescript
app.get('/metrics', metricsAuthMiddleware, async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `METRICS_ENABLED` | Enable/disable metrics endpoint | `true` |
| `METRICS_USER` | Basic auth username | (none - no auth) |
| `METRICS_PASS` | Basic auth password | (none - no auth) |

When both `METRICS_USER` and `METRICS_PASS` are set, authentication is required.

## References

- [prom-client GitHub](https://github.com/siimon/prom-client)
- [Prometheus Metric Types](https://prometheus.io/docs/concepts/metric_types/)
- [Prometheus Naming Conventions](https://prometheus.io/docs/practices/naming/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/instrumentation/)
