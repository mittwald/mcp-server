---
work_package_id: WP02
title: Surgical Fix Implementation
lane: done
history:
- timestamp: '2025-12-10T08:35:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
agent: ''
assignee: ''
phase: Phase 2 - Fix
review_status: ''
reviewed_by: ''
shell_pid: ''
subtasks:
- T007
- T008
- T009
- T010
---

# Work Package Prompt: WP02 – Surgical Fix Implementation

## ⚠️ IMPORTANT: Review Feedback Status

**Read this first if you are implementing this task!**

- **Has review feedback?**: Check the `review_status` field above. If it says `has_feedback`, scroll to the **Review Feedback** section immediately.
- **You must address all feedback** before your work is complete.

---

## Review Feedback

*[Empty initially. Reviewers populate this if work needs changes.]*

---

## Objectives & Success Criteria

**Goal**: Apply precise fix at identified truncation point to ensure tokens flow intact through pipeline.

**Success Criteria**:
- Fix applied at exact location identified in WP01
- Token maintains full format (including complete suffix) through pipeline
- Test `access-001-create-sftp-user` passes without 403 errors
- Test pass rate improves from 19.4% to 40-50% range
- All temporary instrumentation removed

**Verification**: Full test suite shows expected improvement, no truncation warnings in logs

---

## Context & Constraints

**Prerequisites**: WP01 complete with findings documented in `research.md`

**Approach**: Surgical fix only - modify exact truncation point, no defensive changes elsewhere

**Philosophy**: "Fix it once, it shouldn't happen again" - minimal ongoing overhead

**Constraints**:
- Remove ALL temporary instrumentation from WP01
- No defensive programming at other pipeline stages
- No new dependencies or frameworks
- Backward compatible (existing sessions still work)

**Supporting Documents**:
- Research: `kitty-specs/009-fix-token-truncation/research.md` (contains exact truncation location)
- Plan: `kitty-specs/009-fix-token-truncation/plan.md`
- Spec: `kitty-specs/009-fix-token-truncation/spec.md`

---

## Subtasks & Detailed Guidance

### Subtask T007 – Implement Surgical Fix at Identified Location

**Purpose**: Fix the exact code that causes token truncation

**Steps**:
1. Read `research.md` to get exact truncation location
2. Navigate to identified file and line
3. Understand the root cause (e.g., string slicing, buffer limit, serialization issue)
4. Implement minimal fix:
   - If string slicing: Remove or adjust slice operation
   - If buffer limit: Increase limit or remove limit
   - If serialization: Fix encoding/decoding
   - If type casting: Preserve full string

5. Example scenarios:

   **Scenario A: String slicing**
   ```typescript
   // Before (WRONG)
   const token = fullToken.substring(0, 100);

   // After (FIXED)
   const token = fullToken;
   ```

   **Scenario B: Buffer limit**
   ```typescript
   // Before (WRONG)
   await redis.set(key, token, { maxlen: 100 });

   // After (FIXED)
   await redis.set(key, token); // No maxlen limit
   ```

   **Scenario C: Argument truncation**
   ```typescript
   // Before (WRONG)
   const safeToken = token.replace(/:.+$/, ':***');

   // After (FIXED)
   // Don't replace, pass full token
   ```

6. Test fix compiles: `npm run build`

**Files**: [Determined by WP01 investigation]

**Parallel?**: No (depends on WP01 findings)

**Notes**:
- Fix ONLY the identified location
- Don't add validation or defensive code yet (that's WP03)
- Keep changes minimal

---

### Subtask T008 – Remove All Temporary Instrumentation

**Purpose**: Clean up debug logging added in WP01, ensure only fix remains

**Steps**:
1. Search for all `[TOKEN-DEBUG]` logging:
   ```bash
   grep -r "\[TOKEN-DEBUG\]" packages/oauth-bridge/src/ src/
   ```

2. Remove ALL debug logging from these files:
   - `packages/oauth-bridge/src/routes/token.ts` (from T001)
   - `packages/oauth-bridge/src/state/state-store.ts` (from T002)
   - `src/server/session-manager.ts` (from T003)
   - `src/server/oauth-middleware.ts` (from T003)
   - `src/utils/cli-wrapper.ts` (from T004)

3. Verify no debug logs remain:
   ```bash
   grep -r "\[TOKEN-DEBUG\]" packages/ src/ || echo "Clean!"
   ```

4. Rebuild: `npm run build`

**Files**: All files instrumented in WP01

**Parallel?**: No (must wait for T007 fix to be tested first)

**Notes**: Only remove instrumentation, preserve the fix from T007

---

### Subtask T009 – Verify Fix with Single Test Case

**Purpose**: Validate fix resolves token truncation for original failing test

**Steps**:
1. Navigate to test directory: `cd tests/functional`
2. Run the original failing test:
   ```bash
   npm test -- --use-case access-001-create-sftp-user
   ```

3. Check results:
   - Test should PASS (no longer fail with 403)
   - Execution result should show success
   - Tool invocations should complete successfully

4. If test still fails:
   - Check error message (should not be "access denied; verdict: abstain")
   - If still 403: Fix didn't work, return to T007
   - If different error: New issue, investigate separately

5. Verify token format in session:
   - Add temporary verification code if needed
   - Confirm suffix is complete (not truncated)

**Files**: Test execution in `tests/functional/`

**Parallel?**: No (depends on T007-T008)

**Expected Outcome**: Test passes, confirming fix resolves truncation

---

### Subtask T010 – Run Full Test Suite Validation

**Purpose**: Verify fix improves overall test pass rate as expected

**Steps**:
1. Run complete test suite:
   ```bash
   cd tests/functional
   npm test -- --suite 007 --use-cases all
   ```

2. Collect metrics:
   - Total passed vs failed
   - Calculate pass rate percentage
   - Compare to baseline (19.4%)

3. Expected results:
   - Pass rate: 40-50% (improvement of 20-30 percentage points)
   - Eliminated: 403 "verdict: abstain" errors for valid operations
   - Remaining failures: Legitimate (permission issues, API errors, timeouts)

4. Analyze remaining failures:
   - Check error messages for each failure
   - Verify none are related to token truncation
   - Document legitimate failure causes

5. Update metrics in `research.md`:
   ```markdown
   ## Verification Results

   **Before Fix**: 19.4% pass rate (6/31 tests)
   **After Fix**: X% pass rate (Y/31 tests)
   **Improvement**: +Z percentage points

   **403 Errors Eliminated**: N tests
   **Remaining Failures**: Legitimate issues (not token-related)
   ```

**Files**: Full test suite execution

**Parallel?**: No (depends on T009)

**Expected Outcome**: Pass rate in 40-50% range, no token-related 403 errors

---

## Risks & Mitigations

**Risk**: Fix doesn't resolve issue (truncation still occurs)
- **Mitigation**: Return to T007, add more instrumentation, investigate deeper

**Risk**: Fix breaks existing functionality
- **Mitigation**: Run full test suite, check for new failures

**Risk**: Pass rate improvement less than expected
- **Mitigation**: Analyze remaining failures, verify they're not token-related

**Risk**: Truncation occurs at multiple locations
- **Mitigation**: WP01 should identify all locations; fix each in T007

---

## Definition of Done Checklist

- [ ] Surgical fix applied at identified location (T007)
- [ ] All instrumentation removed (T008)
- [ ] Single test passes (T009)
- [ ] Full suite shows 40-50% pass rate (T010)
- [ ] Zero token-related 403 errors
- [ ] research.md updated with verification results
- [ ] Code compiles and builds successfully
- [ ] `tasks.md` updated: WP02 moved to for_review lane

---

## Review Guidance

**For reviewers checking this work package:**

1. **Verify fix is surgical**:
   - Changes are minimal and targeted
   - No defensive programming elsewhere
   - Fix addresses root cause (not symptoms)

2. **Check cleanup**:
   - No `[TOKEN-DEBUG]` logging remains
   - No temporary investigation code
   - Codebase is clean

3. **Validate improvement**:
   - Test pass rate improved significantly (40-50%)
   - Token-related 403 errors eliminated
   - Remaining failures are legitimate

4. **Review research.md**:
   - Verification results documented
   - Metrics updated
   - Fix proven effective

**Approval Criteria**: Test pass rate ≥40%, zero token truncation errors, clean codebase

---

## Activity Log

- 2025-12-10T08:35:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks

---

## Quick Reference

**Fix Verification**:
```bash
# Single test
cd tests/functional
npm test -- --use-case access-001-create-sftp-user

# Full suite
npm test -- --suite 007 --use-cases all

# Check for token debug logs (should be none)
grep -r "\[TOKEN-DEBUG\]" packages/ src/
```

**Expected Improvement**: 19.4% → 40-50% pass rate
