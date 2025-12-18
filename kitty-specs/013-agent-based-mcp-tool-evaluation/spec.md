# Feature Specification: Agent-Based MCP Tool Evaluation

**Feature Branch**: `013-agent-based-mcp-tool-evaluation`
**Created**: 2025-12-18
**Status**: Draft
**Mission**: software-dev
**Predecessor**: `011-langfuse-eval-suite` (worktree-only), `012-convert-mittwald-cli`

---

## Overview

### Problem Statement

Feature 011 built a comprehensive evaluation suite for ~173 MCP tools based on the pre-conversion architecture. Feature 012 then converted the MCP server from CLI process spawning to library-based architecture, which changed/reduced the tool count and altered tool behavior. The existing eval suite is now out of sync with reality:

- Tool inventory mismatch (173 assumed vs unknown actual count)
- Eval prompts may reference removed/renamed tools
- New tools may exist without eval coverage
- No validation of post-012 MCP server health

### Solution

Update the evaluation suite to match the current post-012 MCP server architecture by:

1. **Discovery**: Query live MCP server to determine actual tool inventory
2. **Reconciliation**: Audit and update eval prompts to match current tools
3. **Execution**: Run evals via Claude agents making LIVE MCP calls (not simulation)
4. **Quality**: Achieve 95%+ success rate through iterative bug fixes
5. **Baseline**: Establish new reference point for future comparison

This enables ongoing validation of MCP server health and provides confidence that the CLI-to-library conversion (feature 012) works correctly for concurrent users.

---

## User Stories

### US-1: Tool Inventory Discovery
**As a** developer maintaining the MCP server
**I want to** query the live server for its current tool list
**So that** I know exactly which tools exist post-012 conversion

**Acceptance Scenarios**:
- Query mittwald-mcp-fly2.fly.dev and retrieve full tool list
- Compare against feature 011's 173-tool inventory
- Identify removed, renamed, consolidated, and new tools
- Generate tool inventory report with current count

---

### US-2: Eval Prompt Coverage
**As a** QA engineer
**I want** every current tool to have a valid eval prompt
**So that** I can test 100% of the MCP server's functionality

**Acceptance Scenarios**:
- Audit existing eval prompts in evals/prompts/
- For tools with prompts: verify prompts are still valid for current implementation
- For tools without prompts: create new eval prompts
- For prompts referencing removed tools: archive them
- Achieve 100% coverage (1 eval per tool)

---

### US-3: Live Agent Execution
**As a** test orchestrator
**I want** Claude agents to execute evals by making real MCP calls
**So that** results reflect actual production behavior

**Acceptance Scenarios**:
- Each agent receives eval prompt as instructions
- Agent authenticates to mittwald-mcp-fly2.fly.dev via OAuth
- Agent makes LIVE MCP tool call with test parameters
- Agent observes actual response from production server
- Agent provides structured self-assessment JSON
- Session transcripts stored in timestamped results directory

---

### US-4: Dependency-Based Execution
**As a** test engineer
**I want** evals to run in logical dependency order
**So that** prerequisite resources exist before dependent tools run

**Acceptance Scenarios**:
- Tools classified by tier (Tier 0: no prerequisites → Tier 4: complex dependencies)
- Example ordering: database/create → database/backup → database/restore
- Tier 0 evals execute first, then Tier 1, etc.
- Within each tier, evals run in parallel (no inter-dependencies)
- Dependency graph documented and validated

---

### US-5: Quality Threshold Achievement
**As a** product owner
**I want** 95%+ of tools to pass their evals
**So that** I have confidence the MCP server is production-ready

**Acceptance Scenarios**:
- Initial eval run captures baseline success rate
- Failures categorized: dependency_missing, api_error, auth_error, other
- Bugs discovered during evals are fixed iteratively
- Re-run evals after each fix until 95%+ threshold met
- Documented exceptions for tools that legitimately cannot reach 95%

---

### US-6: Baseline Establishment
**As a** future developer
**I want** a preserved snapshot of post-012 eval results
**So that** I can compare future runs against this baseline

**Acceptance Scenarios**:
- Results stored in evals/results/{timestamp}/ directory
- Coverage report generated (X/Y tools, success rate, failure breakdown)
- Self-assessments extracted and aggregated
- Comparative analysis against feature 011 baseline (optional)
- Baseline marked as "post-012 reference" for future validation

---

## Functional Requirements

### Discovery Requirements (FR-D)

**FR-D-1**: System shall query mittwald-mcp-fly2.fly.dev to retrieve current tool list
**FR-D-2**: System shall compare current tools against feature 011's 173-tool inventory
**FR-D-3**: System shall identify removed, renamed, consolidated, and new tools
**FR-D-4**: System shall generate tool inventory report with current count and diff analysis

### Eval Prompt Requirements (FR-P)

**FR-P-1**: System shall audit all existing eval prompts in evals/prompts/
**FR-P-2**: For each current tool, system shall ensure exactly 1 valid eval prompt exists
**FR-P-3**: System shall create new prompts for tools lacking eval coverage
**FR-P-4**: System shall archive prompts for removed tools
**FR-P-5**: System shall update fixture references in prompts to match current environment

### Fixture Requirements (FR-F)

**FR-F-1**: System shall verify feature 011 fixtures still exist (MySQL DB, Redis, test app, etc.)
**FR-F-2**: System shall regenerate missing fixtures following original creation order
**FR-F-3**: System shall document fixture manifest (ID, type, purpose, dependencies)

### Agent Execution Requirements (FR-E)

**FR-E-1**: System shall spawn Claude agents to execute each eval prompt
**FR-E-2**: Agents shall authenticate to mittwald-mcp-fly2.fly.dev via OAuth flow
**FR-E-3**: Agents shall make LIVE MCP tool calls (not read/analyze existing results)
**FR-E-4**: Agents shall provide structured self-assessment after each eval
**FR-E-5**: System shall store session transcripts in evals/results/{timestamp}/sessions/
**FR-E-6**: System shall execute evals in dependency order (Tier 0 → Tier 4)
**FR-E-7**: System shall parallelize evals within each tier (no inter-dependencies)

### Self-Assessment Requirements (FR-A)

**FR-A-1**: Agents shall output self-assessment in JSON format with markers:
```
<<<SELF_ASSESSMENT_START>>>
{
  "tool_name": "mittwald_app_list",
  "success": true,
  "confidence": 0.95,
  "problem_type": null,
  "resources_used": ["project p-abc123"],
  "notes": "Successfully listed 3 apps in test project"
}
<<<SELF_ASSESSMENT_END>>>
```
**FR-A-2**: System shall extract self-assessments from session transcripts
**FR-A-3**: System shall aggregate assessments into coverage report

### Quality Requirements (FR-Q)

**FR-Q-1**: System shall categorize failures: dependency_missing, api_error, auth_error, other
**FR-Q-2**: System shall support iterative re-runs after bug fixes
**FR-Q-3**: System shall track success rate progression toward 95%+ threshold
**FR-Q-4**: System shall document exceptions for tools that cannot reach 95%

### Reporting Requirements (FR-R)

**FR-R-1**: System shall generate coverage report with metrics:
- Total tools
- Evals executed
- Success count & rate
- Failure count & rate
- Breakdown by category
- Breakdown by domain (apps, databases, etc.)

**FR-R-2**: System shall preserve results in timestamped directory
**FR-R-3**: System shall support comparative analysis (feature 011 vs 013 baseline)

---

## Success Criteria

1. **Tool Coverage**: 100% of current MCP tools have valid, executable eval prompts
2. **Execution Model**: All evals run via Claude agents making live MCP calls to production server
3. **Quality Threshold**: 95%+ of tools pass their evals (or documented exceptions exist)
4. **Results Organization**: Session transcripts, self-assessments, and coverage reports stored in timestamped directories
5. **Dependency Ordering**: Evals execute in logical tier sequence (Tier 0 → Tier 4)
6. **Baseline Establishment**: Post-012 reference point preserved for future comparison
7. **Fixture Validation**: All feature 011 fixtures verified or regenerated
8. **Bug Fixes**: Issues discovered during eval execution are fixed iteratively
9. **Repeatability**: Eval suite can be re-run anytime to validate MCP server health
10. **Documentation**: Tool inventory, dependency graph, and fixture manifest documented

---

## Key Entities

### ToolInventory
- `tools`: Array of tool metadata (name, description, schema)
- `total_count`: Current tool count
- `discovery_timestamp`: When inventory was captured
- `diff_from_011`: Removed, renamed, new tools

### EvalPrompt (reused from 011)
- `tool_name`: MCP tool being evaluated
- `prompt_path`: Location of eval prompt file
- `fixture_dependencies`: Required fixtures (if any)
- `tier`: Dependency tier (0-4)
- `valid`: Whether prompt matches current tool

### SelfAssessment (reused from 011)
- `tool_name`: MCP tool evaluated
- `success`: Boolean pass/fail
- `confidence`: 0.0-1.0 confidence score
- `problem_type`: dependency_missing | api_error | auth_error | other | null
- `resources_used`: Fixtures/resources used during eval
- `notes`: Freeform explanation

### CoverageReport
- `total_tools`: Tool count
- `evals_executed`: How many evals ran
- `success_count`: Passed evals
- `success_rate`: Percentage
- `failure_breakdown`: Count by category
- `domain_breakdown`: Stats by domain (apps, databases, etc.)

### ToolTier
- `tier`: 0-4 (dependency depth)
- `tools`: Tools in this tier
- `description`: What this tier represents
- `execution_order`: Sequence number

---

## Dependencies & Assumptions

### Dependencies
- Feature 011 eval infrastructure (prompts, fixtures, extraction scripts) exists and is reusable
- Feature 012 CLI-to-library conversion completed and deployed to mittwald-mcp-fly2.fly.dev
- OAuth authentication flow works (unchanged from 011)
- Claude agents can make MCP calls to production server

### Assumptions
- mittwald-mcp-fly2.fly.dev is stable and accessible
- Tool count reduced from 173 (likely to ~100-120 based on library consolidation)
- Fixture manifest from 011 is documented (MySQL DB, Redis, test app, cronjob, etc.)
- Self-assessment format from 011 still valid
- Dependency tier classification can be derived from tool names and schemas

---

## Risks & Mitigations

### Risk: Tool inventory differs significantly from 011
**Impact**: High - may require substantial prompt rewriting
**Mitigation**: Discovery phase runs first; prompt reconciliation is budgeted 3 days

### Risk: Fixtures from 011 no longer exist
**Impact**: Medium - evals requiring fixtures will fail
**Mitigation**: Fixture verification phase before eval execution; regeneration plan ready

### Risk: MCP server bugs discovered during evals
**Impact**: Medium - delays reaching 95% threshold
**Mitigation**: Iterative fix-and-rerun workflow; quality phase budgeted 3 days

### Risk: OAuth authentication issues
**Impact**: High - blocks all agent execution
**Mitigation**: Auth flow validated in Phase 1; early smoke test before bulk execution

### Risk: Agent execution too slow (200+ tools × agents)
**Impact**: Low - longer execution time
**Mitigation**: Parallel execution within tiers; batched orchestration

---

## Out of Scope

- Langfuse platform integration (feature 011 handled this; we reuse infrastructure)
- New fixture creation beyond regenerating 011's fixtures
- Performance optimization of MCP server itself (focus is validation, not tuning)
- Eval prompts for tools added after feature 013 completes
- Automated remediation of failures (manual investigation required)

---

## Edge Cases

1. **Tool removed but fixture still references it**: Archive prompt, update fixture manifest
2. **Tool renamed**: Update prompt file name and tool_name reference
3. **Tool consolidated (2+ tools merged into 1)**: Archive old prompts, create new unified prompt
4. **New tool added**: Create new prompt following 011's template pattern
5. **Eval fails due to API rate limiting**: Retry with exponential backoff
6. **Fixture creation fails**: Document dependency blocker, continue with non-dependent evals
7. **Agent provides malformed self-assessment**: Log warning, mark eval as "other" failure
8. **95% threshold unachievable**: Document exceptions, identify root causes, define path to resolution

---

## Testing Scenarios

### Scenario 1: Full Eval Suite Execution
**Given**: All fixtures exist, all prompts valid
**When**: Orchestrator runs full eval suite
**Then**:
- Evals execute in tier order (0 → 4)
- Session transcripts created for each eval
- Self-assessments extracted
- Coverage report shows ≥95% success rate

### Scenario 2: Tool Removed from MCP Server
**Given**: Tool "app_legacy_list" existed in 011 but removed in 012
**When**: Reconciliation phase runs
**Then**:
- Tool identified in diff analysis
- Prompt archived to evals/prompts/_archived/
- Coverage report excludes this tool

### Scenario 3: Fixture Missing
**Given**: Eval for "database_restore" requires MySQL backup fixture
**When**: Agent attempts eval
**Then**:
- Self-assessment marks problem_type: "dependency_missing"
- Fixture regeneration triggered
- Eval re-run after fixture created

### Scenario 4: API Error During Eval
**Given**: MCP server returns 500 error for "project_delete"
**When**: Agent executes eval
**Then**:
- Self-assessment marks success: false, problem_type: "api_error"
- Bug logged for investigation
- Eval re-run after bug fix

### Scenario 5: Comparative Analysis
**Given**: Feature 011 baseline and 013 results both exist
**When**: Analyst runs comparison script
**Then**:
- Report shows tool count delta (173 → X)
- Success rate comparison (011: 32% → 013: 95%)
- Domain-level deltas highlighted

---

## Notes

- This feature establishes the "post-012 baseline" for ongoing MCP server validation
- Agent execution pattern (live MCP calls) differs from 011's later phases which analyzed existing results
- Success criteria A, B, C all confirmed by user as critical: Coverage, Quality, Baseline
- Dependency-based execution reuses ToolTier concept from feature 011
- Iterative quality phase is open-ended until 95% threshold met (or documented exceptions)
