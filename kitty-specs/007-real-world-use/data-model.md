# Data Model: Real-World Use Case Functional Testing

**Date**: 2025-12-05
**Feature**: 007-real-world-use

## Core Entities

### UseCase

A test scenario definition representing a realistic Mittwald customer workflow.

```typescript
interface UseCase {
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

type UseCaseDomain =
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

### SuccessCriterion

An observable outcome that can be verified externally.

```typescript
interface SuccessCriterion {
  /** Description of what to verify */
  description: string;

  /** Verification method */
  method: 'playwright' | 'curl' | 'api' | 'log-pattern';

  /** Method-specific configuration */
  config: PlaywrightVerification | CurlVerification | ApiVerification | LogPatternVerification;
}

interface PlaywrightVerification {
  /** URL to visit */
  url: string;

  /** Selector to wait for */
  waitForSelector?: string;

  /** Expected text content */
  expectedText?: string;

  /** Whether to capture screenshot */
  captureScreenshot: boolean;
}

interface CurlVerification {
  /** URL to request */
  url: string;

  /** Expected HTTP status */
  expectedStatus: number;

  /** Expected response body pattern */
  bodyPattern?: string;
}

interface ApiVerification {
  /** MCP tool to call for verification */
  tool: string;

  /** Parameters for the tool */
  params: Record<string, unknown>;

  /** Expected result pattern */
  expectedPattern: string;
}

interface LogPatternVerification {
  /** Regex pattern to find in session log */
  pattern: string;

  /** Minimum occurrences required */
  minOccurrences: number;
}
```

### CleanupRequirement

Specification of resources to delete after use case completion.

```typescript
interface CleanupRequirement {
  /** Resource type to clean up */
  resourceType: ResourceType;

  /** How to identify the resource */
  identificationMethod: 'log-parse' | 'naming-pattern' | 'explicit-id';

  /** MCP tool to use for deletion */
  deletionTool: string;

  /** Order priority (lower = delete first) */
  order: number;
}

type ResourceType =
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
```

### QuestionAnswer

Predefined response for anticipated agent questions.

```typescript
interface QuestionAnswer {
  /** Pattern to match question text */
  questionPattern: string;

  /** Response to provide */
  answer: string;

  /** Whether to skip (not answer) this question type */
  skip?: boolean;

  /** Whether to escalate (stop execution) */
  escalate?: boolean;
}
```

### UseCaseExecution

A single execution of a use case capturing all runtime data.

```typescript
interface UseCaseExecution {
  /** Unique execution ID */
  id: string;

  /** Reference to use case definition */
  useCaseId: string;

  /** When execution started */
  startTime: Date;

  /** When execution ended */
  endTime?: Date;

  /** Current/final status */
  status: ExecutionStatus;

  /** Path to JSONL session log */
  sessionLogPath: string;

  /** Tools invoked during execution */
  toolsInvoked: string[];

  /** Evidence artifacts collected */
  evidenceArtifacts: EvidenceArtifact[];

  /** Cleanup results */
  cleanupStatus: CleanupStatus;

  /** Error message if failed */
  errorMessage?: string;

  /** Questions asked and answers provided */
  questionLog: QuestionLogEntry[];
}

type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'failure'
  | 'timeout'
  | 'cleanup-failed';
```

### EvidenceArtifact

A piece of evidence captured during verification.

```typescript
interface EvidenceArtifact {
  /** Artifact type */
  type: 'screenshot' | 'response' | 'log-excerpt';

  /** Path to artifact file */
  path: string;

  /** Which success criterion this verifies */
  criterionIndex: number;

  /** Timestamp of capture */
  timestamp: Date;

  /** Additional metadata */
  metadata: Record<string, unknown>;
}
```

### CleanupStatus

Results of resource cleanup.

```typescript
interface CleanupStatus {
  /** Overall cleanup result */
  status: 'complete' | 'partial' | 'failed' | 'skipped';

  /** Resources successfully deleted */
  deleted: DeletedResource[];

  /** Resources that failed to delete */
  failed: FailedResource[];
}

interface DeletedResource {
  type: ResourceType;
  id: string;
  tool: string;
}

interface FailedResource {
  type: ResourceType;
  id: string;
  tool: string;
  error: string;
}
```

### QuestionLogEntry

Record of a question-answer exchange during execution.

```typescript
interface QuestionLogEntry {
  /** When the question was detected */
  timestamp: Date;

  /** The question text from Claude */
  question: string;

  /** How it was handled */
  action: 'answered' | 'skipped' | 'escalated';

  /** The response provided (if answered) */
  response?: string;
}
```

### CoverageReport

Aggregated tool coverage across executions.

```typescript
interface CoverageReport {
  /** When the report was generated */
  generatedAt: Date;

  /** Executions included in this report */
  executionIds: string[];

  /** Total tools in inventory */
  totalTools: number;

  /** Tools invoked at least once */
  coveredTools: number;

  /** Coverage percentage */
  coveragePercent: number;

  /** Per-tool statistics */
  toolStats: ToolStat[];

  /** Tools never invoked */
  uncoveredTools: string[];

  /** Recommendations for closing gaps */
  recommendations: CoverageRecommendation[];
}

interface ToolStat {
  tool: string;
  domain: UseCaseDomain;
  invocationCount: number;
  useCases: string[];
}

interface CoverageRecommendation {
  tool: string;
  suggestedScenario: string;
  priority: 'high' | 'medium' | 'low';
}
```

### SupervisoryState

Internal state tracked by the supervisory controller.

```typescript
interface SupervisoryState {
  /** Current execution phase */
  phase: 'initializing' | 'executing' | 'verifying' | 'cleaning-up' | 'complete';

  /** Pending question awaiting response */
  pendingQuestion?: string;

  /** Success criteria met so far */
  criteriaMetCount: number;

  /** Total criteria to meet */
  criteriaTotalCount: number;

  /** Time remaining before timeout */
  timeRemainingMs: number;

  /** Consecutive errors detected */
  consecutiveErrors: number;

  /** Last activity timestamp */
  lastActivityAt: Date;
}
```

## File Formats

### Use Case Definition (JSON)

```json
{
  "id": "apps-001-deploy-php",
  "title": "Deploy PHP Application",
  "description": "Create a new project and deploy a PHP application with database",
  "domain": "apps",
  "prompt": "I need to set up a new website for my client. It's a PHP application that needs a MySQL database. The website should be accessible at a subdomain. Please create everything needed and give me the URL when it's ready.",
  "expectedDomains": ["project-foundation", "apps", "databases", "domains-mail"],
  "expectedTools": [
    "project/create",
    "app/create",
    "database/mysql/create",
    "domain/virtualhost/create"
  ],
  "successCriteria": [
    {
      "description": "Website responds with 200 OK",
      "method": "playwright",
      "config": {
        "url": "${APP_URL}",
        "expectedStatus": 200,
        "captureScreenshot": true
      }
    }
  ],
  "cleanupRequirements": [
    { "resourceType": "app", "identificationMethod": "log-parse", "deletionTool": "app/delete", "order": 1 },
    { "resourceType": "database", "identificationMethod": "log-parse", "deletionTool": "database/mysql/delete", "order": 2 },
    { "resourceType": "project", "identificationMethod": "log-parse", "deletionTool": "project/delete", "order": 3 }
  ],
  "questionAnswers": [
    { "questionPattern": "PHP version", "answer": "PHP 8.2" },
    { "questionPattern": "database name", "answer": "myapp_db" }
  ],
  "estimatedDuration": 5,
  "timeout": 15,
  "priority": "P1",
  "tags": ["deployment", "php", "mysql"]
}
```

### Execution Log (JSONL)

Same format as 005/006 session logs:
```jsonl
{"type":"user","message":{"role":"user","content":"I need to set up..."}}
{"type":"assistant","message":{"content":[{"type":"text","text":"I'll help you..."}]}}
{"type":"assistant","message":{"content":[{"type":"tool_use","id":"...","name":"mcp__mittwald__project/create","input":{...}}]}}
{"type":"tool_result","tool_use_id":"...","content":"..."}
```

### Coverage Report (JSON)

```json
{
  "generatedAt": "2025-12-05T10:00:00Z",
  "executionIds": ["exec-001", "exec-002"],
  "totalTools": 173,
  "coveredTools": 150,
  "coveragePercent": 86.7,
  "toolStats": [...],
  "uncoveredTools": ["backup/schedule/delete", ...],
  "recommendations": [
    {
      "tool": "backup/schedule/delete",
      "suggestedScenario": "Create and then remove a backup schedule",
      "priority": "medium"
    }
  ]
}
```
