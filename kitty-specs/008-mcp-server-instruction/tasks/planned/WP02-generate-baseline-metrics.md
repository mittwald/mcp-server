# WP02: Generate Baseline Metrics Report

**Work Package ID**: WP02
**Priority**: P1 HIGH
**Complexity**: MEDIUM
**Owner**: Analytics/QA
**Estimated Time**: 3-4 hours
**Depends On**: WP1 (extraction must be complete)
**Blocks**: None (optional, but enables WP6)
**Parallelizable**: Yes - can start once WP1 extraction done

---

## Objective

Analyze extracted tool call data from all 31 execution results to establish baseline metrics for LLM tool discovery behavior, enabling future comparison when MCP server improvements are tested.

**Current State**: Execution results have empty `toolsInvoked[]` (WP1 will fix this)
**Expected Outcome**:
- Baseline metrics document with total calls, distribution, retry patterns
- Tool discovery pattern classification (direct path, retry, discovery, failed)
- Domain-level breakdowns and anomalies
- Data quality validation at 100% accuracy

---

## Context

Once WP1 completes tool extraction, all 31 execution results will have populated `toolsInvoked[]` arrays. This WP analyzes that data to create a complete picture of current LLM tool discovery behavior before prompts are rewritten.

**Success Criteria**:
- **SC-004**: Baseline metrics calculated and documented
- **SC-005**: Data quality validated at 100% accuracy

---

## Subtasks

### T007: Create Metrics Extraction Script

**Goal**: Parse all 31 execution results and calculate key metrics

**Instructions**:

1. **Create analysis script** (`analyze-baseline-metrics.ts` or `.js`):
   - Read all execution JSON files from `tests/functional/executions/`
   - Extract `toolsInvoked[]` array from each result
   - Calculate aggregate metrics

2. **Metrics to Calculate**:
   ```typescript
   interface BaselineMetrics {
     total_executions: 31,
     total_tool_calls: number,
     avg_calls_per_execution: number,
     min_calls: number,
     max_calls: number,
     calls_per_domain: Record<string, number>,
     success_rate: number,  // passed/31
     tool_usage_distribution: Record<string, number>,  // count per tool name
     retry_patterns: {
       single_call: number,     // tools called once
       two_times: number,       // tools called 2x in same execution
       three_plus: number,      // tools called 3+ times
     },
     domain_breakdown: Record<string, {
       executions: number,
       total_calls: number,
       avg_calls: number,
       success_rate: number,
     }>
   }
   ```

3. **Output formats**:
   - CSV export: `baseline-metrics.csv` (for spreadsheet analysis)
   - JSON export: `baseline-metrics.json` (for programmatic use)
   - Human-readable report: `baseline-metrics-report.txt`

4. **Example Output** (rough):
   ```
   Total Executions: 31
   Total Tool Calls: 1,847
   Average Calls/Execution: 59.6 (min: 12, max: 147)

   Top Tools:
     1. mcp__mittwald__mittwald_project_list: 31 calls
     2. mcp__mittwald__mittwald_app_list: 28 calls
     3. mcp__mittwald__mittwald_database_mysql_list: 24 calls

   Retry Patterns:
     Single call only: 312 tools
     Called 2x: 85 tools
     Called 3+ times: 42 tools (up to 7x)
   ```

**Acceptance Criteria**:
- Script compiles and runs without errors
- All 31 execution results processed
- CSV and JSON metrics files generated
- Metrics numbers are reasonable (not 0s or NaNs)

---

### T008: Classify Tool Discovery Patterns

**Goal**: Categorize how each execution's LLM discovered/selected tools

**Definitions**:

- **Direct Path** (optimal): 2-4 tool calls, all successful, on first attempt
  - Pattern: Tool called, succeeds immediately
  - Example: List projects (1 call) → Create app (1 call) → Done

- **Discovery Retry** (learning): 5-8 calls, LLM tries alternatives before succeeding
  - Pattern: Tool A fails → Try tool B → Success
  - Example: Wrong tool attempted, then corrected

- **Efficient Discovery** (exploratory): 6-10 calls, explores multiple tools, reaches goal
  - Pattern: Several queries to understand state, then action
  - Example: List projects, list apps, understand structure, then create

- **Inefficient Discovery** (confusion): 10+ calls, lots of retries, but eventually succeeds
  - Pattern: Multiple false starts, parameter errors, retries

- **Failed** (error): Execution failed, classified by root cause
  - Wrong tool: LLM chose fundamentally wrong tool
  - Parameter error: Right tool but wrong parameters
  - Prerequisite: Couldn't gather needed info first
  - External error: API returned error (permission, timeout, etc.)

**Instructions**:

1. **For each execution** in the 31 results:
   - Review `toolsInvoked[]` array
   - Count total calls
   - Analyze sequence of tool names
   - Check execution status (pass/fail)

2. **Classify by logic**:
   ```
   if (execution.status === 'success') {
     if (tool_count <= 4) → Direct Path
     else if (tool_count <= 8 && has_retries) → Discovery Retry
     else if (tool_count <= 10) → Efficient Discovery
     else → Inefficient Discovery
   } else {
     // Failed - determine root cause from logs
     analyze_session_log_for_failure_reason()
   }
   ```

3. **Document with evidence**:
   - For each classification, note why
   - Include 2-3 example tool sequences
   - Note any unusual patterns

4. **Create classification spreadsheet**:
   ```
   | Use Case | Status | Tool Count | Pattern | Evidence |
   |----------|--------|-----------|---------|----------|
   | apps-001 | pass | 14 | Discovery Retry | Listed projects, tried wrong tool, corrected |
   | dbs-001 | fail | 8 | Wrong Tool | Called list instead of create |
   ```

**Acceptance Criteria**:
- All 31 executions classified
- Each has documented evidence/reasoning
- Classifications are internally consistent
- Patterns make sense for future analysis

---

### T009: Generate Domain-Level Breakdowns

**Goal**: Analyze tool usage patterns by domain (apps, databases, containers, etc.)

**Instructions**:

1. **Identify domains** from use case IDs:
   - apps-001 → "apps" domain
   - databases-002 → "databases" domain
   - domains-001 → "domains-mail" domain
   - containers-001 → "containers" domain
   - etc. (8 total domains)

2. **For each domain**, calculate:
   - Number of executions in domain
   - Total tool calls across domain
   - Average calls per execution
   - Success rate (passed/total in domain)
   - Most commonly used tools
   - Retry frequency

3. **Create domain breakdown table**:
   ```
   | Domain | Count | Total Calls | Avg/Exec | Success | Top Tool |
   |--------|-------|-------------|----------|---------|----------|
   | apps | 4 | 245 | 61.3 | 75% | app_list |
   | databases | 4 | 189 | 47.3 | 50% | database_list |
   | containers | 4 | 312 | 78 | 100% | container_list |
   ```

4. **Identify anomalies**:
   - Which domain has highest average calls? (might indicate tool discovery challenges)
   - Which domain has lowest success rate? (why?)
   - Which tools are called most frequently across all domains?

5. **Create visualization** (if time permits):
   - Bar chart: Calls per domain
   - Pie chart: Tool usage distribution
   - Line graph: Success rate by domain

**Acceptance Criteria**:
- All 8 domains analyzed and documented
- Domain-level metrics table created
- Anomalies identified and noted
- Breakdowns are consistent with total metrics

---

### T010: Data Quality Validation & Spot-Checks

**Goal**: Verify extracted tool call data is accurate and complete

**Instructions** (mirrors T006 in WP01 but more comprehensive):

1. **Select 10% sample** (3-4 random executions):
   - Randomly pick from different domains
   - Include: 1 successful, 1 failed, 1 timeout case

2. **For each spot-check**:
   - Open execution JSON (e.g., `apps-001-deploy-php-app-2025-12-05T18-59-15.json`)
   - Open corresponding JSONL session log
   - Manually count `"type":"tool_use"` in JSONL
   - Compare to extracted `toolsInvoked[]` count
   - Verify tool names match exactly
   - Check sequence order preserved
   - Document any mismatches

3. **Create validation report**:
   ```
   Validation Sample #1: apps-001
   ✓ Tool count: 66 (JSONL) == 66 (extracted)
   ✓ Tool names: 100% match
   ✓ Sequence: Preserved correctly
   Status: PASS

   Overall: 3/3 spot-checks PASS → 100% confidence
   ```

4. **Document confidence level**:
   - 100% → Ready for analysis
   - 90-99% → Note exceptions, document
   - <90% → Escalate, may need WP1 review

**Acceptance Criteria**:
- **SC-005 verified**: 100% accuracy on all spot-checked samples
- Validation report documented
- Confidence level established

---

## Implementation Sketch

**Sequence**:
1. Wait for WP1 completion (tool extraction done)
2. Create metrics extraction script (T007) - ~1 hour
3. Run script on all 31 results - ~15 min
4. Classify tool discovery patterns (T008) - ~1 hour
5. Generate domain breakdowns (T009) - ~45 min
6. Spot-check validation (T010) - ~45 min
7. Compile final baseline report - ~30 min
- **Total**: 3.5-4 hours

**Parallel Opportunities**:
- T007 & T008 can start while waiting for T010 validation
- Domain breakdown (T009) can start once T007 metrics complete

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Script crashes on malformed JSON | Add try-catch, log errors, manual inspection |
| Pattern classification subjective | Use clear rules, document evidence, review |
| Domain breakdown reveals quality issues | Document as anomalies, investigate |
| Analysis paralysis (too much data) | Focus on MVP metrics first, extend later |

---

## Definition of Done

- [ ] Metrics extraction script created and tested
- [ ] Baseline metrics calculated for all 31 executions
- [ ] CSV/JSON/text exports generated
- [ ] All 31 executions classified by tool discovery pattern
- [ ] Domain-level breakdowns completed
- [ ] Spot-check validation done (100% accuracy)
- [ ] Comprehensive baseline report generated (2-3 pages)
- [ ] Data committed to 008 branch

---

## Resources

- **Execution Results**: `/Users/robert/Code/mittwald-mcp/tests/functional/executions/`
- **Session Logs**: `/Users/robert/Code/mittwald-mcp/tests/functional/session-logs/007-real-world-use/`
- **Use Case Definitions**: `/Users/robert/Code/mittwald-mcp/tests/functional/use-case-library/*/`
- **Output Location**: `kitty-specs/008-mcp-server-instruction/analysis/`

---

## Reviewer Guidance

**What to Verify**:
1. ✓ Metrics are reasonable (avg ~60 calls/execution makes sense for complex tasks)
2. ✓ Domain breakdowns add up to total (sanity check)
3. ✓ Pattern classifications have clear evidence
4. ✓ Spot-check validation passes (100% accuracy)
5. ✓ No cherry-picking or bias in sample selection

**Blockers**:
- Metrics don't add up or are inconsistent
- Spot-check validation < 95%
- Pattern classification lacks evidence

---

## Next Steps

After WP02 completion:
- Compare to WP5 new baseline (post-prompt-rewrite)
- Identify which tool discovery patterns improved
- Use insights for Sprint 009 MCP improvements

**Current Baseline Ready for Future Comparison**
