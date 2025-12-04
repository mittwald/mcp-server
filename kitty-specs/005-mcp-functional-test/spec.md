# Feature Specification: MCP Functional Test Suite with Agent Analysis

**Feature Branch**: `005-mcp-functional-test`
**Created**: 2025-12-04
**Status**: Draft
**Input**: Comprehensive functional testing framework for 170 MCP tools on Fly.io, using Claude Code headless mode with parallel execution, tool restrictions blocking mw CLI, stateless agent discovery of dependencies, resource reuse with grouped cleanup, session log capture and analysis, append-only JSONL coverage manifest, and detailed agent path analysis to identify MCP server improvements.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Test Harness Executes Tool Tests (Priority: P1)

A test operator runs the test harness to functionally validate MCP tools. The harness spawns Claude Code headless sessions with specific test prompts, captures results, and tracks progress in an append-only JSONL manifest.

**Why this priority**: Without the core execution engine, no testing can occur. This is the foundation for all other functionality.

**Independent Test**: Can be tested by running a single tool test and verifying the session completes, result is captured, and manifest is updated.

**Acceptance Scenarios**:

1. **Given** the MCP server is deployed and accessible, **When** the harness spawns a Claude Code headless session with a test prompt, **Then** the session executes using only MCP tools and produces a JSON result with session_id.
2. **Given** a test session completes, **When** the harness processes the result, **Then** a line is appended to the JSONL manifest with tool name, session_id, pass/fail status, and timestamp.
3. **Given** multiple tests are queued, **When** the harness runs, **Then** 3-5 tests execute concurrently without resource conflicts.

---

### User Story 2 - Tool Restriction Enforcement (Priority: P1)

Test agents are restricted from using the `mw` CLI directly. They must accomplish tasks using only the MCP tools, simulating real-world agent behavior.

**Why this priority**: The restriction is fundamental to the test's validity - without it, agents bypass MCP tools entirely.

**Independent Test**: Run a test that would be easier with `mw` CLI and verify the agent uses MCP tools instead.

**Acceptance Scenarios**:

1. **Given** a Claude Code session is spawned, **When** the `--disallowedTools` flag includes `Bash(mw)`, **Then** any attempt by the agent to invoke `mw` is blocked.
2. **Given** an agent needs to create a project, **When** restricted from `mw`, **Then** the agent discovers and uses the appropriate MCP tool (e.g., `mcp__mittwald__project_create`).

---

### User Story 3 - Stateless Agent Dependency Discovery (Priority: P1)

Test agents receive goal-oriented prompts without pre-built knowledge of dependencies. They must discover that (for example) deploying a container requires first having a project and an app.

**Why this priority**: This tests the MCP server's discoverability and documentation quality - a core outcome of the testing effort.

**Independent Test**: Give an agent a complex task (e.g., "deploy a Node.js app") and observe whether it discovers the required dependency chain.

**Acceptance Scenarios**:

1. **Given** an agent is tasked with "deploy a container", **When** no project exists, **Then** the agent discovers it needs to create a project first (via tool descriptions or error messages).
2. **Given** an agent encounters a dependency error, **When** the MCP server returns an error, **Then** the error message provides enough context for the agent to understand what prerequisite is missing.

---

### User Story 4 - Resource Lifecycle Management (Priority: P2)

After foundational tools are clean-room tested, the test harness uses `mw` CLI directly for efficient setup. Resources are cleaned up in grouped batches by functional domain.

**Why this priority**: Enables efficient testing of 170 tools without repeated bootstrapping overhead.

**Independent Test**: Verify that after clean-room testing `project-create`, subsequent tests can use harness-created projects.

**Acceptance Scenarios**:

1. **Given** `project-create` has been clean-room tested successfully, **When** subsequent tests need a project, **Then** the harness creates one via `mw` CLI and provides the project ID to the test.
2. **Given** a functional domain's tests complete (e.g., all app-related tests), **When** cleanup runs, **Then** all resources created for that domain are deleted in a single batch.
3. **Given** tests run in parallel, **When** resources are created, **Then** naming conventions prevent conflicts (e.g., `test-{domain}-{timestamp}-{random}`).

---

### User Story 5 - Session Log Capture and Tracking (Priority: P2)

Every test session's ID is captured and stored. Session logs from `~/.claude/projects/` are preserved for post-analysis.

**Why this priority**: Without session tracking, the agent struggle analysis cannot be performed.

**Independent Test**: Run a test, retrieve the session_id, and verify the corresponding JSONL log exists.

**Acceptance Scenarios**:

1. **Given** a headless session completes, **When** JSON output is parsed, **Then** the session_id is extracted and recorded in the manifest.
2. **Given** session logs are stored in `~/.claude/projects/`, **When** log retention is configured, **Then** logs are preserved beyond the default 30-day period.
3. **Given** multiple parallel sessions run, **When** each completes, **Then** each session's log is independently accessible by session_id.

---

### User Story 6 - Agent Path Analysis (Priority: P2)

After tests complete, session logs are analyzed to identify where agents struggled. Analysis produces concrete suggestions for MCP server improvements.

**Why this priority**: This delivers the secondary outcome - insights for improving the MCP server.

**Independent Test**: Analyze a single session log and produce a structured report of agent struggles.

**Acceptance Scenarios**:

1. **Given** a session log contains failed attempts or retries, **When** analysis runs, **Then** each struggle point is identified with context (what the agent tried, what failed, what it tried next).
2. **Given** agent struggles are identified, **When** the report is generated, **Then** it includes concrete suggestions (e.g., "Agent didn't know project ID format - add example to tool description").
3. **Given** multiple sessions are analyzed, **When** results are aggregated, **Then** common struggle patterns are surfaced with frequency counts.

---

### User Story 7 - Test Coverage Verification (Priority: P3)

The JSONL manifest tracks which tools have been tested. Operators can query coverage status at any time.

**Why this priority**: Important for completeness but not blocking core testing.

**Independent Test**: Run tests for a subset of tools and verify the manifest accurately reflects coverage.

**Acceptance Scenarios**:

1. **Given** the manifest exists, **When** a test completes, **Then** a line is appended (not the whole file rewritten) with tool name, status, session_id, and timestamp.
2. **Given** multiple agents run concurrently, **When** both append to the manifest simultaneously, **Then** no data is lost or corrupted (append-only JSONL is atomic per line).
3. **Given** the manifest contains test results, **When** an operator queries coverage, **Then** they can see which of the 170 tools have been tested and which remain.

---

### User Story 8 - Temporary Artifact Management (Priority: P3)

Tests that upload code or apps use `/tmp` filesystem. These artifacts are tracked and cleaned up with their associated test group.

**Why this priority**: Housekeeping concern - important but not core functionality.

**Independent Test**: Run a test that creates temp files, then verify cleanup removes them.

**Acceptance Scenarios**:

1. **Given** a test needs to upload code, **When** the harness prepares the test, **Then** code is placed in a tracked `/tmp` subdirectory.
2. **Given** a test group completes, **When** cleanup runs, **Then** all `/tmp` artifacts for that group are deleted.

---

### Edge Cases

- What happens when the MCP server is unavailable mid-test?
- How does the system handle an agent that gets stuck in an infinite retry loop?
- What if a test creates resources but crashes before recording them for cleanup?
- How are partial test results handled if a session times out?
- What happens when parallel tests accidentally create conflicting resource names despite conventions?

## Requirements *(mandatory)*

### Functional Requirements

**Test Harness Core:**
- **FR-001**: System MUST spawn Claude Code sessions using headless mode (`claude -p --output-format json`)
- **FR-002**: System MUST enforce tool restrictions via `--disallowedTools "Bash(mw)"` on all test sessions
- **FR-003**: System MUST support parallel execution of 3-5 concurrent test sessions
- **FR-004**: System MUST capture session_id from each test session's JSON output
- **FR-005**: System MUST append test results to JSONL manifest (atomic append, no read-modify-write)

**Resource Management:**
- **FR-006**: System MUST support "clean-room" mode for foundational tool tests (no pre-existing resources)
- **FR-007**: System MUST support "harness-assisted" mode where `mw` CLI creates prerequisite resources
- **FR-008**: System MUST track all resources created during testing for cleanup
- **FR-009**: System MUST group resource cleanup by functional domain (not per-test)
- **FR-010**: System MUST use naming conventions for resources to prevent parallel test conflicts

**Session Management:**
- **FR-011**: System MUST configure Claude Code log retention to preserve logs beyond 30 days
- **FR-012**: System MUST store mapping of test -> session_id for later log retrieval
- **FR-013**: System MUST handle session timeouts gracefully with partial result recording

**Analysis:**
- **FR-014**: System MUST parse session JSONL logs to identify agent decision points
- **FR-015**: System MUST identify "struggle patterns" (retries, errors, backtracking)
- **FR-016**: System MUST generate improvement suggestions for each identified struggle
- **FR-017**: System MUST aggregate common struggles across all sessions with frequency counts

**Coverage:**
- **FR-018**: System MUST maintain a manifest of all 170 MCP tools
- **FR-019**: System MUST track test status per tool (untested, passed, failed)
- **FR-020**: System MUST support querying coverage statistics

**Temporary Artifacts:**
- **FR-021**: System MUST create test artifacts in tracked `/tmp` subdirectories
- **FR-022**: System MUST clean up `/tmp` artifacts with their associated test group

### Key Entities

- **TestSession**: Represents a single Claude Code headless execution (session_id, tool_under_test, prompt, start_time, end_time, status, result)
- **TestManifest**: Append-only JSONL file tracking all test executions (tool_name, session_id, status, timestamp, duration, error_message)
- **ToolInventory**: List of all 170 MCP tools with metadata (name, category/domain, dependencies, clean_room_required)
- **ResourceTracker**: Registry of created resources awaiting cleanup (resource_type, resource_id, domain, created_by_session, created_at)
- **StruggleReport**: Analysis output for a session (session_id, struggle_points[], suggestions[], severity)
- **AggregateAnalysis**: Combined insights across all sessions (common_struggles[], improvement_recommendations[], frequency_map)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 170 MCP tools have at least one functional test execution recorded in the manifest
- **SC-002**: Test harness can execute 3-5 tests concurrently without resource conflicts or data corruption
- **SC-003**: Zero instances of agents using `mw` CLI directly (tool restriction 100% effective)
- **SC-004**: Session logs are preserved and retrievable for all test executions
- **SC-005**: Agent struggle analysis produces actionable suggestions for at least 80% of identified struggles
- **SC-006**: Resource cleanup achieves 100% removal of test-created resources (no orphaned resources)
- **SC-007**: Aggregate analysis identifies top 10 common agent struggle patterns across all sessions
- **SC-008**: Test execution completes for all 170 tools within a reasonable operational window
- **SC-009**: JSONL manifest maintains data integrity under concurrent append operations
