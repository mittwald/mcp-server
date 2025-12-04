---
work_package_id: "WP05"
subtasks:
  - "T027"
  - "T028"
  - "T029"
  - "T030"
  - "T031"
  - "T032"
  - "T033"
  - "T034"
title: "Resource Management & Cleanup"
phase: "Phase 2 - Core Features"
lane: "for_review"
assignee: "claude"
agent: "claude"
shell_pid: "72358"
history:
  - timestamp: "2025-12-04T11:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-04T13:50:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "72358"
    action: "Started implementation"
  - timestamp: "2025-12-04T14:30:00Z"
    lane: "for_review"
    agent: "claude"
    shell_pid: "72358"
    action: "Completed T027-T034: tracker.ts, naming.ts, cleanup.ts"
---

# Work Package Prompt: WP05 – Resource Management & Cleanup

## Objectives & Success Criteria

- Track all resources created during testing (FR-008)
- Implement collision-safe naming conventions (FR-010)
- Support domain-grouped cleanup (FR-009)
- Handle temporary artifacts in /tmp (FR-021, FR-022)

**Success Gate**: Resources tracked correctly; cleanup removes all tracked resources without orphans (SC-005).

## Context & Constraints

- **Reference Documents**:
  - `kitty-specs/005-mcp-functional-test/spec.md` - FR-006 through FR-010, FR-021-022
  - `kitty-specs/005-mcp-functional-test/data-model.md` - ResourceTracker, TrackedResource
  - `kitty-specs/005-mcp-functional-test/research.md` - Cleanup order, naming convention
- **Naming Convention**: `test-{domain}-{timestamp}-{random4}`
- **10 Test Domains**: identity, organization, project-foundation, apps, containers, databases, domains-mail, access-users, automation, backups
- **Depends on**: WP01 (types)

## Subtasks & Detailed Guidance

### Subtask T027 – Implement tracker.ts resource tracking

- **Purpose**: Record every resource created during testing.
- **Steps**:
  1. Create `src/resources/tracker.ts`
  2. Implement `track(resource: ResourceCreateOptions): Promise<void>`
  3. Store in `output/resources.json`:
     ```typescript
     interface TrackerState {
       resources: TrackedResource[];
       lastUpdated: string;
     }
     ```
  4. Atomic write pattern (write to temp, rename)
  5. Implement `getByDomain(domain: string): Promise<TrackedResource[]>`
  6. Implement `markCleaned(resourceId: string): Promise<void>`
- **Files**: `tests/functional/src/resources/tracker.ts`, `tests/functional/output/resources.json`
- **Parallel?**: No (foundation)

### Subtask T028 – Implement naming.ts collision-safe naming

- **Purpose**: Generate unique resource names that prevent parallel test conflicts.
- **Steps**:
  1. Create `src/resources/naming.ts`
  2. Implement `generateResourceName(domain: string): string`:
     ```typescript
     function generateResourceName(domain: string): string {
       const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
       const random = Math.random().toString(36).substring(2, 6);
       return `test-${domain}-${timestamp}-${random}`;
     }
     ```
  3. Implement collision detection and retry:
     ```typescript
     async function generateUniqueName(domain: string, existingNames: Set<string>): string {
       for (let i = 0; i < 3; i++) {
         const name = generateResourceName(domain);
         if (!existingNames.has(name)) return name;
       }
       throw new Error('Failed to generate unique name after 3 attempts');
     }
     ```
- **Files**: `tests/functional/src/resources/naming.ts`
- **Parallel?**: No
- **Notes**: Example output: `test-apps-20251204110532-a3f9`

### Subtask T029 – Implement cleanup.ts domain cleanup

- **Purpose**: Delete all resources for a functional domain after its tests complete.
- **Steps**:
  1. Create `src/resources/cleanup.ts`
  2. Implement `cleanupDomain(domain: string): Promise<CleanupResult>`
  3. Fetch resources by domain from tracker
  4. Delete in dependency order (children before parents)
  5. Track success/failure for each resource
  6. Return CleanupResult with stats
- **Files**: `tests/functional/src/resources/cleanup.ts`
- **Parallel?**: No
- **Notes**: Cleanup uses `mw` CLI directly (harness privilege, not test agent).

### Subtask T030 – Add dependency ordering for cleanup

- **Purpose**: Delete child resources before parents to avoid orphan errors.
- **Steps**:
  1. Define cleanup order per research.md:
     ```typescript
     const CLEANUP_ORDER: ResourceType[] = [
       'mail-address', 'mail-deliverybox',  // Tier 1
       'virtualhost', 'domain',              // Tier 2
       'cronjob', 'backup', 'backup-schedule', // Tier 3
       'ssh-user', 'sftp-user',              // Tier 4
       'database-mysql', 'database-redis',   // Tier 5
       'container', 'stack', 'registry', 'volume', // Tier 6
       'app',                                 // Tier 7
       'project',                            // Tier 8 (last)
     ];
     ```
  2. Sort resources by type before deletion
  3. Also respect `parentResourceId` relationships
- **Files**: `tests/functional/src/resources/cleanup.ts`
- **Parallel?**: No

### Subtask T031 – Implement /tmp artifact tracking

- **Purpose**: Track temporary files created for upload tests (FR-021).
- **Steps**:
  1. Create directory: `/tmp/mcp-tests-{domain}/`
  2. Track directory in tracker state
  3. Implement `createTempDir(domain: string): Promise<string>`:
     ```typescript
     const tempDir = `/tmp/mcp-tests-${domain}`;
     await fs.mkdir(tempDir, { recursive: true });
     return tempDir;
     ```
  4. Record in tracker as special resource type `temp-directory`
- **Files**: `tests/functional/src/resources/tracker.ts`
- **Parallel?**: Yes (after T027)

### Subtask T032 – Implement /tmp artifact cleanup

- **Purpose**: Remove temporary directories after domain tests complete (FR-022).
- **Steps**:
  1. Add to domain cleanup: delete `/tmp/mcp-tests-{domain}/`
  2. Use recursive delete:
     ```typescript
     await fs.rm(tempDir, { recursive: true, force: true });
     ```
  3. Handle missing directory gracefully (already cleaned)
- **Files**: `tests/functional/src/resources/cleanup.ts`
- **Parallel?**: Yes (after T029)

### Subtask T033 – Add orphan detection

- **Purpose**: Find resources created but not tracked (crash recovery).
- **Steps**:
  1. Implement `findOrphans(): Promise<string[]>`
  2. Pattern: resources matching `test-*` naming convention
  3. Query Mittwald API for resources with matching names
  4. Compare against tracker state
  5. Return IDs not in tracker
  6. Use for manual cleanup after harness crash
- **Files**: `tests/functional/src/resources/cleanup.ts`
- **Parallel?**: No
- **Notes**: Requires MCP or mw CLI calls to list resources. May be slow.

### Subtask T034 – Implement clean-room vs harness-assisted mode

- **Purpose**: Support two test modes per FR-006, FR-007.
- **Steps**:
  1. **Clean-room mode** (FR-006):
     - Used only for `project/create` test
     - No harness setup - agent discovers everything
     - Test receives empty context
  2. **Harness-assisted mode** (FR-007):
     - Harness creates prerequisite resources via `mw` CLI
     - Test receives context with resource IDs
     - Example: create project, pass projectId to app tests
  3. Implement mode selection in test execution:
     ```typescript
     interface TestContext {
       mode: 'clean-room' | 'harness-assisted';
       projectId?: string;
       serverId?: string;
       // ... other pre-created resource IDs
     }
     ```
- **Files**: `tests/functional/src/resources/tracker.ts`
- **Parallel?**: No

## Test Strategy

No unit tests specified. Validate by:
1. Create 10 resources across 3 domains, verify tracker state
2. Run cleanup on one domain, verify only that domain's resources deleted
3. Create temp directory, verify cleanup removes it
4. Generate 1000 names, verify no collisions

## Risks & Mitigations

- **Cleanup failures**: Mittwald API may timeout. Implement retry with exponential backoff.
- **Orphan resources**: If harness crashes, orphans remain. Document manual cleanup procedure.
- **Race conditions**: Lock tracker file during writes.

## Definition of Done Checklist

- [ ] `tracker.ts` tracks resources with all required fields
- [ ] Naming convention generates unique `test-{domain}-{timestamp}-{random4}` names
- [ ] Domain cleanup deletes resources in correct order
- [ ] Child resources deleted before parents
- [ ] /tmp directories tracked and cleaned
- [ ] Orphan detection finds untracked test resources
- [ ] Clean-room and harness-assisted modes implemented
- [ ] `tasks.md` updated with completion status

## Review Guidance

- Verify cleanup order matches research.md
- Test orphan detection with manually created test resources
- Check that clean-room mode provides NO context to test agent
- Verify tracker state file uses atomic write pattern

## Activity Log

> Append entries when the work package changes lanes.

- 2025-12-04T11:00:00Z – system – lane=planned – Prompt created.
