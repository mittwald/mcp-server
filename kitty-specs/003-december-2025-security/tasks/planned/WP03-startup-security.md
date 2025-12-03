---
work_package_id: "WP03"
subtasks:
  - "T016"
  - "T017"
  - "T018"
  - "T019"
  - "T020"
  - "T021"
title: "Startup Security Guards"
phase: "Phase 2 - Security Hardening (P1)"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
history:
  - timestamp: "2025-12-03T14:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP03 – Startup Security Guards

## Objectives & Success Criteria

- **Primary Objective**: Prevent production deployment with placeholder secrets or insecure CORS
- **Success Criteria**:
  - Server refuses to start in production with placeholder JWT_SECRET
  - Server refuses to start in production with CORS_ORIGIN=*
  - Development mode logs warning but continues startup
  - Clear error messages guide operators to fix configuration

## Context & Constraints

- **Spec Reference**: `kitty-specs/003-december-2025-security/spec.md` - User Story 3, FR-006, FR-007
- **Research**: `kitty-specs/003-december-2025-security/research.md` - Section 5 (placeholder detection)

**Architectural Constraints**:
- Check NODE_ENV === 'production' to determine enforcement mode
- Use explicit allowlist of known placeholders
- Exit with non-zero code and clear error message on failure
- Validate early in startup before accepting connections

## Subtasks & Detailed Guidance

### Subtask T016 – Create startup-validator.ts

**Purpose**: Centralized module for startup security validation.

**Steps**:
1. Create `src/utils/startup-validator.ts`
2. Define `validateSecrets(): void` function
3. Define `isPlaceholder(value: string): boolean` helper
4. Export main validation function

**Files**:
- CREATE: `src/utils/startup-validator.ts`

**Template**:
```typescript
import { logger } from './logger.js';

export function validateSecrets(): void {
  const isProduction = process.env.NODE_ENV === 'production';

  // Implementation in subsequent subtasks
}

function isPlaceholder(value: string | undefined): boolean {
  // Implementation in T017
}
```

### Subtask T017 – Define placeholder allowlist

**Purpose**: Explicit list of known placeholder values from example configs.

**Steps**:
1. Add PLACEHOLDER_SECRETS constant array:
   ```typescript
   const PLACEHOLDER_SECRETS = [
     'development-jwt-secret-key-for-testing',
     'your-jwt-secret-here',
     'change-me-in-production',
     'placeholder',
     'secret',
     'changeme',
     'your-secret-key',
     'replace-this-secret',
   ];
   ```
2. Add PLACEHOLDER_PATTERNS for regex matching:
   ```typescript
   const PLACEHOLDER_PATTERNS = [
     /^test[-_]?/i,
     /^dev[-_]?/i,
     /^example[-_]?/i,
     /^placeholder/i,
     /^changeme/i,
   ];
   ```
3. Implement `isPlaceholder()`:
   ```typescript
   function isPlaceholder(value: string | undefined): boolean {
     if (!value) return false;
     if (PLACEHOLDER_SECRETS.includes(value.toLowerCase())) return true;
     return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(value));
   }
   ```

**Files**:
- MODIFY: `src/utils/startup-validator.ts`

**Notes**:
- Values sourced from .env.example and fly.toml in audit
- Case-insensitive matching for safety

### Subtask T018 – Implement CORS check

**Purpose**: Prevent wildcard CORS in production.

**Steps**:
1. Add `validateCorsOrigin()` helper:
   ```typescript
   function validateCorsOrigin(): void {
     const corsOrigin = process.env.CORS_ORIGIN;
     if (corsOrigin === '*') {
       throw new StartupValidationError(
         'CORS wildcard not allowed in production - set CORS_ORIGIN to specific origin(s)'
       );
     }
   }
   ```
2. Define `StartupValidationError` class for clear error handling
3. Call from main `validateSecrets()`

**Files**:
- MODIFY: `src/utils/startup-validator.ts`

**Notes**:
- Wildcard CORS allows any origin to access tokens
- Production must specify explicit allowed origins

### Subtask T019 – Add development mode bypass

**Purpose**: Allow development with placeholder secrets while logging warnings.

**Steps**:
1. In `validateSecrets()`, check NODE_ENV first:
   ```typescript
   export function validateSecrets(): void {
     const isProduction = process.env.NODE_ENV === 'production';

     const checks = [
       { name: 'JWT_SECRET', value: process.env.JWT_SECRET },
       { name: 'OAUTH_BRIDGE_JWT_SECRET', value: process.env.OAUTH_BRIDGE_JWT_SECRET },
     ];

     for (const { name, value } of checks) {
       if (isPlaceholder(value)) {
         if (isProduction) {
           throw new StartupValidationError(
             `Placeholder secret detected for ${name} - configure secure value`
           );
         } else {
           logger.warn(`[SECURITY] Placeholder secret detected for ${name} - OK for development only`);
         }
       }
     }

     if (isProduction) {
       validateCorsOrigin();
     } else if (process.env.CORS_ORIGIN === '*') {
       logger.warn('[SECURITY] CORS_ORIGIN is wildcard - OK for development only');
     }
   }
   ```

**Files**:
- MODIFY: `src/utils/startup-validator.ts`

**Notes**:
- Development mode: warn and continue
- Production mode: throw and exit

### Subtask T020 – Integrate validator in index.ts

**Purpose**: Run validation before server starts accepting connections.

**Steps**:
1. Open `src/index.ts`
2. Import validateSecrets: `import { validateSecrets } from './utils/startup-validator.js';`
3. Call early in startup, before creating server:
   ```typescript
   try {
     validateSecrets();
   } catch (error) {
     if (error instanceof StartupValidationError) {
       logger.error(`[STARTUP] ${error.message}`);
       process.exit(1);
     }
     throw error;
   }
   ```
4. Place after logger initialization but before server creation

**Files**:
- MODIFY: `src/index.ts`

**Notes**:
- Exit with code 1 for clear CI/deployment failure
- Log error before exit for visibility

### Subtask T021 – Create placeholder detection tests

**Purpose**: Verify startup validation works correctly.

**Steps**:
1. Create `tests/security/placeholder-detection.test.ts`
2. Test: isPlaceholder returns true for known placeholders
3. Test: isPlaceholder returns false for secure values
4. Test: validateSecrets throws in production with placeholder
5. Test: validateSecrets warns in development with placeholder
6. Test: validateSecrets throws for CORS_ORIGIN=* in production

**Files**:
- CREATE: `tests/security/placeholder-detection.test.ts`

**Test Template**:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('startup-validator', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('in production mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('throws for placeholder JWT_SECRET', () => {
      process.env.JWT_SECRET = 'development-jwt-secret-key-for-testing';
      expect(() => validateSecrets()).toThrow(/Placeholder secret detected/);
    });

    it('throws for CORS_ORIGIN wildcard', () => {
      process.env.JWT_SECRET = 'secure-random-value-32chars-here!';
      process.env.CORS_ORIGIN = '*';
      expect(() => validateSecrets()).toThrow(/CORS wildcard not allowed/);
    });
  });

  describe('in development mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('does not throw for placeholder secrets', () => {
      process.env.JWT_SECRET = 'development-jwt-secret-key-for-testing';
      expect(() => validateSecrets()).not.toThrow();
    });
  });
});
```

**Notes**:
- Mock process.env for testing different scenarios
- Restore original env after each test

## Test Strategy

**Required Tests**:
- Unit tests for placeholder detection
- Integration test for startup failure

**Test Commands**:
```bash
npm run test:security -- placeholder-detection
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| False positives blocking legitimate secrets | Use explicit allowlist; patterns are secondary |
| Breaking existing deployments | Document migration path; check existing configs |
| NODE_ENV not set | Default to 'development' behavior (warn only) |

## Definition of Done Checklist

- [ ] startup-validator.ts created with validateSecrets()
- [ ] Placeholder allowlist covers known example values
- [ ] CORS wildcard check implemented
- [ ] Development mode logs warnings
- [ ] Production mode throws and exits
- [ ] index.ts calls validateSecrets() early in startup
- [ ] Tests pass

## Review Guidance

- Verify placeholder list matches .env.example and fly.toml values
- Check error messages are actionable
- Verify exit code is non-zero on failure
- Test actual startup with placeholder values

## Activity Log

- 2025-12-03T14:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
