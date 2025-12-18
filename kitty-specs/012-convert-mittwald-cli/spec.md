# Feature Specification: Convert Mittwald CLI to Library for Concurrent MCP Usage

**Feature Branch**: `012-convert-mittwald-cli`
**Created**: 2025-12-18
**Status**: Draft
**Input**: Convert the Mittwald CLI from spawned processes to an importable library to fix concurrent user failures in the MCP server. Clone @mittwald/cli locally, strip CLI-specific code (arg parsing, installation, console output), and expose core business logic as importable functions. Replace all process spawning with direct function calls while keeping authentication layer and tool signatures unchanged.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multiple Users Can Use MCP Server Concurrently (Priority: P0)

Multiple users can invoke MCP tools simultaneously without causing failures, process spawning conflicts, or Node.js compilation cache deadlocks.

**Why this priority**: The MCP server is currently broken when multiple users access it concurrently. This is a critical blocker preventing production use.

**Independent Test**: Can be fully tested by simulating 10 concurrent users each invoking different MCP tools (e.g., `mittwald_project_list`, `mittwald_app_list`, `mittwald_database_mysql_list`) and verifying all requests complete successfully without errors or timeouts.

**Acceptance Scenarios**:

1. **Given** 10 users simultaneously call `mittwald_project_list`, **When** all requests execute, **Then** all 10 requests complete successfully without process spawning conflicts
2. **Given** concurrent requests to different tools (projects, apps, databases), **When** executed simultaneously, **Then** zero compilation cache deadlocks occur
3. **Given** sustained concurrent load (100 requests over 30 seconds), **When** processing requests, **Then** response times remain consistently under 50ms median without degradation (measured variance <20ms)
4. **Given** concurrent tool invocations, **When** checking system resources, **Then** zero `mw` CLI processes are spawned

---

### User Story 2 - CLI Business Logic Remains Intact (Priority: P0)

All Mittwald CLI business logic, validation, error handling, and workflows remain functionally identical when invoked as library functions instead of spawned processes.

**Why this priority**: The CLI contains valuable business logic that must be preserved. Any regression would break existing functionality.

**Independent Test**: Can be fully tested by running the same operations via library calls and verifying output matches previous CLI spawning behavior character-for-character (excluding timing differences).

**Acceptance Scenarios**:

1. **Given** a project listing operation, **When** invoked via library call, **Then** output data structure matches CLI spawning output exactly
2. **Given** an app installation operation, **When** invoked via library, **Then** validation rules and error messages match CLI behavior
3. **Given** a database creation operation, **When** invoked via library, **Then** multi-step workflow executes identically to CLI version
4. **Given** any MCP tool invocation, **When** comparing library vs CLI output, **Then** business logic results are identical (only invocation mechanism differs)

---

### User Story 3 - Tool Signatures Remain Unchanged (Priority: P1)

All MCP tool signatures (parameters, return types, error formats) remain identical, requiring zero changes to MCP server tool handlers or client code.

**Why this priority**: Ensures backward compatibility and allows seamless drop-in replacement without modifying tool handlers.

**Independent Test**: Can be fully tested by running existing MCP server tests without modification and verifying all tests pass with library implementation.

**Acceptance Scenarios**:

1. **Given** existing MCP tool handler for `mittwald_project_list`, **When** library implementation is used, **Then** handler code requires zero modifications
2. **Given** tool parameter schemas, **When** library functions are called, **Then** parameter validation and transformation logic is identical
3. **Given** tool return types, **When** library returns results, **Then** data structures match existing TypeScript types exactly
4. **Given** error handling, **When** library encounters errors, **Then** error format and codes match existing CLI error patterns

---

### User Story 4 - Authentication Layer Untouched (Priority: P1)

The existing authentication layer (OAuth bridge JWT validation, token extraction, session management) continues to work without modification.

**Why this priority**: Authentication is working perfectly and complex. Changes risk breaking security or token handling.

**Independent Test**: Can be fully tested by verifying tokens flow through oauth-middleware → session-manager → library calls identically to current oauth-middleware → session-manager → CLI spawning.

**Acceptance Scenarios**:

1. **Given** OAuth bridge JWT, **When** middleware validates token, **Then** token extraction logic is unchanged
2. **Given** extracted Mittwald access token, **When** stored in session, **Then** session management code is unchanged
3. **Given** library function invocation, **When** token is needed, **Then** token is retrieved from session identically to current flow
4. **Given** token refresh logic, **When** token expires, **Then** refresh mechanism works identically to current implementation

---

### User Story 5 - Performance Improvement (Priority: P2)

Tool invocations complete in <50ms (vs 200-400ms with process spawning), enabling responsive user experiences and higher throughput.

**Why this priority**: Nice-to-have improvement; primary goal is concurrency fix. Performance gains are a bonus.

**Independent Test**: Can be fully tested by measuring response times for 100 identical tool invocations (same tool, same parameters) and verifying median response time is <50ms.

**Acceptance Scenarios**:

1. **Given** a simple tool like `mittwald_project_list`, **When** invoked 100 times, **Then** median response time is <50ms (vs 200-400ms baseline)
2. **Given** concurrent requests, **When** processing 1000 requests/second, **Then** system maintains <50ms median latency
3. **Given** complex multi-step tools, **When** executed, **Then** response time improvement is proportional to number of CLI calls eliminated
4. **Given** sustained load, **When** monitoring over 5 minutes, **Then** zero performance degradation occurs (no memory leaks, no slowdowns)

---

### Edge Cases

- What happens when library function throws an exception not previously seen with CLI spawning?
- How does library handle concurrent calls to the same operation with different parameters?
- What if Mittwald API returns unexpected response formats not handled by CLI parsing logic?
- How does library behave when node_modules are missing or corrupted?
- What if CLI source code has changed upstream and local clone is out of sync?
- How are environment variables handled (CLI reads from process.env, library may need explicit passing)?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Clone MUST create local copy of `@mittwald/cli` in `~/Code/mittwald-cli` directory
- **FR-002**: CLI conversion MUST strip out all CLI-specific code (arg parsing, commander setup, console output formatting, installation scripts)
- **FR-003**: CLI conversion MUST expose core business logic as importable TypeScript functions
- **FR-004**: Library functions MUST accept parameters directly (objects, primitives) instead of parsed CLI arguments
- **FR-005**: Library functions MUST return structured data (objects, arrays) instead of formatted console output
- **FR-006**: MCP server MUST replace all CLI process spawning with direct library function calls
- **FR-007**: Tool handlers MUST maintain identical signatures (input parameters, return types, error formats)
- **FR-008**: Authentication layer (oauth-middleware, session-manager) MUST remain unchanged
- **FR-009**: Token passing MUST work identically (extract from session, pass to library function) without changes to token format or storage
- **FR-010**: Library functions MUST handle errors identically to CLI (same error codes, messages, validation)
- **FR-011**: Library MUST support all enabled MCP tools (tools loaded from `src/constants/tool/mittwald-cli/`, excluding tools explicitly disabled in `src/utils/tool-scanner.ts`)
- **FR-012**: Library functions MUST be callable concurrently without conflicts, locks, or shared state issues
- **FR-013**: Library MUST use the same Mittwald SDK or API calls that the CLI uses internally (preserve business logic)
- **FR-014**: MCP server MUST not call `spawn()`, `exec()`, or `execFile()` to run the `mw` CLI during normal operation (parity validation may enable CLI spawning explicitly for testing)
- **FR-015**: Library functions MUST accept authentication token as parameter (extracted from session)

### Key Entities

- **CLI Library Module**: Converted Mittwald CLI code exposed as importable library
  - Attributes: module name, exported functions, dependency on Mittwald SDK, TypeScript types
  - Relationships: Imported by MCP tool handlers, replaces CLI spawning, uses same business logic as original CLI

- **Library Function**: Individual operation exposed from CLI library (e.g., `listProjects`, `createApp`)
  - Attributes: function name, parameters (token, operation-specific args), return type, error handling
  - Relationships: Maps 1:1 to MCP tools, called by tool handlers, uses Mittwald SDK internally

- **MCP Tool Handler**: Existing MCP tool implementation that invokes operations
  - Attributes: tool name, parameter schema, handler function, session dependency
  - Relationships: Calls library functions instead of spawning CLI, extracts tokens from session, returns results to MCP client

- **Token Flow**: Authentication token path from OAuth bridge through session to library function
  - Attributes: token value, session ID, extraction logic, validation
  - Relationships: Unchanged from current implementation, passed to library functions as parameter

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: MCP server handles 10 concurrent users with zero failures, timeouts, or process spawning conflicts
- **SC-002**: All existing MCP tools function identically (same inputs, outputs, errors) with library implementation
- **SC-003**: Zero `mw` CLI processes are spawned during any enabled MCP tool invocation in normal operation; any CLI spawning is limited to the dedicated parity validation harness
- **SC-004**: Median tool invocation response time is <50ms (measured over 100 identical requests)
- **SC-005**: System handles 1000 concurrent requests/second without degradation or errors
- **SC-006**: Zero changes required to authentication layer (oauth-middleware, session-manager, token refresh)
- **SC-007**: Zero changes required to MCP tool signatures or parameter schemas
- **SC-008**: 100% coverage of enabled MCP tools (any excluded tools are explicitly disabled with documented reasons in `src/utils/tool-scanner.ts`)

### Qualitative Outcomes

- MCP server is production-ready for multiple concurrent users without architectural limitations
- CLI business logic and validation is preserved without regression or behavior changes
- Code is simpler with fewer failure modes (eliminates process spawning complexity, CLI output parsing, and shell escaping logic - approximately 500 lines of infrastructure code removed)
- Future MCP tools can be implemented faster (direct function calls vs CLI wrapper development)
- System is more reliable (no process spawning failures, no compilation cache issues, no shell escaping bugs)

---

## Assumptions

- Mittwald CLI source code is publicly available and can be cloned without licensing restrictions
- CLI internal structure allows separation of business logic from CLI-specific code (commander, console output)
- CLI uses Mittwald SDK or direct API calls that can be invoked programmatically
- Node.js environment variables and configuration used by CLI are accessible to library functions
- Current authentication token format is compatible with CLI's internal authentication expectations
- All MCP tools currently use the CLI in a way that can be replaced 1:1 with library function calls
- Local CLI clone at `~/Code/mittwald-cli` can be maintained and updated independently
- TypeScript compilation and module resolution will work correctly when importing from local CLI clone

---

## Out of Scope

- Forking CLI to GitHub or publishing as npm package (local clone only for initial implementation)
- Maintaining ongoing sync with upstream CLI changes (not a concern for initial implementation)
- Converting CLI commands that are NOT currently exposed as MCP tools
- Modifying authentication layer, token format, or session management
- Creating fallback mechanisms or backward compatibility with CLI spawning
- Performance benchmarking beyond basic response time validation
- Converting CLI to use different Mittwald SDK version or API approach
- Implementing CLI features that don't exist in current version (only use what's already there)
- Optimizing CLI business logic or refactoring its internal implementation
- Adding new MCP tools beyond what's currently implemented
