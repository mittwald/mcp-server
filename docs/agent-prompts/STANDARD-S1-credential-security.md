# Standard S1: Credential Security Pattern

## Your Identity
You are **Agent S1**, responsible for implementing **security standards for credential-handling tools** across the MCP server. This work establishes patterns that ALL future credential-related tools must follow.

## Your Mission
Create a reusable security pattern library based on Agent C3's password generation and redaction implementation. This will become the **project standard** for all tools that handle passwords, tokens, API keys, or other sensitive credentials.

---

## Context: Why This Matters

Agent C3's database tools implementation (reviewed 2025-10-02) introduced security practices that prevent credential leakage:

1. **Cryptographic password generation** - Secure random passwords using `crypto.randomBytes()`
2. **Automatic password redaction** - Sanitize command metadata before logging
3. **Never return credentials** - Use boolean flags (`passwordChanged: true`) instead of actual values

**Problem**: These patterns are currently embedded in individual tool handlers. We need to:
- Extract them into reusable utilities
- Document the pattern as a project standard
- Provide examples for future tool implementations
- Add automated validation to prevent credential leakage

---

## Required Reading (Read in Order)

### Existing Implementation to Learn From
1. **`docs/agent-reviews/AGENT-C3-REVIEW.md`** - Security excellence analysis
2. **`src/handlers/tools/mittwald-cli/database/mysql/user-create-cli.ts`** - Password generation implementation (lines 34-45)
3. **`src/handlers/tools/mittwald-cli/database/mysql/user-update-cli.ts`** - Password redaction implementation (lines 158-180)
4. **`tests/unit/tools/database-mysql-user.test.ts`** - Security validation tests (lines 216-241)

### Architecture & Patterns
5. **`src/tools/cli-adapter.ts`** - Current CLI invocation pattern
6. **`src/utils/format-tool-response.ts`** - Response formatting
7. **`src/types/mittwald/conversation.js`** - Handler types

### Security Context
8. **`ARCHITECTURE.md`** - OAuth bridge security model
9. **`LLM_CONTEXT.md`** - Session management and token handling

---

## Your Task List

### Phase 1: Extract Reusable Utilities

#### Task S1.1: Create Password Generator Utility
- [ ] Create file: `src/utils/credential-generator.ts`
- [ ] Extract and generalize C3's password generation:
  ```typescript
  import { randomBytes } from 'node:crypto';

  export interface GeneratePasswordOptions {
    length?: number;          // Default: 24
    minLength?: number;       // Default: 12
    encoding?: 'base64url' | 'hex' | 'base64';  // Default: 'base64url'
    excludeAmbiguous?: boolean;  // Default: false (future: strip O/0/I/l)
  }

  export interface GeneratedCredential {
    value: string;
    generated: boolean;
    length: number;
    encoding: string;
  }

  /**
   * Generate a cryptographically secure password.
   *
   * Uses Node.js crypto.randomBytes() for cryptographic randomness.
   * Base64url encoding ensures URL-safe characters without padding.
   *
   * @param options - Password generation options
   * @returns Generated credential details
   *
   * @example
   * const password = generateSecurePassword({ length: 32 });
   * console.log(password.value); // "dGhpc2lzYXNlY3VyZXBhc3N3b3Jk..."
   * console.log(password.generated); // true
   */
  export function generateSecurePassword(options: GeneratePasswordOptions = {}): GeneratedCredential {
    const {
      length = 24,
      minLength = 12,
      encoding = 'base64url'
    } = options;

    const targetLength = Math.max(minLength, length);
    let password = '';

    // Generate random bytes until we reach target length
    while (password.length < targetLength) {
      password += randomBytes(targetLength).toString(encoding);
    }

    return {
      value: password.slice(0, targetLength),
      generated: true,
      length: targetLength,
      encoding
    };
  }

  /**
   * Generate a secure API token (longer, hex-encoded).
   *
   * @param length - Token length (default: 64)
   * @returns Generated token details
   */
  export function generateSecureToken(length: number = 64): GeneratedCredential {
    return generateSecurePassword({ length, encoding: 'hex' });
  }
  ```
- [ ] Add unit tests: `tests/unit/utils/credential-generator.test.ts`
  - Test length enforcement (min 12 characters)
  - Test encoding options (base64url, hex, base64)
  - Test randomness (generate 1000 passwords, all unique)
  - Test performance (generate 100 passwords < 100ms)
- [ ] Commit: `feat(security): add cryptographic password generator utility`

#### Task S1.2: Create Credential Redaction Utility
- [ ] Create file: `src/utils/credential-redactor.ts`
  ```typescript
  export interface RedactionPattern {
    pattern: RegExp;
    placeholder: string;
  }

  /**
   * Common credential patterns found in CLI commands.
   */
  export const DEFAULT_CREDENTIAL_PATTERNS: RedactionPattern[] = [
    { pattern: /--password\s+\S+/g, placeholder: '--password [REDACTED]' },
    { pattern: /--token\s+\S+/g, placeholder: '--token [REDACTED]' },
    { pattern: /--api-key\s+\S+/g, placeholder: '--api-key [REDACTED]' },
    { pattern: /--secret\s+\S+/g, placeholder: '--secret [REDACTED]' },
    { pattern: /--access-token\s+\S+/g, placeholder: '--access-token [REDACTED]' },
    { pattern: /password=["']?[^"'\s]+["']?/gi, placeholder: 'password=[REDACTED]' },
    { pattern: /token=["']?[^"'\s]+["']?/gi, placeholder: 'token=[REDACTED]' },
  ];

  export interface RedactCommandOptions {
    command: string;
    patterns?: RedactionPattern[];
    preserveLength?: boolean;  // Show "[REDACTED:16]" instead of "[REDACTED]"
  }

  /**
   * Redact credentials from CLI command strings before logging.
   *
   * @param options - Redaction options
   * @returns Sanitized command string safe for logging
   *
   * @example
   * const cmd = "mw database mysql user create --password secret123";
   * const safe = redactCredentialsFromCommand({ command: cmd });
   * console.log(safe); // "mw database mysql user create --password [REDACTED]"
   */
  export function redactCredentialsFromCommand(options: RedactCommandOptions): string {
    const { command, patterns = DEFAULT_CREDENTIAL_PATTERNS, preserveLength = false } = options;

    let sanitized = command;

    for (const { pattern, placeholder } of patterns) {
      if (preserveLength && pattern.test(sanitized)) {
        // Extract original length and show it
        const match = sanitized.match(pattern);
        if (match) {
          const originalLength = match[0].split(/\s+/)[1]?.length ?? 0;
          const lengthPlaceholder = placeholder.replace('[REDACTED]', `[REDACTED:${originalLength}]`);
          sanitized = sanitized.replace(pattern, lengthPlaceholder);
        }
      } else {
        sanitized = sanitized.replace(pattern, placeholder);
      }
    }

    return sanitized;
  }

  /**
   * Redact credentials from tool response metadata.
   *
   * @param meta - Tool response metadata containing command
   * @returns Sanitized metadata
   */
  export function redactMetadata(meta: { command?: string; [key: string]: unknown }): typeof meta {
    if (!meta.command) {
      return meta;
    }

    return {
      ...meta,
      command: redactCredentialsFromCommand({ command: meta.command })
    };
  }
  ```
- [ ] Add unit tests: `tests/unit/utils/credential-redactor.test.ts`
  - Test all default patterns (password, token, api-key, secret)
  - Test custom patterns
  - Test preserveLength option
  - Test edge cases (empty string, no credentials, multiple credentials)
- [ ] Commit: `feat(security): add credential redaction utility`

#### Task S1.3: Create Response Builder Helper
- [ ] Create file: `src/utils/credential-response.ts`
  ```typescript
  import { formatToolResponse } from './format-tool-response.js';
  import { redactMetadata } from './credential-redactor.js';

  export interface BuildUpdatedAttributesOptions {
    password?: string;
    token?: string;
    apiKey?: string;
    [key: string]: unknown;
  }

  /**
   * Build updated attributes object with credential flags (not values).
   *
   * SECURITY: Never include actual credential values in response data.
   * Use boolean flags to indicate whether credentials were changed.
   *
   * @param attributes - Update attributes
   * @returns Safe attributes object with credential flags
   *
   * @example
   * const attrs = buildUpdatedAttributes({
   *   description: "New desc",
   *   password: "secret123",
   *   accessLevel: "full"
   * });
   *
   * console.log(attrs);
   * // {
   * //   description: "New desc",
   * //   accessLevel: "full",
   * //   passwordChanged: true  // ✅ Boolean flag, not actual password
   * // }
   */
  export function buildUpdatedAttributes(attributes: BuildUpdatedAttributesOptions): Record<string, unknown> {
    const safe: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(attributes)) {
      // Convert credential fields to boolean flags
      if (key === 'password') {
        safe.passwordChanged = !!value;
      } else if (key === 'token') {
        safe.tokenChanged = !!value;
      } else if (key === 'apiKey') {
        safe.apiKeyChanged = !!value;
      } else if (key === 'secret') {
        safe.secretChanged = !!value;
      } else {
        // Safe to include non-credential values
        safe[key] = value;
      }
    }

    return safe;
  }

  /**
   * Build a secure tool response with redacted metadata.
   *
   * @param status - Response status
   * @param message - User-facing message
   * @param data - Response data (will sanitize credential fields)
   * @param meta - Metadata (will redact credentials from command)
   * @returns Formatted tool response
   */
  export function buildSecureToolResponse(
    status: 'success' | 'error',
    message: string,
    data?: Record<string, unknown>,
    meta?: { command?: string; durationMs?: number; [key: string]: unknown }
  ) {
    // Redact credentials from metadata
    const sanitizedMeta = meta ? redactMetadata(meta) : undefined;

    // Remove credential values from data
    const sanitizedData = data ? buildUpdatedAttributes(data) : undefined;

    return formatToolResponse(status, message, sanitizedData, sanitizedMeta);
  }
  ```
- [ ] Add unit tests: `tests/unit/utils/credential-response.test.ts`
- [ ] Commit: `feat(security): add secure response builder utility`

---

### Phase 2: Documentation & Standards

#### Task S1.4: Create Security Standard Document
- [ ] Create file: `docs/standards/CREDENTIAL-SECURITY.md`
  ```markdown
  # Credential Security Standard

  **Status**: 🟢 REQUIRED for all credential-handling tools
  **Established**: 2025-10-02
  **Based On**: Agent C3 database tools implementation

  ## Overview

  All MCP tools that handle passwords, tokens, API keys, or other sensitive credentials
  MUST follow these security patterns to prevent credential leakage in logs, responses,
  and error messages.

  ## Required Practices

  ### 1. Generate Credentials Securely

  **DO** ✅:
  ```typescript
  import { generateSecurePassword } from '../../utils/credential-generator.js';

  const password = args.password ?? generateSecurePassword({ length: 24 });
  ```

  **DON'T** ❌:
  ```typescript
  const password = Math.random().toString(36);  // ❌ NOT cryptographically secure
  const password = 'password123';                // ❌ Hardcoded default
  ```

  **Why**: Use `crypto.randomBytes()` for cryptographic randomness.

  ---

  ### 2. Redact Credentials from Metadata

  **DO** ✅:
  ```typescript
  import { buildSecureToolResponse } from '../../utils/credential-response.js';

  return buildSecureToolResponse('success', message, data, {
    command: result.meta.command,  // ✅ Auto-redacted
    durationMs: result.meta.durationMs
  });
  ```

  **DON'T** ❌:
  ```typescript
  return formatToolResponse('success', message, data, {
    command: `mw user create --password ${password}`  // ❌ Password leaked in logs
  });
  ```

  **Why**: Prevents credentials appearing in log files, error traces, and debugging output.

  ---

  ### 3. Never Return Credential Values

  **DO** ✅:
  ```typescript
  import { buildUpdatedAttributes } from '../../utils/credential-response.js';

  const responseData = {
    userId: 'u-123',
    passwordChanged: !!args.password,  // ✅ Boolean flag
    updatedAttributes: buildUpdatedAttributes(args)
  };
  ```

  **DON'T** ❌:
  ```typescript
  const responseData = {
    userId: 'u-123',
    password: args.password  // ❌ Password exposed in response
  };
  ```

  **Why**: Responses may be logged, cached, or displayed in UIs.

  ---

  ### 4. Return Generated Credentials Only Once

  **DO** ✅:
  ```typescript
  const passwordGenerated = !args.password;
  const password = args.password ?? generateSecurePassword().value;

  // ... create user ...

  return buildSecureToolResponse('success', message, {
    userId,
    password: passwordGenerated ? password : undefined,  // ✅ Only if generated
    passwordGenerated
  });
  ```

  **Why**: User-provided passwords should never be echoed back. Only return
  generated passwords so users can save them.

  ---

  ### 5. Validate Tests Check for Leakage

  **DO** ✅:
  ```typescript
  it('sanitizes password in meta command', async () => {
    const response = await handleTool({ password: 'super-secret' });
    const payload = JSON.parse(response.content[0]?.text ?? '{}');

    expect(payload.meta.command).not.toContain('super-secret');
    expect(payload.meta.command).toContain('[REDACTED]');
    expect(payload.data.passwordChanged).toBe(true);
    expect(payload.data.password).toBeUndefined();  // ✅ Not returned
  });
  ```

  **Why**: Automated tests prevent regression.

  ---

  ## Implementation Checklist

  When implementing a tool that handles credentials:

  - [ ] Use `generateSecurePassword()` for password generation
  - [ ] Use `buildSecureToolResponse()` for responses with metadata
  - [ ] Use `buildUpdatedAttributes()` to sanitize update data
  - [ ] Never include credential values in response data
  - [ ] Only return generated credentials (never echo user-provided ones)
  - [ ] Add tests validating credential redaction
  - [ ] Document which fields contain sensitive data

  ## Examples

  ### MySQL User Create (Reference Implementation)
  See: `src/handlers/tools/mittwald-cli/database/mysql/user-create-cli.ts`

  ### MySQL User Update (Reference Implementation)
  See: `src/handlers/tools/mittwald-cli/database/mysql/user-update-cli.ts`

  ### Test Suite (Reference Implementation)
  See: `tests/unit/tools/database-mysql-user.test.ts` (lines 216-241)

  ---

  ## Violation Reporting

  If you discover credential leakage:
  1. **DO NOT commit** the leak to version control
  2. Report immediately to security team
  3. File issue with label: `security` + `credential-leak`
  4. Rotate affected credentials if already exposed

  ---

  **Established by**: Agent C3 (2025-10-02)
  **Reviewed by**: Agent S1 (2025-10-02)
  **Next Review**: 2026-01-01
  ```
- [ ] Commit: `docs(security): establish credential security standard`

#### Task S1.5: Add Migration Guide for Existing Tools
- [ ] Create file: `docs/migrations/credential-security-migration-2025-10.md`
  ```markdown
  # Credential Security Migration Guide

  **Target**: All existing tools that handle passwords, tokens, or API keys
  **Deadline**: 2025-11-01
  **Priority**: 🔥 HIGH - Security issue

  ## Scope

  This migration applies to tools that:
  - Generate passwords or tokens
  - Update passwords or tokens
  - Display credential values in responses
  - Log commands containing credentials

  ## Affected Tools

  Run this command to identify tools:
  ```bash
  git grep -l "password\|token\|api-key\|secret" src/handlers/ | \
    grep -v user-create-cli.ts | \
    grep -v user-update-cli.ts
  ```

  ## Migration Steps

  ### Step 1: Update Password Generation

  **Before**:
  ```typescript
  const password = args.password || Math.random().toString(36).slice(2);
  ```

  **After**:
  ```typescript
  import { generateSecurePassword } from '../../utils/credential-generator.js';

  const passwordGenerated = !args.password;
  const password = args.password ?? generateSecurePassword({ length: 24 }).value;
  ```

  ### Step 2: Update Response Building

  **Before**:
  ```typescript
  return formatToolResponse('success', message, {
    userId,
    password: password  // ❌ Always returned
  }, {
    command: result.meta.command  // ❌ Contains --password secret
  });
  ```

  **After**:
  ```typescript
  import { buildSecureToolResponse } from '../../utils/credential-response.js';

  return buildSecureToolResponse('success', message, {
    userId,
    password: passwordGenerated ? password : undefined,  // ✅ Only if generated
    passwordGenerated
  }, {
    command: result.meta.command,  // ✅ Auto-redacted
    durationMs: result.meta.durationMs
  });
  ```

  ### Step 3: Update Tests

  Add credential leakage validation:
  ```typescript
  it('does not leak password in response metadata', async () => {
    const response = await handleTool({ password: 'test-secret' });
    const payload = JSON.parse(response.content[0]?.text ?? '{}');

    expect(payload.meta.command).not.toContain('test-secret');
    expect(payload.meta.command).toContain('[REDACTED]');
  });
  ```

  ## Verification

  After migration:
  ```bash
  npm run test:security  # New test suite (Task S1.6)
  ```

  ## Rollout Plan

  - **Week 1**: High-priority tools (user management, API tokens)
  - **Week 2**: Medium-priority tools (database credentials)
  - **Week 3**: Low-priority tools (SSH keys, certificates)
  - **Week 4**: Verification and cleanup

  ---

  **Questions?** See `docs/standards/CREDENTIAL-SECURITY.md`
  ```
- [ ] Commit: `docs(security): add credential security migration guide`

---

### Phase 3: Validation & CI Integration

#### Task S1.6: Create Security Test Suite
- [ ] Create file: `tests/security/credential-leakage.test.ts`
  ```typescript
  import { describe, expect, it } from 'vitest';
  import { redactCredentialsFromCommand } from '../../src/utils/credential-redactor.js';
  import { buildUpdatedAttributes } from '../../src/utils/credential-response.js';

  describe('Credential Security Validation', () => {
    describe('Command Redaction', () => {
      it('redacts --password flags', () => {
        const cmd = 'mw user create --password secret123';
        const safe = redactCredentialsFromCommand({ command: cmd });
        expect(safe).toBe('mw user create --password [REDACTED]');
        expect(safe).not.toContain('secret123');
      });

      it('redacts --token flags', () => {
        const cmd = 'mw auth login --token abc123def456';
        const safe = redactCredentialsFromCommand({ command: cmd });
        expect(safe).toContain('[REDACTED]');
        expect(safe).not.toContain('abc123def456');
      });

      it('redacts password= query parameters', () => {
        const cmd = 'curl "https://api.example.com?password=secret"';
        const safe = redactCredentialsFromCommand({ command: cmd });
        expect(safe).toContain('password=[REDACTED]');
        expect(safe).not.toContain('secret');
      });

      it('handles multiple credentials in one command', () => {
        const cmd = 'mw user create --password pw123 --token tk456';
        const safe = redactCredentialsFromCommand({ command: cmd });
        expect(safe).not.toContain('pw123');
        expect(safe).not.toContain('tk456');
        expect(safe).toContain('[REDACTED]');
      });
    });

    describe('Response Sanitization', () => {
      it('converts password to passwordChanged flag', () => {
        const attrs = buildUpdatedAttributes({ password: 'secret', description: 'User' });
        expect(attrs.password).toBeUndefined();
        expect(attrs.passwordChanged).toBe(true);
        expect(attrs.description).toBe('User');
      });

      it('converts token to tokenChanged flag', () => {
        const attrs = buildUpdatedAttributes({ token: 'abc123', name: 'API' });
        expect(attrs.token).toBeUndefined();
        expect(attrs.tokenChanged).toBe(true);
      });

      it('preserves non-credential fields', () => {
        const attrs = buildUpdatedAttributes({
          description: 'Test',
          accessLevel: 'full',
          password: 'secret'
        });
        expect(attrs.description).toBe('Test');
        expect(attrs.accessLevel).toBe('full');
      });
    });
  });
  ```
- [ ] Add to `package.json`:
  ```json
  {
    "scripts": {
      "test:security": "vitest run tests/security"
    }
  }
  ```
- [ ] Commit: `test(security): add credential leakage validation suite`

#### Task S1.7: Add ESLint Rule for Credential Leakage
- [ ] Create file: `eslint-rules/no-credential-leak.js`
  ```javascript
  /**
   * ESLint rule: no-credential-leak
   *
   * Detects potential credential leakage in code:
   * - Direct password/token values in responses
   * - Unredacted command metadata
   * - Hardcoded credentials
   */
  module.exports = {
    meta: {
      type: 'problem',
      docs: {
        description: 'Prevent credential leakage in responses and logs',
        category: 'Security',
        recommended: true
      },
      messages: {
        directCredential: 'Do not include {{ field }} directly in response data. Use {{ field }}Changed: boolean instead.',
        unredactedCommand: 'Command metadata must be redacted. Use buildSecureToolResponse() or redactMetadata().',
        hardcodedCredential: 'Do not hardcode credential values. Use generateSecurePassword().'
      }
    },
    create(context) {
      return {
        // Detect: { password: args.password } in response objects
        ObjectExpression(node) {
          node.properties.forEach(prop => {
            if (prop.key?.name === 'password' ||
                prop.key?.name === 'token' ||
                prop.key?.name === 'apiKey') {
              context.report({
                node: prop,
                messageId: 'directCredential',
                data: { field: prop.key.name }
              });
            }
          });
        },

        // Detect: command: result.meta.command (without redaction)
        Property(node) {
          if (node.key?.name === 'command' &&
              node.value?.type === 'MemberExpression' &&
              !context.getAncestors().some(n => n.callee?.name === 'redactMetadata')) {
            context.report({
              node,
              messageId: 'unredactedCommand'
            });
          }
        }
      };
    }
  };
  ```
- [ ] Add to `.eslintrc.js`:
  ```javascript
  module.exports = {
    rules: {
      'local/no-credential-leak': 'error'
    }
  };
  ```
- [ ] Commit: `feat(lint): add credential leakage detection rule`

#### Task S1.8: Add CI Security Check
- [ ] Create file: `.github/workflows/security-check.yml`
  ```yaml
  name: Security Checks

  on:
    pull_request:
      paths:
        - 'src/handlers/**'
        - 'src/utils/**'
    push:
      branches:
        - main

  jobs:
    credential-leakage:
      name: Check for Credential Leakage
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4

        - uses: actions/setup-node@v4
          with:
            node-version: '20'
            cache: 'npm'

        - name: Install dependencies
          run: npm ci

        - name: Run security test suite
          run: npm run test:security

        - name: Check for hardcoded credentials
          run: |
            if git grep -E "(password|token|api-key)\s*=\s*['\"]" src/; then
              echo "❌ Found hardcoded credentials in source code"
              exit 1
            fi
            echo "✅ No hardcoded credentials detected"

        - name: Lint for credential leaks
          run: npm run lint -- --rule local/no-credential-leak
  ```
- [ ] Commit: `ci(security): add credential leakage checks`

---

### Phase 4: Update Existing Tools

#### Task S1.9: Migrate Agent C3 Tools (Verify Pattern Works)
- [ ] Update `src/handlers/tools/mittwald-cli/database/mysql/user-create-cli.ts`
  - Replace inline password generation with `generateSecurePassword()`
  - Replace inline redaction with `buildSecureToolResponse()`
  - Verify tests still pass
- [ ] Update `src/handlers/tools/mittwald-cli/database/mysql/user-update-cli.ts`
  - Replace inline `buildUpdatedAttributes()` with utility version
  - Replace inline redaction with `buildSecureToolResponse()`
  - Verify tests still pass
- [ ] Run: `npm run test:security`
- [ ] Commit: `refactor(database): migrate to standard credential security utilities`

#### Task S1.10: Identify Other Tools Needing Migration
- [ ] Scan codebase for credential-handling tools:
  ```bash
  git grep -l "password\|token\|api-key" src/handlers/ > /tmp/credential-tools.txt
  ```
- [ ] Create file: `docs/migrations/credential-security-backlog.md`
  ```markdown
  # Credential Security Migration Backlog

  Tools identified as handling credentials that need migration to S1 standard:

  ## High Priority (User Management)
  - [ ] `src/handlers/tools/...` (if any exist)

  ## Medium Priority (API Tokens)
  - [ ] `src/handlers/tools/...` (if any exist)

  ## Low Priority (SSH Keys)
  - [ ] `src/handlers/tools/...` (if any exist)

  ## Already Migrated ✅
  - [x] `database/mysql/user-create-cli.ts`
  - [x] `database/mysql/user-update-cli.ts`

  ---
  **Auto-generated**: 2025-10-02
  ```
- [ ] Commit: `docs(security): identify credential tools needing migration`

---

## Success Criteria

- [ ] ✅ Password generator utility with tests (100% coverage)
- [ ] ✅ Credential redactor utility with tests (100% coverage)
- [ ] ✅ Secure response builder utility with tests (100% coverage)
- [ ] ✅ Security standard document published
- [ ] ✅ Migration guide for existing tools
- [ ] ✅ Security test suite running in CI
- [ ] ✅ ESLint rule detects credential leakage
- [ ] ✅ Agent C3 tools migrated to new utilities (verify pattern)
- [ ] ✅ Backlog of remaining tools identified

---

## Git Workflow

- ✅ Commit after **each utility** (minimum 10 commits)
- ✅ Use format: `feat(security): description` or `docs(security): description`
- ❌ DO NOT bundle multiple utilities in one commit
- ✅ Push every 2-3 commits

---

## Testing Requirements

### Unit Tests
- `tests/unit/utils/credential-generator.test.ts` - 100% coverage
- `tests/unit/utils/credential-redactor.test.ts` - 100% coverage
- `tests/unit/utils/credential-response.test.ts` - 100% coverage

### Security Tests
- `tests/security/credential-leakage.test.ts` - Validation suite

### Integration Tests
- Verify C3 tools work after migration
- No credential values in response data
- No credentials in log output

---

## When to Ask for Help

- ❓ Should we support other encodings (base32, alphanumeric)?
- ❓ Should ESLint rule be error or warning initially?
- ❓ Which other tools have credential handling (beyond database)?
- ❓ Should we add commit hooks to prevent credential commits?
- ❓ ANY time stuck for >30 minutes

---

## Deliverables Summary

### New Files (13 total)
1. `src/utils/credential-generator.ts` - Password generation
2. `src/utils/credential-redactor.ts` - Command redaction
3. `src/utils/credential-response.ts` - Secure response builder
4. `tests/unit/utils/credential-generator.test.ts` - Tests
5. `tests/unit/utils/credential-redactor.test.ts` - Tests
6. `tests/unit/utils/credential-response.test.ts` - Tests
7. `tests/security/credential-leakage.test.ts` - Security validation
8. `docs/standards/CREDENTIAL-SECURITY.md` - Standard doc
9. `docs/migrations/credential-security-migration-2025-10.md` - Migration guide
10. `docs/migrations/credential-security-backlog.md` - Tool inventory
11. `eslint-rules/no-credential-leak.js` - Linting rule
12. `.github/workflows/security-check.yml` - CI checks
13. Updated `package.json` (test:security script)

### Updated Files (2 total)
1. `src/handlers/tools/mittwald-cli/database/mysql/user-create-cli.ts` - Use new utils
2. `src/handlers/tools/mittwald-cli/database/mysql/user-update-cli.ts` - Use new utils

---

## Estimated Effort

**3-4 days**:
- Day 1: Utilities + tests (Tasks S1.1-S1.3)
- Day 2: Documentation (Tasks S1.4-S1.5)
- Day 3: Validation + CI (Tasks S1.6-S1.8)
- Day 4: Migration + backlog (Tasks S1.9-S1.10)

---

## Handoff to Coordinator

When complete, report:

1. ✅ Utility functions created and tested
2. ✅ Security standard documented
3. ✅ CI checks integrated
4. ✅ C3 tools migrated successfully (proof of pattern)
5. ✅ Backlog of remaining tools identified
6. ⚠️ Any tools that can't use the standard pattern (exceptions)

---

**Remember**: This is **security-critical work** that protects users from credential leakage. The pattern you establish will be used by ALL future credential-handling tools. Take time to get it right. Test thoroughly. Document clearly. You've got this! 🔒
