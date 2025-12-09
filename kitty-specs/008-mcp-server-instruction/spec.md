# Feature Specification: Fix Sprint 007 Infrastructure & Validate LLM Tool Discovery

**Feature Branch**: `008-mcp-server-instruction`
**Created**: 2025-12-09
**Status**: Ready for Planning
**Input**: Sprint 007 test infrastructure had two critical flaws: (1) tool call tracking not implemented (`toolsInvoked` empty), (2) use case prompts prescriptive instead of outcome-focused. This sprint fixes both issues and re-executes all 31 tests to properly measure LLM tool discovery patterns.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Implement Tool Call Extraction from Session Logs (Priority: P1)

An engineer extracts MCP tool invocation metadata from existing Sprint 007 JSONL session logs and populates the `toolsInvoked` array in execution results, enabling downstream analysis of tool call patterns.

**Why this priority**: Session logs already contain complete tool call data embedded in Task subagent responses. This is pure data extraction—no test re-runs needed, no new instrumentation required. Foundation for all downstream analysis.

**Independent Test**: Can be fully tested by processing a subset (5-10) of existing session logs and verifying: `toolsInvoked[]` is populated with complete metadata for every tool call present in the session, extracted tool list matches manual review of raw JSONL, tool call sequence order preserved.

**Acceptance Scenarios**:

1. **Given** a session log contains tool invocations within Task subagent responses, **When** extraction process runs, **Then** each tool call appears in `toolsInvoked[]` with: name, parameters, response, result status, timestamp, sequence order
2. **Given** a tool call errored (e.g., 403, validation failure), **When** extracted, **Then** error details are captured in the result object with error type and message
3. **Given** a session log has multiple tool calls, **When** extracted, **Then** parent-child relationships are preserved (which tool call triggered follow-up calls)
4. **Given** extraction completes for all 31 existing session logs, **When** compared to manual spot-check, **Then** 100% accuracy on tool call presence and sequence

---

### User Story 2 - Rewrite Sprint 007 Use Case Prompts to Be Outcome-Focused (Priority: P1)

An engineer rewrites all 31 use case prompts to describe desired outcomes without prescribing specific tools, enabling proper measurement of LLM tool discovery capability.

**Why this priority**: Current prompts explicitly list tool names ("Use the Mittwald MCP tools to first list X, then call Y"). This invalidates the entire premise of Sprint 007—testing whether LLMs can discover correct tools from available `tools()` list. Fixing prompts is prerequisite for valid testing.

**Independent Test**: Can be fully tested by comparing original vs. rewritten prompts for a subset and confirming: rewritten versions describe outcomes without naming tools, rewritten versions retain all necessary context for LLM to succeed, domain expert validation that prompts are non-prescriptive.

**Acceptance Scenarios**:

1. **Given** a use case with prescriptive prompt (e.g., "Use tools to list projects, then create app"), **When** rewritten, **Then** it becomes outcome-focused (e.g., "Deploy a Node.js application so I can see it running on Mittwald")
2. **Given** all 31 prompts are rewritten, **When** reviewed for tool name mentions, **Then** automated pattern matching finds zero references to `mcp__mittwald__*` tool names
3. **Given** rewritten prompts, **When** spot-checked by domain expert, **Then** each prompt is clear about intent without limiting tool choices
4. **Given** original use case context (expectedDomains, successCriteria), **When** rewritten prompts are tested, **Then** LLM can still infer correct domain and succeed without explicit tool guidance

---

### User Story 3 - Re-Execute Sprint 007 Test Suite with Fixed Infrastructure (Priority: P1)

An engineer re-executes all 31 use cases using rewritten outcome-focused prompts and updated test harness with proper tool call extraction, generating clean baseline data for tool discovery analysis.

**Why this priority**: New baseline data is essential—old data is invalid due to prescriptive prompts. This re-execution is the foundation for measuring LLM tool discovery capability accurately.

**Independent Test**: Can be fully tested by executing all 31 use cases and confirming: all executions complete (pass or fail as appropriate), all tool invocations captured in `toolsInvoked[]`, baseline metrics available for comparison to original 007 results.

**Acceptance Scenarios**:

1. **Given** improved test harness with tool extraction and rewritten prompts, **When** 007 suite executes against Fly.io deployed MCP server, **Then** all 31 use cases run to completion (success or expected failure)
2. **Given** a use case completes (pass or fail), **When** execution result is generated, **Then** `toolsInvoked[]` contains complete metadata for all tool calls made during execution
3. **Given** rewritten outcome-focused prompts, **When** executed, **Then** pass rate is comparable to or better than original 77.4% baseline (accounting for tool discovery learning)
4. **Given** all executions complete, **When** analyzed, **Then** tool call patterns show LLM discovering tools from available `tools()` list rather than following prescribed sequence

---

### User Story 4 - Classify Tool Call Patterns and Generate Analysis Report (Priority: P2)

An engineer analyzes captured tool call data to identify patterns: successful direct paths, retry loops, tool selection variations, and correlate patterns with use case outcomes.

**Why this priority**: Classification transforms raw tool call data into actionable insights about LLM tool discovery behavior and decision-making patterns.

**Independent Test**: Can be fully tested by analyzing subset of executions and confirming: tool call patterns classified consistently, patterns correlated with pass/fail outcomes, report includes evidence from session logs explaining tool selection decisions.

**Acceptance Scenarios**:

1. **Given** tool call data from new 007 baseline, **When** analyzed, **Then** each successful execution is classified by tool call pattern: direct path (minimal calls), discovery retry (LLM tries alternatives before succeeding), efficient discovery (explores alternatives but reaches correct path efficiently)
2. **Given** a failed execution, **When** analyzed, **Then** failure root cause is classified: wrong tool selection, parameter errors, prerequisite failures, external API errors
3. **Given** multiple executions in same domain, **When** compared, **Then** tool discovery patterns are consistent or differences are explained by prompt variations
4. **Given** analysis complete, **When** report generated, **Then** it includes: tool call distribution by domain, success rate by domain, pattern frequency, examples from session logs

---

### User Story 5 - Validate Data Quality and Establish Metrics Baseline (Priority: P2)

An engineer validates that extracted tool call data is complete and accurate, establishes baseline metrics for tool discovery performance, and documents findings.

**Why this priority**: Data quality validation ensures all downstream analysis is trustworthy. Baseline metrics enable future comparisons when MCP server improvements are tested.

**Independent Test**: Can be fully tested by spot-checking 10% of executions for data completeness, comparing metrics across domains, verifying consistency between session logs and extracted data.

**Acceptance Scenarios**:

1. **Given** extracted tool call data from all 31 executions, **When** spot-checked against raw session logs, **Then** 100% of tool calls are captured accurately with correct metadata
2. **Given** baseline metrics calculated, **When** reviewed, **Then** metrics include: total tool calls, calls per execution (average/min/max), tool usage distribution by domain, retry patterns (count, frequency)
3. **Given** 31 execution results with populated `toolsInvoked[]`, **When** compared across domains, **Then** tool call patterns are consistent within domains and variations across domains are explained
4. **Given** data quality validated and metrics established, **When** documented, **Then** report includes: methodology, validation findings, baseline metrics, confidence level, caveats about data collection

---

### Edge Cases

- What if a tool call occurs but has no visible result (tool runs but result not captured)? How do we handle incomplete tool invocations?
- If an LLM retries with the same tool but different parameters, is this a "retry loop" or "discovery"? How do we distinguish?
- When analyzing tool call patterns, how do we account for legitimate API retries vs. LLM confusion (e.g., eventual consistency polling)?
- What if a use case times out mid-execution? Do partial tool calls count in analysis?
- How do we handle tools that are called but not directly related to the use case goal (e.g., exploratory queries)?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Test harness MUST extract all tool invocations from existing 007 JSONL session logs and populate `toolsInvoked[]` array with: name, parameters, response, result, timestamp, sequence order, success/error status
- **FR-002**: Extraction process MUST handle all tool invocation formats present in Task subagent responses without data loss or corruption
- **FR-003**: All 31 use case prompts MUST be rewritten from prescriptive format to outcome-focused format, removing all explicit tool name references while retaining necessary context
- **FR-004**: Rewritten prompts MUST be validated for tool-name pattern absence (automated scan) and clarity (domain expert spot-check)
- **FR-005**: Test harness MUST preserve all execution result structure while enhancing with populated `toolsInvoked[]` data
- **FR-006**: Re-execution of all 31 use cases MUST be automated, capturing tool call data for each execution
- **FR-007**: Re-execution results MUST be directly comparable to original 007 results (same structure, same use case IDs, same domains)
- **FR-008**: Baseline metrics MUST include: total tool calls, distribution by domain, average calls per execution, retry frequencies, success/failure correlation
- **FR-009**: Data quality validation MUST verify 100% tool call capture accuracy with documented methodology and spot-check results
- **FR-010**: Analysis report MUST document tool discovery patterns with examples from session logs explaining LLM decision-making

### Key Entities

- **Tool Invocation**: Individual MCP tool call with complete metadata
  - Attributes: tool_name, parameters (JSON), response, result, error_status, timestamp, sequence_order, parent_call_id (if nested)
  - Relationships: belongs to a use case execution, may trigger follow-up invocations

- **Execution Result**: Outcome of running a single use case
  - Attributes: execution_id, use_case_id, status (pass/fail), start_time, end_time, duration, toolsInvoked[], error_messages, tool_call_count
  - Relationships: one result per use case execution, references one session log

- **Tool Discovery Pattern**: Classification of how LLM selected tools
  - Attributes: execution_id, pattern_type (direct_path / discovery_retry / efficient_discovery / failed), tool_sequence, success/failure, confidence_score
  - Relationships: one classification per execution, may share pattern with other executions in same domain

- **Baseline Metrics**: Aggregate statistics of tool discovery performance
  - Attributes: total_executions, total_tool_calls, avg_calls_per_execution, success_rate, tool_distribution{}, retry_frequencies{}, domain_breakdown{}
  - Relationships: computed from all 31 execution results

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Tool call extraction complete and accurate — 100% of tool invocations from existing session logs captured in `toolsInvoked[]` array (verified via spot-check against 10% of session logs)

- **SC-002**: Use case prompts rewritten successfully — All 31 prompts rewritten to outcome-focused format with zero tool name references (verified via automated pattern scan + domain expert review)

- **SC-003**: Re-execution data captured — All 31 use cases re-executed with complete tool call metadata captured (100% of executions have non-empty `toolsInvoked[]`)

- **SC-004**: Baseline metrics established — Metrics calculated and documented including: total tool calls, distribution by domain, success rate by domain, average calls per execution, retry pattern frequencies

- **SC-005**: Data quality validated — 100% of extracted tool calls match raw session log data (verified via automated comparison + manual spot-check)

- **SC-006**: Pass rate maintained or improved — Re-execution pass rate meets or exceeds original 77.4% baseline (accounting for tool discovery learning curve)

- **SC-007**: Analysis report complete — Comprehensive report generated documenting: tool discovery patterns, domain breakdowns, examples from session logs, data quality findings, baseline metrics with confidence levels

- **SC-008**: Execution results structure consistent — Re-executed results use identical schema to original 007 results, enabling direct metric comparisons

### Qualitative Outcomes

- Tool call data is trustworthy and complete for downstream analysis
- Outcome-focused prompts accurately represent LLM tool discovery challenges without artificial constraints
- Baseline metrics provide foundation for measuring MCP server instruction improvements in future sprints
- Session logs clearly demonstrate LLM decision-making rationale for each tool selection
- Data is ready for classification into error categories (wrong tool, retry loops, unnecessary prerequisites, errors) in future work

---

## Assumptions

- Existing 007 session logs contain sufficient detail to reconstruct all tool invocations accurately
- Tool invocations in JSONL follow consistent format across all 31 executions
- Outcome-focused prompt rewriting will not significantly change success rate (accounting for legitimate tool discovery process)
- MCP server and Fly.io deployment remain stable during re-execution
- Tool discovery patterns are deterministic enough for consistent analysis (not requiring manual review of every execution)
- Pass/fail outcomes are independent of prompt rewriting (i.e., rewritten prompts enable same outcomes as original)

---

## Out of Scope

- Changes to LLM models or system prompts (test infrastructure and prompts only)
- MCP server code changes or instruction improvements (deferred to future sprints)
- Performance optimization or caching (tool call quality and discovery focus)
- Detailed error categorization (A/B/D/C classification deferred to future work)
- Implementing new MCP capabilities (Resources, Prompts, Completions)
- Architectural refactoring of test harness (minimal changes to existing structure)
