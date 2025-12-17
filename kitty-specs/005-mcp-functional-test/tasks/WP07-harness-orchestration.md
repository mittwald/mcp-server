---
work_package_id: WP07
title: Harness Orchestration
lane: done
history:
- timestamp: '2025-12-04T11:00:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
- timestamp: '2025-12-04T15:00:00Z'
  lane: doing
  agent: claude
  shell_pid: '72358'
  action: Started implementation
- timestamp: '2025-12-04T15:15:00Z'
  lane: for_review
  agent: claude
  shell_pid: '72358'
  action: 'Completed T042-T051: orchestration loop, queue, concurrency, integration'
- timestamp: '2025-12-10T07:22:16Z'
  lane: done
  agent: claude-sonnet-4.5
  shell_pid: '73991'
  action: 'Code review complete: Implementation approved - harness orchestration complete'
agent: claude-sonnet-4.5
assignee: claude
phase: Phase 3 - Integration
review_status: approved without changes
reviewed_by: claude-sonnet-4.5
shell_pid: '73991'
subtasks:
- T042
- T043
- T044
- T045
- T046
- T047
- T048
- T049
- T050
- T051
---

# Work Package Prompt: WP07 – Harness Orchestration 🎯 MVP

## Objectives & Success Criteria

- Orchestrate parallel test execution with 3-5 concurrent sessions (FR-003)
- Implement polling-based completion detection (FR-013)
- Handle rate limiting and eventual consistency (FR-013b, FR-013c)
- Wire all components together for end-to-end test execution

**Success Gate**: Run 3-5 tests concurrently; all complete without resource conflicts; manifest updated correctly.

## Context & Constraints

- **Reference Documents**:
  - `kitty-specs/005-mcp-functional-test/spec.md` - FR-003, FR-013, FR-013a-c
  - `kitty-specs/005-mcp-functional-test/contracts/harness-api.ts` - ITestHarness
  - `kitty-specs/005-mcp-functional-test/research.md` - Execution order
- **Concurrency**: 3-5 parallel sessions maximum
- **Polling**: 30-second intervals for Mittwald async operations
- **Model**: Test agents should use Claude Haiku model (`--model claude-3-haiku-20240307`) for cost efficiency
- **Depends on**: WP02, WP03, WP04, WP05, WP06 (all prior components)

## Subtasks & Detailed Guidance

### Subtask T042 – Implement main orchestration loop

- **Purpose**: Create the core harness entry point that runs tests.
- **Steps**:
  1. Update `src/harness/index.ts` with full implementation
  2. Implement `run(options?: TestExecutionOptions): Promise<TestSuiteResult>`
  3. Main loop structure:
     ```typescript
     async function run(options?: TestExecutionOptions): Promise<TestSuiteResult> {
       // 1. Initialize components
       const inventory = await loadToolInventory();
       const manifest = new ManifestManager();
       const coordinator = new Coordinator();
       const tracker = new ResourceTracker();

       // 2. Build test queue
       const queue = buildTestQueue(inventory, options);

       // 3. Run tests with concurrency control
       const pool = new SessionPool(options?.concurrency ?? 5);
       for (const test of queue) {
         await pool.acquire();
         runTest(test, pool, manifest, coordinator, tracker);
       }

       // 4. Wait for completion
       await pool.drain();

       // 5. Return results
       return buildSuiteResult(manifest);
     }
     ```
- **Files**: `tests/functional/src/harness/index.ts`
- **Parallel?**: No (foundation for T043-T51)

### Subtask T043 – Add test queue management

- **Purpose**: Build and prioritize the test queue based on tool inventory.
- **Steps**:
  1. Implement `buildTestQueue(inventory: IToolInventory, options?: TestExecutionOptions): TestQueueItem[]`
  2. Priority ordering:
     - Tier 0 first (no dependencies)
     - Tier 1 (org-level)
     - Tier 3 (project/create - clean-room)
     - Tier 4 (project-level, grouped by domain)
  3. Filter by options:
     - `options.tools`: specific tools only
     - `options.domains`: specific domains only
  4. Mark `project/create` as clean-room required
- **Files**: `tests/functional/src/harness/index.ts`
- **Parallel?**: No

### Subtask T044 – Implement concurrency control

- **Purpose**: Limit parallel sessions to 3-5 (FR-003).
- **Steps**:
  1. Create `SessionPool` class with semaphore pattern:
     ```typescript
     class SessionPool {
       private available: number;
       private waiting: Array<() => void> = [];

       async acquire(): Promise<void> {
         if (this.available > 0) {
           this.available--;
           return;
         }
         await new Promise<void>(resolve => this.waiting.push(resolve));
       }

       release(): void {
         const next = this.waiting.shift();
         if (next) next();
         else this.available++;
       }

       async drain(): Promise<void> {
         // Wait for all sessions to complete
       }
     }
     ```
  2. Acquire before spawning, release on completion
  3. Configurable via `options.concurrency` (default 5)
- **Files**: `tests/functional/src/harness/index.ts`
- **Parallel?**: No

### Subtask T045 – Integrate session runner, coordinator, manifest

- **Purpose**: Wire all components together for single test execution.
- **Steps**:
  1. Implement `runTest(test: TestQueueItem, ...)`:
     ```typescript
     async function runTest(test: TestQueueItem, ...): Promise<void> {
       // 1. Setup context (clean-room or harness-assisted)
       const context = await setupTestContext(test, tracker);

       // 2. Build prompt
       const prompt = buildTestPrompt(test.tool, context);

       // 3. Spawn session with Haiku model
       const session = await sessionRunner.spawn({
         prompt,
         disallowedTools: ['Bash(mw)'],
         mcpConfig: 'config/mcp-server.json',
         model: 'claude-3-haiku-20240307',  // Use Haiku for cost efficiency
       });

       // 4. Monitor with coordinator
       for await (const event of session.stream) {
         const decision = await coordinator.analyze({
           sessionId: session.sessionId,
           ...eventToInput(event)
         });
         if (decision.action === 'terminate') {
           session.kill();
           break;
         }
       }

       // 5. Record result
       const result = await session.result;
       await manifest.append({
         toolName: test.tool.name,
         sessionId: result.sessionId,
         status: result.status,
         ...
       });
     }
     ```
- **Files**: `tests/functional/src/harness/index.ts`
- **Parallel?**: No
- **Notes**: **IMPORTANT**: Pass `--model claude-3-haiku-20240307` to all spawned sessions for cost efficiency.

### Subtask T046 – Add polling-based completion detection

- **Purpose**: Detect Mittwald async operation completion (FR-013).
- **Steps**:
  1. After write operations, poll for confirmation
  2. Implement polling loop:
     ```typescript
     async function pollForCompletion(
       checkFn: () => Promise<boolean>,
       intervalMs: number = 30000,
       maxAttempts: number = 10
     ): Promise<boolean> {
       for (let i = 0; i < maxAttempts; i++) {
         if (await checkFn()) return true;
         await sleep(intervalMs);
       }
       return false;
     }
     ```
  3. Use 30-second intervals per spec
  4. Include in test prompts: "After creating, wait up to 5 minutes for confirmation"
- **Files**: `tests/functional/src/harness/index.ts`
- **Parallel?**: No

### Subtask T047 – Implement partial result recording

- **Purpose**: Record results even when sessions fail mid-way (FR-013a).
- **Steps**:
  1. On session error or interrupt, still append to manifest
  2. Use status `'interrupted'` for killed sessions
  3. Use status `'timeout'` for timeout
  4. Include partial metrics (duration up to failure)
  5. Include error message if available
- **Files**: `tests/functional/src/harness/index.ts`
- **Parallel?**: No

### Subtask T048 – Add rate limit handling

- **Purpose**: Respect Mittwald API rate limits (FR-013b).
- **Steps**:
  1. Monitor for 429 responses or rate limit headers
  2. Parse headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
  3. Implement exponential backoff:
     ```typescript
     async function withRateLimitRetry<T>(fn: () => Promise<T>): Promise<T> {
       let delay = 1000;
       for (let i = 0; i < 5; i++) {
         try {
           return await fn();
         } catch (e) {
           if (isRateLimited(e)) {
             await sleep(delay);
             delay *= 2;
             continue;
           }
           throw e;
         }
       }
       throw new Error('Rate limit exceeded after retries');
     }
     ```
- **Files**: `tests/functional/src/harness/index.ts`
- **Parallel?**: No
- **Notes**: Include rate limit guidance in test prompts for agents.

### Subtask T049 – Add eventual consistency retry logic

- **Purpose**: Handle 404/403 during propagation (FR-013c).
- **Steps**:
  1. After write operations, expect potential 404/403 for ~30 seconds
  2. Implement consistency-aware retry:
     ```typescript
     async function withConsistencyRetry<T>(
       fn: () => Promise<T>,
       maxWaitMs: number = 30000
     ): Promise<T> {
       const start = Date.now();
       while (Date.now() - start < maxWaitMs) {
         try {
           return await fn();
         } catch (e) {
           if (isConsistencyError(e)) {  // 404 or 403
             await sleep(1000);
             continue;
           }
           throw e;
         }
       }
       throw new Error('Resource not available after consistency window');
     }
     ```
- **Files**: `tests/functional/src/harness/index.ts`
- **Parallel?**: No

### Subtask T050 – Wire manifest appends after completion

- **Purpose**: Ensure all test results are recorded.
- **Steps**:
  1. After each session completes (success or failure), append to manifest
  2. Include all required fields from ManifestEntry
  3. Handle append errors gracefully (log, retry once)
  4. Update coverage statistics after each append
- **Files**: `tests/functional/src/harness/index.ts`
- **Parallel?**: No

### Subtask T051 – Wire cleanup after domain completion

- **Purpose**: Trigger domain cleanup when all domain tests finish.
- **Steps**:
  1. Track completed tests per domain
  2. When all tools in a domain have run:
     ```typescript
     if (isDomainComplete(domain)) {
       const result = await tracker.cleanupDomain(domain);
       logCleanupResult(result);
     }
     ```
  3. Continue testing other domains even if cleanup fails
  4. Log cleanup failures for manual intervention
- **Files**: `tests/functional/src/harness/index.ts`
- **Parallel?**: No

## Test Strategy

No unit tests specified. Validate by:
1. Run 5 Tier 0 tools (identity) in parallel
2. Verify all complete without conflicts
3. Verify manifest has 5 entries
4. Run `project/create` clean-room test
5. Run app tests with harness-assisted setup

## Risks & Mitigations

- **Complex integration**: Many moving parts. Build incrementally, test each addition.
- **Deadlocks**: Ensure semaphore always releases, even on error.
- **Cascade failures**: Isolate domain failures; don't fail entire suite.

## Definition of Done Checklist

- [ ] Main orchestration loop runs end-to-end
- [ ] Queue prioritizes tests by tier correctly
- [ ] Concurrency limited to configured max (3-5)
- [ ] All components wired together (session, coordinator, manifest, tracker)
- [ ] Polling uses 30-second intervals
- [ ] Partial results recorded on failure/interrupt
- [ ] Rate limiting handled with exponential backoff
- [ ] Eventual consistency retry (30s window) implemented
- [ ] Manifest appended after every test
- [ ] Domain cleanup triggered on domain completion
- [ ] Test agents use Haiku model (`claude-3-haiku-20240307`)
- [ ] `tasks.md` updated with completion status

## Review Guidance

- Run parallel tests and verify no deadlocks
- Verify rate limit handling doesn't cause infinite loops
- Check that cleanup only runs after ALL domain tests complete
- Confirm Haiku model flag is passed to spawned sessions

## Activity Log

> Append entries when the work package changes lanes.

- 2025-12-04T11:00:00Z – system – lane=planned – Prompt created.
- 2025-12-10T07:22:16Z – claude-sonnet-4.5 – shell_pid=73991 – lane=done – Code review complete: Implementation approved - harness orchestration complete
