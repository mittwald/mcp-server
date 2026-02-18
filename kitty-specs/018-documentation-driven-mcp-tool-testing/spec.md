# Feature Specification: Documentation-Driven MCP Tool Testing

**Feature Branch**: `018-documentation-driven-mcp-tool-testing`
**Created**: 2026-01-27
**Status**: Draft
**Input**: User description: "Comprehensive testing that proves all 115 MCP tools work in realistic multi-step scenarios, with human-centric documentation that separates human actions from LLM actions"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Prove Tool Functionality in Realistic Scenarios (Priority: P1)

As a **maintainer of the Mittwald MCP server**, I need to verify that all 115 MCP tools work correctly in realistic multi-step workflows (not just isolated unit tests), so that I can confidently deploy the system and know which tools are production-ready.

**Why this priority**: This is the core value proposition. Without proving tools work in realistic combinations, the rest of the system has no foundation.

**Independent Test**: Can be fully tested by executing the 10 existing case study workflows and recording which tools succeed/fail. Delivers immediate value by identifying broken tools.

**Acceptance Scenarios**:

1. **Given** the 10 case study workflows exist, **When** I run each workflow as a test scenario, **Then** each tool used in the workflow is marked as "validated in realistic context" if the workflow succeeds
2. **Given** a workflow execution fails, **When** the test framework analyzes the failure, **Then** it identifies the specific tool(s) that failed and captures the failure mode (broken tool, missing permissions, bad prompt)
3. **Given** a workflow succeeds once, **When** I review the test results, **Then** that tool is marked as production-ready without requiring repeated statistical validation

---

### User Story 2 - Identify and Close Tool Coverage Gaps (Priority: P2)

As a **maintainer**, after running the case study workflows, I need to identify which of the 115 tools were NOT exercised by any case study, so that I can create minimal custom scenarios to achieve 100% tool coverage.

**Why this priority**: Case studies cover ~80% of tools efficiently, but we need comprehensive coverage. This story builds on P1's foundation.

**Independent Test**: Can be fully tested by comparing the tools used in P1's case study executions against the complete tool inventory (115 tools). Delivers a gap analysis report showing uncovered tools.

**Acceptance Scenarios**:

1. **Given** the 10 case study workflows have been executed, **When** I request a coverage report, **Then** the system lists all tools exercised by case studies and identifies the remaining ~20% uncovered tools
2. **Given** a list of uncovered tools, **When** I define a minimal custom scenario for each uncovered tool, **Then** the system validates that scenario exercises the tool in a realistic multi-step context
3. **Given** custom scenarios are defined, **When** I run them, **Then** each uncovered tool is validated using the same diagnostic approach as P1 (1 success = proof, failures = diagnostic)

---

### User Story 3 - Human-Centric Documentation (Priority: P3)

As a **human user reading case study documentation**, I need clear separation between what I type (prompts), what I observe (results), and what the LLM does (MCP tool calls), so that I can understand how to use the system without needing to know implementation details.

**Why this priority**: Documentation enhances usability but depends on understanding which tools work (P1/P2). Can be done in parallel with testing.

**Independent Test**: Can be fully tested by rewriting 1-2 case studies with the new format and validating readability with non-technical users.

**Acceptance Scenarios**:

1. **Given** a case study workflow, **When** I read the documentation, **Then** I can clearly distinguish between "Human Actions" (prompts I type), "What You'll See" (observable results), and "Behind the Scenes" (LLM tool calls)
2. **Given** I want to use a workflow, **When** I follow the documentation, **Then** I can copy-paste the exact prompts without needing to understand which MCP tools will be called
3. **Given** a workflow fails, **When** I consult the documentation, **Then** I can see troubleshooting guidance based on common failure modes identified in P1/P2 testing

---

### User Story 4 - Failure Pattern Analysis and Reporting (Priority: P4)

As a **maintainer debugging a failed test**, I need the system to identify recurring failure patterns (e.g., "3 workflows failed due to missing project:write scope") across multiple scenarios, so that I can fix systemic issues rather than debugging individual failures.

**Why this priority**: Enhances the diagnostic value of P1/P2 but isn't required for basic tool validation. Can be added after core testing works.

**Independent Test**: Can be fully tested by injecting known failures (broken tool, missing permission) and verifying the system clusters them into patterns.

**Acceptance Scenarios**:

1. **Given** multiple test scenarios have failed, **When** I review the failure report, **Then** the system groups failures by root cause (e.g., "OAuth scope issues", "Tool not found", "Timeout errors")
2. **Given** a failure pattern is identified, **When** I fix the root cause, **Then** I can re-run only the affected scenarios to verify the fix
3. **Given** a test scenario fails, **When** the failure is novel (not matching known patterns), **Then** the system flags it for manual investigation

---

### Edge Cases

- **What happens when a case study workflow uses deprecated tools?** The system marks those tools as "deprecated but functional" and flags them for documentation updates.
- **How does the system handle flaky tests?** If a scenario fails once but succeeds on retry without code changes, the failure is logged as "transient" (network issue, API throttling) but doesn't block the tool from being marked production-ready.
- **What if a tool is only used in a deprecated workflow?** The tool is still validated but flagged as "low coverage - only used in deprecated contexts" to prioritize modernization.
- **How are multi-tenant scenarios handled?** Test scenarios must use isolated test accounts/projects to avoid cross-contamination. Cleanup is required after each scenario.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST execute all 10 existing case study workflows as test scenarios
- **FR-002**: System MUST record which MCP tools are exercised by each workflow execution
- **FR-003**: System MUST mark a tool as "production-ready" after ONE successful execution in a realistic scenario
- **FR-004**: System MUST capture detailed failure information when a tool fails (error message, context, tool name, workflow step)
- **FR-005**: System MUST generate a tool coverage report showing: (a) tools validated by case studies, (b) tools not yet validated, (c) tools that failed validation
- **FR-006**: System MUST support defining custom minimal scenarios for tools not covered by case studies
- **FR-007**: System MUST allow re-running failed scenarios without re-running successful ones
- **FR-008**: System MUST cluster failures by pattern (e.g., all failures due to missing OAuth scope grouped together)
- **FR-009**: Documentation MUST clearly separate human actions (prompts), observable results, and LLM actions (tool calls) for each case study
- **FR-010**: System MUST clean up test resources (projects, apps, databases) after each scenario to avoid resource leaks
- **FR-011**: System MUST handle scenario execution failures gracefully (tool crashes, timeouts, API errors) without crashing the test runner
- **FR-012**: Test results MUST be persisted to disk in a structured format (JSON) for analysis and reporting

### Key Entities

- **Test Scenario**: A workflow (case study or custom) that exercises one or more MCP tools in a realistic sequence. Contains prompts, expected outcomes, cleanup steps.
- **Tool Validation Record**: For each of 115 tools, tracks validation status (not tested, success, failed), scenario that validated it, failure details if applicable.
- **Failure Pattern**: A cluster of related failures sharing a common root cause (e.g., "missing permission", "tool not found", "timeout").
- **Coverage Report**: Aggregated view of all 115 tools showing validation status, coverage gaps, and failure summaries.
- **Case Study Documentation**: Enhanced markdown files with structured sections: "What You Type" (prompts), "What Happens" (tool sequence), "What You'll See" (results).

## Dependencies & Assumptions

### Dependencies

- **Existing Case Studies**: 10 case study workflows must exist in `docs/setup-and-guides/src/content/docs/case-studies/` (as documented in Feature 014)
- **Tool Inventory**: Complete list of 115 MCP tools must be available from the current MCP server implementation
- **Test Environment**: Access to Mittwald test accounts/projects for scenario execution
- **Feature 014 Results**: Existing eval framework and tool inventory from Feature 014 provides the baseline for tool identification

### Assumptions

- **Case Study Coverage**: ~80% tool coverage from 10 case studies is achievable (validated by Feature 014's tool-to-domain mapping)
- **Execution Model**: Workflows can be executed programmatically via Claude Code CLI (proven by Feature 014's agent-based eval execution)
- **Resource Availability**: Sufficient test account quotas exist to run 10+ concurrent scenarios without hitting limits
- **Diagnostic Efficiency**: One successful run proves tool functionality; repeated runs only needed for failure diagnosis

## Multi-Target Testing Strategy *(mandatory)*

Feature 018 tests against **three MCP server deployments** to ensure comprehensive validation:

### Test Targets

1. **Local MCP Server** (`build/index.js`)
   - **Purpose**: Fast feedback during development
   - **Authentication**: None required
   - **Log Source**: Subprocess stdout (Pino structured logs)
   - **Execution**: `npm run build && node build/index.js`

2. **Fly.io MCP Server** (`mittwald-mcp-fly2.fly.dev`)
   - **Purpose**: Production environment validation
   - **Authentication**: OAuth required (user must authenticate via Claude Code CLI)
   - **Log Source**: `flyctl logs -a mittwald-mcp-fly2` (Fly.io journald)
   - **Deployment**: Automatic via GitHub Actions on main branch push

3. **Mittwald.de MCP Server** (`mcp.mittwald.de`)
   - **Purpose**: Official production deployment validation
   - **Authentication**: OAuth required (separate from Fly.io)
   - **Log Source**: **No direct log access** - outcome validation only
   - **Validation**: Use local `mw` CLI to verify resource state

### Authentication Requirements

**Pre-flight check**: Tests verify Claude Code CLI authentication status before running. If authentication is missing, tests exit with clear instructions:

```bash
❌ Authentication required for mittwald-mcp-fly2.fly.dev
Please authenticate first:
  claude auth login
Then retry: npm run test:scenarios --target=flyio
```

**User responsibility**: Maintainers must authenticate Claude Code CLI before running production target tests. Local tests require no authentication.

### Target Selection

Tests support a `--target` flag to select which MCP server to test:

```bash
# Quick local validation (default, ~2 hours)
npm run test:scenarios

# Production validation (requires auth, ~2 hours each)
npm run test:scenarios --target=flyio
npm run test:scenarios --target=mittwald
```

**Recommended workflow**:
- Daily/PR checks: Run `--target=local` only (fast feedback)
- Pre-release validation: Run all three targets sequentially (~6 hours total)
- CI/CD: Local tests in PR checks, full suite in nightly builds

### Tool Coverage Tracking by Target

| Target | Log Retrieval | Coverage Tracking Method |
|--------|---------------|--------------------------|
| Local | Parse subprocess stdout | Extract tool names from Pino structured logs |
| Fly.io | `flyctl logs -a mittwald-mcp-fly2` | Extract tool names from Pino structured logs |
| mittwald.de | **No log access** | Validate outcomes using local `mw` CLI |

**Critical constraint for mittwald.de**: Since logs are unavailable, tool coverage is tracked by:
1. Scenario's `expected_tools` field declares which tools should be called
2. Validation script uses local `mw` CLI to verify actual resource state
3. If outcome passes, assume expected tools were called successfully

**Important**: LLMs in test scenarios are **forbidden** from using the `mw` tool. Only validation scripts use `mw` directly to check outcomes. This prevents scenarios from bypassing MCP tools.

### Target-Specific Reporting

Coverage reports show per-target validation status:

```markdown
## Tool Coverage Report

### Summary
- **Local**: 110/115 tools (95.7%)
- **Fly.io**: 106/115 tools (92.2%)
- **mittwald.de**: 101/115 tools (87.8%)

### Tools Working on All Targets ✅
- mittwald_app_list
- mittwald_project_get
- ... (92 tools)

### Tools Failing on Specific Targets ⚠️
**Fly.io only**: mittwald_app_create (timeout)
**mittwald.de only**: mittwald_domain_dns_update (DNS propagation)
```

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 115 MCP tools validated in at least one realistic scenario on at least one target (local, Fly.io, or mittwald.de)
- **SC-002**: At least 80% of tools validated using 10 existing case study workflows
- **SC-003**: Remaining 20% of tools validated using custom minimal scenarios (no more than 25 custom scenarios)
- **SC-004**: Failed tools accompanied by actionable diagnostic information (failure mode, affected scenarios, reproduction steps)
- **SC-005**: Case study documentation rewritten to clearly separate human actions from LLM actions
- **SC-006**: Test execution completes in under 2 hours per target (10 case studies + ~25 custom scenarios)
- **SC-007**: Failure patterns identified automatically for 90% of recurring failures
- **SC-008**: Zero test resource leaks after scenario execution (all projects, apps, databases cleaned up)
- **SC-009**: **NEW** - At least 90% of tools validated on all three targets (identifies environment-specific issues)
- **SC-010**: **NEW** - Per-target coverage reports generated showing tool validation rates and environment-specific failures
