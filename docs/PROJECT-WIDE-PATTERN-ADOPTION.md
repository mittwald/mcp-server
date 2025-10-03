# Project-Wide Pattern Adoption Plan

**Created**: 2025-10-02
**Author**: Claude Code (Sonnet 4.5)
**Status**: DRAFT - Pending Approval

---

## Executive Summary

This document outlines a systematic plan to adopt two critical patterns across all relevant MCP tools:

1. **C6's Dependency Detection Pattern** - Pre-flight safety checks before destructive operations
2. **C2's Array Parameter Iteration Pattern** - Proper forEach handling for multi-value CLI flags

**Scope**: 20 destructive tools + 12 array parameter tools = **32 tools to update**
**Estimated Effort**: 8-12 days (2 developers working in parallel)
**Priority**: High - Improves safety and consistency across all tools

---

## Part 1: C6's Dependency Detection Pattern

### 1.1 Pattern Overview

**Source**: `src/handlers/tools/mittwald-cli/volume/delete-cli.ts:62-124`

**Core Concept**: Before deleting a resource, query its current state to identify dependencies/relationships, then block deletion (or require force override) if dependencies exist.

**Pattern Structure**:
```typescript
// 1. Define safety check interface
interface ResourceSafetyCheck {
  status: 'ok' | 'has-dependencies' | 'not-found' | 'unknown';
  resourceName?: string;
  dependencies?: Array<{ id?: string; name?: string; type?: string }>;
}

// 2. Implement pre-flight check function
async function checkResourceSafety(
  args: DeleteArgs,
  resourceId: string
): Promise<ResourceSafetyCheck> {
  if (!args.contextId) {
    logger.warn('[Resource Delete] Skipping dependency check - missing context', { resourceId });
    return { status: 'unknown', resourceName: resourceId };
  }

  try {
    // Query resource state
    const result = await invokeCliTool({
      toolName: 'list_resource',
      argv: ['resource', 'list', '--id', resourceId, '--output', 'json'],
    });

    const resources = safeParseResources(result.result);
    if (!resources) return { status: 'unknown', resourceName: resourceId };

    const match = resources.find((r) => r.id === resourceId || r.name === resourceId);
    if (!match) return { status: 'not-found', resourceName: resourceId };

    // Check for dependencies
    const dependencies = extractDependencies(match);
    if (dependencies.length > 0) {
      return {
        status: 'has-dependencies',
        resourceName: match.name ?? resourceId,
        dependencies,
      };
    }

    return { status: 'ok', resourceName: match.name ?? resourceId, dependencies: [] };
  } catch (error) {
    logger.warn('[Resource Delete] Unable to run dependency check', { resourceId, error });
    return { status: 'unknown', resourceName: resourceId };
  }
}

// 3. Use in delete handler (AFTER C4 confirm validation, BEFORE CLI execution)
export const handleResourceDeleteCli = async (args, context) => {
  // C4 Pattern: Confirm validation
  if (args.confirm !== true) {
    return formatToolResponse('error', 'Deletion requires confirm=true. This operation is destructive and cannot be undone.');
  }

  // C4 Pattern: Audit logging
  logger.warn('[Resource Delete] Destructive operation attempted', {
    resourceId: args.id,
    sessionId: context?.sessionId,
    userId: context?.userId,
  });

  // C6 Pattern: Dependency check
  const safety = await checkResourceSafety(args, args.id);

  if (safety.status === 'not-found') {
    return formatToolResponse('error', `Resource '${args.id}' not found.`);
  }

  if (safety.status === 'has-dependencies' && !args.force) {
    const deps = safety.dependencies?.map((d) => d.name ?? d.id).filter(Boolean) ?? [];
    const depList = deps.length > 0 ? deps.join(', ') : 'unknown resources';
    return formatToolResponse(
      'error',
      `Resource '${safety.resourceName ?? args.id}' has ${deps.length} active dependencies: ${depList}. ` +
        'Set force: true only if you are certain it is safe to proceed.'
    );
  }

  // Execute deletion
  const argv = ['resource', 'delete', args.id, '--force', '--quiet'];
  // ...
};
```

### 1.2 Applicable Destructive Tools (20 tools)

**Priority 1: High-Value Dependencies** (6 tools - 3 days)
1. ✅ **`volume/delete-cli.ts`** - DONE (reference implementation)
2. ❌ **`container/delete-cli.ts`** - Check linked volumes, networks
3. ❌ **`project/delete-cli.ts`** - Check apps, databases, containers
4. ❌ **`database/mysql/delete-cli.ts`** - Check linked apps
5. ❌ **`stack/delete-cli.ts`** - Check volumes, services
6. ❌ **`registry/delete-cli.ts`** - Check linked containers

**Priority 2: User/Access Dependencies** (5 tools - 2 days)
7. ❌ **`database/mysql/user-delete-cli.ts`** - Check active connections
8. ❌ **`ssh/user-delete-cli.ts`** - Check active sessions
9. ❌ **`sftp/user-delete-cli.ts`** - Check active sessions
10. ❌ **`user/ssh-key/delete-cli.ts`** - Check if key is primary
11. ❌ **`user/api-token/revoke-cli.ts`** - Check if token is in use

**Priority 3: Lower-Risk Resources** (9 tools - 2 days)
12. ❌ **`cronjob/delete-cli.ts`** - Check if job is running
13. ❌ **`backup/delete-cli.ts`** - Check if backup is referenced
14. ❌ **`backup/schedule-delete-cli.ts`** - Check if schedule is active
15. ❌ **`mail/address/delete-cli.ts`** - Check if address is primary
16. ❌ **`mail/deliverybox/delete-cli.ts`** - Check linked addresses
17. ❌ **`domain/virtualhost-delete-cli.ts`** - Check linked apps
18. ✅ **`org/delete-cli.ts`** - HAS C4 pattern (no deps needed)
19. ✅ **`org/membership-revoke-cli.ts`** - HAS C4 pattern (no deps needed)
20. ✅ **`org/invite-revoke-cli.ts`** - HAS C4 pattern (no deps needed)

### 1.3 Implementation Strategy

#### Step 1: Create Reusable Utility (1 day)

**File**: `src/utils/dependency-checker.ts`

```typescript
import type { CliToolError } from '../tools/error.js';
import { invokeCliTool } from '../tools/index.js';
import { logger } from './logger.js';

export interface DependencyCheckOptions {
  resourceType: string;
  resourceId: string;
  contextId?: string;
  listToolName: string;
  listCommand: string[];
  extractDependencies: (resource: unknown) => Dependency[];
}

export interface Dependency {
  id?: string;
  name?: string;
  type?: string;
}

export interface DependencyCheckResult {
  status: 'ok' | 'has-dependencies' | 'not-found' | 'unknown';
  resourceName?: string;
  dependencies?: Dependency[];
}

export async function checkResourceDependencies(
  options: DependencyCheckOptions
): Promise<DependencyCheckResult> {
  const { resourceType, resourceId, contextId, listToolName, listCommand, extractDependencies } = options;

  if (!contextId) {
    logger.warn(`[${resourceType} Delete] Skipping dependency check - missing context`, {
      resourceId,
    });
    return { status: 'unknown', resourceName: resourceId };
  }

  try {
    const result = await invokeCliTool({
      toolName: listToolName,
      argv: listCommand,
    });

    const parsed = safeParseJson(result.result);
    if (!Array.isArray(parsed)) {
      return { status: 'unknown', resourceName: resourceId };
    }

    const match = parsed.find((r: any) => {
      const candidateId = r.id ?? r.name;
      return candidateId === resourceId || r.id === resourceId;
    });

    if (!match) {
      return { status: 'not-found', resourceName: resourceId };
    }

    const dependencies = extractDependencies(match);

    if (dependencies.length > 0) {
      return {
        status: 'has-dependencies',
        resourceName: match.name ?? resourceId,
        dependencies,
      };
    }

    return {
      status: 'ok',
      resourceName: match.name ?? resourceId,
      dependencies: [],
    };
  } catch (error) {
    if (error instanceof CliToolError) {
      logger.warn(`[${resourceType} Delete] Unable to run dependency check`, {
        resourceId,
        contextId,
        error: {
          kind: error.kind,
          message: error.message,
        },
      });
    } else {
      logger.warn(`[${resourceType} Delete] Unexpected error during dependency check`, { error });
    }

    return { status: 'unknown', resourceName: resourceId };
  }
}

function safeParseJson(output: string): unknown {
  try {
    return JSON.parse(output);
  } catch {
    return null;
  }
}
```

**Tests**: `tests/unit/utils/dependency-checker.test.ts`
- Test successful dependency detection
- Test not-found resource
- Test no dependencies (ok status)
- Test CLI error handling
- Test missing context fallback

#### Step 2: Update High-Priority Tools (3 days)

**Example: Container Delete** (`src/handlers/tools/mittwald-cli/container/delete-cli.ts`)

```typescript
import { checkResourceDependencies } from '../../../../utils/dependency-checker.js';

async function checkContainerSafety(
  args: ContainerDeleteArgs,
  containerId: string
): Promise<DependencyCheckResult> {
  return checkResourceDependencies({
    resourceType: 'Container',
    resourceId: containerId,
    contextId: args.projectId,
    listToolName: 'mittwald_container_list',
    listCommand: ['container', 'list', '--project-id', args.projectId!, '--output', 'json'],
    extractDependencies: (container: any) => {
      const deps: Dependency[] = [];

      // Check linked volumes
      if (Array.isArray(container.volumes) && container.volumes.length > 0) {
        container.volumes.forEach((vol: any) => {
          deps.push({
            id: vol.id ?? vol.name,
            name: vol.name,
            type: 'volume',
          });
        });
      }

      // Check linked networks
      if (Array.isArray(container.networks) && container.networks.length > 0) {
        container.networks.forEach((net: any) => {
          deps.push({
            id: net.id ?? net.name,
            name: net.name,
            type: 'network',
          });
        });
      }

      return deps;
    },
  });
}

export const handleContainerDeleteCli = async (args, context) => {
  // C4 Pattern: Confirm validation
  if (args.confirm !== true) {
    return formatToolResponse('error', 'Container deletion requires confirm=true. This operation is destructive and cannot be undone.');
  }

  // C4 Pattern: Audit logging
  logger.warn('[Container Delete] Destructive operation attempted', {
    containerId: args.containerId,
    projectId: args.projectId,
    sessionId: context?.sessionId,
    userId: context?.userId,
  });

  // C6 Pattern: Dependency check
  const safety = await checkContainerSafety(args, args.containerId);

  if (safety.status === 'not-found') {
    return formatToolResponse('error', `Container '${args.containerId}' not found in project ${args.projectId}.`);
  }

  if (safety.status === 'has-dependencies' && !args.force) {
    const volumes = safety.dependencies?.filter((d) => d.type === 'volume').map((d) => d.name).join(', ') ?? 'none';
    const networks = safety.dependencies?.filter((d) => d.type === 'network').map((d) => d.name).join(', ') ?? 'none';
    return formatToolResponse(
      'error',
      `Container '${safety.resourceName ?? args.containerId}' has active dependencies:\n` +
        `- Volumes: ${volumes}\n` +
        `- Networks: ${networks}\n` +
        'Set force: true only if you are certain it is safe to detach these resources.'
    );
  }

  // Execute deletion
  // ...
};
```

#### Step 3: Documentation & Testing (1 day)

**Update**:
- `docs/ARCHITECTURE.md` - Add "Dependency Detection (RECOMMENDED)" section
- `docs/tool-safety/destructive-operations.md` - Add dependency check guidance
- Create test coverage for all updated tools

---

## Part 2: C2's Array Parameter Iteration Pattern

### 2.1 Pattern Overview

**Source**: `src/handlers/tools/mittwald-cli/container/update-cli.ts:38-54`

**Core Concept**: When CLI flags accept multiple values, use `forEach` to properly repeat the flag for each value instead of concatenating.

**Correct Pattern**:
```typescript
// ✅ CORRECT - Repeat flag for each value
if (args.env && args.env.length > 0) {
  args.env.forEach((envVar) => cliArgs.push('--env', envVar));
}
// Result: ['--env', 'FOO=bar', '--env', 'BAZ=qux']
```

**Incorrect Patterns**:
```typescript
// ❌ WRONG - Single flag with array join
if (args.env) {
  cliArgs.push('--env', args.env.join(','));
}
// Result: ['--env', 'FOO=bar,BAZ=qux'] - CLI may not parse this

// ❌ WRONG - Array spread
if (args.env) {
  cliArgs.push('--env', ...args.env);
}
// Result: ['--env', 'FOO=bar', 'BAZ=qux'] - Missing repeated flag
```

### 2.2 Applicable Tools (12 tools)

**Already Implemented** (2 tools):
1. ✅ **`container/update-cli.ts`** - env, envFile, publish, volume (reference implementation)
2. ✅ **`container/run-cli.ts`** - env, envFile, publish, volume

**Need Implementation** (10 tools - 2 days):

**Container Tools** (3 tools):
3. ❌ **`container/create-cli.ts`** - Likely has env, volume arrays
4. ❌ **`container/exec-cli.ts`** - May have env arrays
5. ❌ **`container/start-cli.ts`** - May have env arrays

**App Tools** (3 tools):
6. ❌ **`app/create-*-cli.ts`** - Check for env, volume arrays
7. ❌ **`app/update-cli.ts`** - Check for env arrays
8. ❌ **`app/install-*-cli.ts`** - Check for env arrays

**Stack Tools** (2 tools):
9. ❌ **`stack/create-cli.ts`** - Check for volume arrays
10. ❌ **`stack/update-cli.ts`** - Check for volume arrays

**Other** (2 tools):
11. ❌ **`cronjob/create-cli.ts`** - Check for env arrays
12. ❌ **`cronjob/update-cli.ts`** - Check for env arrays

### 2.3 Implementation Strategy

#### Step 1: Audit All Tools (0.5 days)

**Script**: `scripts/audit-array-parameters.ts`

```typescript
import { glob } from 'glob';
import { readFile } from 'fs/promises';

async function auditArrayParameters() {
  const files = await glob('src/constants/tool/mittwald-cli/**/*-cli.ts');
  const results: Array<{ file: string; arrayParams: string[] }> = [];

  for (const file of files) {
    const content = await readFile(file, 'utf-8');

    // Find array parameters in schema
    const arrayParams: string[] = [];
    const schemaMatch = content.match(/inputSchema:\s*{[\s\S]*?}/);

    if (schemaMatch) {
      const schema = schemaMatch[0];
      // Look for type: "array" or items: { type: "string" }
      const arrayMatches = schema.matchAll(/(\w+):\s*{[\s\S]*?type:\s*["']array["']/g);
      for (const match of arrayMatches) {
        arrayParams.push(match[1]);
      }
    }

    if (arrayParams.length > 0) {
      results.push({ file, arrayParams });
    }
  }

  console.log('Tools with Array Parameters:');
  console.log(JSON.stringify(results, null, 2));
}

auditArrayParameters();
```

**Run**: `tsx scripts/audit-array-parameters.ts > array-params-audit.json`

#### Step 2: Create Utility Helper (0.5 days)

**File**: `src/utils/cli-args-builder.ts`

```typescript
/**
 * Helper to build CLI arguments with proper array parameter handling
 */
export class CliArgsBuilder {
  private args: string[] = [];

  /**
   * Add a single flag
   */
  addFlag(flag: string): this {
    this.args.push(flag);
    return this;
  }

  /**
   * Add a flag with a single value
   */
  addOption(flag: string, value: string | number | boolean): this {
    this.args.push(flag, String(value));
    return this;
  }

  /**
   * Add a flag with multiple values (C2 pattern - forEach iteration)
   */
  addArrayOption(flag: string, values?: string[] | null): this {
    if (values && values.length > 0) {
      values.forEach((value) => {
        this.args.push(flag, value);
      });
    }
    return this;
  }

  /**
   * Add a flag with optional value
   */
  addOptionalOption(flag: string, value?: string | number | null): this {
    if (value !== undefined && value !== null) {
      this.args.push(flag, String(value));
    }
    return this;
  }

  /**
   * Get the built arguments array
   */
  build(): string[] {
    return this.args;
  }
}

// Usage example:
const cliArgs = new CliArgsBuilder()
  .addOption('--project-id', args.projectId)
  .addArrayOption('--env', args.env)
  .addArrayOption('--volume', args.volume)
  .addOptionalOption('--description', args.description)
  .build();
```

**Tests**: `tests/unit/utils/cli-args-builder.test.ts`

#### Step 3: Update Tools (1 day)

**Example Before**:
```typescript
function buildCliArgs(args: ContainerUpdateArgs): string[] {
  const cliArgs = ['container', 'update', args.containerId];

  if (args.env) cliArgs.push('--env', args.env.join(',')); // ❌ WRONG
  if (args.volume) cliArgs.push(...args.volume.map(v => ['--volume', v]).flat()); // ❌ WRONG

  return cliArgs;
}
```

**Example After (Option 1 - Manual)**:
```typescript
function buildCliArgs(args: ContainerUpdateArgs): string[] {
  const cliArgs = ['container', 'update', args.containerId];

  // C2 Pattern: forEach iteration for array parameters
  if (args.env && args.env.length > 0) {
    args.env.forEach((envVar) => cliArgs.push('--env', envVar)); // ✅ CORRECT
  }

  if (args.volume && args.volume.length > 0) {
    args.volume.forEach((vol) => cliArgs.push('--volume', vol)); // ✅ CORRECT
  }

  return cliArgs;
}
```

**Example After (Option 2 - Builder)**:
```typescript
function buildCliArgs(args: ContainerUpdateArgs): string[] {
  return new CliArgsBuilder()
    .addOption('--container-id', args.containerId) // ❌ This is wrong - command comes first
    .addArrayOption('--env', args.env)
    .addArrayOption('--volume', args.volume)
    .build();
}
```

**Preferred**: Manual forEach (Option 1) - More explicit and follows C2 pattern directly

---

## Implementation Phases

### Phase 1: Foundation (2 days)
**Goal**: Create reusable utilities and documentation

**Tasks**:
- [ ] Day 1: Create `dependency-checker.ts` utility + tests
- [ ] Day 1: Create `cli-args-builder.ts` utility + tests
- [ ] Day 2: Run array parameter audit script
- [ ] Day 2: Update `ARCHITECTURE.md` with both patterns
- [ ] Day 2: Update `docs/tool-safety/destructive-operations.md`

**Deliverables**:
- `src/utils/dependency-checker.ts`
- `src/utils/cli-args-builder.ts`
- `tests/unit/utils/dependency-checker.test.ts`
- `tests/unit/utils/cli-args-builder.test.ts`
- `scripts/audit-array-parameters.ts`
- `array-params-audit.json`
- Updated architecture docs

### Phase 2: Priority 1 - High-Value Dependencies (3 days)
**Goal**: Add dependency checks to critical destructive tools

**Tasks**:
- [ ] Day 3: `container/delete-cli.ts` - volumes, networks
- [ ] Day 3: `project/delete-cli.ts` - apps, databases, containers
- [ ] Day 4: `database/mysql/delete-cli.ts` - linked apps
- [ ] Day 4: `stack/delete-cli.ts` - volumes, services
- [ ] Day 5: `registry/delete-cli.ts` - linked containers
- [ ] Day 5: Test all Priority 1 tools

**Deliverables**: 5 tools with dependency checks

### Phase 3: Array Parameters (2 days)
**Goal**: Fix all tools with incorrect array parameter handling

**Tasks**:
- [ ] Day 6: Container tools (create, exec, start) - 3 tools
- [ ] Day 6: App tools (create, update, install) - 3 tools
- [ ] Day 7: Stack tools (create, update) - 2 tools
- [ ] Day 7: Cronjob tools (create, update) - 2 tools
- [ ] Day 7: Test all array parameter fixes

**Deliverables**: 10 tools with correct forEach pattern

### Phase 4: Priority 2 & 3 Dependencies (4 days)
**Goal**: Complete dependency checks for remaining tools

**Tasks**:
- [ ] Day 8-9: User/Access tools (5 tools)
- [ ] Day 10-11: Lower-risk tools (9 tools)
- [ ] Day 11: Integration testing
- [ ] Day 11: Documentation finalization

**Deliverables**: 14 additional tools with dependency checks

---

## Testing Strategy

### Unit Tests
**Each updated tool must have**:
- Test for dependency detection (has-dependencies status)
- Test for force override behavior
- Test for array parameter iteration (CLI args match expected)
- Test for error scenarios (list tool fails, parsing fails)

### Integration Tests
**Critical path validation**:
- `tests/integration/dependency-detection.test.ts`
  - Create resource → verify exists
  - Create dependency → delete should block
  - Delete with force → succeeds
  - Verify dependency cleaned up

- `tests/integration/array-parameters.test.ts`
  - Create container with multiple env vars
  - Verify all env vars applied correctly
  - Update with array params
  - Verify CLI receives repeated flags

### Manual Testing Checklist
- [ ] Delete volume with mounted containers (should block)
- [ ] Delete volume with force (should succeed)
- [ ] Delete project with apps (should block)
- [ ] Delete container with multiple env vars (verify all set)
- [ ] Update container with array params (verify CLI args)

---

## Documentation Updates

### 1. ARCHITECTURE.md
Add new section after "Destructive Operation Safety":

```markdown
### Dependency Detection (RECOMMENDED)

For destructive operations on resources with potential dependencies, implement pre-flight safety checks before deletion:

1. **Query Resource State** - Use list command to fetch current resource details
2. **Extract Dependencies** - Identify linked resources (volumes, networks, apps, etc.)
3. **Block or Warn** - Return error if dependencies exist, unless force flag is set
4. **Report Dependencies** - Include dependency list in error message for user awareness

**Implementation Pattern**: See `src/utils/dependency-checker.ts` and reference implementation in `src/handlers/tools/mittwald-cli/volume/delete-cli.ts:62-124`.

See also:
- [Agent C6 Volume Review (Dependency Detection)](./docs/agent-reviews/AGENT-C6-VOLUME-REVIEW.md)
- [Destructive Operations Safety Guide](./docs/tool-safety/destructive-operations.md)
```

### 2. LLM_CONTEXT.md
Add subsection under "Key Design Principles":

```markdown
#### Array Parameter Handling (REQUIRED)

When CLI flags accept multiple values, use `forEach` iteration to properly repeat the flag:

```typescript
// ✅ CORRECT - C2 Pattern
if (args.env && args.env.length > 0) {
  args.env.forEach((envVar) => cliArgs.push('--env', envVar));
}
// Result: ['--env', 'FOO=bar', '--env', 'BAZ=qux']

// ❌ WRONG - Single flag with join
if (args.env) {
  cliArgs.push('--env', args.env.join(','));
}
```

**Applicable to**: env, volume, publish, port, label, and any other repeatable CLI flags.

See also:
- [Agent C2 Review (Array Parameter Excellence)](./docs/agent-reviews/AGENT-C2-REVIEW.md)
- `src/utils/cli-args-builder.ts` - Helper utility
```

### 3. Tool Safety Guide
**File**: `docs/tool-safety/destructive-operations.md`

Add new section:

```markdown
## Dependency Detection Pattern

Before deleting resources, check for active dependencies:

### When to Use
- Resources with potential relationships (containers → volumes, projects → apps)
- User/access resources (SSH keys, API tokens)
- Infrastructure resources (networks, stacks)

### Implementation
1. Use `checkResourceDependencies()` utility from `src/utils/dependency-checker.ts`
2. Implement AFTER C4 confirm validation, BEFORE CLI execution
3. Block deletion if dependencies exist (unless force=true)
4. Report dependency details in error message

### Example
See `src/handlers/tools/mittwald-cli/volume/delete-cli.ts` for reference implementation.
```

---

## Risk Analysis

### Low Risk
- ✅ Array parameter fixes - No breaking changes, improves correctness
- ✅ Utility creation - New code, no existing code modified

### Medium Risk
- ⚠️ Dependency checks in delete tools - Changes behavior (may block previously-allowed deletions)
  - **Mitigation**: Use `force` flag as escape hatch
  - **Mitigation**: Log warnings when checks fail (don't hard-fail)
  - **Mitigation**: Comprehensive testing before deployment

### High Risk
- ❌ None identified

---

## Success Metrics

### Code Quality
- [ ] All 32 tools updated and tested
- [ ] 100% test coverage for new utilities
- [ ] Zero regressions in existing tools

### User Experience
- [ ] Dependency detection prevents accidental data loss
- [ ] Clear error messages guide users to safe deletion path
- [ ] Array parameters work correctly in all tools

### Documentation
- [ ] Architecture docs updated with both patterns
- [ ] All updated tools have usage examples
- [ ] Migration guide for future tools

---

## Rollout Plan

### Week 1: Foundation + Priority 1
- Day 1-2: Utilities + docs
- Day 3-5: High-value dependency checks (5 tools)

### Week 2: Arrays + Priority 2-3
- Day 6-7: Array parameter fixes (10 tools)
- Day 8-11: Remaining dependency checks (14 tools)

### Week 3: Testing + Release
- Day 12: Integration testing
- Day 13: Documentation review
- Day 14: Production deployment

---

## Approval Checklist

Before proceeding, confirm:
- [ ] Estimated effort acceptable (8-12 days)
- [ ] Resources available (2 developers)
- [ ] Priority aligns with roadmap
- [ ] Risk mitigation strategies approved
- [ ] Testing plan adequate
- [ ] Documentation scope complete

---

**Status**: DRAFT - Awaiting approval
**Next Steps**:
1. Review and approve plan
2. Assign developers
3. Create tracking issues
4. Begin Phase 1 implementation
