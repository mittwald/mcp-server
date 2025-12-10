---
work_package_id: "WP04"
subtasks:
  - "T014"
  - "T015"
  - "T016"
title: "Regression Prevention Tests"
phase: "Phase 4 - Testing"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-12-10T08:35:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP04 – Regression Prevention Tests

## ⚠️ IMPORTANT: Review Feedback Status

**Read this first if you are implementing this task!**

- **Has review feedback?**: Check the `review_status` field above.
- **You must address all feedback** before your work is complete.

---

## Review Feedback

*[Empty initially. Reviewers populate this if work needs changes.]*

---

## Objectives & Success Criteria

**Goal**: Add minimal test coverage to prevent token truncation from recurring in future changes.

**Success Criteria**:
- Unit tests cover token validation function
- Integration test verifies token flows intact through pipeline
- All tests pass
- Test coverage sufficient to catch regression

**Verification**: Tests pass, malformed tokens detected, valid tokens pass through

---

## Context & Constraints

**Prerequisites**: WP03 complete (validation utility exists)

**Approach**: Minimal regression prevention (not comprehensive pipeline testing)

**Constraints**:
- Keep tests simple
- Focus on token format integrity
- No extensive pipeline mocking

**Test Framework**: Use existing test infrastructure in `tests/` directory

**Supporting Documents**:
- Validation Contract: `kitty-specs/009-fix-token-truncation/contracts/token-validation.md`
- Quickstart: `kitty-specs/009-fix-token-truncation/quickstart.md`

---

## Subtasks & Detailed Guidance

### Subtask T014 – Create Unit Tests for Token Validation

**Purpose**: Verify validation utility works correctly for various token formats

**Steps**:
1. Create file: `tests/unit/token-validation.test.ts`

2. Import utilities:
   ```typescript
   import { validateMittwaldToken, redactToken } from '../../src/utils/token-validation';
   ```

3. Write test cases:

   ```typescript
   describe('validateMittwaldToken', () => {
     it('validates correct token format', () => {
       const token = 'c8e06919-aa0c-447e-b57f-c1508f64a76f:secretkey123:mittwald_oauth_xyz';
       const result = validateMittwaldToken(token);

       expect(result.valid).toBe(true);
     });

     it('detects tokens with too few parts', () => {
       const token = 'c8e06919-aa0c-447e-b57f-c1508f64a76f:secretkey123';
       const result = validateMittwaldToken(token);

       expect(result.valid).toBe(false);
       expect(result.error).toContain('expected 3 parts');
     });

     it('detects empty tokens', () => {
       const result = validateMittwaldToken('');

       expect(result.valid).toBe(false);
       expect(result.error).toContain('empty or missing');
     });

     it('detects tokens with empty parts', () => {
       const token = 'c8e06919-aa0c-447e-b57f-c1508f64a76f::mittwald_oauth_xyz';
       const result = validateMittwaldToken(token);

       expect(result.valid).toBe(false);
       expect(result.error).toContain('empty parts');
     });

     it('detects undefined tokens', () => {
       const result = validateMittwaldToken(undefined);

       expect(result.valid).toBe(false);
     });
   });

   describe('redactToken', () => {
     it('redacts secret part of token', () => {
       const token = 'c8e06919-aa0c-447e-b57f-c1508f64a76f:secretkey123:mittwald_oauth_xyz';
       const redacted = redactToken(token);

       expect(redacted).not.toContain('secretkey123');
       expect(redacted).toContain('[REDACTED]');
       expect(redacted).toContain('mittwald_oauth_xyz'); // Suffix visible
       expect(redacted).toMatch(/^c8e06919/); // UUID prefix visible
     });

     it('handles malformed tokens safely', () => {
       const token = 'invalid:token';
       const redacted = redactToken(token);

       expect(redacted).toBe('[MALFORMED_TOKEN]');
     });

     it('shows truncated suffix', () => {
       const token = 'c8e06919-aa0c-447e-b57f-c1508f64a76f:secret:mittwald_o';
       const redacted = redactToken(token);

       expect(redacted).toContain('mittwald_o'); // Truncation visible!
     });
   });
   ```

4. Run tests: `npm test tests/unit/token-validation.test.ts`

5. Verify all tests pass

**Files**: `tests/unit/token-validation.test.ts` (NEW)

**Parallel?**: Can implement alongside T015

**Notes**:
- Cover basic validation logic
- Test both valid and invalid cases
- Verify redaction hides secrets

---

### Subtask T015 – Create Integration Test for Token Flow

**Purpose**: Verify token maintains integrity through session storage and retrieval

**Steps**:
1. Create file: `tests/integration/token-flow.test.ts`

2. Write integration test:
   ```typescript
   import { sessionManager } from '../../src/server/session-manager';

   describe('Token Flow Integration', () => {
     it('maintains token format through session storage', async () => {
       const testToken = 'test-uuid-1234:test-secret-5678:mittwald_oauth_test';

       // Create session with token
       const session = await sessionManager.createSession({
         mittwaldAccessToken: testToken,
         // ... other session fields
       });

       // Retrieve session
       const retrieved = await sessionManager.getSession(session.id);

       // Verify token intact
       expect(retrieved?.mittwaldAccessToken).toBe(testToken);
       expect(retrieved?.mittwaldAccessToken.split(':').length).toBe(3);

       // Verify suffix not truncated
       const suffix = retrieved?.mittwaldAccessToken.split(':')[2];
       expect(suffix).toBe('mittwald_oauth_test');
       expect(suffix?.length).toBeGreaterThan(10); // Not truncated
     });

     it('preserves long tokens without truncation', async () => {
       // Token with long suffix
       const longToken = 'c8e06919-aa0c-447e-b57f-c1508f64a76f:' +
         'veryLongSecretKeyThatShouldNotBeTruncated123456:' +
         'mittwald_oauth_with_long_suffix_xyz';

       const session = await sessionManager.createSession({
         mittwaldAccessToken: longToken
       });

       const retrieved = await sessionManager.getSession(session.id);

       // Verify full token preserved
       expect(retrieved?.mittwaldAccessToken).toBe(longToken);
       expect(retrieved?.mittwaldAccessToken.length).toBe(longToken.length);
     });
   });
   ```

3. Run test: `npm test tests/integration/token-flow.test.ts`

4. Verify test passes

**Files**: `tests/integration/token-flow.test.ts` (NEW)

**Parallel?**: Can implement alongside T014

**Notes**:
- Focus on token integrity only
- Use realistic test token formats
- Verify full pipeline (storage → retrieval)

---

### Subtask T016 – Run Tests and Verify Coverage

**Purpose**: Execute all new tests and confirm coverage is sufficient

**Steps**:
1. Run unit tests:
   ```bash
   npm test tests/unit/token-validation.test.ts
   ```
   - Verify all validation tests pass
   - Check test output for failures

2. Run integration test:
   ```bash
   npm test tests/integration/token-flow.test.ts
   ```
   - Verify token flow test passes
   - Check token maintains full format

3. Run full test suite (verify no regressions):
   ```bash
   npm test
   ```
   - Verify existing tests still pass
   - No new failures introduced

4. Document test coverage:
   - Count test cases added (~5-7 total)
   - Verify coverage of validation logic
   - Confirm regression prevention coverage

**Files**: Test execution

**Parallel?**: No (depends on T014-T015)

**Expected Outcome**: All tests pass, coverage documented

---

## Risks & Mitigations

**Risk**: Tests require extensive setup
- **Mitigation**: Keep tests minimal, use simple fixtures

**Risk**: Integration test depends on session manager implementation
- **Mitigation**: Test focuses on token integrity only, not full session functionality

**Risk**: Tests brittle if token format changes
- **Mitigation**: Use realistic examples matching current Mittwald token format

---

## Definition of Done Checklist

- [ ] Unit tests created and passing (T014)
- [ ] Integration test created and passing (T015)
- [ ] All tests executed successfully (T016)
- [ ] No test failures or regressions
- [ ] Test coverage documented
- [ ] `tasks.md` updated: WP04 moved to for_review lane

---

## Review Guidance

**For reviewers checking this work package:**

1. **Verify test quality**:
   - Tests are clear and focused
   - Cover validation logic adequately
   - Use realistic token examples

2. **Check coverage**:
   - Unit tests cover validation function
   - Integration test covers token flow
   - Sufficient to catch regression

3. **Validate tests pass**:
   - Run tests yourself
   - Verify no failures
   - Check test output clarity

**Approval Criteria**: Tests pass, coverage adequate for regression prevention

---

## Activity Log

- 2025-12-10T08:35:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks

---

## Quick Reference

**Run Tests**:
```bash
# Unit tests
npm test tests/unit/token-validation.test.ts

# Integration test
npm test tests/integration/token-flow.test.ts

# All tests
npm test
```

**Expected Test Count**: 5-7 test cases total
