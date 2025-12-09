# WP05: Execute 007 Test Suite Against Fixed Infrastructure

**Work Package ID**: WP05
**Priority**: P1 CRITICAL
**Complexity**: HIGH (long-running, resource-intensive)
**Owner**: Test Execution
**Estimated Time**: 4-5 hours execution + monitoring
**Depends On**: WP1, WP3, WP4
**Blocks**: WP6 (analysis depends on this)

---

## Objective

Re-run all 31 use cases with fixed tool extraction and outcome-focused prompts to generate clean baseline data. Measure if tool discovery patterns improve and establish valid baseline for future MCP improvements.

---

## Context

**Pre-execution Dependencies** (must all be complete):
- ✓ WP1: Tool extraction bug fixed and integrated
- ✓ WP3: All 31 prompts rewritten to outcome-focused
- ✓ WP4: Infrastructure verified ready

**Expected Outcome**:
- All 31 use cases execute (success or expected failure)
- `toolsInvoked[]` populated for each with complete tool call data
- New baseline metrics calculated
- Pass rate ≥77.4% (original baseline)
- Valid dataset for future analysis

---

## Subtasks

### T023: Pre-execution Checklist

**Goal**: Final verification before starting long-running test

**Instructions**:

1. **Verify WP1 completion**:
   - [ ] executor.ts changes compiled
   - [ ] Single test run shows populated toolsInvoked[]
   - [ ] No extraction errors on sample logs

2. **Verify WP3 completion**:
   - [ ] All 31 use case JSON files updated with new prompts
   - [ ] Automated scan confirms zero tool name references
   - [ ] Domain expert spot-check approved

3. **Verify WP4 completion**:
   - [ ] MCP and OAuth servers healthy
   - [ ] JWT secrets synchronized
   - [ ] Single test execution verified working

4. **Pre-execution steps**:
   - [ ] Backup existing execution results:
     ```bash
     tar czf execution-results-baseline-007.tar.gz tests/functional/executions/
     ```
   - [ ] Backup existing session logs
   - [ ] Free up disk space (at least 5GB recommended)
   - [ ] Close other resource-intensive applications

5. **Create execution summary document**:
   ```
   # 007 Re-execution Summary
   Start Time: [to be filled]
   End Time: [to be filled]
   Duration: [to be calculated]

   Pre-execution Status: ✓ All prerequisites verified
   Infrastructure Status: ✓ Healthy
   ```

**Acceptance Criteria**:
- All pre-execution items verified ✓
- Backups created
- Execution ready to proceed

---

### T024: Execute Full 007 Test Suite (31 Use Cases)

**Goal**: Run all 31 use cases and capture results

**Instructions**:

1. **Start execution**:
   ```bash
   cd /Users/robert/Code/mittwald-mcp/tests/functional

   # Run full 007 suite with fixed infrastructure
   npm run test -- --suite 007 --use-cases all --verbose

   # Alternatively, if available:
   npm run test:007
   ```

2. **Monitor execution**:
   - Watch console output for errors or warnings
   - Note any timeouts or unexpected failures
   - Record start and end timestamps
   - Optional: Redirect output to log file:
     ```bash
     npm run test -- --suite 007 --use-cases all 2>&1 | tee 007-execution-$(date +%Y%m%d).log
     ```

3. **Expected runtime**: 4-5 hours (depending on system)

4. **What to expect**:
   - Some use cases timeout (expected, was in original baseline)
   - Some may fail (normal for complex tasks)
   - Pass rate should be ~77% or better
   - All executions generate execution result JSON
   - Session logs created for each case

5. **Verify execution progress**:
   - After 1 hour: ~8-10 use cases completed
   - After 2 hours: ~16-20 use cases completed
   - After 3 hours: ~24-28 use cases completed
   - After 4-5 hours: All 31 completed

**Acceptance Criteria**:
- All 31 use cases execute (success or expected failure)
- Execution completes without catastrophic failures
- Session logs and execution results generated

---

### T025: Validate Execution Data Capture

**Goal**: Verify all 31 results have proper tool call data

**Instructions**:

1. **Check execution results count**:
   ```bash
   # Should show 31 files
   ls tests/functional/executions/*.json | wc -l
   ```

2. **Verify all have valid JSON**:
   ```bash
   # Should show 31 if all valid
   find tests/functional/executions -name "*.json" \
     -exec jq . {} \; > /dev/null 2>&1
   echo "Valid JSON count: $?"
   ```

3. **Spot-check toolsInvoked[] population** (5-10 random):
   ```bash
   # Check if any still have empty toolsInvoked[]
   grep -l '"toolsInvoked":\[\]' tests/functional/executions/*.json

   # Should return nothing (no empty arrays)
   ```

4. **Sample verification**:
   ```bash
   # Open a random execution and verify tool data
   jq '.toolsInvoked' tests/functional/executions/apps-001-*.json | head -20

   # Should show array of tool names like:
   # [
   #   "mcp__mittwald__mittwald_project_list",
   #   "mcp__mittwald__mittwald_app_create_php",
   #   ...
   # ]
   ```

5. **Create validation summary**:
   ```
   Execution Results Validation:
   - Total execution files: 31 ✓
   - Valid JSON: 31/31 ✓
   - Empty toolsInvoked[]: 0 ✓
   - Average tools per execution: 58.3
   - Status: PASS
   ```

**Acceptance Criteria**:
- **SC-003 verified**: All 31 executions have captured tool data
- No empty toolsInvoked[] arrays
- All JSON valid
- Tool names reasonable and consistent

---

### T026: Calculate New Baseline Metrics

**Goal**: Measure tool usage and success patterns from new execution

**Instructions**:

1. **Run metrics extraction** (uses script from WP2):
   ```bash
   node analyze-baseline-metrics.ts \
     --input-dir tests/functional/executions/ \
     --output-file analysis/baseline-metrics-new.json \
     --compare-to tests/functional/analysis-output/007-run-summary.json
   ```

2. **Key metrics to compare**:
   - Pass rate: Original 77.4% → New ?
   - Total tool calls: Original ~1800 → New ?
   - Average calls per execution: Original ~58 → New ?
   - Retry patterns: Changed?
   - Domain-level success rates: Changed?

3. **Create comparison table**:
   ```
   | Metric | Original 007 | New 007 | Delta |
   |--------|-------------|--------|-------|
   | Pass Rate | 77.4% | 78.2% | +0.8% |
   | Total Calls | 1,847 | 1,923 | +76 |
   | Avg Calls/Exec | 59.6 | 62.0 | +2.4 |
   | Direct Path % | ~30% | 32% | +2% |
   | Retry % | ~40% | 38% | -2% |
   ```

4. **Investigate significant changes**:
   - If pass rate drops >5%: Investigate why
   - If average calls increase significantly: May indicate tool confusion
   - If passes improve: Success - tool discovery working!

5. **Document findings**:
   ```markdown
   # New Baseline Metrics

   ## Summary
   - Pass rate: 78.2% (vs. 77.4% baseline) ✓
   - Tool calls maintained within 5% variance
   - Tool discovery patterns show expected learning curve

   ## Analysis
   [Detailed insights from metrics]

   ## Implications
   [What this means for future MCP improvements]
   ```

**Acceptance Criteria**:
- **SC-006 verified**: Pass rate ≥77.4%
- **SC-004 completed**: New baseline metrics calculated
- Comparison to original baseline documented
- Any variances explained

---

### T027: Document Execution Report

**Goal**: Record complete execution details for stakeholder review

**Instructions**:

1. **Document execution timeline**:
   ```
   Execution Report: 007 Re-execution with Fixed Infrastructure

   Start Time: [timestamp]
   End Time: [timestamp]
   Total Duration: [hours:minutes]
   System: [CPU cores, memory, network info]

   Execution Mode: Full 31 use cases
   Infrastructure: Fly.io (mittwald-mcp-fly2)
   Fixes Applied: WP1 (extraction), WP3 (prompts)
   ```

2. **Record execution summary**:
   ```
   Results Summary:
   - Total Executions: 31
   - Passed: 24 (77.4%)
   - Failed: 7 (22.6%)
   - Timeouts: 4
   - Errors: 3

   Tool Call Metrics:
   - Total Calls: 1,923
   - Average per Execution: 62.0
   - Range: 12-147 calls
   - Most Called: mcp__mittwald__mittwald_project_list (31x)
   ```

3. **Document any failures**:
   ```
   Failed Cases:
   - identity-003: Timeout (1000+ seconds)
   - databases-001: API error (403 Forbidden)
   - [etc]

   Root Cause Analysis:
   [Investigate each failure]
   ```

4. **Compare to original 007 baseline**:
   - Same test cases pass/fail?
   - Differences explained?
   - Outcome-focused prompts working as expected?

5. **Create final execution report** (2-3 pages):
   - Executive summary
   - Metrics comparison table
   - Failure analysis
   - Tool discovery patterns observed
   - Implications for future work

**Acceptance Criteria**:
- Execution report created and documented
- All 31 results accounted for
- Baseline comparison complete
- Ready for stakeholder review

---

## Implementation Sketch

**Sequential (Cannot Parallelize Test Execution)**:
1. T023: Pre-execution checklist (~30 min)
2. T024: Run full 007 suite (~4-5 hours + monitoring)
3. T025: Validate data capture (~30 min)
4. T026: Calculate metrics (~30 min)
5. T027: Document report (~1 hour)
- **Total**: 6-7 hours (mostly waiting for tests to complete)

**Parallel While Waiting**:
- T025, T026, T027 can run partially during test execution
- Can check first few results while remaining tests complete

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Execution takes >5 hours | Parallelization possible (multiple workers) |
| Network connectivity fails mid-execution | Have rollback procedure, retry capability |
| MCP server goes down mid-execution | Monitor health, restart if needed |
| Pass rate drops significantly | Document as data point, investigate |
| Disk fills up during execution | Monitor space, clean up if needed |

---

## Definition of Done

- [ ] All 31 use cases executed
- [ ] SC-003 verified: Tool call data captured for all
- [ ] SC-006 verified: Pass rate ≥77.4%
- [ ] New baseline metrics calculated
- [ ] Metrics compared to original 007 baseline
- [ ] Execution report documented (2-3 pages)
- [ ] Ready for WP6 analysis phase
- [ ] Results committed to git

---

## Monitoring During Execution

**Checklist for test operator**:
- [ ] Monitor for errors every 30 minutes
- [ ] Record major milestones (10 use cases done, 20 done, etc.)
- [ ] Note any unusual patterns or timeouts
- [ ] Verify disk space not filling up
- [ ] Check that execution results being generated

---

## Next Steps

After WP05 completion:
- WP06: Validate data quality and generate final analysis report
- Create roadmap for future MCP improvements
- Prepare for Sprints 009+

**Execution Complete - Ready for WP06 Analysis**
