# Data Model: Token Pipeline

**Feature**: 009-fix-token-truncation
**Date**: 2025-12-10

## Overview

This document defines the data structures for Mittwald access tokens as they flow through the OAuth-to-CLI pipeline.

## Core Entities

### Mittwald Access Token

**Purpose**: OAuth token from Mittwald API used for CLI authentication

**Format**: `{uuid}:{secret}:{provider_suffix}`

**Structure**:
```
Part 1: UUID (36 characters, hyphenated)
Part 2: Secret (variable length, base64-like encoding)
Part 3: Provider Suffix (variable length, typically "mittwald_oauth_*")
```

**Examples**:
- Valid: `c8e06919-aa0c-447e-b57f-c1508f64a76f:-AlM9BrYn9VzcyJB39tzWPr96IXP-GxQupdpYuPrioE:mittwald_oauth_xyz`
- Truncated: `c8e06919-aa0c-447e-b57f-c1508f64a76f:-AlM9BrYn9VzcyJB39tzWPr96IXP-GxQupdpYuPrioE:mittwald_o` ❌

**Attributes**:
| Attribute | Type | Description | Validation |
|-----------|------|-------------|------------|
| uuid | string | Session identifier | 36 chars, UUID format |
| secret | string | Authentication secret | Non-empty, variable length |
| suffix | string | Provider identifier | Non-empty, typically starts with "mittwald_" |

**State Transitions**:
```
Generated (OAuth Bridge)
  └─> Stored (Session Storage)
      └─> Retrieved (Session Manager)
          └─> Passed (CLI Wrapper)
              └─> Used (mw CLI)
```

**Validation Rules**:
- MUST contain exactly 2 colons (3 parts)
- All parts MUST be non-empty
- Total length typically 100-500 characters
- No whitespace or special characters except colons

---

### Token Validation Result

**Purpose**: Result of token format validation

**Structure**:
```typescript
interface TokenValidationResult {
  valid: boolean;           // Whether token passes validation
  error?: string;           // Error message if invalid
  expectedFormat: string;   // Expected token format
  actualFormat: string;     // Actual token format (redacted)
}
```

**Examples**:
```typescript
// Valid token
{
  valid: true,
  expectedFormat: "{uuid}:{secret}:{provider_suffix}",
  actualFormat: "{uuid}:{secret}:{suffix:15chars}"
}

// Invalid token (truncated)
{
  valid: false,
  error: "Token has empty parts",
  expectedFormat: "{uuid}:{secret}:{provider_suffix}",
  actualFormat: "{uuid}:{secret}:{EMPTY}"
}

// Malformed token
{
  valid: false,
  error: "Token malformed: expected 3 parts separated by colons, got 2 parts",
  expectedFormat: "{uuid}:{secret}:{provider_suffix}",
  actualFormat: "{2 parts}"
}
```

---

### Pipeline Stage

**Purpose**: Represents a discrete stage in token flow

**Structure**:
```typescript
interface PipelineStage {
  name: 'oauth_bridge' | 'session_storage' | 'session_retrieval' | 'cli_wrapper';
  inputToken: string;       // Token received
  outputToken: string;      // Token sent to next stage
  validation: TokenValidationResult;
  timestamp: Date;
}
```

**Stages**:
1. **oauth_bridge**: Token generation in OAuth Bridge
   - Input: OAuth response from Mittwald
   - Output: Token stored in session
   - Location: `packages/oauth-bridge/src/routes/token.ts`

2. **session_storage**: Token persistence
   - Input: Token from OAuth Bridge
   - Output: Token stored in data store
   - Location: `packages/oauth-bridge/src/state/state-store.ts`

3. **session_retrieval**: Token lookup
   - Input: Session ID
   - Output: Token retrieved from storage
   - Location: `src/server/session-manager.ts`

4. **cli_wrapper**: Token usage
   - Input: Token from session
   - Output: Token passed to CLI
   - Location: `src/utils/cli-wrapper.ts`

---

## Data Flow

### Normal Flow (Expected)

```
[OAuth Bridge]
  Generates: uuid:secret:mittwald_oauth_xyz
  Length: ~150 chars
  ↓
[Session Storage]
  Stores: uuid:secret:mittwald_oauth_xyz
  Length: ~150 chars (unchanged)
  ↓
[Session Retrieval]
  Retrieves: uuid:secret:mittwald_oauth_xyz
  Length: ~150 chars (unchanged)
  ↓
[CLI Wrapper]
  Passes: uuid:secret:mittwald_oauth_xyz
  Length: ~150 chars (unchanged)
  ↓
[mw CLI]
  Uses: Full token for authentication
  Result: Success ✓
```

### Truncated Flow (Current Bug)

```
[OAuth Bridge]
  Generates: uuid:secret:mittwald_oauth_xyz
  Length: ~150 chars
  ↓
[??? TRUNCATION OCCURS ???]
  ↓
[CLI Wrapper]
  Passes: uuid:secret:mittwald_o
  Length: ~100 chars (TRUNCATED!)
  ↓
[mw CLI]
  Uses: Truncated token
  Result: 403 Forbidden ❌
```

---

## Validation Points

### Pre-CLI Invocation (Primary)

**Location**: `src/utils/cli-wrapper.ts`

**Validation**:
- Check token format before adding to CLI arguments
- Log warning if invalid
- Don't block execution (let CLI handle auth failure)

**Rationale**: Lightweight validation at the point where truncation causes visible failure

---

## Token Security

### Logging

**Rules**:
- NEVER log full tokens
- Use redaction: `uuid:***:suffix` or `uuid:[REDACTED]:suffix`
- Show only format information, not actual secrets

**Example**:
```typescript
// Good
console.log(`Token format: ${redactToken(token)}`);
// Output: c8e06919...:[REDACTED]:mittwald_oauth_xyz

// Bad
console.log(`Token: ${token}`);
// Output: exposes secret!
```

### Error Messages

**Rules**:
- Include expected vs actual format
- Redact sensitive parts
- Provide actionable guidance

**Example**:
```
[Token Validation] Token truncated
Expected: {uuid}:{secret}:{provider_suffix}
Actual: {uuid}:{secret}:{suffix:10chars}
Note: Suffix appears truncated (expected 15-30 chars, got 10)
```

---

## Implementation Mapping

### TypeScript Interfaces

```typescript
// src/utils/token-validation.ts
export interface TokenValidationResult {
  valid: boolean;
  error?: string;
  expectedFormat: string;
  actualFormat: string;
}

export function validateMittwaldToken(token: string | undefined): TokenValidationResult;
export function redactToken(token: string): string;
```

### Test Data

```typescript
// tests/fixtures/tokens.ts
export const VALID_TOKEN = 'c8e06919-aa0c-447e-b57f-c1508f64a76f:secretkey123:mittwald_oauth_xyz';
export const TRUNCATED_TOKEN = 'c8e06919-aa0c-447e-b57f-c1508f64a76f:secretkey123:mittwald_o';
export const MALFORMED_TOKEN = 'invalid:token';
export const EMPTY_TOKEN = '';
```

---

## Relationships

```
Mittwald Access Token
  └─ flows through → Pipeline Stage (x4)
      └─ validated by → Token Validation Result
          └─ used in → CLI Wrapper
              └─ passed to → mw CLI
                  └─ authenticates with → Mittwald API
```

---

## Notes

- Token format is external dependency (Mittwald API)
- Validation is defensive - we check format but don't validate semantics
- Truncation bug affects suffix part specifically (ends at `:mittwald_o`)
- Fix will be surgical at identified truncation point
- Validation provides safety net for regression prevention
