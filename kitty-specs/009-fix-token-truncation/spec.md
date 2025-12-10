# Feature Specification: Fix Token Truncation in MCP Pipeline

**Feature Branch**: `009-fix-token-truncation`
**Created**: 2025-12-10
**Status**: Draft
**Input**: Mittwald access tokens are being truncated during the OAuth-to-CLI pipeline, causing 403 permission errors in tests. Systematically investigate the token flow through OAuth Bridge ’ Session Storage ’ Retrieval ’ CLI Wrapper, identify the exact truncation point, implement a surgical fix, add comprehensive validation to prevent this class of issue, and include test coverage to prevent regression.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Systematic Token Flow Investigation (Priority: P1)

An engineer systematically traces Mittwald access tokens through the entire OAuth-to-CLI pipeline to identify the exact truncation point causing 403 errors in 60% of test failures.

**Why this priority**: Cannot fix what we don't understand. Systematic investigation is the foundation for a surgical fix and prevents treating symptoms instead of root cause.

**Independent Test**: Can be fully tested by instrumenting each pipeline stage (OAuth Bridge, Session Storage, Retrieval, CLI Wrapper) with logging, tracing a test token end-to-end, and identifying where the format changes from valid to truncated.

**Acceptance Scenarios**:

1. **Given** a valid Mittwald OAuth token from the bridge, **When** traced through session storage, **Then** token format is logged at entry and exit with no truncation detected
2. **Given** a stored session token, **When** retrieved by session manager, **Then** retrieved token matches stored token character-for-character
3. **Given** a retrieved token, **When** passed to CLI wrapper, **Then** token passed to mw CLI matches retrieved token exactly
4. **Given** investigation complete, **When** all pipeline stages analyzed, **Then** exact truncation point is identified with evidence (logs showing before/after state)

---

### User Story 2 - Surgical Fix of Token Truncation (Priority: P1)

An engineer implements a precise fix at the identified truncation point, ensuring tokens flow intact through the entire pipeline without defensive band-aids elsewhere.

**Why this priority**: Fixes the immediate blocker causing 60% test failures. Surgical approach prevents technical debt from defensive programming.

**Independent Test**: Can be fully tested by running existing test suite (31 use cases) and verifying 403 "access denied; verdict: abstain" errors are eliminated for operations where user has proper permissions.

**Acceptance Scenarios**:

1. **Given** the truncation point is identified, **When** fix is applied, **Then** tokens maintain full format (e.g., `uuid:secret:mittwald_oauth_xyz`) through the pipeline
2. **Given** fixed pipeline, **When** running access-001-create-sftp-user test, **Then** test passes without 403 permission errors
3. **Given** fixed pipeline, **When** running all 31 test cases, **Then** 403 errors occur only for legitimate permission issues (not token truncation)
4. **Given** fix applied, **When** comparing before/after metrics, **Then** test pass rate improves from 19.4% to expected 40-50% range

---

### User Story 3 - Token Validation Framework (Priority: P2)

An engineer adds validation at each pipeline stage to detect and prevent token malformation, ruling out this entire class of string truncation issues.

**Why this priority**: Prevents regression and catches similar issues before they reach production. Lower priority than fix since tests can run once fix is in place.

**Independent Test**: Can be fully tested by injecting malformed tokens at each pipeline stage and verifying validation catches them with clear error messages.

**Acceptance Scenarios**:

1. **Given** OAuth bridge receives a token, **When** token format is invalid (too short, missing parts, wrong format), **Then** validation rejects it with descriptive error before storage
2. **Given** session storage receives a token, **When** stored token differs from input token, **Then** validation detects mismatch and logs warning
3. **Given** CLI wrapper receives a token, **When** token is malformed, **Then** validation prevents CLI invocation and returns clear error
4. **Given** validation framework complete, **When** running test suite, **Then** any token issues are caught early with actionable error messages

---

### User Story 4 - Token Health Check Integration (Priority: P2)

An engineer adds token integrity checks to the test environment health check system, catching token issues before test runs begin.

**Why this priority**: Prevents wasted test runs and provides fast feedback. Lower priority since manual verification is possible.

**Independent Test**: Can be fully tested by running health checks with various token states (valid, truncated, missing, expired) and verifying each is detected correctly.

**Acceptance Scenarios**:

1. **Given** pre-test health check runs, **When** checking token integrity, **Then** validates token format matches expected pattern
2. **Given** token is truncated in session, **When** health check runs, **Then** check fails with clear message indicating token truncation
3. **Given** token is missing, **When** health check runs, **Then** check fails indicating authentication required
4. **Given** all health checks pass, **When** test run begins, **Then** tests have valid tokens and environment is ready

---

### User Story 5 - Test Coverage for Token Pipeline (Priority: P2)

An engineer adds automated tests covering token flow through each pipeline stage to prevent regression of truncation bugs.

**Why this priority**: Ensures fix remains effective over time. Lower priority since manual testing can verify initially.

**Independent Test**: Can be fully tested by running new test suite covering token storage, retrieval, and CLI invocation with various token formats.

**Acceptance Scenarios**:

1. **Given** token pipeline tests, **When** valid token flows through pipeline, **Then** all stages pass with token intact
2. **Given** token pipeline tests, **When** malformed token is injected, **Then** validation catches it at appropriate stage
3. **Given** integration tests, **When** simulating OAuth-to-CLI flow, **Then** tokens maintain integrity end-to-end
4. **Given** regression tests, **When** running after code changes, **Then** any token truncation is detected immediately

---

### Edge Cases

- What happens when token contains special characters (colons, quotes, unicode)?
- How does system handle extremely long tokens (beyond expected OAuth token length)?
- What if token is valid format but semantically invalid (wrong signature, expired)?
- How does validation perform under high load (many concurrent sessions)?
- What if session storage has size limits that could truncate long tokens?
- How are tokens handled during session migration or serialization to different formats (JSON, logs)?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Investigation MUST trace tokens through all four pipeline stages (OAuth Bridge ’ Session Storage ’ Retrieval ’ CLI Wrapper) with logging at each boundary
- **FR-002**: Investigation MUST identify the exact code location where truncation occurs with evidence (before/after token values)
- **FR-003**: Fix MUST preserve full token format through entire pipeline without defensive modifications at other stages
- **FR-004**: Fix MUST handle tokens of varying lengths (up to 500 characters minimum) without truncation
- **FR-005**: Validation MUST verify token format at OAuth Bridge entry point (before storage)
- **FR-006**: Validation MUST verify token integrity during session storage (detect any modifications)
- **FR-007**: Validation MUST verify token format before CLI wrapper invocation
- **FR-008**: Validation errors MUST include token format expectations and actual format received (with sensitive parts redacted)
- **FR-009**: Health checks MUST validate token format matches expected OAuth token pattern (uuid:secret:mittwald_oauth_suffix)
- **FR-010**: Health checks MUST fail with actionable error messages when token issues are detected
- **FR-011**: Test coverage MUST include unit tests for each validation point
- **FR-012**: Test coverage MUST include integration test covering full OAuth-to-CLI flow
- **FR-013**: All token logging and error messages MUST redact sensitive token parts (show only format, not actual secrets)

### Key Entities

- **Mittwald Access Token**: OAuth token from Mittwald API with format `{uuid}:{secret}:{provider_suffix}`, used for CLI authentication
  - Attributes: UUID, secret key, provider suffix (e.g., mittwald_oauth_xyz)
  - Relationships: Generated by OAuth Bridge, stored in Session, retrieved for CLI invocation

- **Token Validation Result**: Outcome of token integrity checks at pipeline boundaries
  - Attributes: validation status (pass/fail), error message, expected format, actual format, stage where validated
  - Relationships: Generated at each validation point, used for health checks and error reporting

- **Pipeline Stage**: Discrete component in token flow (OAuth Bridge, Session Storage, Session Retrieval, CLI Wrapper)
  - Attributes: stage name, input token format, output token format, validation rules
  - Relationships: Sequential stages with token flowing through each

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Token truncation bug is identified with precision - exact code location and root cause documented
- **SC-002**: Test pass rate improves from 19.4% to 40-50% range after fix is applied
- **SC-003**: Zero 403 "access denied; verdict: abstain" errors occur for operations where user has proper permissions
- **SC-004**: Tokens maintain full format (including provider suffix) through all four pipeline stages
- **SC-005**: Token validation catches 100% of malformed tokens before they reach CLI invocation
- **SC-006**: Health checks detect token truncation before test runs begin (zero false negatives)
- **SC-007**: Test coverage includes minimum 10 test cases covering token pipeline (unit + integration)
- **SC-008**: All token-related error messages are actionable with clear next steps for resolution

### Qualitative Outcomes

- Investigation methodology is thorough enough to rule out entire class of string truncation issues
- Fix is surgical and targeted at root cause (not defensive band-aids)
- Validation framework prevents similar token issues from reaching production
- Test coverage provides confidence that fix won't regress in future changes
- Documentation clearly explains token flow and validation points for future maintainers

---

## Assumptions

- OAuth Bridge is correctly generating full-format tokens initially (not truncating at source)
- Mittwald API accepts tokens up to 500 characters in length
- Session storage mechanism supports strings of adequate length for OAuth tokens
- CLI wrapper and underlying shell can handle token arguments of required length
- Test environment has proper OAuth credentials configured
- Token format follows pattern: `{uuid}:{secret}:{provider_suffix}` where suffix is variable length

---

## Out of Scope

- Implementing JWT token auto-refresh (separate feature)
- Modifying OAuth Bridge scope configuration (verified not needed)
- Performance optimization of token validation (current implementation sufficient)
- Implementing token rotation or expiration handling (existing behavior maintained)
- Creating baseline comparison tools (separate feature)
- Improving MCP tool descriptions (separate feature)
- Changing OAuth token format or structure (external dependency)
