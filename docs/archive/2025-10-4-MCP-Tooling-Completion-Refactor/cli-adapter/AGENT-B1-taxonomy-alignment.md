# Agent B1: Registry & Stack Taxonomy Alignment

**Agent ID**: B1
**Task**: Align MCP tool naming with CLI topic structure (registry, stack)
**Duration**: 1-2 days
**Priority**: Medium (Foundation)
**Dependencies**: A1 recommended (for coverage tracking)

---

## Objective

Rename and reorganize registry and stack tools to match the Mittwald CLI's topic structure. This eliminates false negatives in coverage tracking and aligns the codebase with CLI conventions.

---

## Context

**Current State**:
- Registry tools live under `src/constants/tool/mittwald-cli/container/registry-*.ts`
- Stack tools live under `src/constants/tool/mittwald-cli/container/stack-*.ts`
- Tool names use `mittwald_container_registry_*` and `mittwald_container_stack_*`
- CLI structure uses top-level `registry` and `stack` topics

**Problem**:
- Coverage tracking shows false negatives (CLI commands appear missing when tools exist)
- Naming confusion (registry/stack are NOT container sub-topics in CLI)
- File organization doesn't match CLI's taxonomy

**Target State**:
- Registry tools in `src/constants/tool/mittwald-cli/registry/*.ts`
- Stack tools in `src/constants/tool/mittwald-cli/stack/*.ts`
- Tool names use `mittwald_registry_*` and `mittwald_stack_*`
- Coverage tracking correctly identifies these as covered

---

## Deliverables

### 1. Registry Taxonomy Migration

#### Files to Move
**From** `src/constants/tool/mittwald-cli/container/`:
- `registry-login-cli.ts`
- `registry-logout-cli.ts`
- `registry-list-cli.ts`
- (any other registry-* files)

**To** `src/constants/tool/mittwald-cli/registry/`:
- `login-cli.ts`
- `logout-cli.ts`
- `list-cli.ts`

#### Tool Name Changes
```typescript
// BEFORE
export const toolDefinition: ToolRegistration = {
  definition: {
    name: 'mittwald_container_registry_login',
    // ...
  }
};

// AFTER
export const toolDefinition: ToolRegistration = {
  definition: {
    name: 'mittwald_registry_login',
    // ...
  }
};
```

#### Handler Updates
**From** `src/handlers/tools/mittwald-cli/container/registry-*.ts`:
- Move to `src/handlers/tools/mittwald-cli/registry/*-cli.ts`
- Update imports if needed
- No logic changes required

#### Test Updates
**Files**: `tests/unit/tools/registry-*.test.ts` or `tests/integration/registry-*.test.ts`
- Update tool name references
- Update import paths
- Verify all tests pass

---

### 2. Stack Taxonomy Migration

#### Files to Move
**From** `src/constants/tool/mittwald-cli/container/`:
- `stack-create-cli.ts`
- `stack-delete-cli.ts`
- `stack-list-cli.ts`
- `stack-get-cli.ts`
- (any other stack-* files)

**To** `src/constants/tool/mittwald-cli/stack/`:
- `create-cli.ts`
- `delete-cli.ts`
- `list-cli.ts`
- `get-cli.ts`

#### Tool Name Changes
```typescript
// BEFORE
export const toolDefinition: ToolRegistration = {
  definition: {
    name: 'mittwald_container_stack_create',
    // ...
  }
};

// AFTER
export const toolDefinition: ToolRegistration = {
  definition: {
    name: 'mittwald_stack_create',
    // ...
  }
};
```

#### Handler Updates
**From** `src/handlers/tools/mittwald-cli/container/stack-*.ts`:
- Move to `src/handlers/tools/mittwald-cli/stack/*-cli.ts`
- Update imports if needed
- No logic changes required

#### Test Updates
**Files**: `tests/unit/tools/stack-*.test.ts` or `tests/integration/stack-*.test.ts`
- Update tool name references
- Update import paths
- Verify all tests pass

---

### 3. Tool Scanner Verification

**File**: `src/utils/tool-scanner.ts`

**Verify**:
- Scanner discovers new `registry/` and `stack/` folders
- No changes needed if scanner uses glob pattern: `src/constants/tool/mittwald-cli/**/*-cli.ts`
- Test tool registration includes renamed tools

**Validation Script**:
```typescript
// scripts/verify-tool-discovery.ts
import { listAvailableTools } from '../src/utils/tool-scanner.js';

const tools = await listAvailableTools();

const registryTools = tools.filter(t => t.name.startsWith('mittwald_registry_'));
const stackTools = tools.filter(t => t.name.startsWith('mittwald_stack_'));

console.log(`Registry tools: ${registryTools.length}`);
console.log(registryTools.map(t => t.name));

console.log(`Stack tools: ${stackTools.length}`);
console.log(stackTools.map(t => t.name));

// Verify no old names remain
const oldRegistry = tools.filter(t => t.name.includes('container_registry'));
const oldStack = tools.filter(t => t.name.includes('container_stack'));

if (oldRegistry.length > 0 || oldStack.length > 0) {
  console.error('❌ Old tool names still present:', [...oldRegistry, ...oldStack]);
  process.exit(1);
}

console.log('✅ Tool discovery verified');
```

---

### 4. Documentation Updates

#### Files to Update

**1. Tool Examples**
**File**: `docs/tool-examples/registry.md` (if exists)
```diff
-  "name": "mittwald_container_registry_login",
+  "name": "mittwald_registry_login",
```

**File**: `docs/tool-examples/stack.md` (if exists)
```diff
-  "name": "mittwald_container_stack_create",
+  "name": "mittwald_stack_create",
```

**2. Architecture Docs**
**File**: `docs/ARCHITECTURE.md`
- Update tool naming conventions section (if exists)
- Reference registry and stack as top-level topics

**3. Migration Notes**
**File**: `docs/MIGRATION.md` (create if doesn't exist)
```markdown
## v2.X.X - Registry & Stack Taxonomy Alignment

### Breaking Changes

**Tool Name Changes**:
- `mittwald_container_registry_*` → `mittwald_registry_*`
- `mittwald_container_stack_*` → `mittwald_stack_*`

**Migration Guide**:
If you have client code referencing these tools, update tool names:

| Old Name | New Name |
|----------|----------|
| `mittwald_container_registry_login` | `mittwald_registry_login` |
| `mittwald_container_registry_logout` | `mittwald_registry_logout` |
| `mittwald_container_registry_list` | `mittwald_registry_list` |
| `mittwald_container_stack_create` | `mittwald_stack_create` |
| `mittwald_container_stack_delete` | `mittwald_stack_delete` |
| `mittwald_container_stack_list` | `mittwald_stack_list` |
| `mittwald_container_stack_get` | `mittwald_stack_get` |

**Rationale**: Aligns tool naming with CLI topic structure (`mw registry`, `mw stack`).
```

**4. Coverage Report**
**File**: `docs/mittwald-cli-coverage.md`
- Regenerate after changes (if Agent A1 complete)
- Verify registry/stack commands show as covered

---

### 5. Import Path Updates

**Check All Files Importing**:
```bash
# Find all imports of old paths
grep -r "from.*container/registry-" src/
grep -r "from.*container/stack-" src/
```

**Update Imports**:
```typescript
// BEFORE
import { handleRegistryLoginCli } from '../handlers/tools/mittwald-cli/container/registry-login-cli.js';

// AFTER
import { handleRegistryLoginCli } from '../handlers/tools/mittwald-cli/registry/login-cli.js';
```

---

## Implementation Steps

### Day 1: Registry Migration

**Morning**:
1. Create `src/constants/tool/mittwald-cli/registry/` folder
2. Create `src/handlers/tools/mittwald-cli/registry/` folder
3. Move registry tool definitions (3-5 files)
4. Update tool names in definitions
5. Move registry handlers
6. Update handler imports

**Afternoon**:
7. Update test files (tool names + imports)
8. Run tests: `npm test -- registry`
9. Verify tool scanner discovers registry tools
10. Update documentation (examples, ARCHITECTURE.md)

### Day 2: Stack Migration & Verification

**Morning**:
11. Create `src/constants/tool/mittwald-cli/stack/` folder
12. Create `src/handlers/tools/mittwald-cli/stack/` folder
13. Move stack tool definitions (4-6 files)
14. Update tool names in definitions
15. Move stack handlers
16. Update handler imports

**Afternoon**:
17. Update test files (tool names + imports)
18. Run tests: `npm test -- stack`
19. Verify tool scanner discovers stack tools
20. Run full test suite: `npm test`
21. Create `docs/MIGRATION.md` entry
22. Regenerate coverage report (if A1 complete)
23. Commit all changes

---

## Testing Strategy

### Unit Tests
- [ ] All registry tool tests pass with new names
- [ ] All stack tool tests pass with new names
- [ ] Tool scanner discovers registry tools
- [ ] Tool scanner discovers stack tools
- [ ] No old tool names (`container_registry`, `container_stack`) in registry

### Integration Tests
- [ ] MCP server lists registry tools correctly
- [ ] MCP server lists stack tools correctly
- [ ] Tool invocation works with new names

### Manual Validation
- [ ] `npm run verify-tool-discovery` passes
- [ ] Coverage report shows registry/stack as covered (if A1 complete)
- [ ] No broken imports (`npm run build` succeeds)
- [ ] No ESLint errors

---

## Success Criteria

- [ ] Registry tools in `registry/` folder with `mittwald_registry_*` names
- [ ] Stack tools in `stack/` folder with `mittwald_stack_*` names
- [ ] All tests passing
- [ ] Tool scanner discovers renamed tools
- [ ] Documentation updated with migration guide
- [ ] Coverage report reflects correct taxonomy (if A1 complete)
- [ ] No old tool names in codebase
- [ ] Clean git diff (no unintended changes)

---

## Risk Mitigation

### Breaking Changes
**Risk**: Existing clients break if using old tool names
**Mitigation**:
- Document breaking change in MIGRATION.md
- Include version bump (major or minor depending on policy)
- Consider deprecation warnings in future release

### Import Errors
**Risk**: Missed import paths cause runtime errors
**Mitigation**:
- Use IDE refactoring tools (VSCode "Rename Symbol")
- Run full test suite before commit
- Check with: `npm run build && npm test`

### Tool Scanner Miss
**Risk**: Scanner doesn't find moved tools
**Mitigation**:
- Test scanner with `scripts/verify-tool-discovery.ts`
- Check glob pattern matches new paths

---

## Dependencies & Blockers

**Recommended** (not required):
- Agent A1 (coverage tooling) - enables verification of coverage improvements

**Outputs Used By**:
- Agent A1 (updated coverage report shows correct taxonomy)
- Agents D1-D5 (cleaner codebase for migration work)

---

## Related Documentation

- **Architecture**: `docs/mcp-cli-gap-architecture.md` (Section 3: Gap Analysis)
- **Project Plan**: `docs/mcp-cli-gap-project-plan.md` (Workstream B)
- **Coverage**: `docs/mittwald-cli-coverage.md`

---

**Agent Status**: Ready to execute
**Estimated Effort**: 1-2 days
**Next Steps**: Start with Day 1 (registry migration)
