/**
 * MCP Functional Test Harness - Type Definitions
 *
 * Consolidated types from data-model.md and contracts/harness-api.ts
 */

// =============================================================================
// Domain & Status Types
// =============================================================================

/**
 * Functional test domains grouping tools by dependency chains
 */
export type TestDomain =
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

/**
 * Terminal test status values (final outcome)
 */
export type TestTerminalStatus = 'passed' | 'failed' | 'timeout' | 'interrupted';

/**
 * Full test status including in-progress states
 */
export type TestStatus = 'pending' | 'running' | TestTerminalStatus;

/**
 * Resource types that can be tracked for cleanup
 */
export type ResourceType =
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

/**
 * Tool test status for coverage tracking
 */
export type ToolTestStatus = 'untested' | 'passed' | 'failed';

/**
 * Tracked resource status for cleanup
 */
export type TrackedResourceStatus = 'active' | 'cleanup-pending' | 'cleaned' | 'cleanup-failed';

// =============================================================================
// Core Entities (from data-model.md)
// =============================================================================

/**
 * Reference to a resource created during a test session
 */
export interface ResourceRef {
  resourceId: string;
  resourceType: ResourceType;
}

/**
 * Represents a single Claude Code headless execution testing one or more MCP tools
 */
export interface TestSession {
  // Identity
  sessionId: string;
  testId: string;

  // Test context
  toolUnderTest: string;
  domain: TestDomain;
  prompt: string;

  // Timing
  startTime: Date;
  endTime?: Date;
  durationMs?: number;

  // Execution state
  status: TestStatus;

  // Results
  result?: string;
  errorMessage?: string;
  toolCallCount: number;

  // Resource tracking
  resourcesCreated: ResourceRef[];

  // Streaming state (for coordinator)
  lastActivityTime: Date;
  streamBuffer: string;
}

/**
 * Append-only record in the JSONL manifest file
 */
export interface ManifestEntry {
  // Required fields
  toolName: string;
  sessionId: string;
  testId: string;
  status: TestTerminalStatus;
  timestamp: string;

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

/**
 * Complete inventory of MCP tools with testing metadata
 */
export interface ToolInventory {
  discoveredAt: Date;
  serverUrl: string;
  totalTools: number;
  tools: Map<string, ToolEntry>;
}

/**
 * Individual tool entry with testing metadata
 */
export interface ToolEntry {
  // Identity
  name: string;
  displayName: string;
  description?: string;
  inputSchema?: unknown;

  // Categorization
  domain: TestDomain;
  tier: 0 | 1 | 2 | 3 | 4;

  // Testing requirements
  cleanRoomRequired: boolean;
  prerequisites?: string[];

  // Test execution
  testPrompt?: string;
  verificationPrompt?: string;

  // Coverage status
  testStatus: ToolTestStatus;
  lastTestedAt?: Date;
  lastSessionId?: string;
}

/**
 * Registry of resources created during testing
 */
export interface ResourceTracker {
  resources: Map<string, TrackedResource>;
  cleanupPending: Set<string>;
  cleanupFailed: Set<string>;
}

/**
 * Individual tracked resource
 */
export interface TrackedResource {
  // Identity
  resourceId: string;
  resourceType: ResourceType;

  // Naming
  name: string;

  // Ownership
  domain: TestDomain;
  createdBySession: string;
  createdByTest: string;
  createdAt: Date;

  // Hierarchy (for cleanup ordering)
  parentResourceId?: string;
  childResources: string[];

  // State
  status: TrackedResourceStatus;
}

/**
 * Reference to preserved Claude Code session logs
 */
export interface SessionLogRef {
  sessionId: string;
  testId: string;
  logPath: string;
  startTime: Date;
  endTime?: Date;
  lineCount: number;
  sizeBytes: number;
  preserved: boolean;
}

/**
 * State tracked by the Haiku meta-agent coordinator
 */
export interface CoordinatorState {
  activeSessions: Map<string, SessionMonitor>;
  maxConcurrent: number;
  currentConcurrent: number;
  pendingTests: TestQueueItem[];
  totalStarted: number;
  totalCompleted: number;
  totalFailed: number;
}

/**
 * Monitor state for an individual session
 */
export interface SessionMonitor {
  sessionId: string;
  testId: string;
  lastOutput: Date;
  outputBuffer: string[];
  consecutiveErrors: number;
  retryAttempts: number;
  stuckIndicators: number;
  interventionReason?: string;
  interventionTime?: Date;
}

/**
 * Item in the test queue
 */
export interface TestQueueItem {
  tool: ToolEntry;
  priority: number;
  prerequisites: string[];
  addedAt: Date;
}

// =============================================================================
// API Contracts (from contracts/harness-api.ts)
// =============================================================================

/**
 * Options for spawning a Claude Code headless session
 */
export interface SpawnSessionOptions {
  prompt: string;
  workingDir: string;
  mcpConfig?: string;
  disallowedTools: string[];
  env?: Record<string, string>;
  timeoutMs?: number;
}

/**
 * Result of a completed session
 */
export interface SessionResult {
  sessionId: string;
  status: TestTerminalStatus;
  result?: string;
  error?: string;
  metrics: {
    durationMs: number;
    totalCostUsd: number;
    numTurns: number;
  };
}

/**
 * Stream event from Claude Code headless mode
 */
export interface StreamEvent {
  type: 'message' | 'tool_use' | 'tool_result' | 'error' | 'result';
  timestamp: Date;
  content: unknown;
}

/**
 * Coordinator decision about a monitored session
 */
export interface CoordinatorDecision {
  action: 'continue' | 'intervene' | 'terminate';
  reason?: string;
  suggestion?: string;
}

/**
 * Input to coordinator for analysis
 */
export interface CoordinatorInput {
  sessionId: string;
  testId: string;
  toolUnderTest: string;
  recentOutput: string[];
  idleTimeMs: number;
  patterns: {
    consecutiveErrors: number;
    retryAttempts: number;
    sameToolRepeated: number;
  };
}

/**
 * Coordinator status summary
 */
export interface CoordinatorStatus {
  activeSessions: number;
  queuedTests: number;
  completedTests: number;
  failedTests: number;
  currentPhase: string;
}

/**
 * Entry to append to the manifest
 */
export interface ManifestAppendOptions {
  toolName: string;
  sessionId: string;
  testId: string;
  status: TestTerminalStatus;
  durationMs: number;
  toolCallCount: number;
  domain: string;
  errorMessage?: string;
}

/**
 * Coverage query result
 */
export interface CoverageReport {
  totalTools: number;
  testedTools: number;
  passedTools: number;
  failedTools: number;
  untestedTools: string[];
  coverage: number;
}

/**
 * Resource creation record
 */
export interface ResourceCreateOptions {
  resourceId: string;
  resourceType: string;
  name: string;
  domain: string;
  sessionId: string;
  testId: string;
  parentResourceId?: string;
}

/**
 * Cleanup result
 */
export interface CleanupResult {
  domain: string;
  total: number;
  cleaned: number;
  failed: number;
  failures: Array<{
    resourceId: string;
    error: string;
  }>;
}

/**
 * Tool discovery options
 */
export interface DiscoveryOptions {
  serverUrl: string;
  timeoutMs?: number;
}

/**
 * Discovered tool metadata
 */
export interface DiscoveredTool {
  name: string;
  description: string;
  inputSchema: unknown;
}

/**
 * Test execution options
 */
export interface TestExecutionOptions {
  tools?: string[];
  domains?: string[];
  concurrency?: number;
  cleanRoom?: boolean;
  skipCleanup?: boolean;
  serverUrl?: string;
}

/**
 * Test suite result
 */
export interface TestSuiteResult {
  startTime: Date;
  endTime: Date;
  durationMs: number;
  coverage: CoverageReport;
  domainResults: Array<{
    domain: string;
    passed: number;
    failed: number;
    cleanup: CleanupResult;
  }>;
  manifestPath: string;
  sessionLogsPath: string;
}

// =============================================================================
// Interface Contracts (for component implementations)
// =============================================================================

/**
 * Session runner interface
 */
export interface ISessionRunner {
  spawn(options: SpawnSessionOptions): Promise<{
    sessionId: string;
    stream: AsyncIterable<StreamEvent>;
    result: Promise<SessionResult>;
    kill: () => void;
  }>;
}

/**
 * Coordinator interface (Haiku-powered)
 */
export interface ICoordinator {
  analyze(input: CoordinatorInput): Promise<CoordinatorDecision>;
  getStatus(): CoordinatorStatus;
}

/**
 * Manifest manager interface
 */
export interface IManifestManager {
  append(entry: ManifestAppendOptions): Promise<void>;
  getCoverage(): Promise<CoverageReport>;
  getToolHistory(toolName: string): Promise<ManifestAppendOptions[]>;
}

/**
 * Resource tracker interface
 */
export interface IResourceTracker {
  track(resource: ResourceCreateOptions): Promise<void>;
  getByDomain(domain: string): Promise<ResourceCreateOptions[]>;
  markCleaned(resourceId: string): Promise<void>;
  cleanupDomain(domain: string): Promise<CleanupResult>;
}

/**
 * Tool inventory interface
 */
export interface IToolInventory {
  discover(options: DiscoveryOptions): Promise<DiscoveredTool[]>;
  getTool(name: string): DiscoveredTool | undefined;
  getByDomain(domain: string): DiscoveredTool[];
  getByTier(tier: number): DiscoveredTool[];
}

/**
 * Main harness interface
 */
export interface ITestHarness {
  run(options?: TestExecutionOptions): Promise<TestSuiteResult>;
  runTool(toolName: string, cleanRoom?: boolean): Promise<SessionResult>;
  getStatus(): CoordinatorStatus;
  stop(): Promise<void>;
}
