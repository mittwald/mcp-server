# Token Validation Contract

**Feature**: 009-fix-token-truncation
**Date**: 2025-12-10
**Version**: 1.0

## Purpose

Define the contract for Mittwald OAuth token validation to prevent truncation bugs and ensure token integrity through the pipeline.

## Token Format Specification

### Structure

```
{uuid}:{secret}:{provider_suffix}
```

### Components

| Component | Description | Format | Length |
|-----------|-------------|--------|--------|
| UUID | Session identifier | UUID v4 with hyphens | 36 chars |
| Secret | Authentication secret | Base64-like encoding | 40-60 chars |
| Suffix | Provider identifier | Alphanumeric with underscores | 15-30 chars |

### Examples

**Valid Tokens**:
```
c8e06919-aa0c-447e-b57f-c1508f64a76f:-AlM9BrYn9VzcyJB39tzWPr96IXP-GxQupdpYuPrioE:mittwald_oauth_xyz
d1234567-89ab-cdef-0123-456789abcdef:aB3dEf5gH7iJ9kL1mN3oPq5rS7tU9vWx:mittwald_oauth_abc123
```

**Invalid Tokens**:
```
# Truncated suffix
c8e06919-aa0c-447e-b57f-c1508f64a76f:-AlM9BrYn9VzcyJB39tzWPr96IXP-GxQupdpYuPrioE:mittwald_o

# Missing parts
c8e06919-aa0c-447e-b57f-c1508f64a76f:-AlM9BrYn9VzcyJB39tzWPr96IXP-GxQupdpYuPrioE

# Empty parts
c8e06919-aa0c-447e-b57f-c1508f64a76f::mittwald_oauth_xyz

# Malformed
not-a-valid-token
```

---

## Validation Interface

### Function Signature

```typescript
interface TokenValidationResult {
  valid: boolean;
  error?: string;
  expectedFormat: string;
  actualFormat: string;
}

function validateMittwaldToken(token: string | undefined): TokenValidationResult
```

### Validation Rules

#### Rule 1: Non-Empty
- Token must be defined and non-empty string
- **Error**: `"Token empty or missing"`

#### Rule 2: Three Parts
- Token must contain exactly 2 colons (3 parts)
- **Error**: `"Token malformed: expected 3 parts separated by colons, got N parts"`

#### Rule 3: No Empty Parts
- All 3 parts must be non-empty after splitting
- **Error**: `"Token has empty parts"`

#### Rule 4: Reasonable Length
- Total length should be 100-500 characters (advisory, not enforced)
- Suffix should be 15+ characters (advisory, indicates possible truncation)

---

## Validation Behavior

### Lightweight Approach

**Goal**: Catch obvious malformation without semantic validation

**What We DO Validate**:
- ✅ Token structure (3 parts separated by colons)
- ✅ Non-empty parts
- ✅ Basic format expectations

**What We DON'T Validate**:
- ❌ UUID validity (don't parse UUID format)
- ❌ Secret strength or encoding
- ❌ Suffix content (don't require "mittwald_oauth_*" pattern)
- ❌ Token expiration or signature
- ❌ Permissions or scopes

**Rationale**: Semantic validation is Mittwald API's responsibility. We only check structural integrity to catch truncation.

---

## Usage Points

### Primary Validation Point

**Location**: `src/utils/cli-wrapper.ts`
**When**: Before adding token to CLI arguments
**Behavior**: Log warning if invalid, but continue (let CLI handle auth)

```typescript
if (effectiveToken) {
  const validation = validateMittwaldToken(effectiveToken);

  if (!validation.valid) {
    console.warn(`[Token Validation] ${validation.error}`);
    console.warn(`[Token Validation] Expected: ${validation.expectedFormat}`);
    console.warn(`[Token Validation] Actual: ${validation.actualFormat}`);
  }

  effectiveArgs.push('--token', effectiveToken);
}
```

**Why Non-Blocking**:
- Validation might have false positives
- Let Mittwald API be authoritative on token validity
- Our goal is truncation detection, not authentication

---

## Redaction Contract

### Function Signature

```typescript
function redactToken(token: string): string
```

### Redaction Rules

**Show**:
- First 8 characters of UUID (enough to identify in logs)
- Full suffix (helps identify truncation)

**Hide**:
- Full UUID (beyond first 8 chars)
- Entire secret part

**Format**: `{uuid-prefix}...:[REDACTED]:{suffix}`

### Examples

```typescript
Input:  "c8e06919-aa0c-447e-b57f-c1508f64a76f:-AlM9BrYn9VzcyJB39tzWPr96IXP-GxQupdpYuPrioE:mittwald_oauth_xyz"
Output: "c8e06919...:[REDACTED]:mittwald_oauth_xyz"

Input:  "c8e06919-aa0c-447e-b57f-c1508f64a76f:-AlM9BrYn9VzcyJB39tzWPr96IXP-GxQupdpYuPrioE:mittwald_o"
Output: "c8e06919...:[REDACTED]:mittwald_o"  ← Truncation visible!
```

---

## Error Messages

### Format

```
[Token Validation] {error_description}
Expected: {expected_format}
Actual: {actual_format_redacted}
{optional_hint}
```

### Examples

**Truncated Token**:
```
[Token Validation] Token has 3 parts but suffix appears short
Expected: {uuid}:{secret}:{provider_suffix}
Actual: {uuid}:{secret}:{suffix:10chars}
Note: Suffix length 10 chars is below typical 15-30 chars
```

**Malformed Token**:
```
[Token Validation] Token malformed: expected 3 parts separated by colons, got 2 parts
Expected: {uuid}:{secret}:{provider_suffix}
Actual: {2 parts}
```

**Empty Token**:
```
[Token Validation] Token empty or missing
Expected: {uuid}:{secret}:{provider_suffix}
Actual: empty
```

---

## Testing Contract

### Unit Test Requirements

**File**: `tests/unit/token-validation.test.ts`

**Test Cases** (minimum):
1. Valid token → validation passes
2. Truncated token → validation passes (structural integrity OK, just short)
3. Malformed token (2 parts) → validation fails
4. Empty token → validation fails
5. Token redaction → secret is hidden

### Integration Test Requirements

**File**: `tests/integration/token-flow.test.ts`

**Test Cases** (minimum):
1. Token stored in session → retrieved intact
2. Retrieved token → passed to CLI wrapper intact

---

## Dependencies

### Internal Dependencies
- Session Manager (reads/writes tokens)
- CLI Wrapper (uses tokens)
- OAuth Middleware (retrieves tokens)

### External Dependencies
- Mittwald OAuth API (generates tokens)
- Mittwald CLI (`mw` command - consumes tokens)

---

## Backward Compatibility

**Constraint**: Fix must not break existing sessions or token flows

**Guarantees**:
- Validation is additive (doesn't change token handling)
- Warnings only (non-blocking)
- No changes to token format or generation
- No changes to session storage schema

---

## Future Considerations

*Out of scope for this feature, but documented for future reference*

- Token refresh/rotation (handled separately)
- Token expiration validation (handled by Mittwald API)
- OAuth scope validation (handled by OAuth Bridge)
- Performance monitoring of validation overhead (unlikely to be measurable)
