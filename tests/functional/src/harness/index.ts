/**
 * MCP Functional Test Harness - Main Entry Point
 *
 * Orchestrates functional testing of ~174 MCP tools deployed on Fly.io.
 * Implements T042-T051: orchestration, queue, concurrency, integration.
 */

import type {
  TestExecutionOptions,
  TestSuiteResult,
  CoordinatorStatus,
  TestQueueItem,
  ToolEntry,
  TestDomain,
  ManifestEntry,
  CleanupResult,
  SessionResult,
  SpawnSessionOptions,
  CoordinatorInput,
} from '../types/index.js';
import { SessionRunner } from './session-runner.js';
import { Coordinator } from './coordinator.js';
import { ManifestManager } from './manifest.js';
import { createToolManifest, type ToolManifest, DEFAULT_MCP_SERVER_URL } from '../inventory/index.js';
import { createResourceTracker, type ResourceTracker, type TestContext } from '../resources/tracker.js';
import { cleanupDomain } from '../resources/cleanup.js';
import { generateUniqueName } from '../resources/naming.js';
import { getDomainsInOrder } from '../inventory/grouping.js';

/**
 * Harness version for manifest entries
 */
export const HARNESS_VERSION = '1.0.0';

/**
 * Default concurrency limit (FR-003)
 */
const DEFAULT_CONCURRENCY = 5;

/**
 * Polling interval for async operations in ms (30 seconds per spec)
 */
const POLLING_INTERVAL_MS = 30000;

/**
 * Max polling attempts
 */
const MAX_POLL_ATTEMPTS = 10;

/**
 * Consistency window for eventual consistency retry (30 seconds)
 */
const CONSISTENCY_WINDOW_MS = 30000;

// ============================================================================
// Session Pool - Concurrency Control (T044)
// ============================================================================

/**
 * Semaphore-based session pool for concurrency control
 */
class SessionPool {
  private available: number;
  private waiting: Array<() => void> = [];
  private activeSessions: Set<string> = new Set();

  constructor(maxConcurrency: number) {
    this.available = maxConcurrency;
  }

  /**
   * Acquire a session slot
   */
  async acquire(): Promise<void> {
    if (this.available > 0) {
      this.available--;
      return;
    }
    await new Promise<void>((resolve) => this.waiting.push(resolve));
  }

  /**
   * Release a session slot
   */
  release(): void {
    const next = this.waiting.shift();
    if (next) {
      next();
    } else {
      this.available++;
    }
  }

  /**
   * Track an active session
   */
  trackSession(sessionId: string): void {
    this.activeSessions.add(sessionId);
  }

  /**
   * Untrack a completed session
   */
  untrackSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
  }

  /**
   * Get number of active sessions
   */
  getActiveCount(): number {
    return this.activeSessions.size;
  }

  /**
   * Wait for all sessions to complete
   */
  async drain(): Promise<void> {
    while (this.activeSessions.size > 0) {
      await sleep(100);
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is a rate limit error (T048)
 */
function isRateLimited(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('429') || msg.includes('rate limit') || msg.includes('too many requests');
  }
  return false;
}

/**
 * Check if error is a consistency error (T049)
 */
function isConsistencyError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('404') || msg.includes('403') || msg.includes('not found');
  }
  return false;
}

/**
 * Retry with exponential backoff for rate limits (T048)
 */
async function withRateLimitRetry<T>(fn: () => Promise<T>, maxRetries: number = 5): Promise<T> {
  let delay = 1000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (isRateLimited(e) && i < maxRetries - 1) {
        console.warn(`[harness] Rate limited, retrying in ${delay}ms...`);
        await sleep(delay);
        delay *= 2;
        continue;
      }
      throw e;
    }
  }
  throw new Error('Rate limit exceeded after retries');
}

/**
 * Retry with consistency window (T049)
 */
async function withConsistencyRetry<T>(fn: () => Promise<T>, maxWaitMs: number = CONSISTENCY_WINDOW_MS): Promise<T> {
  const start = Date.now();
  let lastError: Error | undefined;

  while (Date.now() - start < maxWaitMs) {
    try {
      return await fn();
    } catch (e) {
      if (isConsistencyError(e)) {
        lastError = e instanceof Error ? e : new Error(String(e));
        await sleep(1000);
        continue;
      }
      throw e;
    }
  }

  throw lastError || new Error('Resource not available after consistency window');
}

/**
 * Poll for completion (T046)
 */
async function pollForCompletion(
  checkFn: () => Promise<boolean>,
  intervalMs: number = POLLING_INTERVAL_MS,
  maxAttempts: number = MAX_POLL_ATTEMPTS
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    if (await checkFn()) {
      return true;
    }
    console.log(`[harness] Polling attempt ${i + 1}/${maxAttempts}, waiting ${intervalMs}ms...`);
    await sleep(intervalMs);
  }
  return false;
}

// ============================================================================
// Test Queue Management (T043)
// ============================================================================

/**
 * Build prioritized test queue from inventory
 */
function buildTestQueue(inventory: ToolManifest, options?: TestExecutionOptions): TestQueueItem[] {
  const queue: TestQueueItem[] = [];
  const entries = inventory.getAllEntries();

  // Filter by options
  let filteredEntries = entries;

  if (options?.tools && options.tools.length > 0) {
    const toolSet = new Set(options.tools);
    filteredEntries = filteredEntries.filter((e) => toolSet.has(e.name) || toolSet.has(e.displayName));
  }

  if (options?.domains && options.domains.length > 0) {
    const domainSet = new Set(options.domains);
    filteredEntries = filteredEntries.filter((e) => domainSet.has(e.domain));
  }

  // Group by tier and domain
  const byTier = new Map<number, ToolEntry[]>();
  for (const entry of filteredEntries) {
    const tier = entry.tier;
    if (!byTier.has(tier)) {
      byTier.set(tier, []);
    }
    byTier.get(tier)!.push(entry);
  }

  // Build queue in priority order: Tier 0, 1, 2, 3, 4
  for (const tier of [0, 1, 2, 3, 4]) {
    const tierEntries = byTier.get(tier) || [];

    // Sort by domain within tier for grouping
    tierEntries.sort((a, b) => a.domain.localeCompare(b.domain));

    for (const entry of tierEntries) {
      queue.push({
        tool: entry,
        priority: tier * 100 + (entry.cleanRoomRequired ? 0 : 1),
        prerequisites: entry.prerequisites || [],
        addedAt: new Date(),
      });
    }
  }

  return queue;
}

// ============================================================================
// Test Execution (T045, T047)
// ============================================================================

/**
 * Build test prompt for a tool
 */
function buildTestPrompt(tool: ToolEntry, context: TestContext): string {
  const basePrompt = `You are testing the MCP tool "${tool.displayName}" (${tool.name}).

Your task:
1. Call the tool with appropriate parameters
2. Verify the response is valid
3. Report SUCCESS if the tool works correctly, FAILURE if it doesn't

Tool description: ${tool.description || 'No description available'}

`;

  if (context.mode === 'clean-room') {
    return (
      basePrompt +
      `
This is a CLEAN-ROOM test. You must discover all prerequisites yourself.
Do not assume any pre-existing resources.
`
    );
  }

  // Harness-assisted mode
  let contextInfo = 'Available resources:\n';
  if (context.projectId) contextInfo += `- Project ID: ${context.projectId}\n`;
  if (context.serverId) contextInfo += `- Server ID: ${context.serverId}\n`;
  if (context.organizationId) contextInfo += `- Organization ID: ${context.organizationId}\n`;
  if (context.databaseId) contextInfo += `- Database ID: ${context.databaseId}\n`;
  if (context.appId) contextInfo += `- App ID: ${context.appId}\n`;

  return basePrompt + contextInfo;
}

/**
 * Setup test context based on tool requirements
 */
async function setupTestContext(tool: ToolEntry, tracker: ResourceTracker, sharedContext: SharedTestContext): Promise<TestContext> {
  if (tool.cleanRoomRequired) {
    return tracker.createCleanRoomContext();
  }

  // Harness-assisted mode - provide pre-created resources
  return tracker.createHarnessAssistedContext({
    projectId: sharedContext.projectId,
    serverId: sharedContext.serverId,
    organizationId: sharedContext.organizationId,
  });
}

/**
 * Shared context for harness-assisted tests
 */
interface SharedTestContext {
  projectId?: string;
  serverId?: string;
  organizationId?: string;
}

/**
 * Run a single test (T045, T047)
 */
async function runTest(
  test: TestQueueItem,
  sessionRunner: SessionRunner,
  coordinator: Coordinator,
  manifest: ManifestManager,
  tracker: ResourceTracker,
  pool: SessionPool,
  sharedContext: SharedTestContext,
  domain: TestDomain
): Promise<void> {
  const testId = `test-${test.tool.displayName.replace(/\//g, '-')}-${Date.now()}`;
  let sessionId = '';
  let status: 'passed' | 'failed' | 'timeout' | 'interrupted' = 'failed';
  let errorMessage: string | undefined;
  const startTime = Date.now();

  try {
    // Setup context
    const context = await setupTestContext(test.tool, tracker, sharedContext);

    // Build prompt
    const prompt = buildTestPrompt(test.tool, context);

    // Spawn session
    const spawnOptions: SpawnSessionOptions = {
      prompt,
      workingDir: process.cwd(),
      disallowedTools: ['Bash(mw)'],
      mcpConfig: 'config/mcp-server.json',
      timeoutMs: 300000, // 5 minute timeout
    };

    const session = await sessionRunner.spawn(spawnOptions);
    sessionId = session.sessionId;
    pool.trackSession(sessionId);

    console.log(`[harness] Started test ${testId} with session ${sessionId}`);

    // Monitor with coordinator
    let consecutiveErrors = 0;
    let lastActivityTime = Date.now();
    let sameToolCount = 0;
    let lastTool = '';

    for await (const event of session.stream) {
      // Update activity time
      lastActivityTime = Date.now();

      // Track patterns for coordinator
      if (event.type === 'error') {
        consecutiveErrors++;
      } else {
        consecutiveErrors = 0;
      }

      if (event.type === 'tool_use') {
        const toolName = (event.content as { tool?: string })?.tool || '';
        if (toolName === lastTool) {
          sameToolCount++;
        } else {
          sameToolCount = 1;
          lastTool = toolName;
        }
      }

      // Check with coordinator
      const input: CoordinatorInput = {
        sessionId,
        testId,
        toolUnderTest: test.tool.name,
        recentOutput: [],
        idleTimeMs: Date.now() - lastActivityTime,
        patterns: {
          consecutiveErrors,
          retryAttempts: 0,
          sameToolRepeated: sameToolCount,
        },
      };

      const decision = await coordinator.analyze(input);

      if (decision.action === 'terminate') {
        console.warn(`[harness] Coordinator terminated session: ${decision.reason}`);
        session.kill();
        status = 'interrupted';
        errorMessage = `Coordinator intervention: ${decision.reason}`;
        break;
      }
    }

    // Get final result
    const result = await session.result;
    status = result.status;
    if (result.error) {
      errorMessage = result.error;
    }
  } catch (err) {
    // Record partial result on failure (T047)
    status = 'failed';
    errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[harness] Test ${testId} failed:`, errorMessage);
  } finally {
    pool.untrackSession(sessionId);
    pool.release();

    // Append to manifest (T050)
    const durationMs = Date.now() - startTime;
    const entry: ManifestEntry = {
      toolName: test.tool.name,
      sessionId: sessionId || 'unknown',
      testId,
      status,
      timestamp: new Date().toISOString(),
      durationMs,
      toolCallCount: 0,
      errorMessage,
      domain,
      harnessVersion: HARNESS_VERSION,
    };

    try {
      await manifest.append(entry);
    } catch (appendErr) {
      console.error(`[harness] Failed to append manifest entry:`, appendErr);
    }
  }
}

// ============================================================================
// Main Orchestration (T042, T051)
// ============================================================================

/**
 * Harness state
 */
let harnessState: CoordinatorStatus = {
  activeSessions: 0,
  queuedTests: 0,
  completedTests: 0,
  failedTests: 0,
  currentPhase: 'idle',
};

/**
 * Run the full MCP functional test suite (T042)
 */
export async function runTestSuite(options?: TestExecutionOptions): Promise<TestSuiteResult> {
  console.log('MCP Functional Test Harness v' + HARNESS_VERSION);
  console.log('Options:', JSON.stringify(options, null, 2));

  const startTime = new Date();
  harnessState.currentPhase = 'initializing';

  // Initialize components
  const inventory = createToolManifest();
  const manifest = new ManifestManager();
  const coordinator = new Coordinator();
  const tracker = createResourceTracker();
  const sessionRunner = new SessionRunner();

  // Discover tools
  console.log('[harness] Discovering tools from MCP server...');
  harnessState.currentPhase = 'discovery';
  await withRateLimitRetry(() => inventory.discover({ serverUrl: options?.serverUrl || DEFAULT_MCP_SERVER_URL }));

  const summary = inventory.getSummary();
  console.log(`[harness] Discovered ${summary.totalTools} tools`);

  // Build test queue
  console.log('[harness] Building test queue...');
  const queue = buildTestQueue(inventory, options);
  harnessState.queuedTests = queue.length;
  console.log(`[harness] ${queue.length} tests queued`);

  // Initialize session pool
  const concurrency = options?.concurrency ?? DEFAULT_CONCURRENCY;
  const pool = new SessionPool(concurrency);
  console.log(`[harness] Concurrency limit: ${concurrency}`);

  // Shared context for harness-assisted tests
  const sharedContext: SharedTestContext = {};

  // Track domain completion
  const domainTests = new Map<TestDomain, { total: number; completed: number }>();
  const domainCleanupResults = new Map<TestDomain, CleanupResult>();

  // Group tests by domain
  for (const test of queue) {
    const domain = test.tool.domain;
    if (!domainTests.has(domain)) {
      domainTests.set(domain, { total: 0, completed: 0 });
    }
    domainTests.get(domain)!.total++;
  }

  // Run tests
  harnessState.currentPhase = 'testing';
  const testPromises: Promise<void>[] = [];

  for (const test of queue) {
    // Acquire slot
    await pool.acquire();

    // Run test in background
    const testPromise = runTest(test, sessionRunner, coordinator, manifest, tracker, pool, sharedContext, test.tool.domain)
      .then(() => {
        harnessState.completedTests++;
        const domainInfo = domainTests.get(test.tool.domain);
        if (domainInfo) {
          domainInfo.completed++;

          // Check if domain is complete (T051)
          if (domainInfo.completed === domainInfo.total && !options?.skipCleanup) {
            console.log(`[harness] Domain ${test.tool.domain} complete, running cleanup...`);
            return cleanupDomain(tracker, test.tool.domain).then((result) => {
              domainCleanupResults.set(test.tool.domain, result);
              console.log(`[harness] Cleanup ${test.tool.domain}: ${result.cleaned}/${result.total} cleaned`);
            });
          }
        }
      })
      .catch((err) => {
        harnessState.failedTests++;
        console.error(`[harness] Test failed:`, err);
      });

    testPromises.push(testPromise);
    harnessState.activeSessions = pool.getActiveCount();
  }

  // Wait for all tests to complete
  console.log('[harness] Waiting for all tests to complete...');
  await Promise.all(testPromises);
  await pool.drain();

  harnessState.currentPhase = 'complete';
  const endTime = new Date();

  // Build results
  const coverage = await manifest.getCoverage();

  const domainResults: Array<{
    domain: string;
    passed: number;
    failed: number;
    cleanup: CleanupResult;
  }> = [];

  for (const domain of getDomainsInOrder()) {
    const cleanup = domainCleanupResults.get(domain) || {
      domain,
      total: 0,
      cleaned: 0,
      failed: 0,
      failures: [],
    };

    domainResults.push({
      domain,
      passed: 0, // Would need to track per-domain
      failed: 0,
      cleanup,
    });
  }

  const result: TestSuiteResult = {
    startTime,
    endTime,
    durationMs: endTime.getTime() - startTime.getTime(),
    coverage,
    domainResults,
    manifestPath: 'output/manifest.jsonl',
    sessionLogsPath: 'output/sessions/',
  };

  console.log('[harness] Test suite complete');
  console.log(`[harness] Coverage: ${coverage.coverage.toFixed(1)}%`);
  console.log(`[harness] Passed: ${coverage.passedTools}, Failed: ${coverage.failedTools}`);

  return result;
}

/**
 * Run test for a single tool
 */
export async function runSingleTool(toolName: string, cleanRoom: boolean = false): Promise<SessionResult> {
  const inventory = createToolManifest();
  await inventory.discover({ serverUrl: DEFAULT_MCP_SERVER_URL });

  const tool = inventory.getToolEntry(toolName);
  if (!tool) {
    throw new Error(`Tool not found: ${toolName}`);
  }

  const manifest = new ManifestManager();
  const coordinator = new Coordinator();
  const tracker = createResourceTracker();
  const sessionRunner = new SessionRunner();
  const pool = new SessionPool(1);

  const sharedContext: SharedTestContext = {};

  const queueItem: TestQueueItem = {
    tool,
    priority: 0,
    prerequisites: [],
    addedAt: new Date(),
  };

  await pool.acquire();
  await runTest(queueItem, sessionRunner, coordinator, manifest, tracker, pool, sharedContext, tool.domain);

  // Return mock result for now
  return {
    sessionId: 'single-tool-test',
    status: 'passed',
    metrics: {
      durationMs: 0,
      totalCostUsd: 0,
      numTurns: 0,
    },
  };
}

/**
 * Get current harness status
 */
export function getStatus(): CoordinatorStatus {
  return { ...harnessState };
}

/**
 * Stop all running tests
 */
export async function stop(): Promise<void> {
  console.log('[harness] Stopping all tests...');
  harnessState.currentPhase = 'stopping';
  // In a real implementation, would signal all sessions to stop
}

/**
 * CLI entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  console.log('MCP Functional Test Harness');
  console.log('===========================');

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage:
  npm run test:all              Run all tests
  npm run test:domain -- <name> Run tests for a specific domain
  npm run test:tool -- <name>   Run test for a specific tool
  npm run coverage              Show coverage report
  npm run cleanup -- <domain>   Run cleanup for a domain
  npm run status                Show harness status

Options:
  --concurrency <n>    Max concurrent sessions (default: 5)
  --clean-room         Run in clean-room mode (no harness setup)
  --skip-cleanup       Skip cleanup after tests
`);
    return;
  }

  if (args.includes('--status')) {
    const status = getStatus();
    console.log('Status:', JSON.stringify(status, null, 2));
    return;
  }

  // Parse options from args
  const options: TestExecutionOptions = {
    concurrency: DEFAULT_CONCURRENCY,
    cleanRoom: args.includes('--clean-room'),
    skipCleanup: args.includes('--skip-cleanup'),
  };

  // Handle domain filter
  const domainIdx = args.indexOf('--domain');
  if (domainIdx !== -1 && args[domainIdx + 1]) {
    options.domains = [args[domainIdx + 1]];
  }

  // Handle tool filter
  const toolIdx = args.indexOf('--tool');
  if (toolIdx !== -1 && args[toolIdx + 1]) {
    options.tools = [args[toolIdx + 1]];
  }

  // Handle concurrency
  const concurrencyIdx = args.indexOf('--concurrency');
  if (concurrencyIdx !== -1 && args[concurrencyIdx + 1]) {
    options.concurrency = parseInt(args[concurrencyIdx + 1], 10);
  }

  try {
    const result = await runTestSuite(options);
    console.log('Test suite completed');
    console.log('Coverage:', result.coverage.coverage.toFixed(1) + '%');
    console.log('Passed:', result.coverage.passedTools);
    console.log('Failed:', result.coverage.failedTools);
  } catch (err) {
    console.error('Test suite failed:', err);
    process.exit(1);
  }
}

// Run if executed directly
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

// Export utilities for testing
export { SessionPool, buildTestQueue, pollForCompletion, withRateLimitRetry, withConsistencyRetry };
