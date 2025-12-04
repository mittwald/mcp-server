# Data Model: MCP Functional Test Suite

**Date**: 2025-12-04
**Feature**: 005-mcp-functional-test

## Core Entities

### TestSession

Represents a single Claude Code headless execution testing one or more MCP tools.

```typescript
interface TestSession {
  // Identity
  sessionId: string;              // Claude Code session ID from JSON output
  testId: string;                 // Unique test execution ID (UUID)

  // Test context
  toolUnderTest: string;          // Primary tool being tested (e.g., "project/create")
  domain: TestDomain;             // Functional domain grouping
  prompt: string;                 // The test prompt sent to Claude

  // Timing
  startTime: Date;
  endTime?: Date;
  durationMs?: number;

  // Execution state
  status: 'pending' | 'running' | 'passed' | 'failed' | 'timeout' | 'interrupted';

  // Results
  result?: string;                // Final response from Claude
  errorMessage?: string;          // Error details if failed
  toolCallCount: number;          // Number of MCP tool invocations

  // Resource tracking
  resourcesCreated: ResourceRef[];  // Resources created during this session

  // Streaming state (for coordinator)
  lastActivityTime: Date;
  streamBuffer: string;           // Accumulated streaming output
}

type TestDomain =
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

### TestManifest (JSONL Record)

Append-only record in the JSONL manifest file. One line per test execution.

```typescript
interface ManifestEntry {
  // Required fields
  toolName: string;               // Tool tested (e.g., "mittwald_project_create")
  sessionId: string;              // Claude session ID
  testId: string;                 // Test execution ID
  status: 'passed' | 'failed' | 'timeout' | 'interrupted';
  timestamp: string;              // ISO 8601 timestamp

  // Metrics
  durationMs: number;
  toolCallCount: number;

  // Error tracking
  errorMessage?: string;

  // Domain info
  domain: TestDomain;

  // Metadata
  harnessVersion: string;
}

// JSONL format: one JSON object per line, no trailing commas
// {"toolName":"mittwald_project_create","sessionId":"abc123",...}\n
```

### ToolInventory

Complete inventory of MCP tools with testing metadata.

```typescript
interface ToolInventory {
  // Discovery metadata
  discoveredAt: Date;
  serverUrl: string;
  totalTools: number;

  // Tools indexed by name
  tools: Map<string, ToolEntry>;
}

interface ToolEntry {
  // Identity
  name: string;                   // MCP tool name (e.g., "mittwald_project_create")
  displayName: string;            // Human-readable (e.g., "project/create")

  // Categorization
  domain: TestDomain;
  tier: 0 | 1 | 2 | 3 | 4;       // Dependency tier

  // Testing requirements
  cleanRoomRequired: boolean;     // Needs fresh environment (no harness setup)
  prerequisites: string[];        // Tool names that must exist/succeed first

  // Test execution
  testPrompt?: string;            // Custom test prompt (or use default)
  verificationPrompt?: string;    // Prompt to verify action succeeded

  // Coverage status
  testStatus: 'untested' | 'passed' | 'failed';
  lastTestedAt?: Date;
  lastSessionId?: string;
}
```

### ResourceTracker

Registry of resources created during testing, enabling grouped cleanup.

```typescript
interface ResourceTracker {
  resources: Map<string, TrackedResource>;

  // Cleanup state
  cleanupPending: Set<string>;    // Resource IDs awaiting cleanup
  cleanupFailed: Set<string>;     // Resource IDs that failed to cleanup
}

interface TrackedResource {
  // Identity
  resourceId: string;             // Mittwald resource ID
  resourceType: ResourceType;

  // Naming
  name: string;                   // Full resource name (test-domain-timestamp-random)

  // Ownership
  domain: TestDomain;
  createdBySession: string;       // Session ID that created this
  createdByTest: string;          // Test ID that created this
  createdAt: Date;

  // Hierarchy (for cleanup ordering)
  parentResourceId?: string;      // e.g., project ID for an app
  childResources: string[];       // Resources that depend on this one

  // State
  status: 'active' | 'cleanup-pending' | 'cleaned' | 'cleanup-failed';
}

type ResourceType =
  | 'project'
  | 'app'
  | 'container'
  | 'stack'
  | 'volume'
  | 'registry'
  | 'database-mysql'
  | 'database-redis'
  | 'cronjob'
  | 'backup'
  | 'backup-schedule'
  | 'domain'
  | 'virtualhost'
  | 'mail-address'
  | 'mail-deliverybox'
  | 'sftp-user'
  | 'ssh-user';
```

### SessionLog

Reference to preserved Claude Code session logs.

```typescript
interface SessionLogRef {
  sessionId: string;
  testId: string;

  // Log location
  logPath: string;                // Path to JSONL log file in ~/.claude/projects/

  // Metadata
  startTime: Date;
  endTime?: Date;

  // Size tracking
  lineCount: number;
  sizeBytes: number;

  // Preservation status
  preserved: boolean;             // Whether retention config was applied
}
```

### CoordinatorState

State tracked by the Haiku meta-agent coordinator.

```typescript
interface CoordinatorState {
  // Active sessions being monitored
  activeSessions: Map<string, SessionMonitor>;

  // Concurrency control
  maxConcurrent: number;          // 3-5 per spec
  currentConcurrent: number;

  // Queue management
  pendingTests: TestQueueItem[];

  // Metrics
  totalStarted: number;
  totalCompleted: number;
  totalFailed: number;
}

interface SessionMonitor {
  sessionId: string;
  testId: string;

  // Stream monitoring
  lastOutput: Date;
  outputBuffer: string[];         // Recent output lines for pattern detection

  // Pattern detection
  consecutiveErrors: number;
  retryAttempts: number;
  stuckIndicators: number;        // Count of "stuck" signals

  // Coordinator decisions
  interventionReason?: string;
  interventionTime?: Date;
}

interface TestQueueItem {
  tool: ToolEntry;
  priority: number;               // Lower = higher priority
  prerequisites: string[];        // Test IDs that must complete first
  addedAt: Date;
}
```

## Relationships

```
┌─────────────────┐
│  ToolInventory  │
│  (discovered)   │
└────────┬────────┘
         │ provides tools to test
         ▼
┌─────────────────┐        ┌──────────────────┐
│  TestSession    │───────▶│  ResourceTracker │
│  (execution)    │creates │  (cleanup)       │
└────────┬────────┘        └──────────────────┘
         │ writes to
         ▼
┌─────────────────┐        ┌──────────────────┐
│  TestManifest   │        │  SessionLogRef   │
│  (JSONL append) │        │  (preservation)  │
└─────────────────┘        └──────────────────┘
         ▲                          ▲
         │                          │
         └────────┬─────────────────┘
                  │ coordinator monitors
         ┌────────┴────────┐
         │ CoordinatorState│
         │ (Haiku agent)   │
         └─────────────────┘
```

## State Transitions

### TestSession Lifecycle

```
pending → running → passed
                  → failed
                  → timeout
                  → interrupted
```

### TrackedResource Lifecycle

```
active → cleanup-pending → cleaned
                        → cleanup-failed
```

### ToolEntry Test Status

```
untested → passed
         → failed
```

## File Locations

| Entity | Storage | Format |
|--------|---------|--------|
| TestManifest | `tests/functional/output/manifest.jsonl` | JSONL (append-only) |
| ToolInventory | Runtime (discovered from MCP server) | In-memory Map |
| ResourceTracker | `tests/functional/output/resources.json` | JSON (atomic write) |
| SessionLogRef | `tests/functional/output/sessions/` | JSON per session |
| CoordinatorState | Runtime only | In-memory |
| Claude Logs | `~/.claude/projects/*/` | JSONL (Claude-managed) |
