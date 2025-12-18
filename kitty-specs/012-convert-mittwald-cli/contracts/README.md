# API Contracts

This directory contains TypeScript interface definitions for the library conversion.

## Files

### library-functions.ts

Standard interfaces for all library functions exported from `@mittwald-mcp/cli-core`.

**Key Interfaces:**
- `LibraryFunctionBase` - Base interface all library functions extend
- `LibraryResult<T>` - Standard result wrapper
- `LibraryError` - Standard error class

**Implementation Location:** `packages/mittwald-cli-core/src/contracts/functions.ts`

### validation.ts

Interfaces for parallel validation (CLI spawn vs library comparison).

**Key Interfaces:**
- `ValidationResult` - Result of single tool validation
- `ValidationReport` - Full validation suite report
- `validateToolParity()` - Function signature for validation

**Implementation Location:** `tests/validation/parallel-validator.ts`

## Usage

These contracts define the expected signatures for implementation. Refer to these when:
- Creating new library wrapper functions (use `LibraryFunctionBase`)
- Implementing validation harness (use `ValidationResult`)
- Generating validation reports (use `ValidationReport`)

## Related Documentation

- **Data Model:** `../data-model.md` - Entity definitions
- **Quickstart:** `../quickstart.md` - Implementation examples
- **Plan:** `../plan.md` - Full architectural context
