---
work_package_id: "WP04"
subtasks:
  - "T019"
  - "T020"
  - "T021"
  - "T022"
  - "T023"
  - "T024"
  - "T025"
  - "T026"
title: "Use Case Type Definitions"
phase: "Phase 1 - Foundation"
lane: "doing"
assignee: "codex"
agent: "codex"
shell_pid: "8721"
history:
  - timestamp: "2025-12-05T10:15:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-05T09:39:28Z"
    lane: "doing"
    agent: "codex"
    shell_pid: "8721"
    action: "Started implementation"
---

# Work Package Prompt: WP04 – Use Case Type Definitions

## Objectives & Success Criteria

- Define TypeScript interfaces for all use case entities
- Create Zod validation schemas for JSON loading
- Enable type-safe use case handling throughout the system
- Foundation for WP05 (library) and WP06 (loader)

**Success Metric**: Type definitions compile and can represent sample use case JSON

## Context & Constraints

### Prerequisites
- None (foundational, can run parallel to WP01-WP03)

### Key References
- `kitty-specs/007-real-world-use/data-model.md` - Complete entity definitions
- `kitty-specs/007-real-world-use/spec.md` - FR-003 (use case structure)

### Constraints
- Follow data-model.md exactly
- Use Zod for runtime validation
- Export all types from single entry point

## Subtasks & Detailed Guidance

### Subtask T019 – Create UseCase interface with all required fields

- **Purpose**: Define the core use case structure.

- **Steps**:
  1. Create `tests/functional/src/use-cases/types.ts`
  2. Define UseCase interface per data-model.md
  3. Include all fields: id, title, description, domain, prompt, etc.
  4. Add JSDoc comments for each field

- **Files**:
  - Create: `tests/functional/src/use-cases/types.ts`

- **Parallel?**: Yes (with other interface subtasks)

- **Interface** (from data-model.md):
```typescript
export interface UseCase {
  /** Unique identifier (e.g., "apps-001-deploy-php") */
  id: string;
  /** Human-readable title */
  title: string;
  /** Detailed description of the scenario */
  description: string;
  /** Primary domain category */
  domain: UseCaseDomain;
  /** The naive prompt given to Claude (no tool hints) */
  prompt: string;
  /** Tool domains expected to be used */
  expectedDomains: UseCaseDomain[];
  /** Specific MCP tools expected (for coverage mapping) */
  expectedTools: string[];
  /** Observable criteria to verify success */
  successCriteria: SuccessCriterion[];
  /** Resources that need cleanup */
  cleanupRequirements: CleanupRequirement[];
  /** Predefined answers for common questions */
  questionAnswers: QuestionAnswer[];
  /** Estimated duration in minutes */
  estimatedDuration: number;
  /** Maximum allowed duration in minutes */
  timeout: number;
  /** Priority level */
  priority: 'P1' | 'P2' | 'P3';
  /** Tags for filtering */
  tags: string[];
}
```

### Subtask T020 – Create UseCaseExecution interface for runtime tracking

- **Purpose**: Track execution state and results.

- **Steps**:
  1. Define UseCaseExecution interface
  2. Include timing, status, artifacts, cleanup status
  3. Add ExecutionStatus type

- **Files**:
  - Modify: `tests/functional/src/use-cases/types.ts`

- **Parallel?**: Yes

- **Interface**:
```typescript
export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'failure'
  | 'timeout'
  | 'cleanup-failed';

export interface UseCaseExecution {
  id: string;
  useCaseId: string;
  startTime: Date;
  endTime?: Date;
  status: ExecutionStatus;
  sessionLogPath: string;
  toolsInvoked: string[];
  evidenceArtifacts: EvidenceArtifact[];
  cleanupStatus: CleanupStatus;
  errorMessage?: string;
  questionLog: QuestionLogEntry[];
}
```

### Subtask T021 – Create SuccessCriterion interface with verification config

- **Purpose**: Define how to verify use case success.

- **Steps**:
  1. Define SuccessCriterion with method field
  2. Create config interfaces for each verification type
  3. Use discriminated union for type safety

- **Files**:
  - Modify: `tests/functional/src/use-cases/types.ts`

- **Parallel?**: Yes

- **Interfaces**:
```typescript
export type VerificationMethod = 'playwright' | 'curl' | 'api' | 'log-pattern';

export interface SuccessCriterion {
  description: string;
  method: VerificationMethod;
  config: PlaywrightVerification | CurlVerification | ApiVerification | LogPatternVerification;
}

export interface PlaywrightVerification {
  url: string;
  waitForSelector?: string;
  expectedText?: string;
  captureScreenshot: boolean;
}

export interface CurlVerification {
  url: string;
  expectedStatus: number;
  bodyPattern?: string;
}

export interface ApiVerification {
  tool: string;
  params: Record<string, unknown>;
  expectedPattern: string;
}

export interface LogPatternVerification {
  pattern: string;
  minOccurrences: number;
}
```

### Subtask T022 – Create CleanupRequirement interface

- **Purpose**: Specify what resources to clean up.

- **Steps**:
  1. Define ResourceType enum
  2. Create CleanupRequirement interface
  3. Include deletion order for dependencies

- **Files**:
  - Modify: `tests/functional/src/use-cases/types.ts`

- **Parallel?**: Yes

- **Interfaces**:
```typescript
export type ResourceType =
  | 'project'
  | 'app'
  | 'database'
  | 'domain'
  | 'mailbox'
  | 'cronjob'
  | 'backup'
  | 'container'
  | 'ssh-key'
  | 'certificate';

export interface CleanupRequirement {
  resourceType: ResourceType;
  identificationMethod: 'log-parse' | 'naming-pattern' | 'explicit-id';
  deletionTool: string;
  order: number;
}
```

### Subtask T023 – Create QuestionAnswer interface for predefined responses

- **Purpose**: Define how to handle agent questions.

- **Steps**:
  1. Create QuestionAnswer interface
  2. Include pattern, answer, skip, escalate fields
  3. Add QuestionLogEntry for tracking

- **Files**:
  - Modify: `tests/functional/src/use-cases/types.ts`

- **Parallel?**: Yes

- **Interfaces**:
```typescript
export interface QuestionAnswer {
  questionPattern: string;
  answer: string;
  skip?: boolean;
  escalate?: boolean;
}

export interface QuestionLogEntry {
  timestamp: Date;
  question: string;
  action: 'answered' | 'skipped' | 'escalated';
  response?: string;
}
```

### Subtask T024 – Define UseCaseDomain type (10 domains from spec)

- **Purpose**: Enumerate all valid domains.

- **Steps**:
  1. Create UseCaseDomain union type
  2. Match domains from spec and inventory

- **Files**:
  - Modify: `tests/functional/src/use-cases/types.ts`

- **Parallel?**: No (used by other interfaces)

- **Type**:
```typescript
export type UseCaseDomain =
  | 'identity'
  | 'organization'
  | 'project-foundation'
  | 'apps'
  | 'containers'
  | 'databases'
  | 'domains-mail'
  | 'access-users'
  | 'automation'
  | 'backups';
```

### Subtask T025 – Add Zod validation schemas for JSON loading

- **Purpose**: Runtime validation when loading use case JSON.

- **Steps**:
  1. Add zod as dependency (if not present)
  2. Create Zod schema for UseCase
  3. Create schemas for all nested types
  4. Export parse function

- **Files**:
  - Modify: `tests/functional/src/use-cases/types.ts`

- **Parallel?**: No (needs all interfaces defined)

- **Example**:
```typescript
import { z } from 'zod';

export const UseCaseDomainSchema = z.enum([
  'identity', 'organization', 'project-foundation', 'apps',
  'containers', 'databases', 'domains-mail', 'access-users',
  'automation', 'backups'
]);

export const UseCaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  domain: UseCaseDomainSchema,
  prompt: z.string(),
  // ... rest of fields
});

export function parseUseCase(json: unknown): UseCase {
  return UseCaseSchema.parse(json);
}
```

### Subtask T026 – Create CoverageReport interface for tracking

- **Purpose**: Define structure for coverage reporting.

- **Steps**:
  1. Create CoverageReport interface
  2. Include per-tool statistics
  3. Add recommendation interface

- **Files**:
  - Modify: `tests/functional/src/use-cases/types.ts`

- **Parallel?**: Yes

- **Interfaces**:
```typescript
export interface CoverageReport {
  generatedAt: Date;
  executionIds: string[];
  totalTools: number;
  coveredTools: number;
  coveragePercent: number;
  toolStats: ToolStat[];
  uncoveredTools: string[];
  recommendations: CoverageRecommendation[];
}

export interface ToolStat {
  tool: string;
  domain: UseCaseDomain;
  invocationCount: number;
  useCases: string[];
}

export interface CoverageRecommendation {
  tool: string;
  suggestedScenario: string;
  priority: 'high' | 'medium' | 'low';
}
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Schema drift from JSON | Zod validates at load time |
| Missing optional fields | Use z.optional() and defaults |
| Type complexity | Keep interfaces focused, split if needed |

## Definition of Done Checklist

- [ ] T019: UseCase interface complete
- [ ] T020: UseCaseExecution interface complete
- [ ] T021: SuccessCriterion interfaces complete
- [ ] T022: CleanupRequirement interface complete
- [ ] T023: QuestionAnswer interfaces complete
- [ ] T024: UseCaseDomain type defined
- [ ] T025: Zod schemas validate sample JSON
- [ ] T026: CoverageReport interface complete
- [ ] All types exported from types.ts
- [ ] TypeScript compiles without errors

## Review Guidance

- **Key Checkpoint**: Create sample JSON and validate with Zod
- **Verify**: All fields from data-model.md are present
- **Verify**: Types are exported for use in other modules
- **Look For**: Optional vs required field handling

## Activity Log

- 2025-12-05T10:15:00Z – system – lane=planned – Prompt created.
- 2025-12-05T09:39:28Z – codex – shell_pid=8721 – lane=doing – Started implementation
