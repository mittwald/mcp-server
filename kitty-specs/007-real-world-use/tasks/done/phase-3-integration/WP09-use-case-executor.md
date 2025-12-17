---
work_package_id: WP09
title: Use Case Executor
lane: done
history:
- timestamp: '2025-12-05T10:15:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
agent: claude
assignee: claude
phase: Phase 3 - Integration
shell_pid: '68317'
subtasks:
- T056
- T057
- T058
- T059
- T060
- T061
- T062
- T063
---

# Work Package Prompt: WP09 – Use Case Executor

## Objectives & Success Criteria

- Execute use cases end-to-end: load → execute → verify → cleanup
- Integrate all components: controller, evidence, cleanup
- Preserve session logs and generate execution reports
- Handle phase failures gracefully

**Success Metric**: Can execute a use case through all phases and produce summary

## Context & Constraints

### Prerequisites
- WP03: Supervisory Controller
- WP06: Use Case Loader
- WP07: Evidence Collection
- WP08: Resource Cleanup

### Key References
- `kitty-specs/007-real-world-use/data-model.md` - UseCaseExecution
- `kitty-specs/007-real-world-use/spec.md` - FR-020

### Constraints
- Cleanup runs even if verification fails
- Session logs preserved in JSONL format
- Each execution isolated and self-contained

## Subtasks & Detailed Guidance

### Subtask T056 – Create executor.ts with executeUseCase() function

- **Purpose**: Main orchestration function for use case execution.

- **Steps**:
  1. Create `tests/functional/src/use-cases/executor.ts`
  2. Implement `executeUseCase(useCase: UseCase): Promise<UseCaseExecution>`
  3. Coordinate all phases
  4. Return complete execution result

- **Files**:
  - Create: `tests/functional/src/use-cases/executor.ts`

- **Parallel?**: No (orchestrator)

- **Example**:
```typescript
import { UseCase, UseCaseExecution, ExecutionStatus } from './types';
import { SupervisoryController } from '../harness/supervisory-controller';
import { EvidenceCollector } from '../verification/evidence-collector';
import { CleanupExecutor } from '../cleanup/cleanup-executor';

export class UseCaseExecutor {
  async execute(useCase: UseCase): Promise<UseCaseExecution> {
    const execution: UseCaseExecution = {
      id: this.generateExecutionId(useCase),
      useCaseId: useCase.id,
      startTime: new Date(),
      status: 'running',
      sessionLogPath: '',
      toolsInvoked: [],
      evidenceArtifacts: [],
      cleanupStatus: { status: 'skipped', deleted: [], failed: [] },
      questionLog: []
    };

    try {
      // Phase 1: Execute
      await this.executePhase(useCase, execution);

      // Phase 2: Verify
      await this.verifyPhase(useCase, execution);

      // Phase 3: Cleanup (always runs)
      await this.cleanupPhase(useCase, execution);

      execution.status = 'success';
    } catch (error) {
      execution.status = 'failure';
      execution.errorMessage = String(error);
    } finally {
      execution.endTime = new Date();
    }

    return execution;
  }
}
```

### Subtask T057 – Integrate SupervisoryController for execution control

- **Purpose**: Use controller for session management during execution.

- **Steps**:
  1. Create controller instance with use case config
  2. Start controller and spawn Claude session
  3. Monitor events for state changes
  4. Extract tools invoked from session

- **Files**:
  - Modify: `tests/functional/src/use-cases/executor.ts`

- **Parallel?**: No

- **Example**:
```typescript
private async executePhase(useCase: UseCase, execution: UseCaseExecution): Promise<void> {
  const controller = new SupervisoryController(useCase);

  controller.on('state_change', (event) => {
    console.log(`State: ${event.from} → ${event.to}`);
  });

  controller.on('question_handled', (event) => {
    execution.questionLog.push({
      timestamp: new Date(),
      question: event.question,
      action: event.action,
      response: event.answer
    });
  });

  // Start execution
  const result = await controller.run(useCase.prompt);

  execution.sessionLogPath = result.sessionLogPath;
  execution.toolsInvoked = result.toolsInvoked;

  if (result.status === 'timeout') {
    execution.status = 'timeout';
    throw new Error('Execution timed out');
  }

  if (result.status === 'failure') {
    throw new Error(result.errorMessage || 'Execution failed');
  }
}
```

### Subtask T058 – Integrate EvidenceCollector for verification phase

- **Purpose**: Collect evidence after successful execution.

- **Steps**:
  1. Create evidence collector instance
  2. Pass success criteria from use case
  3. Collect evidence artifacts
  4. Update execution with results

- **Files**:
  - Modify: `tests/functional/src/use-cases/executor.ts`

- **Parallel?**: No

- **Example**:
```typescript
private async verifyPhase(useCase: UseCase, execution: UseCaseExecution): Promise<void> {
  if (useCase.successCriteria.length === 0) {
    console.log('No success criteria to verify');
    return;
  }

  const evidenceDir = this.getEvidenceDir(execution.id);
  const collector = new EvidenceCollector();

  await collector.init();
  try {
    const { artifacts, allPassed } = await collector.collectEvidence(
      useCase.successCriteria,
      evidenceDir
    );

    execution.evidenceArtifacts = artifacts;

    if (!allPassed) {
      console.log('Some verification criteria failed');
      // Don't throw - continue to cleanup
    }
  } finally {
    await collector.close();
  }
}
```

### Subtask T059 – Integrate CleanupExecutor for cleanup phase

- **Purpose**: Clean up resources even if previous phases failed.

- **Steps**:
  1. Parse session log for created resources
  2. Create cleanup executor
  3. Execute cleanup
  4. Record cleanup status

- **Files**:
  - Modify: `tests/functional/src/use-cases/executor.ts`

- **Parallel?**: No

- **Example**:
```typescript
private async cleanupPhase(useCase: UseCase, execution: UseCaseExecution): Promise<void> {
  try {
    const tracker = new ResourceTracker();
    await tracker.parseSessionLog(execution.sessionLogPath);

    const resources = tracker.getAll();
    if (resources.length === 0) {
      console.log('No resources to clean up');
      execution.cleanupStatus = { status: 'complete', deleted: [], failed: [] };
      return;
    }

    const cleaner = new CleanupExecutor();
    execution.cleanupStatus = await cleaner.cleanup(resources);

    if (execution.cleanupStatus.status === 'failed') {
      execution.status = 'cleanup-failed';
    }
  } catch (error) {
    execution.cleanupStatus = {
      status: 'failed',
      deleted: [],
      failed: [{ type: 'unknown' as any, id: 'unknown', tool: 'unknown', error: String(error) }]
    };
  }
}
```

### Subtask T060 – Preserve session logs in JSONL format

- **Purpose**: Keep complete session records for analysis.

- **Steps**:
  1. Configure session log path per execution
  2. Ensure StreamParser writes to correct location
  3. Add session log path to execution result
  4. Verify log is complete after execution

- **Files**:
  - Modify: `tests/functional/src/use-cases/executor.ts`

- **Parallel?**: No

- **Log Path Format**:
```
tests/functional/session-logs/007-real-world-use/{usecase-id}-{timestamp}.jsonl
```

### Subtask T061 – Generate UseCaseExecution result object

- **Purpose**: Complete execution summary for reporting.

- **Steps**:
  1. Populate all fields of UseCaseExecution
  2. Calculate duration
  3. Include all artifacts and status
  4. Write execution summary JSON

- **Files**:
  - Modify: `tests/functional/src/use-cases/executor.ts`

- **Parallel?**: No

- **Example Summary**:
```json
{
  "id": "apps-001-deploy-php-app-2025-12-05T10-30-00",
  "useCaseId": "apps-001-deploy-php-app",
  "startTime": "2025-12-05T10:30:00Z",
  "endTime": "2025-12-05T10:35:00Z",
  "durationSeconds": 300,
  "status": "success",
  "sessionLogPath": "session-logs/007-real-world-use/apps-001-...",
  "toolsInvoked": ["project/create", "app/create", "database/mysql/create"],
  "evidenceArtifacts": [{"type": "screenshot", "path": "..."}],
  "cleanupStatus": {"status": "complete", "deleted": [...], "failed": []},
  "questionLog": [{"question": "PHP version?", "action": "answered", "response": "PHP 8.2"}]
}
```

### Subtask T062 – Implement execution phases: init → execute → verify → cleanup → report

- **Purpose**: Clear phase structure with logging.

- **Steps**:
  1. Add phase logging
  2. Emit phase events for monitoring
  3. Track phase timing
  4. Handle phase transitions

- **Files**:
  - Modify: `tests/functional/src/use-cases/executor.ts`

- **Parallel?**: No

- **Phase Flow**:
```
[10:30:00] Phase: INIT
[10:30:01] Phase: EXECUTE
[10:35:00] Phase: VERIFY
[10:35:30] Phase: CLEANUP
[10:36:00] Phase: REPORT
[10:36:01] Complete: SUCCESS
```

### Subtask T063 – Handle phase failures with graceful degradation

- **Purpose**: Continue to cleanup even when earlier phases fail.

- **Steps**:
  1. Wrap each phase in try-catch
  2. Record phase errors
  3. Always attempt cleanup
  4. Set final status based on failures

- **Files**:
  - Modify: `tests/functional/src/use-cases/executor.ts`

- **Parallel?**: No

- **Degradation Rules**:
- Execute fails → Skip verify → Run cleanup → Status: failure
- Verify fails → Run cleanup → Status: success (but criteria not met)
- Cleanup fails → Status: cleanup-failed

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Long execution blocks resources | Timeout enforcement from WP03 |
| Cleanup never runs on crash | Add signal handlers, try-finally |
| Phase errors cascade badly | Isolated phase execution with clear boundaries |

## Definition of Done Checklist

- [x] T056: executeUseCase() function created
- [x] T057: SupervisoryController integrated
- [x] T058: EvidenceCollector integrated
- [x] T059: CleanupExecutor integrated
- [x] T060: Session logs preserved correctly
- [x] T061: UseCaseExecution result complete
- [x] T062: Phase logging implemented
- [x] T063: Graceful degradation working
- [x] Can execute a use case end-to-end

## Review Guidance

- **Key Checkpoint**: Execute a simple use case and verify all phases run
- **Verify**: Cleanup runs even when execution fails
- **Verify**: Session logs are complete and parseable
- **Look For**: Resource leaks, orphaned processes

## Activity Log

- 2025-12-05T10:15:00Z – system – lane=planned – Prompt created.
- 2025-12-05T11:35:00Z – claude – shell_pid=68317 – lane=doing – Started implementation
- 2025-12-05T11:50:00Z – claude – shell_pid=68317 – lane=for_review – Implementation complete
- 2025-12-05T12:10:00Z – claude – shell_pid=72766 – lane=done – APPROVED: All T056-T063 subtasks verified. Executor.ts compiles cleanly, integrates with WP03/WP07/WP08 dependencies, instantiates successfully. 5-phase execution flow with graceful degradation implemented correctly.

## Implementation Notes

### Created Files
- `tests/functional/src/use-cases/executor.ts` - Full use case executor implementation (500 lines)

### Implementation Details

**UseCaseExecutor class** extends EventEmitter with:
- 5-phase execution: init → execute → verify → cleanup → report
- Event emission for monitoring (`phase` events with PhaseEvent interface)
- Configurable options: sessionLogRoot, evidenceRoot, executionRoot, workingDir, mcpConfig, deletionInvoker, disallowedTools

**executePhase()** integrates:
- SessionRunner with interactive mode for mid-session injection
- StreamParser for parsing Claude output
- SupervisoryController for state management and question handling
- Tool tracking via tool_use events
- Session logging to JSONL format

**verifyPhase()** integrates:
- EvidenceCollector with success criteria
- Converts criterion results to EvidenceArtifact[]

**cleanupPhase()** integrates:
- ResourceTracker to parse session log for created resources
- CleanupExecutor with custom DeletionInvoker pattern
- Always runs even if previous phases fail

**Graceful degradation**:
- Execute fails → Skip verify → Run cleanup → Status: failure
- Verify fails → Run cleanup → Status: success (criteria status tracked separately)
- Cleanup fails → Status: cleanup-failed

**Exports**:
- `UseCaseExecutor` class
- `createUseCaseExecutor()` factory function
- `executeUseCase()` convenience function
- `ExecutorOptions`, `PhaseEvent`, `ExecutionPhase` types
