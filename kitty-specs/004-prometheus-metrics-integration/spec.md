# Feature Specification: Prometheus Metrics Integration

**Feature Branch**: `004-prometheus-metrics-integration`
**Created**: 2025-12-04
**Status**: Draft
**Input**: Add Prometheus-compatible /metrics endpoints to both MCP Server and OAuth Bridge using prom-client library with optional basic authentication

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Operations Team Monitors MCP Server Health (Priority: P1)

As an operations engineer at Mittwald, I want to scrape metrics from the MCP Server so that I can monitor tool usage, performance, and system health in our Prometheus/Grafana stack.

**Why this priority**: Core functionality - without metrics exposure, no monitoring is possible. This is the primary value of the feature.

**Independent Test**: Can be fully tested by configuring Prometheus to scrape the MCP Server `/metrics` endpoint and verifying metrics appear in Prometheus UI.

**Acceptance Scenarios**:

1. **Given** the MCP Server is running with metrics enabled, **When** Prometheus scrapes `/metrics`, **Then** it receives valid Prometheus-format metrics including tool call counts and durations
2. **Given** the MCP Server receives tool invocations, **When** I query Prometheus, **Then** I see `mcp_tool_calls_total` counter incremented with correct `tool_name` and `status` labels
3. **Given** tools are being executed, **When** I view the `mcp_tool_duration_seconds` histogram, **Then** I see accurate timing distribution across defined buckets

---

### User Story 2 - Operations Team Monitors OAuth Bridge (Priority: P1)

As an operations engineer at Mittwald, I want to scrape metrics from the OAuth Bridge so that I can monitor authentication flows, token exchanges, and client registrations.

**Why this priority**: Equal priority to MCP metrics - OAuth health is critical for the overall system to function.

**Independent Test**: Can be fully tested by configuring Prometheus to scrape the OAuth Bridge `/metrics` endpoint and verifying OAuth-specific metrics appear.

**Acceptance Scenarios**:

1. **Given** the OAuth Bridge is running with metrics enabled, **When** Prometheus scrapes `/metrics`, **Then** it receives valid Prometheus-format metrics including authorization and token request counts
2. **Given** clients are authenticating, **When** I query `oauth_authorization_requests_total`, **Then** I see counts broken down by `client_id` and `status` (success/failure)
3. **Given** DCR registrations occur, **When** I query `oauth_dcr_registrations_total`, **Then** I see registration counts by status

---

### User Story 3 - Secure Metrics Access (Priority: P2)

As a security-conscious operator, I want the metrics endpoint to require authentication so that internal system metrics are not exposed to unauthorized parties.

**Why this priority**: Security hardening - important but the endpoint can be protected at network level initially if needed.

**Independent Test**: Can be tested by attempting to access `/metrics` without credentials and verifying rejection, then with valid credentials and verifying access.

**Acceptance Scenarios**:

1. **Given** metrics authentication is enabled, **When** a request to `/metrics` has no credentials, **Then** the server returns 401 Unauthorized with WWW-Authenticate header
2. **Given** metrics authentication is enabled, **When** a request includes valid Basic Auth credentials, **Then** the server returns metrics data
3. **Given** metrics authentication is disabled (environment variable not set), **When** a request to `/metrics` is made, **Then** metrics are served without authentication

---

### User Story 4 - Monitor Node.js Runtime Health (Priority: P3)

As an operations engineer, I want default Node.js runtime metrics so that I can monitor memory usage, CPU, garbage collection, and event loop health.

**Why this priority**: Useful for capacity planning but secondary to application-specific metrics.

**Independent Test**: Can be tested by querying for `nodejs_*` and `process_*` metrics from either service.

**Acceptance Scenarios**:

1. **Given** either service is running with metrics enabled, **When** I scrape `/metrics`, **Then** I receive default Node.js metrics including `nodejs_heap_size_total_bytes`, `nodejs_eventloop_lag_seconds`, and `process_cpu_seconds_total`

---

### Edge Cases

- What happens when metrics endpoint is called during high load? Metrics collection should not significantly impact service performance.
- How does system handle invalid Basic Auth credentials? Returns 401 without leaking information about valid usernames.
- What happens if Redis is unavailable when querying `oauth_state_store_size`? Metric returns 0 or omits the gauge rather than failing the entire metrics response.
- How are metrics handled during service startup before full initialization? Default/zero values are returned for application metrics.

## Requirements *(mandatory)*

### Functional Requirements

**MCP Server Metrics:**

- **FR-001**: System MUST expose a `/metrics` endpoint returning Prometheus text format (text/plain; version=0.0.4)
- **FR-002**: System MUST track `mcp_tool_calls_total` counter with labels `tool_name` and `status` (success/error)
- **FR-003**: System MUST track `mcp_tool_duration_seconds` histogram with label `tool_name` and buckets [0.1, 0.5, 1, 2, 5, 10, 30]
- **FR-004**: System MUST track `mcp_active_connections` gauge showing current active MCP connections
- **FR-005**: System MUST track `mittwald_cli_calls_total` counter for upstream Mittwald API calls

**OAuth Bridge Metrics:**

- **FR-006**: System MUST expose a `/metrics` endpoint returning Prometheus text format
- **FR-007**: System MUST track `oauth_authorization_requests_total` counter with labels `client_id` and `status`
- **FR-008**: System MUST track `oauth_token_requests_total` counter with labels `grant_type` and `status`
- **FR-009**: System MUST track `oauth_dcr_registrations_total` counter with label `status`
- **FR-010**: System MUST track `oauth_state_store_size` gauge showing current entries in Redis state store

**Common Requirements:**

- **FR-011**: Both services MUST collect default Node.js metrics (memory, CPU, event loop, GC)
- **FR-012**: System MUST support optional Basic Authentication for the `/metrics` endpoint
- **FR-013**: System MUST be configurable via environment variables: `METRICS_ENABLED`, `METRICS_USER`, `METRICS_PASS`
- **FR-014**: When `METRICS_USER` and `METRICS_PASS` are both set, authentication MUST be required
- **FR-015**: When authentication environment variables are not set, `/metrics` MUST be accessible without authentication
- **FR-016**: System MUST return 401 Unauthorized with `WWW-Authenticate: Basic` header for failed authentication attempts

### Key Entities

- **Metric Registry**: Central collection of all metrics for a service, responsible for serializing to Prometheus format
- **Counter**: Cumulative metric that only increases (e.g., total requests)
- **Histogram**: Samples observations and counts them in configurable buckets (e.g., request durations)
- **Gauge**: Single numerical value that can go up or down (e.g., active connections)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Prometheus can successfully scrape metrics from both services within standard 15-second scrape interval
- **SC-002**: Metrics endpoint responds in under 100ms under normal load
- **SC-003**: All tool invocations are accurately reflected in `mcp_tool_calls_total` within 1 second
- **SC-004**: Duration histograms accurately capture 99th percentile latencies within 5% margin
- **SC-005**: Operations team can create Grafana dashboards showing tool usage patterns, error rates, and authentication flows
- **SC-006**: Memory overhead from metrics collection remains under 10MB per service

## Assumptions

- Mittwald will configure their Prometheus instance to scrape the endpoints
- Network-level security (firewall, VPN) may provide additional protection beyond Basic Auth
- Metric cardinality will remain manageable (limited number of unique tool names and client IDs)
- Services run in environments where `prom-client` default metrics are meaningful (standard Node.js runtime)

## Out of Scope

- Prometheus server installation or configuration
- Grafana dashboard creation
- Alerting rule definitions
- Push-based metrics (Pushgateway integration)
- Custom metric aggregation or pre-computation
