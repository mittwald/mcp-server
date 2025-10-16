# Agent S1 Implementation Guidance

**Date**: 2025-10-02
**Responding to**: S1's request for scope clarification

---

## Implementation Approach: Phased & Focused

Execute in **4 distinct phases** to maintain quality and avoid regressions. Each phase should be atomic, tested, and committed independently.

---

## Phase 1: Foundation (Priority 1 - Start Here)

**Goal**: Create reusable utilities with comprehensive tests

**Duration**: 1-2 days

### Tasks:
1. Create `src/utils/credential-generator.ts`
   - `generateSecurePassword(options?)` - crypto.randomBytes, 144-bit entropy
   - `generateSecureToken(options?)` - API tokens
   - Default: 24 chars, base64url

2. Create `src/utils/credential-redactor.ts`
   - `redactCredentialsFromCommand(command: string, patterns?: string[])`
   - Default patterns: password, token, api-key, secret, auth
   - Regex-based replacement with `[REDACTED]`

3. Create `src/utils/credential-response.ts`
   - `buildSecureToolResponse(status, message, data?)` - Auto-sanitization
   - `buildUpdatedAttributes(attrs: Record<string, any>)` - Convert values to boolean flags

4. Write comprehensive unit tests:
   - `tests/unit/utils/credential-generator.test.ts`
   - `tests/unit/utils/credential-redactor.test.ts`
   - `tests/unit/utils/credential-response.test.ts`

**Deliverables**: 3 utilities + 3 test files, all tests passing

**Commit**: "feat(security): implement credential security utilities (S1 Phase 1)"

---

## Phase 2: Migrate Existing Credential Tools (Priority 2)

**Goal**: Migrate C3's database tools + other credential-handling tools to use new utilities

**Duration**: 1-2 days

**Scope**: Focus on tools that ALREADY handle credentials (not create new ones)

### Subset A: Database Tools (C3's work)
1. `src/handlers/tools/mittwald-cli/database/mysql/user-create-cli.ts`
2. `src/handlers/tools/mittwald-cli/database/mysql/user-update-password-cli.ts`
3. `src/handlers/tools/mittwald-cli/database/redis/create-cli.ts`

**Approach**:
- Replace manual `crypto.randomBytes()` with `generateSecurePassword()`
- Replace manual redaction with `redactCredentialsFromCommand()`
- Replace manual response building with `buildSecureToolResponse()`
- Update existing tests to verify utility usage

### Subset B: SSH/SFTP Tools (if they generate credentials)
4. `src/handlers/tools/mittwald-cli/ssh/user-create-cli.ts` (if generates passwords)
5. `src/handlers/tools/mittwald-cli/sftp/user-create-cli.ts` (if generates passwords)

**Approach**: Same as Subset A

### Subset C: API Token Tools
6. `src/handlers/tools/mittwald-cli/user/api-token/create-cli.ts`
7. Any other token generation tools

**Approach**: Use `generateSecureToken()` instead of `generateSecurePassword()`

**Deliverables**: 6-10 tools migrated, all existing tests passing

**Commit**: "refactor(security): migrate credential tools to security utilities (S1 Phase 2)"

---

## Phase 3: Enforcement & CI (Priority 3)

**Goal**: Automated validation to prevent credential leakage

**Duration**: 1 day

### Tasks:
1. Create `eslint-rules/no-credential-leak.js`
   - Detect hardcoded passwords/tokens
   - Detect direct `crypto.randomBytes()` in handlers (should use utility)
   - Detect missing `redactCredentialsFromCommand()` before logging

2. Create `.github/workflows/security-check.yml`
   - Run ESLint security rules
   - Run security test suite
   - Block PR if violations found

3. Update `package.json`
   - Add `"test:security"` script
   - Add ESLint rule to default config

4. Create `tests/security/credential-leakage.test.ts`
   - End-to-end validation
   - Test all credential-handling tools
   - Verify no passwords in responses
   - Verify no passwords in logs

**Deliverables**: ESLint rule, CI workflow, security test suite

**Commit**: "feat(security): add credential security enforcement and CI checks (S1 Phase 3)"

---

## Phase 4: CLI Adapter Migration (Priority 4 - DEFERRED)

**Goal**: Remove no-restricted-imports warnings

**Duration**: 2-3 days (NOT part of S1 - separate initiative)

**Scope**: 37+ handlers still using cli-wrapper directly

**Approach**: **DO NOT tackle this in S1**

**Rationale**:
- CLI adapter migration is orthogonal to credential security
- 37 handlers is a large surface area (high regression risk)
- Should be a separate Agent task (recommend Agent C7 or C8)
- Not blocking production deployment of C1-C6

**Next Steps**:
- Document as separate work item
- Create agent prompt for future CLI adapter migration
- Track in backlog, not S1 scope

---

## Phase 5: Documentation & Migration Guide (Priority 5)

**Goal**: Enable future tools to use security patterns correctly

**Duration**: 0.5 days

### Tasks:
1. Create `docs/guides/credential-security-migration.md`
   - Step-by-step guide for migrating tools
   - Before/after code examples
   - Testing checklist

2. Update `docs/CREDENTIAL-SECURITY.md`
   - Add "Implementation" section with utility references
   - Link to migration guide

3. Update `LLM_CONTEXT.md`
   - Add "Security Utilities (REQUIRED)" subsection
   - Reference utilities for all credential-handling tools

**Deliverables**: Migration guide + updated docs

**Commit**: "docs(security): add credential security migration guide (S1 Phase 5)"

---

## Answers to Your Questions

### 1. Credential migration scope
**Answer**: **Focused subset approach (Phase 2)**
- Start with C3's database tools (3 tools)
- Then SSH/SFTP (2 tools)
- Then API tokens (2-3 tools)
- Total: ~7 tools in Phase 2

**Rationale**: These tools ALREADY implement manual patterns. Migration is straightforward refactoring, not new behavior.

### 2. CLI adapter cleanup
**Answer**: **Defer to separate agent (not part of S1)**
- CLI adapter migration is NOT credential-security work
- 37 handlers is too large for S1 scope
- High regression risk requires dedicated focus
- Recommend creating Agent C7/C8 prompt for CLI adapter migration

**Rationale**: S1 should focus on credential security utilities and migration of credential-handling tools only. CLI adapter work is infrastructure cleanup, not security.

---

## Success Criteria

**Phase 1 Complete**:
- [ ] 3 utilities created and exported
- [ ] 3 test files with 100% coverage
- [ ] All tests passing

**Phase 2 Complete**:
- [ ] 6-10 credential tools migrated to utilities
- [ ] All existing tests passing
- [ ] No manual crypto.randomBytes() in credential handlers
- [ ] No manual redaction patterns (use utility)

**Phase 3 Complete**:
- [ ] ESLint rule detects credential violations
- [ ] CI workflow fails on violations
- [ ] Security test suite validates all credential tools
- [ ] No false positives in ESLint

**Phase 5 Complete**:
- [ ] Migration guide published
- [ ] CREDENTIAL-SECURITY.md updated
- [ ] LLM_CONTEXT.md references utilities

---

## Out of Scope for S1

**DO NOT IMPLEMENT**:
- ❌ CLI adapter migration (37 handlers)
- ❌ New credential-handling tools (only migrate existing)
- ❌ Mail handler migration (unless they generate credentials)
- ❌ Project-wide pattern adoption (C6 dependency detection, C2 arrays)

**These should be separate agents/tasks**

---

## Estimated Timeline

- **Phase 1**: 1-2 days (utilities + tests)
- **Phase 2**: 1-2 days (migrate 7 tools)
- **Phase 3**: 1 day (enforcement + CI)
- **Phase 5**: 0.5 days (docs)

**Total: 3.5-5.5 days**

---

## Next Steps

1. **Start with Phase 1** - Create utilities and tests
2. **Commit atomically** - One phase per commit
3. **Report progress** - Provide summary after each phase
4. **Ask questions** - If blockers arise, report immediately
5. **Test thoroughly** - All tests must pass before moving to next phase

---

**Approved**: Ready to proceed with Phase 1
**Point of Contact**: Robert (via summary reports after each phase)
