/**
 * MCP Functional Test Harness - Internal API Contracts
 *
 * These interfaces define the contracts between harness components.
 * This is a design artifact, not executable code.
 */

// =============================================================================
// Session Runner Contracts
// =============================================================================

/**
 * Options for spawning a Claude Code headless session
 */
export interface SpawnSessionOptions {
  /** The test prompt to execute */
  prompt: string;

  /** Working directory for the session */
  workingDir: string;

  /** MCP server configuration */
  mcpConfig?: string;

  /** Tools to disallow (e.g., "Bash(mw)") */
  disallowedTools: string[];

  /** Additional environment variables */
  env?: Record<string, string>;

  /** Timeout in milliseconds (0 = no timeout) */
  timeoutMs?: number;
}

/**
 * Result of a completed session
 *
 * Status values (standardized across all components):
 * - 'passed': Test completed successfully with verified outcome
 * - 'failed': Test completed but failed verification or encountered errors
 * - 'timeout': Test exceeded time limit
 * - 'interrupted': Test was interrupted by coordinator or external signal
 */
export interface SessionResult {
  /** Claude's session ID */
  sessionId: string;

  /** Exit status (standardized: passed/failed/timeout/interrupted) */
  status: 'passed' | 'failed' | 'timeout' | 'interrupted';

  /** Final result text */
  result?: string;

  /** Error message if failed */
  error?: string;

  /** Execution metrics */
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
 * Session runner interface
 */
export interface ISessionRunner {
  /**
   * Spawn a new Claude Code session
   * @returns AsyncIterable of stream events, final result accessible via return
   */
  spawn(options: SpawnSessionOptions): Promise<{
    sessionId: string;
    stream: AsyncIterable<StreamEvent>;
    result: Promise<SessionResult>;
    kill: () => void;
  }>;
}

// =============================================================================
// Coordinator Contracts
// =============================================================================

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

  /** Recent streaming output */
  recentOutput: string[];

  /** Time since last activity */
  idleTimeMs: number;

  /** Detected patterns */
  patterns: {
    consecutiveErrors: number;
    retryAttempts: number;
    sameToolRepeated: number;
  };
}

/**
 * Coordinator interface (Haiku-powered)
 */
export interface ICoordinator {
  /**
   * Analyze session state and decide on action
   */
  analyze(input: CoordinatorInput): Promise<CoordinatorDecision>;

  /**
   * Get overall test suite status summary
   */
  getStatus(): CoordinatorStatus;
}

export interface CoordinatorStatus {
  activeSessions: number;
  queuedTests: number;
  completedTests: number;
  failedTests: number;
  currentPhase: string;
}

// =============================================================================
// Manifest Contracts
// =============================================================================

/**
 * Entry to append to the manifest
 */
export interface ManifestAppendOptions {
  toolName: string;
  sessionId: string;
  testId: string;
  status: 'passed' | 'failed' | 'timeout' | 'interrupted';
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
  coverage: number; // percentage
}

/**
 * Manifest manager interface
 */
export interface IManifestManager {
  /**
   * Append a test result (atomic, concurrent-safe)
   */
  append(entry: ManifestAppendOptions): Promise<void>;

  /**
   * Get coverage statistics
   */
  getCoverage(): Promise<CoverageReport>;

  /**
   * Get all entries for a specific tool
   */
  getToolHistory(toolName: string): Promise<ManifestAppendOptions[]>;
}

// =============================================================================
// Resource Tracker Contracts
// =============================================================================

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
 * Resource tracker interface
 */
export interface IResourceTracker {
  /**
   * Record a created resource
   */
  track(resource: ResourceCreateOptions): Promise<void>;

  /**
   * Get all resources for a domain
   */
  getByDomain(domain: string): Promise<ResourceCreateOptions[]>;

  /**
   * Mark resource as cleaned
   */
  markCleaned(resourceId: string): Promise<void>;

  /**
   * Cleanup all resources for a domain (in dependency order)
   */
  cleanupDomain(domain: string): Promise<CleanupResult>;
}

// =============================================================================
// Tool Inventory Contracts
// =============================================================================

/**
 * Tool discovery options
 */
export interface DiscoveryOptions {
  /** MCP server URL */
  serverUrl: string;

  /** Timeout for discovery */
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
 * Tool inventory interface
 */
export interface IToolInventory {
  /**
   * Discover tools from MCP server
   */
  discover(options: DiscoveryOptions): Promise<DiscoveredTool[]>;

  /**
   * Get tool by name
   */
  getTool(name: string): DiscoveredTool | undefined;

  /**
   * Get all tools in a domain
   */
  getByDomain(domain: string): DiscoveredTool[];

  /**
   * Get tools at a specific dependency tier
   */
  getByTier(tier: number): DiscoveredTool[];
}

// =============================================================================
// Harness Main Interface
// =============================================================================

/**
 * Test execution options
 */
export interface TestExecutionOptions {
  /** Specific tools to test (empty = all) */
  tools?: string[];

  /** Specific domains to test */
  domains?: string[];

  /** Maximum concurrent sessions */
  concurrency?: number;

  /** Clean-room mode (no harness setup) */
  cleanRoom?: boolean;

  /** Skip cleanup after tests */
  skipCleanup?: boolean;
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

/**
 * Main harness interface
 */
export interface ITestHarness {
  /**
   * Run the full test suite
   */
  run(options?: TestExecutionOptions): Promise<TestSuiteResult>;

  /**
   * Run tests for a single tool
   */
  runTool(toolName: string, cleanRoom?: boolean): Promise<SessionResult>;

  /**
   * Get current status
   */
  getStatus(): CoordinatorStatus;

  /**
   * Stop all running tests
   */
  stop(): Promise<void>;
}
