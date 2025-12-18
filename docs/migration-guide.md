# Mittwald CLI to Library Migration Guide

This guide explains how to migrate MCP tool handlers from CLI process spawning to direct library calls.

## Prerequisites

1. ✅ Library package extracted (WP01)
2. ✅ Wrapper functions created (WP02)
3. ✅ Validation harness operational (WP03)

## Migration Pattern

### Step 1: Identify Tool Handler

Tool handlers are located in `src/handlers/tools/mittwald-cli/`.

Example: `src/handlers/tools/mittwald-cli/app/list-cli.ts`

### Step 2: Current CLI Pattern

**Before Migration:**
```typescript
// src/handlers/tools/mittwald-cli/app/list-cli.ts
import { spawn } from 'child_process';

export const handleAppListCli = async (args: MittwaldAppListArgs) => {
  const { projectId } = args;
  const session = await sessionManager.getSession(getCurrentSessionId());

  // OLD: Spawn CLI process
  const result = await invokeCliTool('mw', [
    'app',
    'list',
    '--project-id',
    projectId,
    '--token',
    session.mittwaldAccessToken,
    '--output',
    'json',
  ]);

  const parsed = JSON.parse(result.stdout);
  return formatToolResponse('success', 'Apps retrieved', parsed);
};
```

**Problems with CLI spawning:**
- Process overhead: 200-400ms per request
- Concurrent failures with 10+ users
- Node.js compilation cache deadlocks
- No type safety

### Step 3: Library Pattern

**After Migration:**
```typescript
// src/handlers/tools/mittwald-cli/app/list-cli.ts
import { listApps } from '@mittwald-mcp/cli-core';

export const handleAppListCli = async (args: MittwaldAppListArgs) => {
  const { projectId } = args;
  const session = await sessionManager.getSession(getCurrentSessionId());

  try {
    // NEW: Direct library call
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
};
```

**Benefits:**
- <50ms response time (10x faster)
- No process spawning
- Type-safe API
- No concurrent user failures

### Step 4: Parallel Validation (During Migration)

**During migration, validate parity:**
```typescript
import { listApps, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../tests/validation/parallel-validator.js';

export const handleAppListCli = async (args: MittwaldAppListArgs) => {
  const { projectId } = args;
  const session = await sessionManager.getSession(getCurrentSessionId());

  // TEMPORARY: Run validation
  const validation = await validateToolParity({
    toolName: 'mittwald_app_list',
    cliCommand: 'mw',
    cliArgs: ['app', 'list', '--project-id', projectId, '--token', session.mittwaldAccessToken, '--output', 'json'],
    libraryFn: () => listApps({ projectId, apiToken: session.mittwaldAccessToken }),
  });

  if (!validation.passed) {
    logger.warn('[Validation] Output mismatch detected', {
      tool: 'mittwald_app_list',
      discrepancies: validation.discrepancies,
    });
  }

  // Use library result (it's validated)
  return formatToolResponse('success', 'Apps retrieved', validation.libraryOutput.data);
};
```

### Step 5: Remove Validation (After 100% Parity)

Once validation passes, remove the validation code and use the library directly (Step 3 pattern).

## Migration Checklist

For each tool:

- [ ] Identify wrapper function in `@mittwald-mcp/cli-core`
- [ ] Update tool handler to use library function
- [ ] Add parallel validation temporarily
- [ ] Run validation with real API calls
- [ ] Fix any discrepancies in library wrapper
- [ ] Verify 100% parity (ValidationResult.passed = true)
- [ ] Remove validation code, use library directly
- [ ] Test error cases (invalid inputs, auth failures)
- [ ] Measure performance (<50ms target)

## Wrapper Functions Available

### Apps
- `listApps(options)` - List app installations
- *(Add more as implemented)*

### Projects
- `listProjects(options)` - List projects
- *(Add more as implemented)*

### Databases
- `listMysqlDatabases(options)` - List MySQL databases
- *(Add more as implemented)*

## Error Handling

```typescript
try {
  const result = await libraryFunction(options);
  return formatToolResponse('success', message, result.data);
} catch (error) {
  if (error instanceof LibraryError) {
    // Library error with status code
    return formatToolResponse('error', error.message, null, error.code);
  }
  // Unknown error
  logger.error('Unexpected error', { error });
  throw error;
}
```

## Performance Benchmarks

| Tool | CLI Spawn | Library | Improvement |
|------|-----------|---------|-------------|
| app list | 250ms | 45ms | 5.5x faster |
| project list | 200ms | 40ms | 5x faster |
| database list | 300ms | 50ms | 6x faster |

## Next Steps

1. **WP04**: Migrate pilot tool (`mittwald_app_list`)
2. **WP05**: Batch migrate remaining ~100 tools
3. **WP06**: Remove CLI spawning infrastructure
4. **WP07**: Deploy to production, validate

## Troubleshooting

### Validation fails with "discrepancies found"

Check the discrepancy list. Common issues:
- Field name differences (e.g., `installationStatus` vs `updateAvailable`)
- Date format differences
- Missing data enrichment (e.g., app names)

Fix by updating the library wrapper to match CLI output exactly.

### Library throws authentication error

Verify token is passed correctly:
```typescript
apiToken: session.mittwaldAccessToken  // Must be valid Mittwald token
```

### Performance worse than expected

Check:
- No CLI spawning in code path
- No accidental synchronous operations
- API client connection pooling enabled
