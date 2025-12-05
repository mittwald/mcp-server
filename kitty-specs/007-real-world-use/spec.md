# Feature Specification: Real-World Use Case Functional Testing

**Feature Branch**: `007-real-world-use`
**Created**: 2025-12-05
**Status**: Draft
**Input**: Comprehensive functional testing through realistic multi-step use cases achieving 100% MCP tool coverage

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Use Case Research & Design (Priority: P1)

A test designer researches Mittwald documentation to identify common customer workflows, then creates adjacent (not duplicate) use case definitions that will naturally exercise MCP tools through realistic scenarios.

**Why this priority**: Without well-designed use cases, the entire testing effort fails. Use cases must be realistic enough to reveal actual confusion patterns while collectively covering all 170+ tools.

**Independent Test**: Can be tested by reviewing the use case library for completeness, realism, and tool coverage mapping.

**Acceptance Scenarios**:

1. **Given** Mittwald developer documentation exists, **When** the designer reviews tutorials and examples, **Then** they identify common patterns (app deployment, email setup, database provisioning, etc.) and create 30-50 adjacent scenarios that differ from but relate to documented examples
2. **Given** a use case definition exists, **When** it is mapped to expected tool usage, **Then** each use case clearly specifies which MCP tools should be invoked during successful execution
3. **Given** all use cases are defined, **When** tool coverage is analyzed, **Then** 100% of the 170+ MCP tools are covered by at least one use case

---

### User Story 2 - Enhanced Harness with Supervisory Control (Priority: P1)

A test runner executes headless Claude sessions for multi-step use cases with a supervisory controller that understands success/failure states, enforces timeouts, and handles agent questions.

**Why this priority**: The existing 005 harness handles single-tool tests. Multi-step realistic use cases require longer execution, state tracking, and interactive control.

**Independent Test**: Can be tested by running a single use case end-to-end with timeout enforcement, question handling, and success verification.

**Acceptance Scenarios**:

1. **Given** a use case with defined success criteria, **When** the harness executes it, **Then** the controller monitors progress and correctly identifies when "done" state is reached
2. **Given** a use case that encounters errors, **When** the agent fails or gets stuck, **Then** the controller identifies failure state within the timeout window and terminates gracefully
3. **Given** an agent asks a clarifying question during execution, **When** the controller receives it, **Then** it either provides a predefined answer, skips the question, or marks the session as requiring manual intervention
4. **Given** any use case execution, **When** the configured timeout is reached without completion, **Then** the session is terminated and marked as timeout failure

---

### User Story 3 - Self-Contained Execution with Evidence & Cleanup (Priority: P1)

Each use case creates Mittwald resources, performs work, gathers evidence of success via Playwright and other verification methods, then cleans up all created resources.

**Why this priority**: Real Mittwald infrastructure has storage limits. Without cleanup, test runs accumulate garbage. Without evidence, success cannot be verified.

**Independent Test**: Can be tested by executing one use case and verifying: (1) resources were created, (2) evidence was captured, (3) resources were deleted.

**Acceptance Scenarios**:

1. **Given** a use case that creates a project/app, **When** the work is completed, **Then** Playwright or curl captures screenshots/responses proving the deployment works
2. **Given** evidence has been captured, **When** the cleanup phase runs, **Then** all created resources (projects, apps, databases, domains, etc.) are deleted
3. **Given** a use case fails mid-execution, **When** cleanup is attempted, **Then** partial resources are still cleaned up to avoid accumulation

---

### User Story 4 - Session Log Analysis & Coverage Reporting (Priority: P2)

Completed test sessions are analyzed using the 006 pipeline to detect confusion patterns, and coverage reports show which tools were exercised across all use cases.

**Why this priority**: Analysis reveals where MCP tools need better descriptions or documentation. Coverage tracking ensures the 100% goal is met.

**Independent Test**: Can be tested by running analysis on a subset of session logs and generating coverage reports.

**Acceptance Scenarios**:

1. **Given** session logs from use case executions, **When** the 006 analysis pipeline runs, **Then** confusion patterns (wrong-tool-selection, retry-loop, etc.) are detected and reported
2. **Given** multiple use cases have been executed, **When** coverage is calculated, **Then** a report shows which of the 170+ tools were called and which remain uncovered
3. **Given** coverage gaps exist, **When** the gap report is reviewed, **Then** it recommends additional use cases or modifications to achieve 100% coverage

---

### User Story 5 - Use Case Prompt Generation (Priority: P2)

Each use case has a carefully crafted prompt that gives the headless Claude a realistic task without hinting at which MCP tools to use, simulating a naive user.

**Why this priority**: Prompts must be realistic (no tool hints) to reveal genuine confusion patterns, but must also be achievable within the MCP tool capabilities.

**Independent Test**: Can be tested by reviewing prompts for absence of tool hints and presence of clear success criteria.

**Acceptance Scenarios**:

1. **Given** a use case definition, **When** the prompt is generated, **Then** it describes the desired outcome in user terms without mentioning MCP tools, `mw` CLI, or implementation specifics
2. **Given** a prompt, **When** it specifies available tools, **Then** it only mentions generic Linux utilities (curl, grep, sed, awk) and /tmp directories - NOT `mw` or MCP tool names
3. **Given** a prompt, **When** success criteria are included, **Then** they describe observable outcomes (website responds, email delivers, database accepts connections)

---

### Edge Cases

- What happens when a use case requires tools that have external dependencies (e.g., domain DNS propagation)?
- How does the system handle use cases where Mittwald API rate limits are hit?
- What happens when cleanup fails due to resource dependencies (e.g., can't delete project with active apps)?
- How are use cases handled that require human verification (e.g., email delivery to external address)?
- What happens when Playwright verification times out waiting for deployment propagation?

## Requirements *(mandatory)*

### Functional Requirements

#### Use Case Library
- **FR-001**: System MUST include a library of 30-50 use case definitions covering realistic Mittwald customer scenarios
- **FR-002**: Use cases MUST be inspired by but NOT duplicate Mittwald documentation examples
- **FR-003**: Each use case MUST specify: title, description, naive prompt, expected tool domains, success criteria, cleanup requirements
- **FR-004**: Use cases MUST collectively cover all 170+ MCP tools (100% coverage goal)
- **FR-005**: Each use case MUST be categorized by primary domain (apps, databases, domains-mail, etc.)

#### Enhanced Harness
- **FR-010**: Harness MUST extend the existing 005 infrastructure (coordinator, session-runner, stream-parser)
- **FR-011**: Harness MUST implement configurable timeout enforcement per use case (default: 10 minutes, max: 30 minutes)
- **FR-012**: Harness MUST detect "done" state based on use-case-specific success signals
- **FR-013**: Harness MUST detect "failure" state based on error patterns, stuck indicators, or timeout
- **FR-014**: Harness MUST handle agent questions with configurable responses (answer, skip, or escalate)
- **FR-015**: Harness MUST preserve complete session logs in JSONL format for analysis

#### Execution & Verification
- **FR-020**: Each use case execution MUST be self-contained (create -> work -> verify -> cleanup)
- **FR-021**: Verification MUST use Playwright for web-based evidence (screenshots, response validation)
- **FR-022**: Verification MUST support non-Playwright methods (curl, database connections, API calls)
- **FR-023**: Cleanup MUST attempt to remove all resources created during the use case
- **FR-024**: Cleanup MUST handle partial failures gracefully (log what couldn't be deleted)
- **FR-025**: Evidence (screenshots, logs, responses) MUST be preserved alongside session logs

#### Analysis & Coverage
- **FR-030**: System MUST integrate with 006 analysis pipeline for confusion pattern detection
- **FR-031**: System MUST track tool coverage across all executed use cases
- **FR-032**: System MUST generate coverage reports showing: tools hit, tools missed, use cases per tool
- **FR-033**: System MUST recommend use case additions when coverage gaps are identified

#### Prompt Design
- **FR-040**: Prompts MUST describe tasks in user/business terms without MCP tool references
- **FR-041**: Prompts MUST NOT mention `mw` CLI or internal Mittwald tool names
- **FR-042**: Prompts MAY reference standard Linux tools (curl, grep, sed, awk, Playwright)
- **FR-043**: Prompts MUST include observable success criteria that can be verified externally

### Key Entities

- **UseCase**: A test scenario definition including title, description, prompt, expected domains, success criteria, cleanup spec, estimated duration, and tool coverage mapping
- **UseCaseExecution**: A single run of a use case capturing start time, end time, status (success/failure/timeout), session log path, evidence artifacts, and cleanup status
- **CoverageReport**: Aggregated view of tool usage across executions showing per-tool hit counts, uncovered tools, and coverage percentage
- **SupervisoryController**: Enhanced coordinator that monitors execution state, handles timeouts, processes agent questions, and determines done/failure status

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of MCP tools (170+) are exercised by at least one use case execution
- **SC-002**: Use case library contains minimum 30 distinct realistic scenarios spanning all 10 domains
- **SC-003**: 90% of use cases complete within their configured timeout without manual intervention
- **SC-004**: Cleanup successfully removes 95% of created resources (measured by Mittwald console verification)
- **SC-005**: Evidence artifacts (screenshots, logs) are captured for 100% of completed use cases
- **SC-006**: Session logs are compatible with 006 analysis pipeline (all incidents detected)
- **SC-007**: Coverage gaps are identified and addressable through use case additions within one iteration
- **SC-008**: No use case results in infinite execution (all terminate via success, failure, or timeout)

## Assumptions

- Mittwald MCP server is accessible and authenticated during test execution
- Test account has sufficient quota to create resources needed for use cases (projects, apps, databases)
- Playwright can be installed and run in the test environment
- DNS propagation for domain-related tests may require delays or polling
- Rate limits on Mittwald APIs are sufficient for reasonable test execution frequency
- The 005 harness codebase is stable and suitable for extension
- The 006 analysis pipeline accepts session logs in the format produced by the enhanced harness
