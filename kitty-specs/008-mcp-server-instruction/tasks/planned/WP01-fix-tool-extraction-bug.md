# WP01: Fix Tool Call Extraction Bug

**Work Package ID**: WP01
**Priority**: P1 CRITICAL
**Complexity**: LOW (parsing fix, ~50 lines)
**Owner**: Backend/Test Infrastructure
**Estimated Time**: 2-4 hours
**Depends On**: None
**Blocks**: WP2, WP4, WP5

---

## Objective

Fix the executor.ts tool extraction logic to correctly parse tool calls from JSONL session logs, enabling population of the `toolsInvoked[]` array in execution results.

**Current State**: All 31 execution results have `toolsInvoked: []` (empty arrays)
**Root Cause**: Parser checks wrong location - looks for `event.type === 'tool_use'` but tool calls are nested in `assistant.message.content[]`
**Expected Outcome**: All 31 execution results will have `toolsInvoked` populated with 60+ tool calls each

---

## Context

Sprint 007 has the extraction code infrastructure, but it fails to find any tool calls because it's checking the top-level event type instead of looking inside the message content.

**File to Fix**: `/Users/robert/Code/mittwald-mcp/tests/functional/src/use-cases/executor.ts`
**Lines to Change**: 427-434

**Current Code (BROKEN)**:
```typescript
// Track tools
if (event.type === 'tool_use') {
  const content = event.content as Record<string, unknown>;
  const toolName = content.name as string;
  if (toolName) {
    toolsInvoked.add(toolName);
    controller.recordToolCall(toolName);
  }
}
```

**Problem**:
- `event.type` is set to top-level JSON: "assistant", "user", "system", "result"
- Tool calls nested in `message.content[]` have `type === 'tool_use'`
- Current code NEVER matches (finds 0 tool calls)

---

## Subtasks

### T001: Investigate JSONL Structure

**Goal**: Document where tool calls actually exist in parsed JSONL events

**Instructions**:
1. Examine sample session logs to understand the nesting structure
2. Document all event types at top level
3. Map where tool_use and tool_result appear in the hierarchy
4. Create design document with examples

**Evidence**:
- Sample log: `/Users/robert/Code/mittwald-mcp/tests/functional/session-logs/007-real-world-use/apps-001-deploy-php-app-2025-12-05T18-59-15.jsonl`
- Analysis already done in `/Users/robert/Code/mittwald-mcp/SPRINT-008-BUG-ANALYSIS.md`

**Acceptance Criteria**:
- Design doc created with JSONL structure diagrams
- Tool call location precisely documented
- Edge cases identified (errors, nested calls, incomplete invocations)

---

### T002: Fix executor.ts Tool Extraction Logic

**Goal**: Replace broken extraction code with correct implementation

**Instructions**:

1. **Locate the code** at `src/use-cases/executor.ts` line 427-434
2. **Replace the tool_use extraction block** with:

```typescript
// Track tools from assistant messages
if (event.type === 'assistant') {
  const message = (event.content as Record<string, unknown>).message as Record<string, unknown>;
  if (message?.content && Array.isArray(message.content)) {
    for (const item of message.content) {
      if (typeof item === 'object' && item !== null) {
        const itemRecord = item as Record<string, unknown>;
        if (itemRecord.type === 'tool_use') {
          const toolName = itemRecord.name as string;
          if (toolName) {
            toolsInvoked.add(toolName);
            controller.recordToolCall(toolName);
          }
        }
      }
    }
  }
}

// Optionally track tool results from user messages (for future enhancements)
if (event.type === 'user') {
  const message = (event.content as Record<string, unknown>).message as Record<string, unknown>;
  if (message?.content && Array.isArray(message.content)) {
    for (const item of message.content) {
      if (typeof item === 'object' && item !== null) {
        const itemRecord = item as Record<string, unknown>;
        if (itemRecord.type === 'tool_result') {
          // Tool result tracking (for now just documents the pattern)
          // Can be enhanced later to track result status/errors
        }
      }
    }
  }
}
```

3. **Verify the logic**:
   - Check for `event.type === 'assistant'` (correct top-level type)
   - Navigate to `message.content[]` array
   - Iterate through content items
   - Look for items where `type === 'tool_use'`
   - Extract `name` field for tool name

4. **Add inline comments** explaining the nested structure

**Acceptance Criteria**:
- Code compiles without errors
- Logic matches specification exactly
- Comments explain why extraction works at this location
- No changes to other parts of executor.ts

---

### T003: Implement Error Handling for Edge Cases

**Goal**: Handle all variations of tool calls found in real JSONL

**Edge Cases to Handle**:

1. **Tool calls with errors** (API returns 403, 404, etc.)
   - Status will be in the response/result, not in tool_use
   - Extract both successful and failed tool calls
   - Document error status if available

2. **Nested tool calls** (one tool result triggers another tool call)
   - Track parent-child relationships via `tool_use_id` field
   - Don't deduplicate tool calls, each call is independent
   - Preserve sequence order

3. **Incomplete tool invocations** (tool runs but result missing)
   - Tool may appear in assistant message without corresponding user result
   - Include in `toolsInvoked[]` anyway (tool WAS called)
   - Mark as incomplete if possible

4. **Timeout scenarios** (session times out mid-execution)
   - Partial tool call data should still be captured
   - Don't lose tool calls that did complete

**Instructions**:
1. Add defensive checks for null/undefined values (already done in code above)
2. Add try-catch blocks around extraction if needed
3. Add logging for edge cases found
4. Document handling approach with inline comments

**Acceptance Criteria**:
- All edge cases have explicit handling
- No crashes on malformed data
- Edge case behavior documented in code comments

---

### T004: Rebuild Project and Test on Sample Logs

**Goal**: Verify extraction works correctly on a diverse set of logs

**Instructions**:

1. **Rebuild the project**:
   ```bash
   cd /Users/robert/Code/mittwald-mcp/tests/functional
   npm run build
   ```
   - Should complete without errors
   - Check that `dist/use-cases/executor.js` is updated

2. **Test on 5-10 sample logs** (diverse domains and complexities):
   - Simple: `access-001-create-sftp-user-2025-12-05T18-53-38.jsonl` (3 lines)
   - Medium: `apps-001-deploy-php-app-2025-12-05T18-59-15.jsonl` (66 tool calls)
   - Complex: `access-002-manage-ssh-access-2025-12-05T18-55-48.jsonl` (31 tool calls, errors)
   - Timeout: `identity-003-check-account-settings-2025-12-05T20-04-02.jsonl` (timed out)

3. **For each sample**:
   - Run extraction manually or via test script
   - Verify `toolsInvoked[]` is populated (not empty)
   - Compare extracted count to manual JSONL inspection
   - Check for data loss or corruption

4. **Create test script** (if not already present):
   ```bash
   # Test extraction on a single execution
   node dist/use-cases/executor.js --test-extract \
     --session-log=<path-to-jsonl>
   ```

**Acceptance Criteria**:
- Compilation succeeds with no errors
- Extraction works on all test samples
- No data loss on diverse log types
- Tool call count matches manual verification

---

### T005: Run Full Extraction on All 31 Existing Execution Results

**Goal**: Process all JSONL logs through fixed extractor and verify all execution results are updated

**Instructions**:

1. **Identify all 31 JSONL session logs**:
   ```bash
   ls /Users/robert/Code/mittwald-mcp/tests/functional/session-logs/007-real-world-use/*.jsonl | wc -l
   ```
   Should list exactly 31 files (some use cases have multiple runs)

2. **Create extraction batch script** or modify executor to run on all logs:
   - For each JSONL file, parse and extract tool calls
   - Update corresponding execution result JSON file
   - Log progress (X/31 completed)

3. **Verify all 31 execution results updated**:
   ```bash
   find /Users/robert/Code/mittwald-mcp/tests/functional/executions \
     -name "*.json" -exec grep -l '"toolsInvoked":\[\]' {} \; | wc -l
   ```
   - Should return 0 (no empty toolsInvoked arrays)

4. **Document any anomalies**:
   - If a log can't be parsed, document why
   - If extraction finds 0 tool calls when expected many, investigate
   - Create summary of any extraction issues

**Acceptance Criteria**:
- All 31 execution results have non-empty `toolsInvoked[]`
- Zero empty arrays remaining
- Any parsing issues documented and justified

---

### T006: Spot-Check Validation (10% Sample)

**Goal**: Verify extraction accuracy by manually comparing with raw JSONL

**Instructions**:

1. **Select 3-4 random execution results** (for 31 total, 10% = 3-4):
   - Randomly pick from different domains
   - Include at least one failed/timeout case
   - Example selections: apps-001, databases-002, organization-001

2. **For each selected execution**:
   - Open the execution JSON file (e.g., `executions/apps-001-deploy-php-app-2025-12-05T18-59-15.json`)
   - Open corresponding JSONL session log
   - Manually count tool calls in JSONL (search for `"type":"tool_use"`)
   - Compare extracted count in `toolsInvoked[]`
   - Check that tool names match
   - Verify sequence order preserved

3. **Create validation report**:
   - Document each spot-check result
   - Note any discrepancies (missing calls, extra calls, wrong names)
   - Calculate accuracy percentage
   - Note confidence level

4. **Example Format**:
   ```
   Spot-Check Sample #1: apps-001-deploy-php-app-2025-12-05T18-59-15
   - JSONL tool calls: 66 total
   - Extracted toolsInvoked[]: 66 items
   - Name accuracy: 100% (all names match)
   - Sequence accuracy: 100% (order preserved)
   - Status: ✓ PASS

   Overall Accuracy: 100% (3/3 spot-checks passed)
   ```

**Acceptance Criteria**:
- **SC-001 verified**: 100% accuracy on all spot-checked samples
- Validation report completed and documented
- Any mismatches investigated and explained

---

## Implementation Sketch

**Sequence**:
1. Read SPRINT-008-BUG-ANALYSIS.md for context (T001 context)
2. Update executor.ts with fixed extraction logic (T002)
3. Add edge case handling and comments (T003)
4. Rebuild and test on samples (T004)
5. Run full extraction on all 31 logs (T005)
6. Spot-check validation (T006)

**Estimated Time Breakdown**:
- T001: 15 min (mostly reading analysis doc)
- T002: 30 min (code change + compilation)
- T003: 30 min (defensive checks, comments)
- T004: 45 min (testing, verification)
- T005: 30 min (batch processing + verification)
- T006: 45 min (manual spot-checks + documentation)
- **Total**: ~3.5 hours

---

## Parallel Opportunities

- T001 (investigation) can be skipped if analysis doc is read
- Multiple developers could test different samples in parallel (T004)
- Batch processing (T005) could be parallelized across files if needed

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| JSONL format varies | Test on diverse samples first (different domains/sizes) |
| Tool nesting depth inconsistent | Use recursive extraction or handle variable depth |
| Performance issues with 31 logs | Profile and optimize if needed, consider parallelization |
| Extraction finds 0 calls on some logs | Investigate JSONL structure, may indicate timeout/error cases |

---

## Definition of Done

- [ ] executor.ts updated with correct extraction logic
- [ ] All 31 execution results have non-empty `toolsInvoked[]`
- [ ] Spot-check validation confirms 100% accuracy
- [ ] No compilation errors, tests pass
- [ ] Code committed to 008 branch with clear commit message
- [ ] Spot-check report documented in SPRINT-008-VALIDATION.md

---

## Test Strategy

**Automated Testing**:
- Run extraction on sample JSONL → compare output to expected tool count
- Check for presence of specific tool names (e.g., `mcp__mittwald__mittwald_project_list`)

**Manual Testing**:
- Spot-check 10% as described in T006
- Manual JSONL inspection for accuracy verification

**Regression Testing**:
- Ensure no existing functionality broken
- Verify other executor functionality still works

---

## Resources

- **Analysis**: `/Users/robert/Code/mittwald-mcp/SPRINT-008-BUG-ANALYSIS.md`
- **Current Code**: `/Users/robert/Code/mittwald-mcp/tests/functional/src/use-cases/executor.ts`
- **Sample Logs**: `/Users/robert/Code/mittwald-mcp/tests/functional/session-logs/007-real-world-use/`
- **Execution Results**: `/Users/robert/Code/mittwald-mcp/tests/functional/executions/`

---

## Reviewer Guidance

**What to Verify**:
1. ✓ Extraction logic correctly identifies `event.type === 'assistant'`
2. ✓ Tool call extraction from `message.content[]` accurate
3. ✓ Edge cases handled gracefully (errors, incomplete, nested)
4. ✓ All 31 execution results have populated `toolsInvoked[]`
5. ✓ Spot-check validation passes 100%

**Blockers**:
- Code doesn't compile or fails tests
- Extraction finds 0 tool calls (indicates wrong fix)
- Spot-check validation < 95% accuracy

---

## Next Steps

After WP01 completion:
- WP2 can use extracted data for baseline metrics
- WP4 uses fixed extraction for test preparation
- WP5 re-executes tests with working extraction

**Promote to WP02** once validation complete.
