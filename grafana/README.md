# Grafana OOM Monitoring Dashboard

## Quick Setup

### 1. Import Dashboard to Grafana

```bash
# Via UI:
# 1. Go to Grafana → Dashboards → Import
# 2. Upload oom-monitoring-dashboard.json
# 3. Select your Prometheus datasource
# 4. Click Import

# Via API:
curl -X POST https://your-grafana/api/dashboards/db \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @oom-monitoring-dashboard.json
```

### 2. Configure Prometheus Alerts

```bash
# Copy alerts to Prometheus config directory
cp prometheus-alerts.yml /etc/prometheus/

# Add to prometheus.yml:
rule_files:
  - "prometheus-alerts.yml"

# Reload Prometheus
curl -X POST http://localhost:9090/-/reload
```

### 3. Access Dashboard

```
https://mittwald-prometheus.fly.dev/grafana/dashboards
```

## Dashboard Panels

### Row 1: Memory Overview
- **Memory Pressure** - Heap usage % with color-coded thresholds
- **Process Memory** - Resident memory, heap used/total

### Row 2: Tool Memory Analysis
- **Top 10 Memory Tools** - Tools consuming most memory
- **Memory Delta Over Time** - Memory usage trends per tool

### Row 3: Performance
- **Slow Tools** - Executions >5s, >30s
- **Duration p95** - 95th percentile latency per tool

### Row 4: Health Indicators
- **Active Connections** - Current connection count
- **Success Rate** - Percentage of successful tool calls
- **Event Loop Lag** - Node.js responsiveness

### Row 5: Diagnostics
- **CLI Execution Rate** - Rate of CLI command calls
- **Memory Leak Detector** - Heap growth rate (MB/s)

## Alert Descriptions

| Alert | Threshold | Action |
|-------|-----------|--------|
| **CriticalMemoryPressure** | Heap >90% for 1min | OOM imminent - investigate immediately |
| **HighMemoryPressure** | Heap >75% for 5min | Monitor closely, prepare to scale |
| **MemoryLeakDetected** | Heap grows >1MB/s for 10min | Check for leaking tools |
| **SlowToolExecution** | p95 >30s for 5min | Tool performance issue |
| **HighMemoryToolDetected** | Avg >50MB per call | Consider caching or optimization |
| **HighEventLoopLag** | p95 >100ms for 2min | Server overload |
| **ToolErrorRate** | >10% errors for 5min | Tool failure spike |

## Useful Queries

### Find memory-hungry tools
```promql
topk(10, sum by (tool_name) (mcp_tool_memory_delta_mb_sum) / sum by (tool_name) (mcp_tool_memory_delta_mb_count))
```

### Detect memory leaks
```promql
deriv(nodejs_heap_size_used_bytes[10m]) / 1024 / 1024
```

### Find slowest tools
```promql
histogram_quantile(0.95, sum by (tool_name, le) (rate(mcp_tool_duration_seconds_bucket[5m])))
```

### Memory pressure correlation with errors
```promql
mcp_memory_pressure_percent and on() sum(rate(mcp_tool_calls_total{status="error"}[5m]))
```

## Troubleshooting

### Dashboard shows no data
1. Check Prometheus is scraping metrics: `https://mittwald-mcp-fly2.fly.dev/metrics`
2. Verify datasource in Grafana
3. Check time range (default: Last 6 hours)

### Alerts not firing
1. Verify `prometheus-alerts.yml` is loaded: `http://prometheus:9090/rules`
2. Check alert state: `http://prometheus:9090/alerts`
3. Verify Alertmanager is configured

### High memory but no OOM
- This is expected! The alerts warn BEFORE OOM occurs
- Review memory-hungry tools and optimize
- Consider increasing machine memory if sustained >75%
