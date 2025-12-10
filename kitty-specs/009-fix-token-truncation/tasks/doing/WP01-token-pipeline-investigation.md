---
work_package_id: "WP01"
subtasks:
  - "T001"
  - "T002"
  - "T003"
  - "T004"
  - "T005"
  - "T006"
title: "Systematic Token Pipeline Investigation"
phase: "Phase 1 - Investigation"
lane: "doing"
assignee: "Claude Sonnet 4.5"
agent: "claude"
shell_pid: "81162"
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-12-10T08:35:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-10T16:30:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "81162"
    action: "Started implementation"
---

# Work Package Prompt: WP01 – Systematic Token Pipeline Investigation

## ⚠️ IMPORTANT: Review Feedback Status

**Read this first if you are implementing this task!**

- **Has review feedback?**: Check the `review_status` field above. If it says `has_feedback`, scroll to the **Review Feedback** section immediately.
- **You must address all feedback** before your work is complete.
- **Mark as acknowledged**: When you understand feedback, update `review_status: acknowledged`.

---

## Review Feedback

*[Empty initially. Reviewers populate this if work needs changes.]*

---

## Objectives & Success Criteria

**Goal**: Identify the exact location where Mittwald access tokens are being truncated in the OAuth-to-CLI pipeline.

**Success Criteria**:
- Exact file, line number, and function where truncation occurs is documented
- Evidence collected showing token format before and after truncation
- Root cause explanation documented (why truncation happens)
- Surgical fix approach proposed

**Evidence**: `research.md` populated with findings, logs showing token progression through pipeline

---

## Context & Constraints

**Problem**: Sprint 008 tests show 60% failure rate with 403 "access denied; verdict: abstain" errors. Investigation revealed tokens are truncated, ending at `:mittwald_o` instead of full suffix.

**Evidence**:
- Test logs show token: `uuid:secret:mittwald_o` (truncated)
- Expected format: `uuid:secret:mittwald_oauth_xyz` (full)
- OAuth scope configuration verified as correct (all write scopes present)
- Manual `mw` CLI works (proving user has proper permissions)

**Pipeline Stages to Investigate**:
1. OAuth Bridge: `packages/oauth-bridge/src/routes/token.ts`
2. Session Storage: `packages/oauth-bridge/src/state/state-store.ts`
3. Session Retrieval: `src/server/session-manager.ts`, `src/server/oauth-middleware.ts`
4. CLI Wrapper: `src/utils/cli-wrapper.ts`

**Constraints**:
- Use temporary instrumentation only (remove after investigation)
- Never log full tokens (use redaction)
- Minimal test runs (single failing test to reduce noise)

**Supporting Documents**:
- Spec: `kitty-specs/009-fix-token-truncation/spec.md`
- Plan: `kitty-specs/009-fix-token-truncation/plan.md`
- Research Template: `kitty-specs/009-fix-token-truncation/research.md`

---

## Subtasks & Detailed Guidance

### Subtask T001 – Instrument OAuth Bridge Token Generation

**Purpose**: Verify token format is correct at generation point (rule out source truncation)

**Steps**:
1. Open `packages/oauth-bridge/src/routes/token.ts`
2. Find where Mittwald access token is extracted from OAuth response
3. Add logging after token extraction:
   ```typescript
   console.debug(`[TOKEN-DEBUG] oauth_bridge: length=${token.length}, parts=${token.split(':').length}, suffix_len=${token.split(':')[2]?.length}`);
   ```
4. Add token format logging (redacted):
   ```typescript
   const parts = token.split(':');
   console.debug(`[TOKEN-DEBUG] oauth_bridge format: uuid=${parts[0]?.slice(0,8)}..., secret=[REDACTED], suffix=${parts[2]}`);
   ```

**Files**: `packages/oauth-bridge/src/routes/token.ts`

**Parallel?**: Yes (can implement alongside T002-T004)

**Expected Outcome**: Logs show token is full format at generation (baseline evidence)

---

### Subtask T002 – Instrument Session Storage

**Purpose**: Check if token gets truncated during storage or serialization

**Steps**:
1. Open `packages/oauth-bridge/src/state/state-store.ts`
2. Find where `mittwaldAccessToken` is stored
3. Add logging BEFORE storage:
   ```typescript
   console.debug(`[TOKEN-DEBUG] session_storage_input: length=${token.length}, suffix=${token.split(':')[2]}`);
   ```
4. Find where token is retrieved from storage
5. Add logging AFTER retrieval:
   ```typescript
   console.debug(`[TOKEN-DEBUG] session_storage_output: length=${retrievedToken.length}, suffix=${retrievedToken.split(':')[2]}`);
   ```
6. Compare input vs output lengths

**Files**: `packages/oauth-bridge/src/state/state-store.ts`

**Parallel?**: Yes

**Notes**: Check for JSON serialization limits, Redis string limits (if using Redis), or any string truncation operations

**Expected Outcome**: Logs show whether truncation occurs in storage layer

---

### Subtask T003 – Instrument Session Retrieval

**Purpose**: Check if token gets truncated during retrieval on MCP server side

**Steps**:
1. Open `src/server/session-manager.ts`
2. Find `getSession()` method
3. Add logging when session retrieved:
   ```typescript
   console.debug(`[TOKEN-DEBUG] session_retrieval: token_exists=${!!session?.mittwaldAccessToken}, length=${session?.mittwaldAccessToken?.length}, suffix=${session?.mittwaldAccessToken?.split(':')[2]}`);
   ```
4. Open `src/server/oauth-middleware.ts`
5. Find where token is extracted from session for use
6. Add logging:
   ```typescript
   console.debug(`[TOKEN-DEBUG] oauth_middleware: length=${token.length}, suffix=${token.split(':')[2]}`);
   ```

**Files**:
- `src/server/session-manager.ts`
- `src/server/oauth-middleware.ts`

**Parallel?**: Yes

**Notes**: Check for any string operations, substring calls, or transformations on retrieved token

**Expected Outcome**: Logs show token format after retrieval from session

---

### Subtask T004 – Instrument CLI Wrapper

**Purpose**: Check if token gets truncated when building CLI arguments

**Steps**:
1. Open `src/utils/cli-wrapper.ts`
2. Find where `effectiveToken` is added to CLI arguments (around line 159)
3. Add logging BEFORE adding to arguments:
   ```typescript
   if (effectiveToken) {
     console.debug(`[TOKEN-DEBUG] cli_wrapper_input: length=${effectiveToken.length}, parts=${effectiveToken.split(':').length}, suffix=${effectiveToken.split(':')[2]}`);
   ```
4. Add logging showing final CLI command structure:
   ```typescript
   const tokenIndex = effectiveArgs.indexOf('--token');
   if (tokenIndex >= 0) {
     const tokenArg = effectiveArgs[tokenIndex + 1];
     console.debug(`[TOKEN-DEBUG] cli_wrapper_final: token_arg_length=${tokenArg?.length}, suffix=${tokenArg?.split(':')[2]}`);
   }
   ```

**Files**: `src/utils/cli-wrapper.ts`

**Parallel?**: Yes

**Notes**: Check for argument escaping, shell quoting, or string manipulation during command construction

**Expected Outcome**: Logs show token format when passed to CLI

---

### Subtask T005 – Run Instrumented Test and Collect Evidence

**Purpose**: Execute failing test with instrumentation to capture token progression through pipeline

**Steps**:
1. Ensure all T001-T004 instrumentation is in place
2. Build project: `npm run build`
3. Navigate to test directory: `cd tests/functional`
4. Run single failing test:
   ```bash
   npm test -- --use-case access-001-create-sftp-user 2>&1 | tee investigation.log
   ```
5. Filter for token debug logs:
   ```bash
   grep "\[TOKEN-DEBUG\]" investigation.log > token-trace.log
   ```
6. Analyze logs to find truncation point:
   - Look for first stage where `suffix` length decreases
   - Look for stage where `length` drops significantly
   - Identify transition from full format to truncated format

**Files**:
- Output: `investigation.log`, `token-trace.log`

**Parallel?**: No (depends on T001-T004)

**Analysis Questions**:
- At which stage does length first decrease?
- What is the suffix length at each stage?
- Is truncation gradual or sudden?
- Are all token parts affected or just suffix?

**Expected Outcome**: Clear evidence showing exact stage where truncation occurs

---

### Subtask T006 – Document Findings in research.md

**Purpose**: Record investigation findings with evidence for surgical fix in WP02

**Steps**:
1. Open `kitty-specs/009-fix-token-truncation/research.md`
2. Fill "Findings" section with:
   - **Truncation Point Identified**: Stage name, file, line
   - **Root Cause Analysis**: Why truncation occurs (code snippet)
   - **Evidence**: Paste relevant debug logs
   - **Surgical Fix Design**: Describe exact fix needed

3. Example documentation:
   ```markdown
   ### Truncation Point Identified

   **Stage**: Session Retrieval
   **File**: src/server/session-manager.ts
   **Line**: 145
   **Root Cause**: Token retrieved from Redis is limited to 100 characters due to maxlen configuration

   **Evidence**:
   ```
   [TOKEN-DEBUG] session_storage_output: length=150, suffix=mittwald_oauth_xyz
   [TOKEN-DEBUG] session_retrieval: length=100, suffix=mittwald_o  ← TRUNCATED!
   ```

   **Fix Approach**: Remove or increase maxlen limit in Redis GET operation
   ```

4. Complete "Surgical Fix Design" section
5. Document alternatives investigated and ruled out
6. Propose verification plan

**Files**: `kitty-specs/009-fix-token-truncation/research.md`

**Parallel?**: No (depends on T005)

**Expected Outcome**: Research document ready for WP02 implementation

---

## Test Strategy

**Not applicable** - This is investigation phase, no tests needed yet. Tests will be added in WP04.

---

## Risks & Mitigations

**Risk**: Instrumentation affects token handling behavior
- **Mitigation**: Use logging only, no code logic changes

**Risk**: Logs expose secrets
- **Mitigation**: Redact secret portion, only log format and lengths

**Risk**: Can't identify truncation point (no clear evidence)
- **Mitigation**: Add more granular logging, check intermediate operations within each stage

**Risk**: Multiple truncation points
- **Mitigation**: Fix all identified points in WP02

---

## Definition of Done Checklist

- [ ] All 4 pipeline stages instrumented (T001-T004)
- [ ] Test executed with full debug logging (T005)
- [ ] Truncation point identified with evidence (T005)
- [ ] Findings documented in research.md (T006)
- [ ] Root cause explained
- [ ] Surgical fix approach proposed
- [ ] `tasks.md` updated: WP01 moved to done lane

---

## Review Guidance

**For reviewers checking this work package:**

1. **Verify investigation completeness**:
   - Check research.md has exact file and line number
   - Verify evidence logs show clear truncation
   - Confirm root cause explanation makes sense

2. **Validate fix approach**:
   - Surgical fix targets exact location (not defensive programming)
   - Fix is minimal and focused
   - No unnecessary changes proposed

3. **Check documentation quality**:
   - Findings are clear and actionable for WP02
   - Evidence supports conclusions
   - Alternative causes documented as ruled out

**Approval Criteria**: Research.md complete with exact truncation location and surgical fix approach

---

## Activity Log

- 2025-12-10T08:35:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
- 2025-12-10T16:30:00Z – claude – shell_pid=81162 – lane=doing – Started implementation

---

## Quick Reference

**Investigation Command**:
```bash
cd tests/functional
npm run build && npm test -- --use-case access-001-create-sftp-user 2>&1 | grep "\[TOKEN-DEBUG\]"
```

**Files to Instrument**:
1. `packages/oauth-bridge/src/routes/token.ts`
2. `packages/oauth-bridge/src/state/state-store.ts`
3. `src/server/session-manager.ts`
4. `src/server/oauth-middleware.ts`
5. `src/utils/cli-wrapper.ts`

**Expected Token Format**: `{uuid}:{secret}:{provider_suffix}` (150+ chars)
**Actual (Truncated)**: `{uuid}:{secret}:mittwald_o` (~100 chars)
