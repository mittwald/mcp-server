# WP06: CLI Removal & Cleanup Guide

## Overview

Remove all CLI spawning infrastructure after validation passes (WP05 complete).

## Files to Remove

### 1. CLI Adapter/Wrapper
```bash
rm src/utils/cli-wrapper.ts
rm src/tools/cli-adapter.ts
rm src/utils/session-aware-cli.ts  # If exists
```

### 2. Validation Infrastructure (After Migration Complete)
```bash
rm -rf tests/validation/  # Keep if useful for future validations
# Or just remove parallel validation code from tool handlers
```

## Code Changes

### 1. Remove Parallel Validation from Tool Handlers

**Before (during migration):**
```typescript
const validation = await validateToolParity({
  toolName: 'mittwald_app_list',
  cliCommand: 'mw',
  cliArgs: [...],
  libraryFn: () => listApps({...}),
});

return formatToolResponse('success', 'Apps retrieved', validation.libraryOutput.data);
```

**After (final):**
```typescript
try {
  const result = await listApps({
    projectId,
    apiToken: session.mittwaldAccessToken,
  });

  return formatToolResponse('success', 'Apps retrieved', result.data);
} catch (error) {
  if (error instanceof LibraryError) {
    return formatToolResponse('error', error.message, null, error.code);
  }
  throw error;
}
```

### 2. Remove CLI Imports

Search and remove:
```bash
# Find all imports of CLI spawning code
grep -r "from 'child_process'" src/
grep -r "from.*cli-wrapper" src/
grep -r "from.*cli-adapter" src/

# Remove these imports
```

### 3. Remove Environment Variables (If No Longer Needed)

Check `.env` and `.env.example`:
- Remove `CLI_PATH` if exists
- Remove `MW_PATH` if exists
- Keep `MITTWALD_API_TOKEN` (still needed for library)

## Verification Steps

### 1. Build Check
```bash
npm run build
# Should succeed with zero errors
# Should show no references to CLI spawning
```

### 2. Grep for Remaining References
```bash
# Check for any CLI spawning still present
grep -r "spawn\|exec\|spawnSync" src/ | grep -v node_modules

# Check for CLI command references
grep -r "'mw'" src/ | grep -v node_modules

# Should return no results in tool handlers
```

### 3. Test Suite
```bash
npm test
# All tests should pass
# No tests should spawn CLI processes
```

### 4. Runtime Verification

Monitor production logs after deployment:
```bash
# Check for CLI process spawning (should be zero)
flyctl logs -a mittwald-mcp-fly2 | grep -i "spawn\|child_process\|mw "
```

## Performance Verification

### Before Cleanup
- Response times: Mixed (some 200-400ms with CLI, some <50ms with library)
- Process count: Varies with concurrent requests

### After Cleanup
- Response times: All <50ms
- Process count: Stable (no child processes spawned)

### Measurement
```bash
# In production, run load test
npm run test:performance

# Expected results:
# - Median response time: <50ms (was 200-400ms)
# - p95 response time: <100ms (was 500ms+)
# - Zero "Cannot spawn process" errors
```

## Package Cleanup

### Dependencies to Remove
```json
// package.json - Remove if no longer needed:
{
  "devDependencies": {
    // Remove these if only used for CLI spawning:
    "cross-spawn": "...",  // If only for mw CLI
    "execa": "...",        // If only for mw CLI
  }
}
```

Run after removing:
```bash
npm install
npm audit
```

## Documentation Updates

### 1. Update README.md
Remove references to:
- CLI binary requirements
- PATH configuration for `mw` command
- CLI installation instructions

Add:
- Library-based architecture
- No external CLI dependencies
- Direct API client usage

### 2. Update CONTRIBUTING.md
Update development setup:
- No need to install `@mittwald/cli` globally
- No need to configure CLI paths
- Library package handles all Mittwald operations

### 3. Update Deployment Docs
- Remove CLI binary from Docker images
- Remove CLI installation from Fly.io setup
- Simplified deployment (fewer dependencies)

## Success Criteria

- [ ] All CLI spawning files removed
- [ ] Zero `child_process` imports in tool handlers
- [ ] Build succeeds
- [ ] All tests pass
- [ ] No CLI processes in production logs
- [ ] Performance <50ms maintained
- [ ] Documentation updated

## Rollback Plan

If issues arise:

1. Revert to previous git commit
2. Re-enable CLI spawning for affected tools
3. Investigate discrepancies
4. Fix library implementation
5. Re-run validation
6. Retry cleanup

## Next Steps

After WP06 completion → WP07: Production Deployment & Validation
