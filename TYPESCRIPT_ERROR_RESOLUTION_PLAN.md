# TypeScript Error Resolution Plan

## Current Status
- **Total Errors**: 147 (down from 350)
- **Progress**: 58% reduction achieved

## Error Analysis by Type

### 1. TS2339: Property does not exist (51 errors - 35%)
**Pattern**: API client methods are being accessed incorrectly
**Root Cause**: TypeScript is resolving the API client structure differently than expected

**Specific Issues**:
- `getOwnAccount` doesn't exist on `user` (should be on `user.api`)
- `listIngresses` doesn't exist on `project` (should be on `project.api`)
- `listSshUsers` doesn't exist on `project`
- `deleteAppinstallation` doesn't exist (wrong method name)
- `.app` property doesn't exist on app installation objects

### 2. TS2307: Cannot find module (23 errors - 16%)
**Pattern**: Import path issues and missing modules
**Root Cause**: Incorrect relative paths and references to non-existent utilities

**Specific Issues**:
- backup/schedule handlers have wrong import depth (4 vs 5)
- References to non-existent `@/utils/execute-cli-command.js`
- References to non-existent `executeCommand.js`
- Wrong import paths for domain handlers

### 3. TS2741: Property is missing (14 errors - 10%)
**Pattern**: Missing required properties in return objects
**Root Cause**: formatToolResponse calls still returning raw objects in some places

**Specific Issues**:
- mail/address handlers still have some raw object returns
- backup.ts missing `expirationTime` property
- Missing `content` property in CallToolResult

### 4. TS2345: Argument type mismatch (13 errors - 9%)
**Pattern**: Wrong argument types being passed to functions
**Root Cause**: API parameter structure mismatches

### 5. TS7006: Parameter implicitly has 'any' type (11 errors - 7%)
**Pattern**: Missing type annotations
**Root Cause**: Callbacks and handlers without proper typing

### 6. Other errors (35 errors - 23%)
**Pattern**: Various type mismatches and API usage issues

## Resolution Plan

### Phase 1: Fix Import Paths (23 errors)
1. **backup/schedule handlers** - Fix import depth (5 levels not 4)
2. **database/mysql handlers** - Remove CLI command imports, use API client
3. **domain handlers** - Fix virtualhost import paths
4. **login handlers** - Fix tool-response import

### Phase 2: Fix API Access Patterns (51 errors)
1. **app/install handlers** - Debug why TypeScript isn't seeing the .api property
2. **app handlers** - Fix app installation property access (.appId not .app)
3. **project API methods** - Verify correct method names for SSH users
4. **app/uninstall** - Fix deleteAppinstallation method name

### Phase 3: Fix Return Statements (14 errors)
1. **mail/address handlers** - Complete formatToolResponse migration
2. **backup handler** - Add required expirationTime property

### Phase 4: Fix Type Annotations (11 errors)
1. Add explicit types to callback parameters
2. Fix any implicit any types

### Phase 5: Fix Remaining Issues (48 errors)
1. Parameter structure mismatches
2. Missing type imports
3. Other API usage corrections

## Implementation Strategy

1. **Start with import path fixes** - These are mechanical and straightforward
2. **Fix API access patterns systematically** - May require investigating the API client type definitions
3. **Complete formatToolResponse migration** - Ensure all handlers use consistent return format
4. **Add missing type annotations** - Improve type safety
5. **Address remaining edge cases** - Various specific fixes

## Expected Outcome
- Reduce errors from 147 to 0
- Establish consistent patterns for:
  - API client usage
  - Import paths based on directory depth
  - Return statement formatting
  - Type annotations

## Key Patterns to Establish
1. **Import paths**: Count directory depth correctly
2. **API access**: Always use `mittwaldClient.api.domain.method`
3. **Returns**: Always use `formatToolResponse(status, message, data?)`
4. **Types**: Explicit types for all handler parameters
5. **No CLI dependencies**: Only use API client methods