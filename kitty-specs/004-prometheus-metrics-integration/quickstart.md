# Quickstart: Prometheus Metrics Integration

## Prerequisites

- Node.js 18+
- npm
- Running MCP Server and/or OAuth Bridge
- (Optional) Prometheus instance for testing

## Installation

```bash
# In MCP Server root
npm install prom-client

# In OAuth Bridge
cd packages/oauth-bridge
npm install prom-client
```

## Quick Test

After implementation, verify metrics are exposed:

```bash
# MCP Server (default port 3000)
curl http://localhost:3000/metrics

# OAuth Bridge (default port 3001)
curl http://localhost:3001/metrics
```

Expected output (partial):
```
# HELP mcp_tool_calls_total Total number of MCP tool invocations
# TYPE mcp_tool_calls_total counter
mcp_tool_calls_total{tool_name="app_list",status="success",service="mcp-server"} 5

# HELP nodejs_version_info Node.js version info
# TYPE nodejs_version_info gauge
nodejs_version_info{version="v18.17.0",major="18",minor="17",patch="0"} 1
```

## Configuration

Set environment variables for authentication:

```bash
# Enable basic auth (optional)
export METRICS_USER=prometheus
export METRICS_PASS=your-secret-password
```

Test with authentication:
```bash
curl -u prometheus:your-secret-password http://localhost:3000/metrics
```

## Prometheus Scrape Config

Add to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'mittwald-mcp-server'
    static_configs:
      - targets: ['localhost:3000']
    # Uncomment if auth is enabled:
    # basic_auth:
    #   username: prometheus
    #   password: your-secret-password

  - job_name: 'mittwald-oauth-bridge'
    static_configs:
      - targets: ['localhost:3001']
```

## Key Metrics to Monitor

### MCP Server

| Metric | Type | Description |
|--------|------|-------------|
| `mcp_tool_calls_total` | Counter | Tool invocations by name and status |
| `mcp_tool_duration_seconds` | Histogram | Tool execution time |
| `mcp_active_connections` | Gauge | Current MCP connections |
| `mittwald_cli_calls_total` | Counter | Mittwald CLI invocations |

### OAuth Bridge

| Metric | Type | Description |
|--------|------|-------------|
| `oauth_authorization_requests_total` | Counter | Auth requests by client |
| `oauth_token_requests_total` | Counter | Token exchanges by grant type |
| `oauth_dcr_registrations_total` | Counter | Client registrations |
| `oauth_state_store_size` | Gauge | Redis state entries |

## Example PromQL Queries

```promql
# Tool call rate (per minute)
rate(mcp_tool_calls_total[1m])

# Tool error rate
sum(rate(mcp_tool_calls_total{status="error"}[5m]))
  / sum(rate(mcp_tool_calls_total[5m]))

# 95th percentile tool duration
histogram_quantile(0.95, rate(mcp_tool_duration_seconds_bucket[5m]))

# OAuth token exchange success rate
sum(rate(oauth_token_requests_total{status="success"}[5m]))
  / sum(rate(oauth_token_requests_total[5m]))
```

## Troubleshooting

### Metrics endpoint returns 404
- Verify the service is running
- Check that metrics code is properly initialized
- Ensure `/metrics` route is registered

### Metrics endpoint returns 401
- Basic auth is enabled but credentials not provided
- Check `METRICS_USER` and `METRICS_PASS` environment variables
- Verify credentials in curl/Prometheus config

### Missing application metrics
- Metrics only appear after first use (e.g., first tool call)
- Check that instrumentation code is in the request path
- Verify metric names match expected format

### High cardinality warning
- Monitor unique `client_id` values in OAuth metrics
- Consider aggregating by client type if needed
