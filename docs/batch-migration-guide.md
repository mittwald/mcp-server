# WP05: Batch Tool Migration Guide

## Overview

Migrate all ~100 MCP tools from CLI spawning to library calls.

## Tool Inventory

Tools are located in `src/handlers/tools/mittwald-cli/`:

### App Tools (~25 tools)
- `app/list-cli.ts` - List app installations ✅ (Pilot in WP04)
- `app/get-cli.ts` - Get app details
- `app/create-cli.ts` - Create app
- `app/delete-cli.ts` - Delete app
- `app/update-cli.ts` - Update app
- ... (complete inventory in main repo)

### Project/Org Tools (~20 tools)
- `project/list-cli.ts` - List projects
- `project/get-cli.ts` - Get project details
- `project/create-cli.ts` - Create project
- `org/list-cli.ts` - List organizations
- ... (complete inventory in main repo)

### Database Tools (~25 tools)
- `database/mysql/list-cli.ts` - List MySQL databases
- `database/mysql/create-cli.ts` - Create MySQL database
- `database/mysql/delete-cli.ts` - Delete MySQL database
- `database/redis/list-cli.ts` - List Redis databases
- ... (complete inventory in main repo)

### Infrastructure Tools (~30 tools)
- `container/list-cli.ts` - List containers
- `backup/list-cli.ts` - List backups
- `domain/list-cli.ts` - List domains
- `ssh/exec-cli.ts` - Execute SSH commands
- ... (complete inventory in main repo)

## Migration Strategy

### Phase 1: Create Wrapper Functions

For each CLI command, create a library wrapper in `packages/mittwald-cli-core/src/index.ts`:

```typescript
// Example: app/get-cli.ts needs getApp() wrapper
export async function getApp(options: GetAppOptions): Promise<LibraryResult<AppDetails>> {
  const startTime = performance.now();

  try {
    const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
    const response = await client.app.getAppinstallation({
      appInstallationId: options.appId,
    });

    assertStatus(response, 200);

    const durationMs = performance.now() - startTime;
    return {
      data: response.data,
      status: response.status,
      durationMs,
    };
  } catch (error) {
    const durationMs = performance.now() - startTime;
    throw new LibraryError(
      error instanceof Error ? error.message : 'Unknown error',
      (error as any).status || 500,
      { originalError: error, durationMs }
    );
  }
}
```

### Phase 2: Update Tool Handlers

Follow the pattern from WP04 migration guide:

1. Import library wrapper
2. Replace CLI spawn with library call
3. Add parallel validation
4. Fix discrepancies
5. Remove validation after parity achieved

### Phase 3: Validate by Category

Run validation suite for each tool category:

```bash
npm run test:validation -- --category=app
npm run test:validation -- --category=project
npm run test:validation -- --category=database
npm run test:validation -- --category=infrastructure
```

## Automation Script

Create `scripts/migrate-tools.ts` to automate repetitive parts:

```typescript
#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

// Find all CLI tool handlers
const toolHandlers = glob.sync('src/handlers/tools/mittwald-cli/**/*-cli.ts');

for (const handler of toolHandlers) {
  console.log(`Processing ${handler}...`);

  const content = readFileSync(handler, 'utf-8');

  // Check if already migrated
  if (content.includes('@mittwald-mcp/cli-core')) {
    console.log(`  ✓ Already migrated`);
    continue;
  }

  // TODO: Auto-generate wrapper function call based on tool name
  // TODO: Add parallel validation
  // TODO: Update handler code

  console.log(`  → Migration template created`);
}
```

## Progress Tracking

Create `docs/migration-progress.md` to track completion:

```markdown
# Migration Progress

## App Tools (25 total)
- [x] app/list-cli.ts (WP04 pilot)
- [ ] app/get-cli.ts
- [ ] app/create-cli.ts
... (complete list)

## Project Tools (20 total)
- [ ] project/list-cli.ts
... (complete list)
```

## Estimated Effort

- **Wrapper Functions**: ~2-3 per hour = 33-50 hours
- **Tool Handler Updates**: ~5-10 per hour = 10-20 hours
- **Validation & Fixes**: ~10-20 hours
- **Total**: ~53-90 hours

### Optimization

Parallelize by category:
- Developer 1: App tools
- Developer 2: Project/Org tools
- Developer 3: Database tools
- Developer 4: Infrastructure tools

Estimated with 4 developers: **~13-23 hours**

## Success Criteria

- [ ] All ~100 tools migrated
- [ ] Validation passes for all tools (100% parity)
- [ ] No CLI spawning in any tool handler
- [ ] Performance <50ms median for all tools
- [ ] All tests pass
- [ ] Zero regressions in production

## Next Steps

After WP05 completion → WP06: CLI Removal & Cleanup
