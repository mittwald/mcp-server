# Data Model: Session Log Analysis

**Feature**: 006-session-log-analysis
**Date**: 2025-12-04

## Entities

### Session

A single Claude Code execution representing one MCP tool test.

```typescript
interface Session {
  id: string;                    // UUID from sessionId field
  filePath: string;              // Absolute path to JSONL file
  targetTool: string;            // MCP tool being tested (extracted from first user message)
  domain: TestDomain;            // Functional domain (from grouping.ts)
  events: Event[];               // Parsed log events
  subAgents: string[];           // IDs of child agent sessions
  parentSessionId?: string;      // If this is a sub-agent, link to parent

  // Metrics
  startTime: Date;
  endTime: Date;
  durationMs: number;
  totalTokens: number;
  toolCallCount: number;
  errorCount: number;
  outcome: 'success' | 'failure' | 'timeout' | 'unknown';
}
```

### Event

A single log entry from a session.

```typescript
interface Event {
  type: EventType;
  timestamp: Date;
  raw: Record<string, unknown>;  // Original JSON for debugging

  // Type-specific fields (populated based on type)
  toolCall?: ToolCall;
  toolResult?: ToolResult;
  message?: Message;
  tokenUsage?: TokenUsage;
}

type EventType =
  | 'queue-operation'
  | 'user'
  | 'assistant'
  | 'tool_use'
  | 'tool_result';

interface ToolCall {
  id: string;                    // call_id for correlation
  name: string;                  // Tool name (e.g., "Bash", "SlashCommand", "mcp__mittwald__...")
  input: Record<string, unknown>;
}

interface ToolResult {
  callId: string;                // Correlates to ToolCall.id
  isError: boolean;
  content: string;
  durationMs?: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string | ToolUseContent[];
}

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cachCreationTokens?: number;
}
```

### Incident

A detected confusion pattern.

```typescript
interface Incident {
  id: string;                    // Generated UUID
  type: IncidentType;
  severity: 'high' | 'medium' | 'low';
  severityScore: number;         // Numeric for ranking

  sessionId: string;             // Reference to Session.id
  toolAttempted?: string;        // What the LLM tried
  toolNeeded?: string;           // What it should have used

  tokenWaste: number;            // Tokens spent on failed/unnecessary operations
  timeWasteMs: number;           // Time spent on failed/unnecessary operations

  context: {
    eventRange: [number, number]; // Start/end event indices
    errorMessages: string[];      // Relevant error text
    description: string;          // Human-readable explanation
  };
}

type IncidentType =
  | 'wrong-tool-selection'
  | 'retry-loop'
  | 'unnecessary-delegation'
  | 'stuck-indicator'
  | 'capability-mismatch'
  | 'exploration-waste';
```

### Dependency

A directed edge in the tool dependency graph.

```typescript
interface Dependency {
  from: string;                  // Prerequisite tool
  to: string;                    // Dependent tool
  confidence: number;            // 0.0 - 1.0
  evidenceCount: number;         // Number of sessions supporting this
  evidenceSessions: string[];    // Session IDs as evidence
  type: 'sequence' | 'error-recovery';
}
```

### ToolChain

A recommended sequence of tools for a use case.

```typescript
interface ToolChain {
  id: string;
  useCase: string;               // Human-readable name
  description: string;           // What this achieves
  tools: string[];               // Ordered tool sequence
  requiredParams: Record<string, string>; // Parameter passing hints
  examplePrompt: string;         // Sample user prompt

  // Efficiency metrics
  avgTokens: number;
  avgDurationMs: number;
  successRate: number;

  // Evidence
  derivedFromSessions: string[];
}
```

### DomainReport

Aggregated analysis for one functional domain.

```typescript
interface DomainReport {
  domain: TestDomain;
  generatedAt: Date;

  // Coverage
  sessionCount: number;
  toolsTested: string[];
  toolsUntested: string[];       // Tools in domain with 0 sessions

  // Incidents
  incidents: Incident[];
  incidentsByType: Record<IncidentType, number>;
  totalTokenWaste: number;

  // Dependencies
  internalDependencies: Dependency[];  // Within domain
  externalDependencies: Dependency[];  // Cross-domain

  // Efficiency
  avgTokensPerSession: number;
  successRate: number;
  mostProblematicTool: string;

  // Recommendations
  recommendations: string[];
}
```

### CorpusIndex

Top-level index of all sessions.

```typescript
interface CorpusIndex {
  generatedAt: Date;
  inputDirectory: string;

  // Session lookup
  sessions: Record<string, Session>;
  byTool: Record<string, string[]>;     // toolName -> sessionIds
  byDomain: Record<TestDomain, string[]>;

  // Aggregates
  stats: {
    totalSessions: number;
    totalEvents: number;
    totalTokens: number;
    totalDurationMs: number;
    sessionsByOutcome: Record<Session['outcome'], number>;
  };
}
```

## Relationships

```
┌─────────────┐       ┌─────────────┐
│   Session   │ 1───* │    Event    │
└─────────────┘       └─────────────┘
       │
       │ 1───*
       ▼
┌─────────────┐
│  Incident   │
└─────────────┘

┌─────────────┐       ┌─────────────┐
│    Tool     │ *───* │ Dependency  │
└─────────────┘       └─────────────┘
       │
       │ *───*
       ▼
┌─────────────┐
│ ToolChain   │
└─────────────┘

┌─────────────┐       ┌─────────────┐
│   Domain    │ 1───* │   Session   │
└─────────────┘       └─────────────┘
       │
       │ 1───1
       ▼
┌─────────────┐
│DomainReport │
└─────────────┘
```

## Validation Rules

### Session
- `id` must be unique across corpus
- `targetTool` must be a valid MCP tool name
- `startTime` < `endTime`
- `events` must be ordered by timestamp

### Incident
- `severityScore` must be >= 0
- `tokenWaste` must be >= 0
- `sessionId` must reference existing session

### Dependency
- `confidence` must be 0.0 - 1.0
- `from` !== `to` (no self-loops)
- `evidenceCount` must equal `evidenceSessions.length`

### ToolChain
- `tools` must have at least 2 entries
- All tools must be valid MCP tool names
- `successRate` must be 0.0 - 1.0

## State Transitions

### Session.outcome

```
                    ┌──────────┐
                    │ unknown  │
                    └────┬─────┘
                         │ (parsed)
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │ success │    │ failure │    │ timeout │
    └─────────┘    └─────────┘    └─────────┘
```

Determined by:
- `success`: Final tool result has `isError: false`
- `failure`: Final tool result has `isError: true`
- `timeout`: Session ends with no final result
- `unknown`: Cannot determine from log structure

## Domain Enumeration

```typescript
type TestDomain =
  | 'identity'           // user/, login/, context/
  | 'organization'       // org/, extension/
  | 'project-foundation' // project/, server/
  | 'apps'               // app/
  | 'containers'         // container/, stack/, volume/, registry/
  | 'databases'          // database/
  | 'domains-mail'       // domain/, mail/
  | 'access-users'       // sftp/, ssh/
  | 'automation'         // cronjob/
  | 'backups';           // backup/
```

Imported from `tests/functional/src/inventory/grouping.ts`.
