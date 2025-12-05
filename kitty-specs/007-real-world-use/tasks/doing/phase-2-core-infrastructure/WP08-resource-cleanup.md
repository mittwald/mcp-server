---
work_package_id: "WP08"
subtasks:
  - "T049"
  - "T050"
  - "T051"
  - "T052"
  - "T053"
  - "T054"
  - "T055"
title: "Resource Tracking and Cleanup"
phase: "Phase 2 - Core Infrastructure"
lane: "doing"
assignee: "codex"
agent: "codex"
shell_pid: "61363"
history:
  - timestamp: "2025-12-05T10:15:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-05T10:05:37Z"
    lane: "doing"
    agent: "codex"
    shell_pid: "54032"
    action: "Started implementation"
  - timestamp: "2025-12-05T10:08:34Z"
    lane: "for_review"
    agent: "codex"
    shell_pid: "54032"
    action: "Ready for review"
  - timestamp: "2025-12-05T10:09:42Z"
    lane: "planned"
    agent: "codex"
    shell_pid: "55120"
    action: "Review feedback: missing wiring to parser/session, success/failure detection, idle/timeout enforcement, and controller tests"
  - timestamp: "2025-12-05T10:15:00Z"
    lane: "doing"
    agent: "codex"
    shell_pid: "61363"
    action: "Started review"
---

# Work Package Prompt: WP08 – Resource Tracking and Cleanup

## Objectives & Success Criteria

- Track resources created during use case execution
- Parse session logs to identify created resources
- Delete resources in correct dependency order
- Handle partial cleanup failures gracefully

**Success Metric**: Can identify created resources from session log and delete them in correct order

## Context & Constraints

### Prerequisites
- WP04: Use Case Type Definitions (CleanupRequirement, CleanupStatus)

### Key References
- `kitty-specs/007-real-world-use/data-model.md` - ResourceType, CleanupStatus
- `kitty-specs/007-real-world-use/spec.md` - FR-023, FR-024

### Constraints
- Must handle partial failures (log and continue)
- Respect resource dependencies (apps before projects)
- Use MCP tools for deletion (not direct API calls)

## Subtasks & Detailed Guidance

### Subtask T049 – Create resource-tracker.ts with ResourceType enum

- **Purpose**: Central module for tracking created resources.

- **Steps**:
  1. Create `tests/functional/src/cleanup/resource-tracker.ts`
  2. Define TrackedResource interface
  3. Implement ResourceTracker class with add/get methods
  4. Track resource type, ID, and creation order

- **Files**:
  - Create: `tests/functional/src/cleanup/resource-tracker.ts`

- **Parallel?**: Yes

- **Example**:
```typescript
import { ResourceType } from '../use-cases/types';

export interface TrackedResource {
  type: ResourceType;
  id: string;
  name?: string;
  createdAt: Date;
  createdByTool: string;
  deletionTool: string;
}

export class ResourceTracker {
  private resources: TrackedResource[] = [];

  add(resource: TrackedResource): void {
    this.resources.push(resource);
  }

  getAll(): TrackedResource[] {
    return [...this.resources];
  }

  getByType(type: ResourceType): TrackedResource[] {
    return this.resources.filter(r => r.type === type);
  }

  clear(): void {
    this.resources = [];
  }
}
```

### Subtask T050 – Implement session log parsing for resource creation events

- **Purpose**: Automatically detect when resources are created during execution.

- **Steps**:
  1. Parse JSONL session log
  2. Find tool_use events for create operations
  3. Match tool names to resource types
  4. Extract from corresponding tool_result

- **Files**:
  - Modify: `tests/functional/src/cleanup/resource-tracker.ts`

- **Parallel?**: Yes

- **Tool to ResourceType Mapping**:
```typescript
const CREATION_TOOLS: Record<string, ResourceType> = {
  'project/create': 'project',
  'app/create': 'app',
  'database/mysql/create': 'database',
  'database/redis/create': 'database',
  'domain/create': 'domain',
  'mail/mailbox/create': 'mailbox',
  'cronjob/create': 'cronjob',
  'backup/create': 'backup',
  // Add more as needed
};
```

### Subtask T051 – Extract resource IDs from tool_result payloads

- **Purpose**: Get the actual IDs needed for deletion.

- **Steps**:
  1. Parse tool_result content (JSON string)
  2. Look for common ID fields: id, projectId, appId, etc.
  3. Associate ID with the creation tool_use
  4. Handle various response formats

- **Files**:
  - Modify: `tests/functional/src/cleanup/resource-tracker.ts`

- **Parallel?**: Yes

- **Example**:
```typescript
function extractResourceId(toolName: string, toolResult: string): string | null {
  try {
    const result = JSON.parse(toolResult);

    // Common patterns
    if (result.id) return result.id;
    if (result.projectId) return result.projectId;
    if (result.appId) return result.appId;

    // Tool-specific extraction
    if (toolName.includes('project') && result.project?.id) {
      return result.project.id;
    }

    return null;
  } catch {
    return null;
  }
}
```

### Subtask T052 – Create cleanup-executor.ts with ordered deletion

- **Purpose**: Delete resources in correct dependency order.

- **Steps**:
  1. Create `tests/functional/src/cleanup/cleanup-executor.ts`
  2. Accept array of TrackedResources
  3. Sort by deletion order (reverse creation, respect dependencies)
  4. Execute deletion for each resource

- **Files**:
  - Create: `tests/functional/src/cleanup/cleanup-executor.ts`

- **Parallel?**: No (orchestrates deletion)

- **Example**:
```typescript
import { TrackedResource } from './resource-tracker';
import { CleanupStatus, DeletedResource, FailedResource } from '../use-cases/types';

export class CleanupExecutor {
  async cleanup(resources: TrackedResource[]): Promise<CleanupStatus> {
    const deleted: DeletedResource[] = [];
    const failed: FailedResource[] = [];

    // Sort by deletion order
    const sorted = this.sortForDeletion(resources);

    for (const resource of sorted) {
      const result = await this.deleteResource(resource);
      if (result.success) {
        deleted.push({ type: resource.type, id: resource.id, tool: resource.deletionTool });
      } else {
        failed.push({ type: resource.type, id: resource.id, tool: resource.deletionTool, error: result.error! });
      }
    }

    return {
      status: failed.length === 0 ? 'complete' : deleted.length === 0 ? 'failed' : 'partial',
      deleted,
      failed
    };
  }
}
```

### Subtask T053 – Implement dependency-aware deletion order

- **Purpose**: Delete dependent resources before their parents.

- **Steps**:
  1. Define resource dependency graph
  2. Apps depend on projects (delete apps first)
  3. Databases depend on projects
  4. Sort resources topologically
  5. Delete leaf nodes first

- **Files**:
  - Modify: `tests/functional/src/cleanup/cleanup-executor.ts`

- **Parallel?**: No

- **Dependency Order** (delete first → last):
1. app
2. database
3. mailbox
4. cronjob
5. domain
6. backup
7. container
8. ssh-key
9. certificate
10. project (last - parent of most resources)

- **Example**:
```typescript
const DELETION_ORDER: ResourceType[] = [
  'app',
  'database',
  'mailbox',
  'cronjob',
  'domain',
  'backup',
  'container',
  'ssh-key',
  'certificate',
  'project'
];

private sortForDeletion(resources: TrackedResource[]): TrackedResource[] {
  return [...resources].sort((a, b) => {
    const orderA = DELETION_ORDER.indexOf(a.type);
    const orderB = DELETION_ORDER.indexOf(b.type);
    return orderA - orderB;
  });
}
```

### Subtask T054 – Handle partial cleanup failures with logging

- **Purpose**: Continue cleanup even if some resources fail to delete.

- **Steps**:
  1. Wrap each deletion in try-catch
  2. Log failure with resource details
  3. Continue with next resource
  4. Collect all failures in report

- **Files**:
  - Modify: `tests/functional/src/cleanup/cleanup-executor.ts`

- **Parallel?**: No

- **Example**:
```typescript
private async deleteResource(resource: TrackedResource): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Deleting ${resource.type} ${resource.id} via ${resource.deletionTool}`);

    // Execute deletion via MCP tool or CLI
    const result = await this.executeDeletion(resource);

    if (result.success) {
      console.log(`  ✓ Deleted ${resource.type} ${resource.id}`);
      return { success: true };
    } else {
      console.log(`  ✗ Failed to delete ${resource.type} ${resource.id}: ${result.error}`);
      return { success: false, error: result.error };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`  ✗ Error deleting ${resource.type} ${resource.id}: ${message}`);
    return { success: false, error: message };
  }
}
```

### Subtask T055 – Create CleanupStatus reporting

- **Purpose**: Summarize cleanup results for execution report.

- **Steps**:
  1. Generate CleanupStatus object
  2. Include deleted and failed arrays
  3. Calculate overall status
  4. Format for human reading

- **Files**:
  - Modify: `tests/functional/src/cleanup/cleanup-executor.ts`

- **Parallel?**: No

- **Example Output**:
```
Cleanup Summary:
  Status: partial
  Deleted: 3 resources
    ✓ app a1b2c3d4
    ✓ database d5e6f7g8
    ✓ project p9q0r1s2
  Failed: 1 resource
    ✗ mailbox m3n4o5p6: Resource not found (already deleted?)
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Resource dependencies unknown | Document known dependencies, test empirically |
| Deletion API rate limited | Add delays between deletions |
| Resource already deleted | Handle 404/not-found as success |
| Orphaned resources accumulate | Periodic cleanup script with naming pattern match |

## Definition of Done Checklist

- [ ] T049: ResourceTracker class created
- [ ] T050: Session log parsing extracts creation events
- [ ] T051: Resource IDs extracted from tool results
- [ ] T052: CleanupExecutor deletes resources
- [ ] T053: Dependency-aware ordering works
- [ ] T054: Partial failures logged and continued
- [ ] T055: CleanupStatus reporting complete
- [ ] Can cleanup resources from a test session log

## Review Guidance

- **Key Checkpoint**: Parse a real session log and verify resource extraction
- **Verify**: Deletion order respects dependencies
- **Verify**: Failed deletions don't stop cleanup
- **Look For**: Edge cases with nested resources

## Activity Log

- 2025-12-05T10:15:00Z – system – lane=planned – Prompt created.
- 2025-12-05T10:05:37Z – codex – shell_pid=54032 – lane=doing – Started implementation
- 2025-12-05T10:08:34Z – codex – shell_pid=54032 – lane=doing – Completed implementation
- 2025-12-05T10:15:00Z – codex – shell_pid=61363 – lane=doing – Started review
