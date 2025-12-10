# Work Packages: Fix Token Truncation in MCP Pipeline

**Feature**: 009-fix-token-truncation
**Inputs**: Design documents from `kitty-specs/009-fix-token-truncation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Organization**: Fine-grained subtasks (`Txxx`) roll up into work packages (`WPxx`). Each work package is independently deliverable and testable.

**Prompt Files**: Each work package references a matching prompt file in `tasks/planned/` for detailed implementation guidance.

---

## Work Package WP01: Systematic Token Pipeline Investigation (Priority: P1) 🎯 MVP

**Goal**: Identify exact truncation point by instrumenting all 4 pipeline stages with temporary debug logging.

**Independent Test**: Investigation reveals exact code location where token goes from full format to truncated format, documented with evidence.

**Prompt**: `tasks/planned/WP01-token-pipeline-investigation.md`

### Included Subtasks

- [ ] **T001**: Add instrumentation to OAuth Bridge token generation (`packages/oauth-bridge/src/routes/token.ts`)
  - Log token format, length, and parts after generation
  - Use `[TOKEN-DEBUG]` prefix for filtering
  - Redact secret in logs

- [ ] **T002**: Add instrumentation to Session Storage (`packages/oauth-bridge/src/state/state-store.ts`)
  - Log token before storage (input)
  - Log token after storage (output)
  - Compare lengths and formats

- [ ] **T003**: Add instrumentation to Session Retrieval (`src/server/session-manager.ts`, `src/server/oauth-middleware.ts`)
  - Log token when retrieved from session
  - Check for any string operations
  - Document retrieved token format

- [ ] **T004**: Add instrumentation to CLI Wrapper (`src/utils/cli-wrapper.ts`)
  - Log token before adding to CLI arguments
  - Log final CLI command structure (with redaction)
  - Check argument construction for truncation

- [ ] **T005**: Run instrumented test and collect evidence
  - Execute failing test: `access-001-create-sftp-user`
  - Collect all `[TOKEN-DEBUG]` logs
  - Analyze token format at each stage
  - Identify exact truncation point

- [ ] **T006**: Document findings in `research.md`
  - Record exact truncation location (file, line, function)
  - Explain root cause (why truncation occurs)
  - Document evidence (before/after token values)
  - Propose surgical fix approach

### Implementation Notes

1. Add temporary `console.debug()` calls at each pipeline boundary
2. Use consistent format: `[TOKEN-DEBUG] stage_name: length=X, parts=Y, suffix=Zchars`
3. Never log full tokens - use redaction helper
4. Run single test to minimize log noise
5. Trace token format changes between stages
6. Document exact point where suffix goes from full to truncated

### Parallel Opportunities

- T001-T004 can be implemented in parallel (different files)
- T005 depends on T001-T004 complete
- T006 depends on T005 complete

### Dependencies

- None (first work package)

### Risks & Mitigations

- **Risk**: Logs too noisy to analyze
  - **Mitigation**: Use `[TOKEN-DEBUG]` prefix for easy filtering
- **Risk**: Token logged in plaintext
  - **Mitigation**: Redact secret portion in all logs
- **Risk**: Instrumentation affects behavior
  - **Mitigation**: Use logging only, no code changes yet

---

## Work Package WP02: Surgical Fix Implementation (Priority: P1) 🎯 MVP

**Goal**: Apply precise fix at identified truncation point to ensure tokens flow intact through pipeline.

**Independent Test**: Test `access-001-create-sftp-user` passes without 403 errors; token maintains full format through pipeline.

**Prompt**: `tasks/planned/WP02-surgical-fix-implementation.md`

### Included Subtasks

- [ ] **T007**: Implement surgical fix at identified location
  - Apply fix at exact code point identified in WP01
  - Preserve full token format through truncation point
  - No defensive changes elsewhere

- [ ] **T008**: Remove all temporary instrumentation
  - Remove all `[TOKEN-DEBUG]` logging from WP01
  - Clean up any temporary code added for investigation
  - Ensure only fix remains

- [ ] **T009**: Verify fix with single test case
  - Run `access-001-create-sftp-user` test
  - Verify token maintains full format
  - Verify test passes (no 403 error)
  - Check token suffix is complete

- [ ] **T010**: Run full test suite validation
  - Execute all 31 use cases
  - Measure pass rate improvement
  - Verify expected improvement from 19.4% to 40-50%
  - Document any remaining failures (should be non-token issues)

### Implementation Notes

1. Fix only the identified truncation point (surgical approach)
2. Don't add defensive code elsewhere
3. Verify fix with original failing test first
4. Run full suite to validate improvement
5. Document any unexpected behaviors

### Parallel Opportunities

- T007-T008 sequential (must fix before cleanup)
- T009 sequential (must cleanup before testing)
- T010 sequential (verify single test before full suite)

### Dependencies

- **Depends on**: WP01 (investigation must identify truncation point)

### Risks & Mitigations

- **Risk**: Fix introduces new bug
  - **Mitigation**: Test with original failing case first, then full suite
- **Risk**: Pass rate doesn't improve as expected
  - **Mitigation**: Document remaining failures, verify they're not token-related
- **Risk**: Truncation reappears elsewhere
  - **Mitigation**: WP03 validation will catch it

---

## Work Package WP03: Lightweight Token Validation (Priority: P2)

**Goal**: Add minimal format validation at CLI wrapper boundary to catch token truncation before CLI invocation.

**Independent Test**: Validation detects malformed tokens and logs warnings; valid tokens pass through unchanged.

**Prompt**: `tasks/planned/WP03-lightweight-token-validation.md`

### Included Subtasks

- [ ] **T011**: Create token validation utility (`src/utils/token-validation.ts`)
  - Implement `validateMittwaldToken()` function
  - Check for 3 parts separated by colons
  - Validate all parts non-empty
  - Return structured validation result

- [ ] **T012**: Implement token redaction helper
  - Create `redactToken()` function
  - Show first 8 chars of UUID
  - Hide secret part completely
  - Show full suffix (to detect truncation)

- [ ] **T013**: Integrate validation into CLI wrapper
  - Add validation before adding token to arguments
  - Log warning if invalid (non-blocking)
  - Include expected vs actual format in warning
  - Let CLI handle actual auth failure

### Implementation Notes

1. Keep validation lightweight (structure only, not semantics)
2. Non-blocking warnings only (don't prevent execution)
3. Redaction helper for safe logging
4. Integration at single point (CLI wrapper)

### Parallel Opportunities

- T011-T012 can be implemented in parallel (same file, different functions)
- T013 depends on T011-T012 complete

### Dependencies

- **Depends on**: WP02 (fix must be in place first)

### Risks & Mitigations

- **Risk**: Validation too strict (false positives)
  - **Mitigation**: Lightweight checks only (structure, not content)
- **Risk**: Performance overhead
  - **Mitigation**: Simple string operations, minimal impact

---

## Work Package WP04: Regression Prevention Tests (Priority: P2)

**Goal**: Add minimal test coverage to prevent token truncation from recurring.

**Independent Test**: Tests pass with valid tokens; tests detect truncation with invalid tokens.

**Prompt**: `tasks/planned/WP04-regression-prevention-tests.md`

### Included Subtasks

- [ ] **T014**: Create unit tests for token validation (`tests/unit/token-validation.test.ts`)
  - Test valid token format passes validation
  - Test malformed tokens fail validation
  - Test empty tokens fail validation
  - Test redaction hides secrets

- [ ] **T015**: Create integration test for token flow (`tests/integration/token-flow.test.ts`)
  - Test token stored in session retrieves intact
  - Test CLI wrapper receives full token format
  - Verify no truncation through full pipeline

- [ ] **T016**: Run tests and verify coverage
  - Execute unit tests
  - Execute integration test
  - Verify all tests pass
  - Document test coverage

### Implementation Notes

1. Minimal test coverage (regression prevention only)
2. Focus on token format integrity
3. Use realistic test tokens
4. Verify fix doesn't regress

### Parallel Opportunities

- T014-T015 can be written in parallel (different files)
- T016 sequential (run after tests written)

### Dependencies

- **Depends on**: WP03 (validation utility must exist for unit tests)

### Risks & Mitigations

- **Risk**: Tests brittle if token format changes
  - **Mitigation**: Use realistic examples matching current format
- **Risk**: Integration test requires full setup
  - **Mitigation**: Keep test minimal, focus on token integrity only

---

## Work Package WP05: Documentation & Cleanup (Priority: P3)

**Goal**: Document fix, update quickstart guide, and remove temporary artifacts.

**Independent Test**: Documentation accurately describes fix; no temporary files remain in codebase.

**Prompt**: `tasks/planned/WP05-documentation-and-cleanup.md`

### Included Subtasks

- [ ] **T017**: Update `research.md` with investigation findings
  - Document truncation point found
  - Explain root cause
  - Document fix applied

- [ ] **T018**: Update `quickstart.md` with validation examples
  - Add token debugging commands
  - Document validation usage
  - Include common issues section

- [ ] **T019**: Final cleanup pass
  - Verify all instrumentation removed
  - Check for any debug logs remaining
  - Remove any temporary test files

### Implementation Notes

1. Complete research.md with actual findings (template populated during WP01)
2. Enhance quickstart.md with real examples
3. Ensure codebase is clean

### Parallel Opportunities

- T017-T018 can be done in parallel
- T019 sequential (final cleanup)

### Dependencies

- **Depends on**: WP02 (fix must be complete), WP03 (validation in place), WP04 (tests complete)

### Risks & Mitigations

- **Risk**: Documentation becomes stale
  - **Mitigation**: Keep focused on token debugging, not implementation details

---

## Dependency & Execution Summary

### Execution Sequence

```
WP01 (Investigation)
  └─> WP02 (Surgical Fix)
      └─> WP03 (Validation)
          └─> WP04 (Tests)
              └─> WP05 (Documentation)
```

### Parallelization Strategy

- **WP01**: Subtasks T001-T004 can run in parallel (different files)
- **WP02**: Sequential execution (fix → cleanup → verify)
- **WP03**: T011-T012 parallel, T013 sequential
- **WP04**: T014-T015 parallel, T016 sequential
- **WP05**: T017-T018 parallel, T019 sequential

### MVP Scope

**Minimum Viable Fix**: WP01 + WP02

- WP01 identifies the problem
- WP02 fixes the problem
- Result: Tokens work, pass rate improves

**Recommended MVP**: WP01 + WP02 + WP03

- Adds lightweight validation
- Prevents silent regressions
- Minimal overhead

**Complete Feature**: WP01-WP05

- Includes test coverage
- Full documentation
- Production-ready

### Time Estimates

| WP | Description | Estimated Time | Dependencies |
|----|-------------|----------------|--------------|
| WP01 | Investigation | 2-3 hours | None |
| WP02 | Surgical Fix | 1-2 hours | WP01 |
| WP03 | Validation | 2-3 hours | WP02 |
| WP04 | Tests | 2-3 hours | WP03 |
| WP05 | Documentation | 1-2 hours | WP02-WP04 |

**Total**: 8-13 hours for complete feature

---

## Subtask Index (Reference)

### WP01: Investigation
- T001: OAuth Bridge instrumentation
- T002: Session Storage instrumentation
- T003: Session Retrieval instrumentation
- T004: CLI Wrapper instrumentation
- T005: Run test and collect evidence
- T006: Document findings

### WP02: Fix
- T007: Apply surgical fix
- T008: Remove instrumentation
- T009: Verify single test
- T010: Run full suite

### WP03: Validation
- T011: Create validation utility
- T012: Create redaction helper
- T013: Integrate into CLI wrapper

### WP04: Tests
- T014: Unit tests for validation
- T015: Integration test for token flow
- T016: Run and verify tests

### WP05: Documentation
- T017: Update research.md
- T018: Update quickstart.md
- T019: Final cleanup

**Total**: 19 subtasks across 5 work packages

---

## Success Metrics

**Primary Metrics**:
- ✅ Truncation point identified with evidence
- ✅ Fix applied at exact location
- ✅ Pass rate improves from 19.4% to 40-50%
- ✅ Zero 403 "verdict: abstain" for valid operations

**Quality Metrics**:
- ✅ All instrumentation removed
- ✅ Validation catches malformed tokens
- ✅ Tests prevent regression
- ✅ Documentation complete

**Sprint 008 Impact**:
- 15-20 previously failing tests now pass
- OAuth scope configuration proven sufficient
- Token integrity guaranteed through pipeline

---

## Next Steps

1. Review this task breakdown
2. Run `/spec-kitty.implement --work-package WP01` to begin investigation
3. Or review generated prompt files in `tasks/planned/`
4. Or run `/spec-kitty.analyze` to validate task quality
