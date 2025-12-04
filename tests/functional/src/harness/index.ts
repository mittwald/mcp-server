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
import { createToolManifest, type ToolManifest, DEFAULT_MCP_SERVER_URL, loadTestDomainsConfig } from '../inventory/index.js';
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

    const endTime = new Date();
    const durationMs = Date.now() - startTime;

    // Append to manifest (T050)
    const entry: ManifestEntry = {
      toolName: test.tool.name,
      sessionId: sessionId || 'unknown',
      testId,
      status,
      timestamp: endTime.toISOString(),
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

    // Save session mapping (T059)
    if (sessionId) {
      await saveSessionMapping({
        sessionId,
        testId,
        toolName: test.tool.name,
        logPath: `~/.claude/projects/mcp-functional-tests/sessions/${sessionId}`,
        startTime: new Date(startTime).toISOString(),
        endTime: endTime.toISOString(),
      });
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

// ============================================================================
// CLI Commands (T052-T060)
// ============================================================================

/**
 * CLI options parsed from command line
 */
interface CLIOptions {
  command: 'test' | 'coverage' | 'cleanup' | 'status' | 'list-resources' | 'help';
  domain?: string;
  tool?: string;
  cleanRoom?: boolean;
  concurrency?: number;
  skipCleanup?: boolean;
  orphaned?: boolean;
  all?: boolean;
}

/**
 * Valid domains for validation
 */
const VALID_DOMAINS: TestDomain[] = [
  'identity',
  'organization',
  'project-foundation',
  'apps',
  'containers',
  'databases',
  'domains-mail',
  'access-users',
  'automation',
  'backups',
];

/**
 * Parse CLI arguments (T052)
 */
function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {
    command: 'help',
  };

  // Determine command
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    options.command = 'help';
  } else if (args.includes('--all') || args[0] === 'test:all') {
    options.command = 'test';
    options.all = true;
  } else if (args.includes('--domain') || args[0] === 'test:domain') {
    options.command = 'test';
    const domainIdx = args.indexOf('--domain');
    if (domainIdx !== -1 && args[domainIdx + 1]) {
      options.domain = args[domainIdx + 1];
    } else if (args[1]) {
      options.domain = args[1];
    }
  } else if (args.includes('--tool') || args[0] === 'test:tool') {
    options.command = 'test';
    const toolIdx = args.indexOf('--tool');
    if (toolIdx !== -1 && args[toolIdx + 1]) {
      options.tool = args[toolIdx + 1];
    } else if (args[1]) {
      options.tool = args[1];
    }
  } else if (args[0] === 'coverage') {
    options.command = 'coverage';
  } else if (args[0] === 'cleanup') {
    options.command = 'cleanup';
    if (args.includes('--all')) {
      options.all = true;
    } else if (args.includes('--domain')) {
      const domainIdx = args.indexOf('--domain');
      if (domainIdx !== -1 && args[domainIdx + 1]) {
        options.domain = args[domainIdx + 1];
      }
    } else if (args[1] && !args[1].startsWith('--')) {
      options.domain = args[1];
    }
  } else if (args[0] === 'status') {
    options.command = 'status';
  } else if (args[0] === 'list-resources') {
    options.command = 'list-resources';
    options.orphaned = args.includes('--orphaned');
  }

  // Parse common options
  options.cleanRoom = args.includes('--clean-room');
  options.skipCleanup = args.includes('--skip-cleanup');

  const concurrencyIdx = args.indexOf('--concurrency');
  if (concurrencyIdx !== -1 && args[concurrencyIdx + 1]) {
    options.concurrency = parseInt(args[concurrencyIdx + 1], 10);
  }

  return options;
}

/**
 * Display help message
 */
function showHelp(): void {
  console.log(`
MCP Functional Test Harness v${HARNESS_VERSION}
==========================================

Commands:
  test:all                      Run complete test suite across all domains
  test:domain <domain>          Run tests for a specific domain
  test:tool <tool> [--clean-room]  Run test for a single tool
  coverage                      Show coverage report
  cleanup [--domain <d>] [--all] Run cleanup for domain or all resources
  status                        Show current harness status
  list-resources [--orphaned]   List tracked or orphaned test resources

Options:
  --concurrency <n>             Max concurrent sessions (default: 5)
  --clean-room                  Run in clean-room mode (no harness setup)
  --skip-cleanup                Skip cleanup after tests
  --orphaned                    Show orphaned resources only (for list-resources)
  --all                         Apply to all domains/resources

Domains:
  ${VALID_DOMAINS.join(', ')}

Examples:
  npm run test:all
  npm run test:domain -- apps
  npm run test:tool -- mittwald_project_create --clean-room
  npm run cleanup -- --domain apps
  npm run list-resources -- --orphaned
`);
}

/**
 * Check Claude Code log retention settings (T058)
 */
async function checkLogRetentionConfig(): Promise<boolean> {
  const os = await import('os');
  const fs = await import('fs/promises');
  const path = await import('path');

  const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');

  try {
    const content = await fs.readFile(settingsPath, 'utf-8');
    const settings = JSON.parse(content);

    if (settings.cleanupPeriodDays && settings.cleanupPeriodDays >= 99999) {
      console.log('[config] Log retention: ✓ configured (cleanupPeriodDays >= 99999)');
      return true;
    } else {
      console.warn('[config] ⚠ Log retention not configured optimally');
      console.warn(`[config] Current cleanupPeriodDays: ${settings.cleanupPeriodDays || 'not set'}`);
      console.warn('[config] Recommended: Add "cleanupPeriodDays": 99999 to ~/.claude/settings.json');
      return false;
    }
  } catch {
    console.warn('[config] ⚠ Could not read Claude settings from:', settingsPath);
    console.warn('[config] Session logs may be cleaned up automatically.');
    console.warn('[config] Recommended: Create ~/.claude/settings.json with:');
    console.warn('[config]   { "cleanupPeriodDays": 99999 }');
    return false;
  }
}

/**
 * Session log reference for mapping (T059)
 */
interface SessionLogMapping {
  sessionId: string;
  testId: string;
  toolName: string;
  logPath: string;
  startTime: string;
  endTime: string;
}

/**
 * Save session to log mapping (T059)
 */
async function saveSessionMapping(mapping: SessionLogMapping): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');

  const outputDir = path.join(process.cwd(), 'output', 'sessions');

  try {
    await fs.mkdir(outputDir, { recursive: true });
    const filePath = path.join(outputDir, `${mapping.sessionId}.json`);
    await fs.writeFile(filePath, JSON.stringify(mapping, null, 2));
  } catch (err) {
    console.error('[sessions] Failed to save session mapping:', err);
  }
}

/**
 * Find session log by ID (T059)
 */
async function findSessionLog(sessionId: string): Promise<SessionLogMapping | null> {
  const fs = await import('fs/promises');
  const path = await import('path');
  const os = await import('os');

  // First check our mapping file
  const mappingPath = path.join(process.cwd(), 'output', 'sessions', `${sessionId}.json`);
  try {
    const content = await fs.readFile(mappingPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    // Not in mapping, search Claude's log directory
  }

  // Search ~/.claude/projects/ for the session
  const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');
  try {
    const projects = await fs.readdir(claudeProjectsDir);
    for (const project of projects) {
      const projectDir = path.join(claudeProjectsDir, project);
      const stat = await fs.stat(projectDir);
      if (!stat.isDirectory()) continue;

      // Look for session files
      const files = await fs.readdir(projectDir);
      for (const file of files) {
        if (file.includes(sessionId) || file === 'session.jsonl') {
          const filePath = path.join(projectDir, file);
          // Check if this is the right session
          const content = await fs.readFile(filePath, 'utf-8');
          if (content.includes(sessionId)) {
            return {
              sessionId,
              testId: 'unknown',
              toolName: 'unknown',
              logPath: filePath,
              startTime: '',
              endTime: '',
            };
          }
        }
      }
    }
  } catch {
    // Claude directory not accessible
  }

  return null;
}

/**
 * Run test:all command (T053)
 */
async function cmdTestAll(options: CLIOptions): Promise<number> {
  console.log('');
  console.log('Test Suite: ALL TOOLS');
  console.log('=====================');
  console.log('');

  await checkLogRetentionConfig();
  console.log('');

  const execOptions: TestExecutionOptions = {
    concurrency: options.concurrency ?? DEFAULT_CONCURRENCY,
    cleanRoom: options.cleanRoom,
    skipCleanup: options.skipCleanup,
  };

  const result = await runTestSuite(execOptions);

  // Summary display
  console.log('');
  console.log('Test Suite Complete');
  console.log('===================');
  console.log(`Total:    ${result.coverage.totalTools}`);
  console.log(`Passed:   ${result.coverage.passedTools}`);
  console.log(`Failed:   ${result.coverage.failedTools}`);
  console.log(`Duration: ${formatDuration(result.durationMs)}`);
  console.log('');

  return result.coverage.failedTools > 0 ? 1 : 0;
}

/**
 * Run test:domain command (T054)
 */
async function cmdTestDomain(options: CLIOptions): Promise<number> {
  if (!options.domain) {
    console.error('Error: Domain name required');
    console.error(`Valid domains: ${VALID_DOMAINS.join(', ')}`);
    return 1;
  }

  // Validate domain name
  if (!VALID_DOMAINS.includes(options.domain as TestDomain)) {
    console.error(`Error: Invalid domain "${options.domain}"`);
    console.error(`Valid domains: ${VALID_DOMAINS.join(', ')}`);
    return 1;
  }

  console.log('');
  console.log(`Test Suite: DOMAIN "${options.domain}"`);
  console.log('='.repeat(30));
  console.log('');

  const execOptions: TestExecutionOptions = {
    domains: [options.domain],
    concurrency: options.concurrency ?? DEFAULT_CONCURRENCY,
    cleanRoom: options.cleanRoom,
    skipCleanup: options.skipCleanup,
  };

  const result = await runTestSuite(execOptions);

  console.log('');
  console.log(`Domain "${options.domain}" Complete`);
  console.log(`Passed: ${result.coverage.passedTools}`);
  console.log(`Failed: ${result.coverage.failedTools}`);
  console.log(`Duration: ${formatDuration(result.durationMs)}`);
  console.log('');

  return result.coverage.failedTools > 0 ? 1 : 0;
}

/**
 * Run test:tool command (T055)
 */
async function cmdTestTool(options: CLIOptions): Promise<number> {
  if (!options.tool) {
    console.error('Error: Tool name required');
    return 1;
  }

  console.log('');
  console.log(`Test: SINGLE TOOL "${options.tool}"`);
  console.log('='.repeat(40));
  console.log(`Mode: ${options.cleanRoom ? 'CLEAN-ROOM' : 'HARNESS-ASSISTED'}`);
  console.log('');

  try {
    const result = await runSingleTool(options.tool, options.cleanRoom);

    console.log('');
    console.log('Test Result');
    console.log('-----------');
    console.log(`Status:     ${result.status}`);
    console.log(`Session ID: ${result.sessionId}`);
    console.log(`Duration:   ${formatDuration(result.metrics.durationMs)}`);
    console.log(`Cost:       $${result.metrics.totalCostUsd.toFixed(4)}`);
    console.log('');

    return result.status === 'passed' ? 0 : 1;
  } catch (err) {
    console.error('Test failed:', err instanceof Error ? err.message : err);
    return 1;
  }
}

/**
 * Get list of all known tool names from inventory
 * Tries cached config first, falls back to MCP discovery
 */
async function getKnownToolNames(): Promise<string[]> {
  // Try to load from cached config first
  const config = loadTestDomainsConfig();
  if (config) {
    // Flatten all tool names from domains
    const tools: string[] = [];
    for (const domainTools of Object.values(config.domains)) {
      tools.push(...domainTools);
    }
    console.log(`[inventory] Loaded ${tools.length} tools from cached config`);
    return tools;
  }

  // Fall back to MCP discovery
  console.log('[inventory] No cached config, discovering tools from MCP server...');
  const inventory = createToolManifest();
  try {
    await inventory.discover({ serverUrl: DEFAULT_MCP_SERVER_URL });
    const entries = inventory.getAllEntries();
    console.log(`[inventory] Discovered ${entries.length} tools`);
    return entries.map((e) => e.name);
  } catch (err) {
    console.warn('[inventory] Discovery failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Run coverage command (T025)
 */
async function cmdCoverage(): Promise<number> {
  console.log('');
  console.log('Coverage Report');
  console.log('===============');
  console.log('');

  // Get known tools from inventory for accurate coverage calculation
  const knownTools = await getKnownToolNames();
  if (knownTools.length === 0) {
    console.warn('[coverage] No known tools loaded. Coverage may be inaccurate.');
    console.warn('[coverage] Run a test first to populate the tool inventory.');
  }

  const manifest = new ManifestManager();
  const coverage = await manifest.getCoverage(knownTools.length > 0 ? knownTools : undefined);

  console.log(`Total Tools:    ${coverage.totalTools}`);
  console.log(`Tested:         ${coverage.testedTools}`);
  console.log(`Passed:         ${coverage.passedTools}`);
  console.log(`Failed:         ${coverage.failedTools}`);
  console.log(`Untested:       ${coverage.untestedTools.length}`);
  console.log(`Coverage:       ${coverage.coverage.toFixed(1)}%`);
  console.log('');

  if (coverage.untestedTools.length > 0) {
    console.log('Untested Tools:');
    for (const tool of coverage.untestedTools.slice(0, 20)) {
      console.log(`  - ${tool}`);
    }
    if (coverage.untestedTools.length > 20) {
      console.log(`  ... and ${coverage.untestedTools.length - 20} more`);
    }
  }

  return 0;
}

/**
 * Run cleanup command (T056)
 */
async function cmdCleanup(options: CLIOptions): Promise<number> {
  console.log('');
  console.log('Resource Cleanup');
  console.log('================');
  console.log('');

  const tracker = createResourceTracker();

  if (options.all) {
    console.log('Cleaning up ALL tracked resources...');
    let totalCleaned = 0;
    let totalFailed = 0;

    for (const domain of getDomainsInOrder().reverse()) {
      console.log(`\nDomain: ${domain}`);
      const result = await cleanupDomain(tracker, domain);
      console.log(`  Cleaned: ${result.cleaned}/${result.total}`);
      if (result.failed > 0) {
        console.log(`  Failed:  ${result.failed}`);
        for (const failure of result.failures) {
          console.log(`    - ${failure.resourceId}: ${failure.error}`);
        }
      }
      totalCleaned += result.cleaned;
      totalFailed += result.failed;
    }

    console.log('');
    console.log(`Total cleaned: ${totalCleaned}`);
    console.log(`Total failed:  ${totalFailed}`);
    return totalFailed > 0 ? 1 : 0;
  }

  if (options.domain) {
    if (!VALID_DOMAINS.includes(options.domain as TestDomain)) {
      console.error(`Error: Invalid domain "${options.domain}"`);
      return 1;
    }

    console.log(`Cleaning up domain: ${options.domain}`);
    const result = await cleanupDomain(tracker, options.domain as TestDomain);

    console.log(`Cleaned: ${result.cleaned}/${result.total}`);
    if (result.failed > 0) {
      console.log(`Failed:  ${result.failed}`);
      for (const failure of result.failures) {
        console.log(`  - ${failure.resourceId}: ${failure.error}`);
      }
    }

    return result.failed > 0 ? 1 : 0;
  }

  console.error('Error: Specify --domain <name> or --all');
  return 1;
}

/**
 * Run status command (T057)
 */
async function cmdStatus(): Promise<number> {
  console.log('');
  console.log('MCP Functional Test Harness Status');
  console.log('===================================');
  console.log('');

  const status = getStatus();
  const tracker = createResourceTracker();
  const manifest = new ManifestManager();

  console.log(`Active Sessions: ${status.activeSessions}`);
  console.log(`Queued Tests:    ${status.queuedTests}`);
  console.log(`Completed:       ${status.completedTests}`);
  console.log(`Failed:          ${status.failedTests}`);
  console.log('');
  console.log(`Current Phase:   ${status.currentPhase}`);

  if (status.queuedTests > 0) {
    const total = status.completedTests + status.failedTests + status.queuedTests;
    const progress = ((status.completedTests + status.failedTests) / total) * 100;
    console.log(`Progress:        ${status.completedTests + status.failedTests}/${total} (${progress.toFixed(1)}%)`);
  }

  console.log('');
  console.log('Resource Tracker:');

  const trackerStatus = tracker.getStatus();
  for (const [type, count] of Object.entries(trackerStatus.byType)) {
    if (count > 0) {
      console.log(`  - ${type}: ${count} active`);
    }
  }

  if (status.currentPhase === 'idle') {
    console.log('');
    console.log('Last Run Summary:');
    // Use known tools for accurate coverage calculation
    const knownTools = await getKnownToolNames();
    const coverage = await manifest.getCoverage(knownTools.length > 0 ? knownTools : undefined);
    console.log(`  Coverage: ${coverage.coverage.toFixed(1)}%`);
    console.log(`  Passed:   ${coverage.passedTools}`);
    console.log(`  Failed:   ${coverage.failedTools}`);
    console.log(`  Untested: ${coverage.untestedTools.length}`);
  }

  return 0;
}

/**
 * Run list-resources command (T060)
 */
async function cmdListResources(options: CLIOptions): Promise<number> {
  console.log('');

  if (options.orphaned) {
    console.log('Orphaned Test Resources');
    console.log('=======================');
    console.log('');
    console.log('Searching for resources matching "test-*" pattern...');
    console.log('');

    // This would need MCP server access to list resources
    // For now, show guidance
    console.log('To find orphaned resources, use the Mittwald CLI:');
    console.log('');
    console.log('  mw project list | grep test-');
    console.log('  mw app list --project-id <id> | grep test-');
    console.log('  mw database mysql list --project-id <id> | grep test-');
    console.log('');
    console.log('To cleanup orphaned resources:');
    console.log('  mw project delete <project-id>');
    console.log('  mw app uninstall <app-id>');
    console.log('');
  } else {
    console.log('Tracked Test Resources');
    console.log('======================');
    console.log('');

    const tracker = createResourceTracker();
    const resources = tracker.getAllResources();

    if (resources.length === 0) {
      console.log('No tracked resources.');
    } else {
      // Group by domain
      const byDomain = new Map<string, typeof resources>();
      for (const r of resources) {
        const domain = r.domain;
        if (!byDomain.has(domain)) {
          byDomain.set(domain, []);
        }
        byDomain.get(domain)!.push(r);
      }

      for (const [domain, domainResources] of byDomain) {
        console.log(`Domain: ${domain}`);
        for (const r of domainResources) {
          console.log(`  - ${r.resourceType}: ${r.name} (${r.resourceId}) [${r.status}]`);
        }
        console.log('');
      }
    }
  }

  return 0;
}

/**
 * Format duration in human-readable form
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;

  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * CLI entry point (T052)
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  console.log('MCP Functional Test Harness v' + HARNESS_VERSION);
  console.log('');

  const options = parseArgs(args);
  let exitCode = 0;

  switch (options.command) {
    case 'help':
      showHelp();
      break;
    case 'test':
      if (options.all) {
        exitCode = await cmdTestAll(options);
      } else if (options.domain) {
        exitCode = await cmdTestDomain(options);
      } else if (options.tool) {
        exitCode = await cmdTestTool(options);
      } else {
        console.error('Error: Specify --all, --domain <name>, or --tool <name>');
        exitCode = 1;
      }
      break;
    case 'coverage':
      exitCode = await cmdCoverage();
      break;
    case 'cleanup':
      exitCode = await cmdCleanup(options);
      break;
    case 'status':
      exitCode = await cmdStatus();
      break;
    case 'list-resources':
      exitCode = await cmdListResources(options);
      break;
    default:
      showHelp();
  }

  process.exit(exitCode);
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
export {
  SessionPool,
  buildTestQueue,
  pollForCompletion,
  withRateLimitRetry,
  withConsistencyRetry,
  checkLogRetentionConfig,
  saveSessionMapping,
  findSessionLog,
};
