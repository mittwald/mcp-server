---
work_package_id: "WP03"
subtasks:
  - "T011"
  - "T012"
  - "T013"
title: "Lightweight Token Validation"
phase: "Phase 3 - Validation"
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

# Work Package Prompt: WP03 – Lightweight Token Validation

## ⚠️ IMPORTANT: Review Feedback Status

**Read this first if you are implementing this task!**

- **Has review feedback?**: Check the `review_status` field above.
- **You must address all feedback** before your work is complete.

---

## Review Feedback

*[Empty initially. Reviewers populate this if work needs changes.]*

---

## Objectives & Success Criteria

**Goal**: Add minimal token format validation at CLI wrapper boundary to catch future token truncation issues.

**Success Criteria**:
- Validation function checks token structure (3 parts, non-empty)
- Validation logs warnings for malformed tokens (non-blocking)
- Redaction helper safely logs tokens in error messages
- Valid tokens pass through unchanged
- Minimal performance overhead

**Verification**: Unit tests pass, validation catches test malformed tokens, no false positives

---

## Context & Constraints

**Prerequisites**: WP02 complete (fix applied and verified)

**Approach**: Lightweight validation at single boundary (CLI wrapper)

**Philosophy**:
- Structure validation only (not semantic)
- Non-blocking warnings (let CLI handle auth)
- Minimal overhead (simple string operations)

**Constraints**:
- No external dependencies
- Keep validation simple
- Don't block on validation failures

**Supporting Documents**:
- Contract: `kitty-specs/009-fix-token-truncation/contracts/token-validation.md`
- Data Model: `kitty-specs/009-fix-token-truncation/data-model.md`

---

## Subtasks & Detailed Guidance

### Subtask T011 – Create Token Validation Utility

**Purpose**: Implement lightweight token structure validation

**Steps**:
1. Create file: `src/utils/token-validation.ts`

2. Define validation result interface:
   ```typescript
   export interface TokenValidationResult {
     valid: boolean;
     error?: string;
     expectedFormat: string;
     actualFormat: string;
   }
   ```

3. Implement validation function:
   ```typescript
   export function validateMittwaldToken(token: string | undefined): TokenValidationResult {
     const expectedFormat = '{uuid}:{secret}:{provider_suffix}';

     // Check 1: Non-empty
     if (!token) {
       return {
         valid: false,
         error: 'Token empty or missing',
         expectedFormat,
         actualFormat: 'empty'
       };
     }

     // Check 2: Three parts
     const parts = token.split(':');
     if (parts.length !== 3) {
       return {
         valid: false,
         error: `Token malformed: expected 3 parts separated by colons, got ${parts.length} parts`,
         expectedFormat,
         actualFormat: `{${parts.length} parts}`
       };
     }

     // Check 3: No empty parts
     const [uuid, secret, suffix] = parts;
     if (!uuid || !secret || !suffix) {
       return {
         valid: false,
         error: 'Token has empty parts',
         expectedFormat,
         actualFormat: `{${uuid?'uuid':'EMPTY'}:${secret?'secret':'EMPTY'}:${suffix?'suffix':'EMPTY'}}`
       };
     }

     // Valid
     return {
       valid: true,
       expectedFormat,
       actualFormat: `{uuid}:{secret}:{suffix:${suffix.length}chars}`
     };
   }
   ```

4. Add TypeScript exports in `src/utils/index.ts` (if needed)

**Files**: `src/utils/token-validation.ts` (NEW)

**Parallel?**: Can implement alongside T012

**Notes**:
- Keep validation simple (structure only)
- Don't validate UUID format, secret strength, or suffix content
- Return structured result for clear error messages

---

### Subtask T012 – Implement Token Redaction Helper

**Purpose**: Safely log token information without exposing secrets

**Steps**:
1. Add to `src/utils/token-validation.ts`:
   ```typescript
   /**
    * Redact sensitive token parts for safe logging
    * Shows: First 8 chars of UUID, full suffix
    * Hides: Full UUID, entire secret
    */
   export function redactToken(token: string): string {
     const parts = token.split(':');

     // Handle malformed tokens
     if (parts.length !== 3) {
       return '[MALFORMED_TOKEN]';
     }

     const [uuid, _secret, suffix] = parts;

     // Show first 8 chars of UUID, redact secret, show full suffix
     return `${uuid.slice(0, 8)}...:[REDACTED]:${suffix}`;
   }
   ```

2. Example outputs:
   ```typescript
   Input:  "c8e06919-aa0c-447e-b57f-c1508f64a76f:secret123:mittwald_oauth_xyz"
   Output: "c8e06919...:[REDACTED]:mittwald_oauth_xyz"

   Input:  "c8e06919-aa0c-447e-b57f-c1508f64a76f:secret123:mittwald_o"
   Output: "c8e06919...:[REDACTED]:mittwald_o"  ← Truncation visible!
   ```

**Files**: `src/utils/token-validation.ts`

**Parallel?**: Can implement alongside T011

**Notes**:
- Full suffix shown to detect truncation
- Secret completely hidden
- UUID prefix helps identify token in logs

---

### Subtask T013 – Integrate Validation into CLI Wrapper

**Purpose**: Use validation before CLI invocation to catch malformed tokens

**Steps**:
1. Open `src/utils/cli-wrapper.ts`

2. Import validation utilities:
   ```typescript
   import { validateMittwaldToken, redactToken } from './token-validation.js';
   ```

3. Find where token is added to CLI arguments (around line 157-159)

4. Add validation before pushing token:
   ```typescript
   if (!hasTokenArg) {
     if (effectiveToken) {
       // Validate token format
       const validation = validateMittwaldToken(effectiveToken);

       if (!validation.valid) {
         console.warn(`[Token Validation] ${validation.error}`);
         console.warn(`[Token Validation] Expected: ${validation.expectedFormat}`);
         console.warn(`[Token Validation] Actual: ${validation.actualFormat}`);
         console.warn(`[Token Validation] Redacted: ${redactToken(effectiveToken)}`);
         // Continue anyway - let CLI handle auth failure
       }

       effectiveArgs.push('--token', effectiveToken);
     }
   }
   ```

5. Test validation doesn't break normal flow:
   - Valid tokens should pass through without warnings
   - Invalid tokens should log warnings but not block

6. Rebuild: `npm run build`

**Files**: `src/utils/cli-wrapper.ts`

**Parallel?**: No (depends on T011-T012)

**Notes**:
- Non-blocking validation (warnings only)
- Let Mittwald CLI be authoritative on token validity
- Our goal: catch obvious truncation, not authenticate

---

## Risks & Mitigations

**Risk**: Validation too strict (false positives)
- **Mitigation**: Simple structure checks only, no semantic validation

**Risk**: Performance overhead from validation
- **Mitigation**: Simple string operations, minimal impact (microseconds)

**Risk**: Warnings too noisy in logs
- **Mitigation**: Only warn on actual malformation (shouldn't happen with fix in place)

---

## Definition of Done Checklist

- [ ] Token validation utility created (T011)
- [ ] Redaction helper implemented (T012)
- [ ] Validation integrated into CLI wrapper (T013)
- [ ] Code compiles successfully
- [ ] Valid tokens pass through without warnings
- [ ] Malformed tokens generate warnings (tested manually)
- [ ] `tasks.md` updated: WP03 moved to for_review lane

---

## Review Guidance

**For reviewers checking this work package:**

1. **Verify lightweight approach**:
   - Validation is simple (structure only)
   - No semantic checks (UUID validity, secret strength)
   - Non-blocking behavior

2. **Check redaction safety**:
   - Secrets never logged
   - Suffix visible (for truncation detection)
   - Test with sample tokens

3. **Validate integration**:
   - Warnings appear for malformed tokens
   - Valid tokens pass through unchanged
   - No performance impact

**Approval Criteria**: Validation utility complete, integrated, non-blocking, minimal overhead

---

## Activity Log

- 2025-12-10T08:35:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks

---

## Quick Reference

**Files Created**:
- `src/utils/token-validation.ts` (NEW)

**Files Modified**:
- `src/utils/cli-wrapper.ts` (add validation integration)

**Testing Validation**:
```typescript
import { validateMittwaldToken } from './src/utils/token-validation';

// Should pass
validateMittwaldToken('uuid:secret:mittwald_oauth_xyz');

// Should fail
validateMittwaldToken('uuid:secret'); // Only 2 parts
validateMittwaldToken(''); // Empty
```
