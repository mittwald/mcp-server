# Sprint 008 Task Breakdown: Fix Sprint 007 Infrastructure & Validate LLM Tool Discovery

**Status**: Ready for Implementation
**Feature**: 008-mcp-server-instruction
**Last Updated**: 2025-12-09

---

## Overview

Sprint 008 fixes critical infrastructure issues in Sprint 007:
1. **Tool call tracking bug** - `toolsInvoked[]` arrays empty due to parsing error in executor.ts
2. **Test design flaw** - Use case prompts are prescriptive instead of outcome-focused

This task breakdown organizes work into 6 sequential work packages across 3 phases.

---

## Quick Start: MVP Scope

**Recommended MVP** (first 3-4 days):
- [ ] **WP1**: Fix tool extraction bug in executor.ts
- [ ] **WP2**: Generate baseline metrics from 31 existing logs
- [ ] **WP3**: Rewrite 31 use case prompts to outcome-focused

This establishes valid test infrastructure for future improvements.

---

### Phase 1: Data Extraction Infrastructure

## Work Package WP01: Fix Tool Call Extraction Bug (Priority: P1 CRITICAL)

**Goal**: Fix executor.ts to correctly extract tool calls from JSONL session logs, enabling population of `toolsInvoked[]`

**Priority**: P1 - Blocking issue, all downstream work depends on this
**Complexity**: LOW (parsing fix, ~50 lines of code)
**Owner**: Backend/Test Infrastructure
**Timeline**: 2-4 hours
**Acceptance Criteria**:
- All tool invocations from sample logs extracted correctly (100% accuracy)
- `toolsInvoked[]` populated for all 31 execution results
- Edge cases handled (errors, nested calls, incomplete invocations)
- Spot-check validation passes

**Subtasks**:
- [ ] **T001**: Investigate JSONL structure to confirm tool call location [P - investigation only]
  - Document where tool calls actually exist in parsed events
  - Identify all tool call fields and relationships
  - **Acceptance**: Design doc with JSONL structure diagrams

- [ ] **T002**: Fix executor.ts tool extraction logic (lines 427-434)
  - Replace `event.type === 'tool_use'` check with correct location
  - Implement extraction from `assistant.message.content[]`
  - Handle tool_result extraction from `user.message.content[]`
  - **Acceptance**: Code compiles, logic matches specification

- [ ] **T003**: Implement error handling for edge cases
  - Tool calls with errors (capture error status)
  - Nested tool calls (preserve parent-child via tool_use_id)
  - Incomplete invocations (tool runs but result missing)
  - Timeout scenarios (partial tool data)
  - **Acceptance**: All edge cases have handling, documented in code

- [ ] **T004**: Rebuild project and test on sample logs
  - Run `npm run build` to compile TypeScript
  - Test extraction on 5-10 representative session logs (different domains/complexities)
  - Verify `toolsInvoked[]` populated correctly
  - Compare extracted vs. manual review for accuracy
  - **Acceptance**: Zero compilation errors, extraction works on all samples, no data loss

- [ ] **T005**: Run full extraction on all 31 existing execution results
  - Process all 31 JSONL session logs through fixed extractor
  - Verify all execution results have populated `toolsInvoked[]`
  - Document any anomalies or edge cases found
  - **Acceptance**: All 31 results have non-empty toolsInvoked[], baseline data ready

- [ ] **T006**: Spot-check validation (10% sample)
  - Randomly select 3-4 execution results
  - Manually verify extracted tool calls against raw session logs
  - Check metadata accuracy (names, parameters, results)
  - Verify sequence order preserved
  - **Acceptance**: 100% match between extracted and manual review, documented in report

**Risks**:
- JSONL format varies across session logs (mitigate: test on diverse samples)
- Tool call nesting depth differs (mitigate: recursive extraction with safeguards)
- Performance: processing 31 large logs might be slow (mitigate: profile and optimize if needed)

**Dependencies**: None (can start immediately)
**Parallelization**: T001 can run in parallel with other WPs (investigation only)

**Prompt File**: See `WP01-fix-tool-extraction-bug.md`

---

## Work Package WP02: Generate Baseline Metrics Report (Priority: P1 HIGH)

**Goal**: Analyze extracted tool call data to establish baseline metrics for measuring LLM tool discovery

**Priority**: P1 - Enables all downstream analysis
**Complexity**: MEDIUM (analysis + reporting)
**Owner**: Analytics/QA
**Timeline**: 3-4 hours
**Depends On**: WP1 (extraction must be complete)
**Acceptance Criteria**:
- SC-004 verified: baseline metrics calculated and documented
- SC-005 verified: data quality validated at 100% accuracy
- Baseline report generated with methodology and findings
- Metrics provided for future MCP improvements comparison

**Subtasks**:
- [ ] **T007**: Create metrics extraction script [P - can parallelize with analysis]
  - Parse all 31 execution results with populated `toolsInvoked[]`
  - Calculate: total calls, average per execution (min/max/mean), distribution by domain
  - Count retry patterns (same tool called 2+, 3+, 4+ times)
  - Identify success rate by domain
  - **Acceptance**: Script produces CSV/JSON with all metrics

- [ ] **T008**: Classify tool discovery patterns
  - Analyze each execution's tool call sequence
  - Classify successful executions: direct path (2-3 calls), discovery retry (4-6), efficient (6-8+)
  - Classify failed executions: wrong tool, parameter error, prerequisite failure, external API error
  - Document retry loops with examples
  - **Acceptance**: All 31 executions classified with pattern justification

- [ ] **T009**: Generate domain-level breakdowns
  - Group metrics by domain (apps, databases, domains-mail, containers, etc.)
  - Calculate domain-specific success rates and tool usage patterns
  - Identify domains with high/low retry frequencies
  - Note any domain-specific anomalies
  - **Acceptance**: Domain breakdown table with 8 domains, metrics for each

- [ ] **T010**: Data quality validation & spotchecks
  - Spot-check 10% of extracted tool calls (3-4 executions) against raw JSONL
  - Verify: tool names match, parameters correct, response data complete
  - Document confidence level and any discrepancies
  - **Acceptance**: Validation report confirms 100% accuracy or identifies issues

- [ ] **T011**: Generate comprehensive baseline report
  - Document extraction methodology used (which JSONL fields parsed, etc.)
  - Present baseline metrics with confidence intervals
  - Include tool distribution charts/tables by domain
  - Add 5-10 example tool call sequences showing LLM patterns
  - Note any data quality issues, caveats, limitations
  - **Acceptance**: Report is 5-10 pages, ready for stakeholder review

**Risks**:
- Tool call patterns hard to classify objectively (mitigate: create clear classification rules with examples)
- Metrics may reveal data quality issues (mitigate: investigate and document)
- Analysis paralysis (mitigate: focus on MVP metrics first, extend later)

**Dependencies**: WP1 (extraction complete)
**Parallelization**: T007, T008, T009 can run in parallel; T010, T011 sequential

**Parallel Opportunities**:
- T007 & T008 can extract different execution subsets in parallel
- Domain grouping (T009) can run while pattern classification (T008) ongoing

**Prompt File**: See `WP02-generate-baseline-metrics.md`

---

### Phase 2: Test Data Quality Fixes

## Work Package WP03: Rewrite All 31 Use Case Prompts (Priority: P1 HIGH)

**Goal**: Convert prescriptive prompts to outcome-focused format, fixing test design flaw

**Priority**: P1 - Blocks valid testing
**Complexity**: MEDIUM (32 prompt rewrites, consistency checking)
**Owner**: QA/Product
**Timeline**: 4-6 hours
**Depends On**: None (can run in parallel with WP1-2)
**Acceptance Criteria**:
- SC-002 verified: all 31 prompts rewritten with zero tool name references
- Domain expert spot-check confirms non-prescriptive format
- Prompts retain sufficient context for LLM success
- All use case JSON files updated with new prompts

**Subtasks**:
- [ ] **T012**: Create prompt rewriting guidelines
  - Define "outcome-focused" with 3-5 clear examples (before/after pairs)
  - List prohibited terms: `mcp__mittwald__*` tool names, "use the tools", "call this tool"
  - List required elements: business goal, context, expected outcome, success indicators
  - Create template for rewritten prompt format
  - **Acceptance**: Guidelines doc (1-2 pages) with clear examples and rules

- [ ] **T013**: Batch 1 - Rewrite prompts for 8 use cases (apps domain) [P]
  - Apps: deploy, update version, install wordpress, migrate
  - Access: create sftp user, manage ssh, (2 more if needed)
  - Follow guidelines, maintain domain/context, no tool prescriptions
  - Document reasoning for each rewrite
  - **Acceptance**: 8 rewritten prompts validated against guidelines

- [ ] **T014**: Batch 2 - Rewrite prompts for 8 use cases (databases domain) [P]
  - Databases: provision mysql, create backup, setup redis, manage users
  - Automation: setup cronjob, manage scheduled tasks, (2 more if needed)
  - **Acceptance**: 8 rewritten prompts, consistent with batch 1

- [ ] **T015**: Batch 3 - Rewrite prompts for 8 use cases (domains/mail domain) [P]
  - Domains: setup email forwarding, configure dns, setup mailbox, ssl certificate
  - Backups: setup schedule, create backup, restore from backup, (1 more if needed)
  - **Acceptance**: 8 rewritten prompts, style consistent across batches

- [ ] **T016**: Batch 4 - Rewrite prompts for remaining use cases [P]
  - Containers: manage resources, scale app, deploy docker, manage volumes
  - Identity: manage api tokens, ssh key management, check account settings
  - Organization: invite team member, manage memberships
  - Project: create project, configure ssh, manage environment
  - **Acceptance**: All 31 prompts completed, batches 1-4 stylistically consistent

- [ ] **T017**: Automated tool name pattern scan
  - Create regex scan for `mcp__mittwald__.*` in all 31 prompts
  - Scan for alternative tool name patterns (tool names without mcp prefix)
  - Scan for prohibited phrases ("use the", "call", "invoke")
  - **Acceptance**: SC-002 verified - zero matches found or issues documented

- [ ] **T018**: Domain expert spot-check (10-15% sample)
  - Select 3-5 random prompts from each batch (4-5 total)
  - Verify: clear business goal, no tool prescriptions, retain necessary context
  - Confirm LLM can infer correct domain/tools from context alone
  - Document feedback or issues
  - **Acceptance**: Domain expert approves all spot-checked prompts

- [ ] **T019**: Update all 31 use case JSON definition files
  - Locate each use case JSON in `tests/functional/use-case-library/`
  - Replace `prompt` field with rewritten outcome-focused version
  - Preserve all other fields (expectedDomains, successCriteria, etc.)
  - Validate JSON syntax
  - **Acceptance**: All 31 files updated and syntactically valid

**Risks**:
- Prompts become too vague, LLM can't infer correct tools (mitigate: domain expert review)
- Rewritten prompts cause test pass rate to drop significantly (mitigate: expect 70-80% pass rate initially)
- Inconsistency across rewrites (mitigate: guidelines + batch approach ensures consistency)

**Dependencies**: None
**Parallelization**: Batches 1-4 (T013-T016) can run in parallel if multiple writers
**Parallel Opportunities**:
- Each batch can be assigned to different team member
- Pattern scan (T017) can start once batch 1-2 complete
- Domain expert review can proceed as batches complete

**Prompt File**: See `WP03-rewrite-use-case-prompts.md`

---

## Work Package WP04: Prepare Test Infrastructure for Re-execution (Priority: P1 HIGH)

**Goal**: Ensure test harness is ready for clean 007 re-execution with fixed infrastructure

**Priority**: P1 - Required before WP5
**Complexity**: LOW (infrastructure checks)
**Owner**: Test Infrastructure
**Timeline**: 1-2 hours
**Depends On**: WP1 (extraction must be integrated)
**Acceptance Criteria**:
- Test harness integrated with fixed extraction code
- MCP and OAuth servers operational on Fly.io
- Test runner can execute single use case with tool data capture
- Execution plan documented with success criteria

**Subtasks**:
- [ ] **T020**: Verify test harness integration with fixed extraction
  - Confirm executor.ts changes compiled into dist/
  - Test single use case execution (e.g., apps-001) against live MCP server
  - Verify execution result has populated `toolsInvoked[]`
  - **Acceptance**: Single test run produces valid execution result with tool data

- [ ] **T021**: Health check MCP and OAuth servers on Fly.io
  - Test `mittwald-mcp-fly2` health endpoint
  - Test `mittwald-oauth-server` health endpoint
  - Verify JWT secret synchronization (BRIDGE_JWT_SECRET matches OAUTH_BRIDGE_JWT_SECRET)
  - **Acceptance**: Both servers healthy and responsive

- [ ] **T022**: Create execution plan and logging configuration
  - Document re-execution procedures (npm commands, expected runtime ~4 hours)
  - Define monitoring/logging strategy for full 31 use cases
  - Establish cleanup protocol for temporary test data
  - Create rollback plan if execution fails mid-way
  - **Acceptance**: Execution plan doc (2-3 pages) ready for team

**Risks**:
- Fly.io servers may be down (mitigate: manual health check before WP5)
- JWT secrets out of sync (mitigate: verify synchronization explicitly)
- Test data accumulation (mitigate: cleanup script ready)

**Dependencies**: WP1 (extraction integrated)
**Parallelization**: T020, T021 can run in parallel

**Prompt File**: See `WP04-prepare-test-infrastructure.md`

---

### Phase 3: Validation & Analysis

## Work Package WP05: Execute 007 Test Suite Against Fixed Infrastructure (Priority: P1 CRITICAL)

**Goal**: Re-run all 31 use cases with fixed extraction and outcome-focused prompts, capture clean baseline data

**Priority**: P1 - Core deliverable
**Complexity**: HIGH (long-running, resource-intensive)
**Owner**: Test Execution
**Timeline**: 4-5 hours (for execution) + monitoring
**Depends On**: WP1, WP3, WP4
**Acceptance Criteria**:
- SC-003 verified: all 31 executions complete with captured tool call data
- SC-006 verified: pass rate ≥77.4% or justified variance explained
- New baseline metrics calculated
- Execution logs preserved for analysis

**Subtasks**:
- [ ] **T023**: Pre-execution checklist
  - Confirm WP1 extraction integrated and tested ✓
  - Confirm WP3 prompts updated in all 31 use case files ✓
  - Confirm WP4 infrastructure ready and health-checked ✓
  - Backup existing execution results (archive old baseline)
  - **Acceptance**: All pre-execution items verified, ready to proceed

- [ ] **T024**: Execute full 007 test suite (31 use cases)
  - Run: `npm run test -- --suite 007 --use-cases all`
  - Monitor execution for errors or timeouts
  - Capture session logs, execution results, tool call data
  - **Acceptance**: All 31 executions complete (success or expected failure)

- [ ] **T025**: Validate execution data capture
  - Verify all 31 execution results exist and contain valid JSON
  - Spot-check 5-10 results: verify `toolsInvoked[]` non-empty and properly formatted
  - Verify tool call metadata (names, parameters, results) reasonable
  - Document any execution failures or anomalies
  - **Acceptance**: SC-003 verified - all executions have captured tool data

- [ ] **T026**: Calculate new baseline metrics
  - Run metrics extraction on new 31 execution results
  - Compare to old baseline (77.4% pass rate, original tool call distribution)
  - Calculate pass rate delta and tool call count changes
  - Analyze domain-by-domain comparison
  - **Acceptance**: SC-006 verified - pass rate ≥77.4% or variance explained

- [ ] **T027**: Document execution report
  - Report start/end times and total duration
  - Document any failures or timeouts with root causes
  - Compare new vs. old baseline metrics (pass rate, tool calls, retry frequency)
  - Highlight any anomalies or unexpected patterns
  - **Acceptance**: Execution report (2-3 pages) ready for review

**Risks**:
- Execution may take longer than 5 hours (mitigate: parallelization possible if multiple workers)
- Some tests may timeout (mitigate: investigate and document, expected for some complex tasks)
- Tool discovery learning curve: pass rate might drop slightly (mitigate: account for in analysis)
- MCP server may become unstable (mitigate: have fallback/restart procedure ready)

**Dependencies**: WP1, WP3, WP4 (all must be complete)
**Not Parallelizable**: Test execution must be sequential, but can parallelize across multiple machines if infrastructure allows

**Prompt File**: See `WP05-execute-007-suite.md`

---

## Work Package WP06: Validate Data Quality & Generate Final Report (Priority: P2)

**Goal**: Verify extracted tool call data accuracy, generate comprehensive analysis report, enable future MCP improvements

**Priority**: P2 - High value but not blocking
**Complexity**: MEDIUM (validation + analysis)
**Owner**: Analytics/QA
**Timeline**: 3-4 hours
**Depends On**: WP5 (new baseline execution complete)
**Acceptance Criteria**:
- SC-005 verified: data quality validated at 100% accuracy
- SC-007 verified: comprehensive analysis report generated
- SC-008 verified: execution results structure consistent with original 007
- Future work roadmap documented

**Subtasks**:
- [ ] **T028**: Comprehensive data quality validation
  - Spot-check 10% of new execution results (3-4 random) against raw JSONL session logs
  - For each spot-check: verify all tool calls captured, metadata accurate, sequence preserved
  - Compare new vs. old execution result schema (ensure backward compatibility)
  - Document any discrepancies or data quality issues
  - **Acceptance**: SC-005 verified - 100% accuracy on sample, report documented

- [ ] **T029**: Analyze tool discovery patterns from new baseline
  - Classify all 31 executions by tool discovery pattern (direct path, discovery retry, etc.)
  - Identify successful vs. failed patterns and root causes
  - Compare patterns across domains
  - Document examples of good patterns and anti-patterns
  - **Acceptance**: All 31 executions classified with evidence

- [ ] **T030**: Generate comprehensive analysis report
  - **Section 1**: Executive summary (fixes applied, key findings)
  - **Section 2**: Data extraction methodology (JSONL parsing approach, validation)
  - **Section 3**: Baseline metrics (before/after comparison, domain breakdowns)
  - **Section 4**: Tool discovery patterns (classification, examples, insights)
  - **Section 5**: Data quality findings (spot-check results, confidence, caveats)
  - **Section 6**: Recommendations (implications for future MCP improvements, next steps)
  - **Acceptance**: Report is 10-15 pages, ready for stakeholder review

- [ ] **T031**: Create roadmap for future MCP improvements (Sprints 009+)
  - Document which tool call patterns suggest MCP server improvements
  - Identify categories of LLM confusion that could be addressed
  - Propose priorities for future work (tool descriptions, Resources, Prompts, Completion)
  - **Acceptance**: Roadmap document (2-3 pages) with prioritized recommendations

**Risks**:
- Analysis paralysis: too many insights to process (mitigate: focus on MVP findings, extend later)
- Conflicting patterns hard to explain (mitigate: document as "requires investigation")
- Report writing takes longer than expected (mitigate: use template structure)

**Dependencies**: WP5 (new baseline execution complete)
**Parallelization**: T028 & T029 can run in parallel

**Prompt File**: See `WP06-validate-data-quality.md`

---

## Work Package Summary

| WP | Title | Priority | Timeline | Depends On | Owner |
|---|---|---|---|---|---|
| **WP1** | Fix Tool Extraction Bug | P1 CRITICAL | 2-4h | None | Backend |
| **WP2** | Generate Baseline Metrics | P1 HIGH | 3-4h | WP1 | Analytics |
| **WP3** | Rewrite 31 Use Case Prompts | P1 HIGH | 4-6h | None | QA/Product |
| **WP4** | Prepare Test Infrastructure | P1 HIGH | 1-2h | WP1 | Test Infra |
| **WP5** | Execute 007 Test Suite | P1 CRITICAL | 4-5h | WP1,WP3,WP4 | Test Exec |
| **WP6** | Validate & Final Report | P2 HIGH | 3-4h | WP5 | Analytics |

**Total Effort**: 22-27 hours of work
**Critical Path**: WP1 → WP4 → WP5 → WP6 (essential sequence)
**Parallelizable**: WP2 & WP3 can start immediately alongside WP1

---

## Success Metrics (Complete Sprint 008)

- [ ] **SC-001**: Tool extraction 100% accurate (10% spot-check validation)
- [ ] **SC-002**: All 31 prompts rewritten, zero tool name references (automated scan)
- [ ] **SC-003**: All 31 executions complete with captured tool data
- [ ] **SC-004**: Baseline metrics calculated with domain breakdowns
- [ ] **SC-005**: Data quality validated at 100% accuracy
- [ ] **SC-006**: Pass rate ≥77.4% (original baseline)
- [ ] **SC-007**: Comprehensive analysis report generated
- [ ] **SC-008**: Execution results structure consistent with original 007

**Sprint 008 is complete when ALL success criteria are verified.**

---

## Next Steps

1. **Start WP1** (Fix tool extraction) - Critical path blocker
2. **Parallelize WP2 & WP3** (Metrics + Prompt rewriting) while WP1 completes
3. **Execute WP4-6 sequentially** once foundation established

**Suggested Command**: `claude /spec-kitty.implement --work-package WP01`

---

## Prompt Files

Each work package has a dedicated prompt file in the `tasks/planned/` directory:

- [ ] `tasks/planned/WP01-fix-tool-extraction-bug.md` - Detailed implementation guidance
- [ ] `tasks/planned/WP02-generate-baseline-metrics.md` - Metrics calculation approach
- [ ] `tasks/planned/WP03-rewrite-use-case-prompts.md` - Prompt rewriting guidelines
- [ ] `tasks/planned/WP04-prepare-test-infrastructure.md` - Infrastructure setup
- [ ] `tasks/planned/WP05-execute-007-suite.md` - Execution procedures
- [ ] `tasks/planned/WP06-validate-data-quality.md` - Validation and reporting

