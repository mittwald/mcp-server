# Implementation Plan: Fix Sprint 007 Infrastructure & Validate LLM Tool Discovery

**Feature Branch**: `008-mcp-server-instruction`
**Created**: 2025-12-09
**Status**: Ready for Implementation

---

## Implementation Strategy

Sprint 008 is organized into three sequential phases, each with clear completion criteria:

### Phase 1: Data Extraction Infrastructure (WP1-2)
Extract tool call metadata from existing Sprint 007 session logs and populate execution results.
**Goal**: Enable analysis of what tools LLMs actually used (currently `toolsInvoked: []` is empty)

### Phase 2: Test Data Quality Fixes (WP3-4)
Rewrite all 31 use case prompts to be outcome-focused instead of prescriptive, ensuring proper tool discovery measurement.
**Goal**: Replace prescriptive prompts ("Use tools to list X, then call Y") with outcome-focused ones ("Deploy a Node.js app so I can see it running")

### Phase 3: Validation & Analysis (WP5-6)
Re-execute 007 tests with fixed infrastructure, validate data capture, and establish baseline metrics.
**Goal**: Generate clean dataset with trustworthy tool call data and baseline metrics for future MCP improvements

---

## Work Packages

### WP1: Implement Tool Call Extraction Pipeline

**Objective**: Parse existing 007 JSONL session logs and populate `toolsInvoked[]` in execution results

**Key Tasks**:
1. **Analyze JSONL structure** (Story 1 acceptance test)
   - Examine sample session logs to document tool invocation format
   - Identify how tool calls are embedded within Task subagent responses
   - Document parser requirements and edge cases
   - Acceptance: Design document describing JSONL structure, tool call format, extraction approach

2. **Implement extraction parser** (Story 1 acceptance test)
   - Create tool invocation extraction logic that processes JSONL files
   - Parse tool_use objects from assistant messages
   - Extract tool_result objects from user messages
   - Build tool invocation metadata: name, parameters, response, result, timestamp, sequence
   - Acceptance: Parser successfully extracts 100% of tool calls from sample 10% of session logs

3. **Handle edge cases**
   - Tool calls with errors (capture error details)
   - Nested tool calls (preserve parent-child relationships)
   - Incomplete tool invocations (tool runs but result missing)
   - Timeout scenarios (partial tool call data)
   - Acceptance: Edge case handling documented and tested on representative scenarios

4. **Integrate with execution result generation**
   - Modify execution result JSON generation to populate `toolsInvoked[]`
   - Run extraction on all 31 existing session logs
   - Verify execution results now contain complete tool call data
   - Acceptance: All 31 execution results have populated `toolsInvoked[]` (none empty)

5. **Validate extraction accuracy**
   - Spot-check 10% of extracted tool calls against raw JSONL
   - Verify metadata accuracy (names, parameters, responses)
   - Verify sequence order preserved
   - Document any discrepancies
   - Acceptance: SC-001 verified - 100% accuracy on spot-checked sample

**Acceptance Criteria**:
- All tool invocations from existing session logs are captured in `toolsInvoked[]`
- Extraction process handles all tool invocation formats without loss
- Error details and tool call relationships preserved
- Spot-check validation confirms 100% accuracy

---

### WP2: Create Tool Call Analysis Baseline Report

**Objective**: Generate metrics report from extracted tool call data (before prompt rewriting)

**Key Tasks**:
1. **Calculate baseline metrics**
   - Count total tool calls across all 31 executions
   - Calculate average calls per execution (min, max, mean)
   - Distribution of tool usage by domain
   - Retry pattern frequencies (how often same tool called multiple times)
   - Success rate by domain
   - Acceptance: Metrics document created with all baseline numbers

2. **Validate extraction accuracy on old baseline**
   - Spot-check 10% of extracted tool calls (3-4 executions) against raw JSONL
   - Verify: tool names match, parameters correct, response data complete, sequence order preserved
   - Document confidence level and any discrepancies
   - Acceptance: SC-001 verification complete - extraction 100% accurate on sample

3. **Generate baseline metrics report**
   - Document extraction methodology (which JSONL fields parsed, edge cases handled)
   - Present baseline metrics with confidence intervals
   - Show tool distribution charts/tables by domain
   - Include 5-10 example tool call sequences showing LLM patterns
   - Note any data quality issues, caveats, limitations
   - Acceptance: Report is 3-5 pages, ready for comparison after new baseline execution

**Acceptance Criteria**:
- Baseline metrics calculated and documented
- Extraction accuracy validated at 100% on spot-check sample
- Report includes methodology, metrics, examples, and caveats

**Note**: This report represents the OLD baseline with prescriptive prompts. Pattern classification deferred to Phase 3 (WP6) after new baseline execution.

---

### WP3: Rewrite All 31 Use Case Prompts

**Objective**: Convert prescriptive prompts ("Use tools to...") to outcome-focused prompts ("I need to...")

**Key Tasks**:
1. **Create prompt rewriting guidelines**
   - Document style guide for outcome-focused prompts
   - Define what NOT to include (tool names, explicit tool sequences)
   - Define what TO include (business goal, context, expected outcome)
   - Provide before/after examples
   - Acceptance: Guidelines document created and validated

2. **Rewrite all 31 prompts**
   - Convert each prompt from prescriptive to outcome-focused format
   - Maintain domain and context for LLM to discover correct tools
   - Ensure rewritten prompts are clear about intent without limiting choices
   - Preserve original use case intent and success criteria
   - Acceptance: All 31 prompts rewritten

3. **Validate rewrites for tool-name removal**
   - Scan all 31 rewritten prompts for `mcp__mittwald__*` tool name patterns
   - Automated pattern matching confirms zero tool name references
   - SC-002 verification: Pass automated scan for tool-name absence
   - Acceptance: Automated scan passes with zero tool name matches

4. **Domain expert spot-check**
   - Sample review: 10-15% of rewritten prompts (3-5 use cases per domain)
   - Verify prompts are clear about intent
   - Verify prompts don't prescribe tools
   - Verify prompts retain sufficient context for LLM success
   - Acceptance: Domain expert confirms all spot-checked prompts are non-prescriptive

5. **Update use case definitions**
   - Replace prescriptive prompts in all 31 use case JSON files
   - Update prompt field with outcome-focused version
   - Preserve all other fields (expectedDomains, successCriteria, etc.)
   - Acceptance: All 31 use case files updated and committed

**Acceptance Criteria**:
- All 31 prompts converted from prescriptive to outcome-focused
- SC-002 verified - zero tool name references
- Domain expert spot-check confirms quality
- Use case definition files updated

---

### WP4: Prepare Test Infrastructure for Re-execution

**Objective**: Ensure test harness is ready for clean re-execution with new tool extraction

**Key Tasks**:
1. **Verify test harness readiness**
   - Confirm tool extraction code integrated into test runner
   - Test execution with sample use case to verify tool call capture works
   - Verify execution results generated with populated `toolsInvoked[]`
   - Acceptance: Sample test execution produces valid results with tool data

2. **Prepare test environment**
   - Verify MCP server is deployed to Fly.io (`mittwald-mcp-fly2`)
   - Health check: Confirm OAuth and MCP servers are operational
   - Prepare test runner configuration
   - Acceptance: All infrastructure healthy and ready for full suite execution

3. **Create execution plan and cleanup protocol**
   - Document re-execution procedures and success criteria
   - Define cleanup requirements for test data
   - Establish monitoring/logging for re-execution run
   - Acceptance: Execution plan document ready

**Acceptance Criteria**:
- Test infrastructure ready for full 31-use-case execution
- Tool extraction code verified working
- MCP and OAuth servers healthy on Fly.io

---

### WP5: Execute 007 Test Suite Against Rewritten Prompts

**Objective**: Re-run all 31 use cases with outcome-focused prompts and capture complete tool call data

**Key Tasks**:
1. **Execute full 007 test suite**
   - Run all 31 use cases against Fly.io MCP server
   - Each execution captures tool call data via extraction pipeline
   - Generate execution results with populated `toolsInvoked[]` for each case
   - Acceptance: All 31 executions complete (success or expected failure)

2. **Validate execution data capture**
   - Verify all 31 execution results have non-empty `toolsInvoked[]`
   - Spot-check 10% of results for data completeness
   - Verify tool call sequence and metadata accuracy
   - Acceptance: SC-003 verified - all 31 use cases have captured tool call data

3. **Calculate new baseline metrics**
   - Recalculate all baseline metrics with new execution data
   - Compare to original 007 baseline:
     - Tool call count changes
     - Retry frequency changes
     - Pass rate comparison (target: ≥77.4%)
     - Domain-by-domain breakdowns
   - Acceptance: SC-004 & SC-006 verified - metrics calculated and pass rate maintained

**Acceptance Criteria**:
- All 31 use cases executed successfully (data-wise, regardless of pass/fail outcome)
- Tool call data captured for all executions (SC-003)
- New baseline metrics calculated (SC-004)
- Pass rate maintained or improved vs. 77.4% (SC-006)

---

### WP6: Validate Data Quality & Generate Final Report

**Objective**: Verify extracted tool call data is accurate and complete, generate comprehensive analysis report

**Key Tasks**:
1. **Comprehensive data quality validation**
   - Compare new execution results to original session logs (10% sample)
   - Verify 100% of tool calls captured in extraction
   - Verify metadata accuracy (names, parameters, responses, errors)
   - Verify sequence order preserved
   - Document any anomalies or data quality issues
   - Acceptance: SC-005 verified - data quality validation complete with 100% accuracy

2. **Tool discovery pattern analysis**
   - Classify all 31 executions by tool discovery pattern
   - Direct path (minimal, optimal tool calls)
   - Discovery retry (LLM tries alternatives, eventually succeeds)
   - Efficient discovery (explores but finds path efficiently)
   - Failed (wrong tool selection, parameter errors, prerequisites, external API errors)
   - Identify domain patterns and variations
   - Acceptance: All executions classified with pattern justifications

3. **Generate comprehensive final report**
   - Executive summary: Sprint 008 scope, fixes applied, key findings
   - Data extraction section: Methodology, validation results (SC-005)
   - Prompt rewriting section: Guidelines applied, validation results (SC-002)
   - Baseline metrics: Before/after comparison, domain breakdowns (SC-004)
   - Tool discovery patterns: Classification results, examples from session logs (SC-007)
   - Data quality findings: Spot-check results, confidence level, caveats (SC-005)
   - Recommendations: Foundation for future MCP improvements
   - Acceptance: SC-007 verified - comprehensive report with all required sections

4. **Enable future Sprint 009+ analysis**
   - Establish clean data foundation for error categorization (A/B/D/C)
   - Document where additional analysis might start
   - Create roadmap for MCP server improvements based on patterns
   - Acceptance: Handoff documentation for future sprints created

**Acceptance Criteria**:
- SC-005: Data quality validated at 100% accuracy level
- SC-007: Analysis report complete with all required sections
- SC-008: Execution results structure verified consistent with original 007

---

## Critical Success Path

### Must Complete for Sprint Success:
1. **WP1 completion**: Tool extraction pipeline fully working, all session logs parsed, `toolsInvoked[]` populated
2. **WP3 completion**: All 31 prompts rewritten and validated (automated scan + domain expert spot-check)
3. **WP5 completion**: Full 007 test suite re-executed with tool call data captured
4. **WP6 completion**: Data quality validation confirms 100% accuracy

### Optional Enhancements (Time Permitting):
- Automated testing of tool extraction accuracy
- Additional domain expert review beyond required 10% spot-check
- Extended analysis of tool discovery patterns for future MCP improvements

---

## Known Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| JSONL parsing complexity | Tool extraction fails, cannot populate toolsInvoked[] | Start with sample JSONL analysis, test parser incrementally, document format first |
| Rewritten prompts cause test failures | Pass rate drops below 77.4% baseline | Domain expert reviews high-risk prompts before final commit, validate on sample cases first |
| Tool extraction misses edge cases | Data quality concerns, metrics unreliable | Implement comprehensive error handling, test on diverse execution patterns, spot-check validation |
| Fly.io deployment unavailable | Cannot re-execute 007 tests | Health checks before execution, have fallback test environment ready |
| Session log data incomplete | Cannot extract some tool calls | Analyze representative sample of logs first, document missing data patterns, note in report |

---

## Dependencies & Blockers

**External Dependencies**:
- Existing Sprint 007 session logs must be available and readable
- Mittwald MCP server must be deployed and operational on Fly.io
- OAuth server and JWT secrets must be synchronized (verified via CLAUDE.md)

**Upstream Tasks**:
- None - can start immediately on tool extraction

**Downstream Tasks**:
- Sprint 009+: MCP server instruction improvements based on 008 baseline

---

## Success Metrics & Acceptance

### All Success Criteria Must Be Met:
- **SC-001**: 100% tool call extraction accuracy (verified via spot-check)
- **SC-002**: All 31 prompts rewritten with zero tool name references
- **SC-003**: All 31 re-executions capture complete tool call data
- **SC-004**: Baseline metrics calculated with domain breakdowns
- **SC-005**: Data quality validated at 100% accuracy
- **SC-006**: Pass rate ≥77.4% (original baseline)
- **SC-007**: Comprehensive analysis report generated
- **SC-008**: Execution results structure consistent with 007

**Sprint 008 is complete only when ALL success criteria are verified.**

---

## Next Steps After Sprint 008

Once 008 is complete:

1. **Sprint 009+**: MCP Server Instruction Optimization
   - Implement improved tool descriptions
   - Add MCP Resources for reference data
   - Add MCP Prompts for workflow guidance
   - Add MCP Completion for parameter suggestions
   - Re-execute 007 tests to measure improvements

2. **Error Categorization Project**:
   - Classify tool calls into categories A/B/D/C
   - Correlate categories with prompt/server improvements
   - Establish root cause analysis for failures

3. **Continuous Improvement**:
   - Use 008 baseline as foundation for measuring improvements
   - Iterate on MCP server instructions based on tool discovery patterns
   - Track metrics longitudinally across sprints
