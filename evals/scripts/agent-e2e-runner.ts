#!/usr/bin/env npx tsx

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

type AgentName = 'claude' | 'codex' | 'opencode';
type CoverageMode = 'all-agents' | 'any-agent';
type McpTarget = 'fly' | 'mittwald';

const SUPPORTED_AGENTS: AgentName[] = ['claude', 'codex', 'opencode'];
const MCP_TARGET_URLS: Record<McpTarget, string> = {
  fly: 'https://mittwald-mcp-fly2.fly.dev/mcp',
  mittwald: 'https://mcp.mittwald.de/mcp',
};
const DEFAULT_MCP_TARGET: McpTarget = 'fly';
const CODEX_MCP_SERVERS_TO_DISABLE = ['notion', 'Tavily', 'playwright'];
const SELF_ASSESSMENT_START = '<!-- SELF_ASSESSMENT_START -->';
const SELF_ASSESSMENT_END = '<!-- SELF_ASSESSMENT_END -->';
const DEFAULT_MCP_URL = MCP_TARGET_URLS[DEFAULT_MCP_TARGET];
const DEFAULT_TIMEOUT_MS = 180000;
const PROBE_TOOL_NAME = 'mcp__mittwald__mittwald_user_get';
const DEFAULT_MW_TIMEOUT_MS = 120000;
const PROBE_PROMPT = [
  'MCP readiness probe.',
  `Call exactly one MCP tool: ${PROBE_TOOL_NAME}.`,
  'Do not run shell commands.',
  'Do not read or write files.',
  'If the call succeeds, reply exactly PRECHECK_OK.',
  'If the call fails or the tool is unavailable, reply exactly PRECHECK_FAILED.',
].join('\n');

interface RunnerOptions {
  agents: AgentName[];
  promptDir: string;
  outputDir: string;
  timeoutMs: number;
  mcpConfigPath: string;
  target: McpTarget;
  mcpUrl: string;
  domains?: Set<string>;
  tools?: Set<string>;
  maxTools?: number;
  skipPreflight: boolean;
  preflightOnly: boolean;
  continueOnFailure: boolean;
  requireCoverage: number;
  coverageMode: CoverageMode;
  requireSelfAssessment: boolean;
  cleanupTestProjects: boolean;
  cleanupProjectPrefix?: string;
  codexMcpServerName: string;
  codexModel?: string;
  claudeModel?: string;
  opencodeModel?: string;
}

interface MittwaldProject {
  id: string;
  shortId?: string;
  description?: string;
}

interface ProjectCleanupResult {
  enabled: boolean;
  prefix: string;
  startedAt: string;
  finishedAt: string;
  matchedCount: number;
  deleted: string[];
  failed: Array<{ id: string; reason: string }>;
  listError?: string;
}

interface PromptCase {
  id: string;
  domain: string;
  promptFile: string;
  toolName: string;
  displayName: string;
  prompt: string;
}

interface InvalidPromptFile {
  filePath: string;
  error: string;
}

interface SelfAssessment {
  success: boolean;
  confidence?: string;
  tool_executed?: string;
  timestamp?: string;
  problems_encountered?: unknown[];
  resources_created?: unknown[];
  resources_verified?: unknown[];
  tool_response_summary?: string;
  execution_notes?: string;
  [key: string]: unknown;
}

interface AssessmentParseResult {
  assessment?: SelfAssessment;
  error?: string;
  rawJson?: string;
}

interface AgentExecutionResult {
  agent: AgentName;
  command: string;
  args: string[];
  exitCode: number | null;
  durationMs: number;
  timedOut: boolean;
  stdout: string;
  stderr: string;
  toolsCalled: string[];
  toolCallErrors: string[];
  messages: string[];
  parseErrors: number;
  mcpServerStatus: Record<string, string>;
  mittwaldToolCount: number | null;
}

type FailureCategory =
  | 'timeout'
  | 'agent_exit_nonzero'
  | 'missing_expected_tool_call'
  | 'tool_call_error'
  | 'mcp_server_unavailable'
  | 'missing_self_assessment'
  | 'invalid_self_assessment'
  | 'tool_mismatch_in_self_assessment'
  | 'self_assessment_reported_failure';

interface ToolCaseResult {
  runId: string;
  agent: AgentName;
  promptCaseId: string;
  domain: string;
  promptFile: string;
  toolName: string;
  displayName: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  status: 'success' | 'failure';
  failureCategory?: FailureCategory;
  failureReason?: string;
  expectedToolCalled: boolean;
  toolsCalled: string[];
  toolCallErrors: string[];
  selfAssessment?: SelfAssessment;
  stdoutFile: string;
  stderrFile: string;
  rawOutputFile: string;
}

interface AgentPreflightResult {
  agent: AgentName;
  ok: boolean;
  reason?: string;
  details: {
    commandAvailable: boolean;
    expectedToolCalled: boolean;
    hasToolCallErrors: boolean;
    claudeNeedsAuth: boolean;
    probeExitCode: number | null;
    probeTimedOut: boolean;
  };
  execution: AgentExecutionResult;
}

interface RunSummary {
  runId: string;
  generatedAt: string;
  outputDir: string;
  options: {
    agents: AgentName[];
    promptDir: string;
    timeoutMs: number;
    target: McpTarget;
    requireCoverage: number;
    coverageMode: CoverageMode;
    requireSelfAssessment: boolean;
    cleanupTestProjects: boolean;
    cleanupProjectPrefix: string;
    mcpUrl: string;
    mcpConfigPath: string;
    domains?: string[];
    tools?: string[];
    maxTools?: number;
  };
  promptInventory: {
    totalLoaded: number;
    invalidFiles: InvalidPromptFile[];
  };
  preflight: AgentPreflightResult[];
  counts: {
    totalCaseRuns: number;
    passedCaseRuns: number;
    failedCaseRuns: number;
    matrixCoveragePercent: number;
    totalTools: number;
    coveredTools: number;
    toolCoveragePercent: number;
  };
  perAgent: Record<
    AgentName,
    {
      total: number;
      passed: number;
      failed: number;
      coveragePercent: number;
    }
  >;
  perTool: Array<{
    toolName: string;
    domain: string;
    displayName: string;
    byAgent: Record<AgentName, 'success' | 'failure' | 'not_run'>;
    covered: boolean;
  }>;
  gate: {
    requiredCoverage: number;
    mode: CoverageMode;
    passed: boolean;
    reasons: string[];
  };
  cleanup?: ProjectCleanupResult;
  abortedReason?: string;
}

function toAbsolute(p: string): string {
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

function normalizeToolName(name: string): string {
  return name
    .trim()
    .replace(/^mcp__mittwald__/, '')
    .replace(/^mittwald_mittwald_/, 'mittwald_')
    .replace(/^mcp__/, '');
}

function sanitizeFilePart(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function parseCsv(value: string): string[] {
  return value
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseIntArg(value: string, key: string): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error(`Invalid ${key}: ${value}`);
  }
  return parsed;
}

function parseFloatArg(value: string, key: string): number {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
    throw new Error(`Invalid ${key}: ${value}`);
  }
  return parsed;
}

function parseArgs(argv: string[]): RunnerOptions {
  const mcpConfigDefault = toAbsolute('.mcp.json');
  let mcpUrlExplicitlySet = false;

  const options: RunnerOptions = {
    agents: ['claude'],
    promptDir: toAbsolute('evals/prompts'),
    outputDir: toAbsolute('evals/results/agent-e2e'),
    timeoutMs: DEFAULT_TIMEOUT_MS,
    mcpConfigPath: mcpConfigDefault,
    target: DEFAULT_MCP_TARGET,
    mcpUrl: DEFAULT_MCP_URL,
    skipPreflight: false,
    preflightOnly: false,
    continueOnFailure: true,
    requireCoverage: 100,
    coverageMode: 'all-agents',
    requireSelfAssessment: false,
    cleanupTestProjects: true,
    codexMcpServerName: 'mittwald',
    opencodeModel: process.env.OPENCODE_MODEL || 'opencode/gpt-5-nano',
  };

  for (const arg of argv) {
    if (!arg.startsWith('--')) {
      throw new Error(`Unknown argument format: ${arg}`);
    }

    const [rawKey, rawValue] = arg.slice(2).split('=', 2);
    const key = rawKey.trim();
    const value = rawValue?.trim();

    switch (key) {
      case 'agents':
        if (!value) {
          throw new Error('--agents requires a value');
        }
        options.agents = parseCsv(value).map((agent) => {
          if (!SUPPORTED_AGENTS.includes(agent as AgentName)) {
            throw new Error(
              `Unsupported agent '${agent}'. Supported: ${SUPPORTED_AGENTS.join(', ')}`
            );
          }
          return agent as AgentName;
        });
        break;
      case 'prompt-dir':
        if (!value) throw new Error('--prompt-dir requires a value');
        options.promptDir = toAbsolute(value);
        break;
      case 'output-dir':
        if (!value) throw new Error('--output-dir requires a value');
        options.outputDir = toAbsolute(value);
        break;
      case 'timeout-ms':
        if (!value) throw new Error('--timeout-ms requires a value');
        options.timeoutMs = parseIntArg(value, '--timeout-ms');
        break;
      case 'mcp-config':
        if (!value) throw new Error('--mcp-config requires a value');
        options.mcpConfigPath = toAbsolute(value);
        break;
      case 'target':
        if (!value) throw new Error('--target requires a value');
        if (value !== 'fly' && value !== 'mittwald') {
          throw new Error(
            `Invalid --target '${value}'. Use 'fly' or 'mittwald'`
          );
        }
        options.target = value;
        if (!mcpUrlExplicitlySet) {
          options.mcpUrl = MCP_TARGET_URLS[value];
        }
        break;
      case 'mcp-url':
        if (!value) throw new Error('--mcp-url requires a value');
        mcpUrlExplicitlySet = true;
        options.mcpUrl = value;
        break;
      case 'domains':
        if (!value) throw new Error('--domains requires a value');
        options.domains = new Set(parseCsv(value));
        break;
      case 'tools':
        if (!value) throw new Error('--tools requires a value');
        options.tools = new Set(parseCsv(value).map(normalizeToolName));
        break;
      case 'max-tools':
        if (!value) throw new Error('--max-tools requires a value');
        options.maxTools = parseIntArg(value, '--max-tools');
        break;
      case 'skip-preflight':
        options.skipPreflight = true;
        break;
      case 'preflight-only':
        options.preflightOnly = true;
        break;
      case 'continue-on-failure':
        options.continueOnFailure = true;
        break;
      case 'fail-fast':
        options.continueOnFailure = false;
        break;
      case 'require-coverage':
        if (!value) throw new Error('--require-coverage requires a value');
        options.requireCoverage = parseFloatArg(value, '--require-coverage');
        break;
      case 'coverage-mode':
        if (!value) throw new Error('--coverage-mode requires a value');
        if (value !== 'all-agents' && value !== 'any-agent') {
          throw new Error(
            `Invalid --coverage-mode '${value}'. Use 'all-agents' or 'any-agent'`
          );
        }
        options.coverageMode = value;
        break;
      case 'require-self-assessment':
        options.requireSelfAssessment = true;
        break;
      case 'cleanup-test-projects':
        options.cleanupTestProjects = true;
        break;
      case 'no-cleanup-test-projects':
        options.cleanupTestProjects = false;
        break;
      case 'cleanup-project-prefix':
        if (!value) throw new Error('--cleanup-project-prefix requires a value');
        options.cleanupProjectPrefix = value;
        break;
      case 'codex-mcp-server-name':
        if (!value) throw new Error('--codex-mcp-server-name requires a value');
        options.codexMcpServerName = value;
        break;
      case 'codex-model':
        if (!value) throw new Error('--codex-model requires a value');
        options.codexModel = value;
        break;
      case 'claude-model':
        if (!value) throw new Error('--claude-model requires a value');
        options.claudeModel = value;
        break;
      case 'opencode-model':
        if (!value) throw new Error('--opencode-model requires a value');
        options.opencodeModel = value;
        break;
      default:
        throw new Error(`Unknown flag: --${key}`);
    }
  }

  if (options.agents.length === 0) {
    throw new Error('At least one agent is required');
  }

  return options;
}

function walkJsonFiles(rootDir: string): string[] {
  const out: string[] = [];

  function walk(current: string): void {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(absolute);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith('.json')) {
        out.push(absolute);
      }
    }
  }

  walk(rootDir);
  return out.sort();
}

function loadPromptCases(
  options: RunnerOptions
): { cases: PromptCase[]; invalidFiles: InvalidPromptFile[] } {
  if (!fs.existsSync(options.promptDir)) {
    throw new Error(`Prompt directory not found: ${options.promptDir}`);
  }

  const files = walkJsonFiles(options.promptDir).filter(
    (filePath) => path.basename(filePath) !== 'generation-manifest.json'
  );

  const invalidFiles: InvalidPromptFile[] = [];
  const cases: PromptCase[] = [];

  for (const filePath of files) {
    let parsed: any;
    try {
      parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (error) {
      invalidFiles.push({
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    const prompt = parsed?.input?.prompt;
    const toolName = parsed?.input?.tool_name;
    if (typeof prompt !== 'string' || typeof toolName !== 'string') {
      continue;
    }

    const domain =
      typeof parsed?.metadata?.domain === 'string'
        ? parsed.metadata.domain
        : path.basename(path.dirname(filePath));

    if (options.domains && !options.domains.has(domain)) {
      continue;
    }

    if (options.tools && !options.tools.has(normalizeToolName(toolName))) {
      continue;
    }

    const fileBase = path.basename(filePath, '.json');
    const displayName =
      typeof parsed?.input?.display_name === 'string'
        ? parsed.input.display_name
        : fileBase;

    cases.push({
      id: fileBase,
      domain,
      promptFile: filePath,
      toolName,
      displayName,
      prompt,
    });
  }

  if (options.maxTools !== undefined) {
    return {
      cases: cases.slice(0, options.maxTools),
      invalidFiles,
    };
  }

  return { cases, invalidFiles };
}

function createLineParser(onLine: (line: string) => void): {
  push: (chunk: string) => void;
  flush: () => void;
} {
  let buffer = '';

  return {
    push(chunk: string) {
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line.length > 0) {
          onLine(line);
        }
      }
    },
    flush() {
      if (buffer.length > 0) {
        onLine(buffer);
      }
      buffer = '';
    },
  };
}

function parseClaudeEvent(
  parsed: any,
  toolsCalled: string[],
  messages: string[],
  toolCallErrors: string[],
  mcpServerStatus: Record<string, string>,
  mittwaldToolCountRef: { value: number | null }
): void {
  if (parsed?.type === 'system' && parsed?.subtype === 'init') {
    if (Array.isArray(parsed?.mcp_servers)) {
      for (const server of parsed.mcp_servers) {
        if (
          typeof server?.name === 'string' &&
          typeof server?.status === 'string'
        ) {
          mcpServerStatus[server.name] = server.status;
        }
      }
    }
    if (Array.isArray(parsed?.tools)) {
      mittwaldToolCountRef.value = parsed.tools.filter(
        (tool: unknown) =>
          typeof tool === 'string' && tool.startsWith('mcp__mittwald__')
      ).length;
    }
    return;
  }

  if (parsed?.type === 'assistant' && parsed?.message?.content) {
    const content = parsed.message.content;
    if (Array.isArray(content)) {
      for (const item of content) {
        if (item?.type === 'tool_use' && typeof item?.name === 'string') {
          toolsCalled.push(item.name);
        }
        if (item?.type === 'text' && typeof item?.text === 'string') {
          messages.push(item.text);
        }
      }
    }
    return;
  }

  if (parsed?.type === 'user' && parsed?.message?.content) {
    const content = parsed.message.content;
    if (Array.isArray(content)) {
      for (const item of content) {
        if (item?.type !== 'tool_result') continue;

        if (item?.is_error === true) {
          toolCallErrors.push(extractClaudeToolResultError(item));
          continue;
        }

        // Some MCP bridges return status=error without setting is_error=true.
        const payloadText = extractClaudeToolResultText(item);
        if (payloadText) {
          try {
            const payload = JSON.parse(payloadText);
            if (payload?.status === 'error') {
              const message =
                typeof payload?.message === 'string'
                  ? payload.message
                  : 'Tool returned status=error';
              toolCallErrors.push(message);
            }
          } catch {
            // Ignore non-JSON payloads.
          }
        }
      }
    }
    return;
  }

  if (parsed?.type === 'result' && parsed?.is_error === true) {
    toolCallErrors.push(
      typeof parsed?.result === 'string'
        ? parsed.result
        : JSON.stringify(parsed?.result ?? parsed)
    );
  }
}

function extractClaudeToolResultText(item: any): string | undefined {
  if (!item) return undefined;

  if (typeof item.content === 'string') {
    return item.content;
  }

  if (Array.isArray(item.content) && typeof item.content[0]?.text === 'string') {
    return item.content[0].text;
  }

  return undefined;
}

function extractClaudeToolResultError(item: any): string {
  const payloadText = extractClaudeToolResultText(item);
  if (payloadText) {
    return payloadText;
  }

  return JSON.stringify(item);
}

function parseCodexEvent(
  parsed: any,
  toolsCalled: string[],
  messages: string[],
  toolCallErrors: string[]
): void {
  if (parsed?.type === 'item.started' || parsed?.type === 'item.completed') {
    const item = parsed?.item;
    if (!item || typeof item !== 'object') {
      return;
    }

    if (item.type === 'mcp_tool_call') {
      if (typeof item.tool === 'string') {
        toolsCalled.push(item.tool);
      }
      if (item.error) {
        toolCallErrors.push(
          typeof item.error === 'string' ? item.error : JSON.stringify(item.error)
        );
      }
      if (item.status === 'failed') {
        toolCallErrors.push(
          `MCP tool call failed: ${typeof item.tool === 'string' ? item.tool : 'unknown_tool'}`
        );
      }
      return;
    }

    if (item.type === 'agent_message' && typeof item.text === 'string') {
      messages.push(item.text);
      return;
    }
  }

  if (parsed?.type === 'error') {
    toolCallErrors.push(
      typeof parsed?.message === 'string'
        ? parsed.message
        : JSON.stringify(parsed)
    );
  }
}

function parseOpencodeEvent(
  parsed: any,
  toolsCalled: string[],
  messages: string[],
  toolCallErrors: string[]
): void {
  if (parsed?.type === 'tool_use' && parsed?.part?.type === 'tool') {
    if (typeof parsed?.part?.tool === 'string') {
      toolsCalled.push(parsed.part.tool);
    }
    const status = parsed?.part?.state?.status;
    if (status === 'error' || status === 'failed') {
      toolCallErrors.push(
        `Tool ${String(parsed?.part?.tool ?? 'unknown')} failed in opencode`
      );
    }
    return;
  }

  if (parsed?.type === 'text' && typeof parsed?.part?.text === 'string') {
    messages.push(parsed.part.text);
    return;
  }

  if (parsed?.type === 'error') {
    toolCallErrors.push(
      typeof parsed?.error?.message === 'string'
        ? parsed.error.message
        : JSON.stringify(parsed?.error ?? parsed)
    );
  }
}

function dedupePreserveOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

function detectClaudeMcpAvailabilityIssue(
  mcpServerStatus: Record<string, string>,
  mittwaldToolCount: number | null
): string | undefined {
  const mittwaldStatus = mcpServerStatus.mittwald;
  if (typeof mittwaldStatus === 'string' && mittwaldStatus !== 'connected') {
    return `MCP server 'mittwald' reported status '${mittwaldStatus}'`;
  }

  if (mittwaldToolCount === 0) {
    return "MCP tool inventory has zero mittwald tools";
  }

  return undefined;
}

function buildAgentCommand(
  agent: AgentName,
  prompt: string,
  options: RunnerOptions
): { command: string; args: string[] } {
  if (agent === 'claude') {
    const args = [
      '--print',
      prompt,
      '--output-format',
      'stream-json',
      '--verbose',
      '--allowedTools',
      'mcp__mittwald__*',
      '--mcp-config',
      options.mcpConfigPath,
      '--strict-mcp-config',
    ];
    if (options.claudeModel) {
      args.push('--model', options.claudeModel);
    }
    return { command: 'claude', args };
  }

  if (agent === 'codex') {
    const args = ['exec', '--json', prompt];
    if (options.codexModel) {
      args.push('--model', options.codexModel);
    }

    args.push(
      '-c',
      `mcp_servers.${options.codexMcpServerName}.url="${options.mcpUrl}"`
    );
    for (const serverName of CODEX_MCP_SERVERS_TO_DISABLE) {
      if (serverName === options.codexMcpServerName) continue;
      args.push('-c', `mcp_servers.${serverName}.enabled=false`);
    }

    return { command: 'codex', args };
  }

  const args = ['run', prompt, '--format', 'json'];
  if (options.opencodeModel) {
    args.push('--model', options.opencodeModel);
  }
  return { command: 'opencode', args };
}

async function executePromptWithAgent(
  agent: AgentName,
  prompt: string,
  options: RunnerOptions
): Promise<AgentExecutionResult> {
  const { command, args } = buildAgentCommand(agent, prompt, options);
  const started = Date.now();

  return await new Promise<AgentExecutionResult>((resolve) => {
    const toolsCalled: string[] = [];
    const messages: string[] = [];
    const toolCallErrors: string[] = [];
    const mcpServerStatus: Record<string, string> = {};
    const mittwaldToolCountRef = { value: null as number | null };
    let stdout = '';
    let stderr = '';
    let parseErrors = 0;
    let timedOut = false;
    let terminatedForMcpAvailability = false;

    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
      },
    });

    const stdoutParser = createLineParser((line) => {
      let parsed: any;
      try {
        parsed = JSON.parse(line);
      } catch {
        parseErrors += 1;
        return;
      }

      if (agent === 'claude') {
        parseClaudeEvent(
          parsed,
          toolsCalled,
          messages,
          toolCallErrors,
          mcpServerStatus,
          mittwaldToolCountRef
        );
        if (!terminatedForMcpAvailability && !timedOut && !child.killed) {
          const mcpAvailabilityIssue = detectClaudeMcpAvailabilityIssue(
            mcpServerStatus,
            mittwaldToolCountRef.value
          );
          if (mcpAvailabilityIssue) {
            terminatedForMcpAvailability = true;
            toolCallErrors.push(
              `MCP availability guard tripped: ${mcpAvailabilityIssue}`
            );
            child.kill('SIGTERM');
          }
        }
      } else if (agent === 'codex') {
        parseCodexEvent(parsed, toolsCalled, messages, toolCallErrors);
      } else {
        parseOpencodeEvent(parsed, toolsCalled, messages, toolCallErrors);
      }
    });

    child.stdout.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stdout += text;
      stdoutParser.push(text);
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 3000);
    }, options.timeoutMs);

    child.on('error', (error) => {
      clearTimeout(timeout);
      resolve({
        agent,
        command,
        args,
        exitCode: 127,
        durationMs: Date.now() - started,
        timedOut: false,
        stdout,
        stderr: `${stderr}\n${error.message}`.trim(),
        toolsCalled: dedupePreserveOrder(toolsCalled),
        toolCallErrors: dedupePreserveOrder(toolCallErrors),
        messages,
        parseErrors,
        mcpServerStatus,
        mittwaldToolCount: mittwaldToolCountRef.value,
      });
    });

    child.on('close', (exitCode) => {
      clearTimeout(timeout);
      stdoutParser.flush();

      resolve({
        agent,
        command,
        args,
        exitCode,
        durationMs: Date.now() - started,
        timedOut,
        stdout,
        stderr,
        toolsCalled: dedupePreserveOrder(toolsCalled),
        toolCallErrors: dedupePreserveOrder(toolCallErrors),
        messages,
        parseErrors,
        mcpServerStatus,
        mittwaldToolCount: mittwaldToolCountRef.value,
      });
    });
  });
}

async function runCommandCapture(
  command: string,
  args: string[],
  timeoutMs: number = DEFAULT_MW_TIMEOUT_MS
): Promise<{ exitCode: number | null; stdout: string; stderr: string; timedOut: boolean }> {
  return await new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
      },
    });

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 3000);
    }, timeoutMs);

    child.on('error', (error) => {
      clearTimeout(timeout);
      resolve({
        exitCode: 127,
        stdout,
        stderr: `${stderr}\n${error.message}`.trim(),
        timedOut: false,
      });
    });

    child.on('close', (exitCode) => {
      clearTimeout(timeout);
      resolve({ exitCode, stdout, stderr, timedOut });
    });
  });
}

function stripAnsi(raw: string): string {
  const esc = String.fromCharCode(27);
  return raw.replace(new RegExp(`${esc}\\[[0-9;]*m`, 'g'), '');
}

function parseJsonArrayFromOutput(raw: string): unknown[] {
  const cleaned = stripAnsi(raw);
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start < 0 || end < 0 || end <= start) {
    throw new Error('Could not locate JSON array in mw output');
  }
  const jsonText = cleaned.slice(start, end + 1);
  const parsed = JSON.parse(jsonText);
  if (!Array.isArray(parsed)) {
    throw new Error('mw project list output is not a JSON array');
  }
  return parsed;
}

async function listProjectsViaMw(): Promise<MittwaldProject[]> {
  const result = await runCommandCapture('mw', ['project', 'list', '-o', 'json']);
  if (result.timedOut) {
    throw new Error('mw project list timed out');
  }
  if (result.exitCode !== 0) {
    throw new Error(
      `mw project list failed with code ${result.exitCode}: ${result.stderr || result.stdout}`
    );
  }

  const parsed = parseJsonArrayFromOutput(result.stdout);
  return parsed
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const project = item as Record<string, unknown>;
      return {
        id: typeof project.id === 'string' ? project.id : '',
        shortId:
          typeof project.shortId === 'string' ? project.shortId : undefined,
        description:
          typeof project.description === 'string'
            ? project.description
            : undefined,
      };
    })
    .filter((item) => item.id.length > 0);
}

async function cleanupProjectsByPrefix(
  prefix: string
): Promise<ProjectCleanupResult> {
  const startedAt = new Date().toISOString();
  const result: ProjectCleanupResult = {
    enabled: true,
    prefix,
    startedAt,
    finishedAt: startedAt,
    matchedCount: 0,
    deleted: [],
    failed: [],
  };

  let projects: MittwaldProject[];
  try {
    projects = await listProjectsViaMw();
  } catch (error) {
    result.finishedAt = new Date().toISOString();
    result.listError = error instanceof Error ? error.message : String(error);
    return result;
  }

  const matches = projects.filter((project) =>
    (project.description ?? '').startsWith(prefix)
  );
  result.matchedCount = matches.length;

  for (const project of matches) {
    const deletion = await runCommandCapture('mw', [
      'project',
      'delete',
      project.id,
      '--force',
      '--quiet',
    ]);

    if (deletion.timedOut) {
      result.failed.push({
        id: project.id,
        reason: 'mw project delete timed out',
      });
      continue;
    }

    if (deletion.exitCode !== 0) {
      result.failed.push({
        id: project.id,
        reason: (deletion.stderr || deletion.stdout || `exit ${deletion.exitCode}`).trim(),
      });
      continue;
    }

    result.deleted.push(project.id);
  }

  result.finishedAt = new Date().toISOString();
  return result;
}

function withRunCleanupGuardrails(prompt: string, projectPrefix: string): string {
  const guardrails = [
    '## Run Safety Constraints',
    `- This eval run uses test project prefix: "${projectPrefix}".`,
    `- If you call mcp__mittwald__mittwald_project_create, the description MUST start with "${projectPrefix}-".`,
    `- For operations that need a project, prefer projects whose description starts with "${projectPrefix}-".`,
    '- Never modify, delete, or operate on non-test projects.',
  ].join('\n');

  return `${guardrails}\n\n${prompt}`;
}

function extractSelfAssessment(rawText: string): AssessmentParseResult {
  const startIndex = rawText.indexOf(SELF_ASSESSMENT_START);
  const endIndex = rawText.indexOf(SELF_ASSESSMENT_END);

  if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex) {
    return { error: 'Self-assessment markers not found' };
  }

  let payload = rawText
    .slice(startIndex + SELF_ASSESSMENT_START.length, endIndex)
    .trim();

  if (payload.startsWith('```json')) {
    payload = payload.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (payload.startsWith('```')) {
    payload = payload.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    const parsed = JSON.parse(payload) as SelfAssessment;
    if (typeof parsed.success !== 'boolean') {
      return { error: 'Self-assessment JSON missing boolean success field', rawJson: payload };
    }
    return { assessment: parsed, rawJson: payload };
  } catch (error) {
    return {
      error: `Failed to parse self-assessment JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
      rawJson: payload,
    };
  }
}

function buildCaseRawText(execution: AgentExecutionResult): string {
  return `${execution.stdout}\n${execution.messages.join('\n')}`;
}

function expectedToolCalledForCase(
  promptCase: Pick<PromptCase, 'toolName'>,
  execution: AgentExecutionResult
): boolean {
  const expectedTool = normalizeToolName(promptCase.toolName);
  const calledToolsNormalized = new Set(
    execution.toolsCalled.map((tool) => normalizeToolName(tool))
  );
  return calledToolsNormalized.has(expectedTool);
}

function detectMcpAvailabilityIssue(
  agent: AgentName,
  execution: AgentExecutionResult
): string | undefined {
  if (agent !== 'claude') {
    return undefined;
  }
  return detectClaudeMcpAvailabilityIssue(
    execution.mcpServerStatus,
    execution.mittwaldToolCount
  );
}

function evaluateCase(
  promptCase: PromptCase,
  execution: AgentExecutionResult,
  options: RunnerOptions
): {
  status: 'success' | 'failure';
  failureCategory?: FailureCategory;
  failureReason?: string;
  expectedToolCalled: boolean;
  selfAssessment?: SelfAssessment;
} {
  const expectedToolCalled = expectedToolCalledForCase(promptCase, execution);

  if (execution.timedOut) {
    return {
      status: 'failure',
      failureCategory: 'timeout',
      failureReason: `Agent timed out after ${execution.durationMs}ms`,
      expectedToolCalled,
    };
  }

  if (execution.exitCode !== 0) {
    return {
      status: 'failure',
      failureCategory: 'agent_exit_nonzero',
      failureReason: `Agent exited with code ${execution.exitCode}. stderr: ${execution.stderr.slice(0, 500)}`,
      expectedToolCalled,
    };
  }

  if (!expectedToolCalled) {
    return {
      status: 'failure',
      failureCategory: 'missing_expected_tool_call',
      failureReason: `Expected tool ${promptCase.toolName} was not called`,
      expectedToolCalled,
    };
  }

  if (execution.toolCallErrors.length > 0) {
    return {
      status: 'failure',
      failureCategory: 'tool_call_error',
      failureReason: execution.toolCallErrors.join('; '),
      expectedToolCalled,
    };
  }

  const assessmentResult = extractSelfAssessment(buildCaseRawText(execution));
  if (!assessmentResult.assessment) {
    if (!options.requireSelfAssessment) {
      return {
        status: 'success',
        expectedToolCalled,
      };
    }
    return {
      status: 'failure',
      failureCategory: assessmentResult.rawJson
        ? 'invalid_self_assessment'
        : 'missing_self_assessment',
      failureReason: assessmentResult.error,
      expectedToolCalled,
    };
  }

  if (
    options.requireSelfAssessment &&
    assessmentResult.assessment.tool_executed &&
    normalizeToolName(assessmentResult.assessment.tool_executed) !==
      normalizeToolName(promptCase.toolName)
  ) {
    return {
      status: 'failure',
      failureCategory: 'tool_mismatch_in_self_assessment',
      failureReason: `Self-assessment tool_executed '${assessmentResult.assessment.tool_executed}' does not match expected '${promptCase.toolName}'`,
      expectedToolCalled,
      selfAssessment: assessmentResult.assessment,
    };
  }

  if (options.requireSelfAssessment && assessmentResult.assessment.success !== true) {
    return {
      status: 'failure',
      failureCategory: 'self_assessment_reported_failure',
      failureReason:
        typeof assessmentResult.assessment.execution_notes === 'string'
          ? assessmentResult.assessment.execution_notes
          : 'Self-assessment reported failure',
      expectedToolCalled,
      selfAssessment: assessmentResult.assessment,
    };
  }

  return {
    status: 'success',
    expectedToolCalled,
    selfAssessment: assessmentResult.assessment,
  };
}

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function writeText(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
}

function isAuthRelatedError(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    normalized.includes('needs-auth') ||
    normalized.includes('invalid_grant') ||
    normalized.includes('no mittwald access token') ||
    normalized.includes('unauthorized') ||
    normalized.includes('authentication') ||
    normalized.includes('oauth')
  );
}

function preflightRemediation(agent: AgentName, options: RunnerOptions): string {
  if (agent === 'claude') {
    return `Run 'claude' and authenticate the mittwald MCP server via '/mcp', or update ${options.mcpConfigPath} to a valid authenticated server.`;
  }
  if (agent === 'codex') {
    return `Ensure server '${options.codexMcpServerName}' exists (codex mcp add ${options.codexMcpServerName} --url ${options.mcpUrl}) and authenticate with 'codex mcp login ${options.codexMcpServerName}'.`;
  }
  return "Configure and authenticate mittwald in opencode ('opencode mcp add' then 'opencode mcp auth mittwald').";
}

async function preflightAgent(
  agent: AgentName,
  options: RunnerOptions
): Promise<AgentPreflightResult> {
  const execution = await executePromptWithAgent(agent, PROBE_PROMPT, {
    ...options,
    timeoutMs: Math.min(options.timeoutMs, 90000),
  });

  const expectedToolCalled = execution.toolsCalled
    .map((tool) => normalizeToolName(tool))
    .includes(normalizeToolName(PROBE_TOOL_NAME));

  const hasToolCallErrors = execution.toolCallErrors.length > 0;
  const claudeNeedsAuth =
    agent === 'claude' &&
    Object.values(execution.mcpServerStatus).some((status) => status === 'needs-auth');

  const authHint = isAuthRelatedError(
    `${execution.stderr}\n${execution.stdout}\n${execution.messages.join('\n')}`
  );

  const ok =
    execution.exitCode === 0 &&
    !execution.timedOut &&
    expectedToolCalled &&
    !hasToolCallErrors &&
    !claudeNeedsAuth &&
    !authHint;

  let reason: string | undefined;
  if (!ok) {
    if (claudeNeedsAuth) {
      reason = 'Claude reports MCP server needs OAuth authentication';
    } else if (execution.timedOut) {
      reason = 'Probe timed out';
    } else if (execution.exitCode !== 0) {
      reason = `Probe exited with code ${execution.exitCode}`;
    } else if (!expectedToolCalled) {
      reason = `Probe did not call expected tool ${PROBE_TOOL_NAME}`;
    } else if (hasToolCallErrors) {
      reason = `Probe had MCP tool errors: ${execution.toolCallErrors.join('; ')}`;
    } else if (authHint) {
      reason = 'Probe output indicates OAuth/authentication issue';
    } else {
      reason = 'Probe failed for unknown reason';
    }
    reason = `${reason} Remediation: ${preflightRemediation(agent, options)}`;
  }

  return {
    agent,
    ok,
    reason,
    details: {
      commandAvailable: execution.exitCode !== 127,
      expectedToolCalled,
      hasToolCallErrors,
      claudeNeedsAuth,
      probeExitCode: execution.exitCode,
      probeTimedOut: execution.timedOut,
    },
    execution,
  };
}

function formatPercent(value: number): number {
  return Number(value.toFixed(2));
}

function generateSummary(
  runId: string,
  runDir: string,
  options: RunnerOptions,
  cleanupProjectPrefix: string,
  promptCases: PromptCase[],
  invalidFiles: InvalidPromptFile[],
  preflight: AgentPreflightResult[],
  results: ToolCaseResult[],
  cleanup?: ProjectCleanupResult,
  abortedReason?: string
): RunSummary {
  const totalCaseRuns = results.length;
  const passedCaseRuns = results.filter((r) => r.status === 'success').length;
  const failedCaseRuns = totalCaseRuns - passedCaseRuns;
  const matrixCoveragePercent =
    totalCaseRuns > 0 ? formatPercent((passedCaseRuns / totalCaseRuns) * 100) : 0;

  const perAgent = Object.fromEntries(
    options.agents.map((agent) => {
      const scoped = results.filter((result) => result.agent === agent);
      const passed = scoped.filter((result) => result.status === 'success').length;
      const failed = scoped.length - passed;
      const coveragePercent =
        scoped.length > 0 ? formatPercent((passed / scoped.length) * 100) : 0;
      return [agent, { total: scoped.length, passed, failed, coveragePercent }];
    })
  ) as RunSummary['perAgent'];

  const toolMap = new Map<
    string,
    {
      toolName: string;
      domain: string;
      displayName: string;
      byAgent: Record<AgentName, 'success' | 'failure' | 'not_run'>;
    }
  >();

  for (const promptCase of promptCases) {
    if (toolMap.has(promptCase.toolName)) continue;
    toolMap.set(promptCase.toolName, {
      toolName: promptCase.toolName,
      domain: promptCase.domain,
      displayName: promptCase.displayName,
      byAgent: Object.fromEntries(
        SUPPORTED_AGENTS.map((agent) => [agent, 'not_run'])
      ) as Record<AgentName, 'success' | 'failure' | 'not_run'>,
    });
  }

  for (const result of results) {
    const entry = toolMap.get(result.toolName);
    if (!entry) continue;
    entry.byAgent[result.agent] =
      result.status === 'success' ? 'success' : 'failure';
  }

  const perTool = Array.from(toolMap.values()).map((entry) => {
    const statuses = options.agents.map((agent) => entry.byAgent[agent]);
    const covered =
      options.coverageMode === 'all-agents'
        ? statuses.every((status) => status === 'success')
        : statuses.some((status) => status === 'success');
    return { ...entry, covered };
  });

  const totalTools = perTool.length;
  const coveredTools = perTool.filter((tool) => tool.covered).length;
  const toolCoveragePercent =
    totalTools > 0 ? formatPercent((coveredTools / totalTools) * 100) : 0;

  const reasons: string[] = [];
  if (invalidFiles.length > 0) {
    reasons.push(`${invalidFiles.length} malformed prompt file(s)`);
  }
  const failedPreflight = preflight.filter((p) => !p.ok);
  if (failedPreflight.length > 0) {
    reasons.push(
      `Preflight failed for: ${failedPreflight.map((item) => item.agent).join(', ')}`
    );
  }
  if (toolCoveragePercent < options.requireCoverage) {
    reasons.push(
      `Tool coverage ${toolCoveragePercent}% is below required ${options.requireCoverage}%`
    );
  }
  if (cleanup) {
    if (cleanup.listError) {
      reasons.push(`Cleanup failed to list projects: ${cleanup.listError}`);
    }
    if (cleanup.failed.length > 0) {
      reasons.push(
        `Cleanup failed for ${cleanup.failed.length} test project(s): ${cleanup.failed
          .map((item) => item.id)
          .join(', ')}`
      );
    }
  }
  if (abortedReason) {
    reasons.push(`Execution aborted: ${abortedReason}`);
  }

  return {
    runId,
    generatedAt: new Date().toISOString(),
    outputDir: runDir,
    options: {
      agents: options.agents,
      promptDir: options.promptDir,
      timeoutMs: options.timeoutMs,
      target: options.target,
      requireCoverage: options.requireCoverage,
      coverageMode: options.coverageMode,
      requireSelfAssessment: options.requireSelfAssessment,
      cleanupTestProjects: options.cleanupTestProjects,
      cleanupProjectPrefix,
      mcpUrl: options.mcpUrl,
      mcpConfigPath: options.mcpConfigPath,
      domains: options.domains ? Array.from(options.domains) : undefined,
      tools: options.tools ? Array.from(options.tools) : undefined,
      maxTools: options.maxTools,
    },
    promptInventory: {
      totalLoaded: promptCases.length,
      invalidFiles,
    },
    preflight,
    counts: {
      totalCaseRuns,
      passedCaseRuns,
      failedCaseRuns,
      matrixCoveragePercent,
      totalTools,
      coveredTools,
      toolCoveragePercent,
    },
    perAgent,
    perTool,
    gate: {
      requiredCoverage: options.requireCoverage,
      mode: options.coverageMode,
      passed: reasons.length === 0,
      reasons,
    },
    cleanup,
    abortedReason,
  };
}

function generateMarkdownSummary(summary: RunSummary): string {
  const lines: string[] = [];
  lines.push(`# Agent E2E Summary: ${summary.runId}`);
  lines.push('');
  lines.push(`- Generated: ${summary.generatedAt}`);
  lines.push(`- Coverage mode: ${summary.gate.mode}`);
  lines.push(`- Required coverage: ${summary.gate.requiredCoverage}%`);
  lines.push(`- Gate: ${summary.gate.passed ? 'PASS' : 'FAIL'}`);
  lines.push(`- Cleanup test projects: ${summary.options.cleanupTestProjects ? 'enabled' : 'disabled'}`);
  lines.push(`- Cleanup project prefix: ${summary.options.cleanupProjectPrefix}`);
  if (summary.abortedReason) {
    lines.push(`- Aborted: ${summary.abortedReason}`);
  }
  lines.push('');

  lines.push('## Counts');
  lines.push('');
  lines.push(`- Total tools: ${summary.counts.totalTools}`);
  lines.push(`- Covered tools: ${summary.counts.coveredTools}`);
  lines.push(`- Tool coverage: ${summary.counts.toolCoveragePercent}%`);
  lines.push(`- Case runs: ${summary.counts.totalCaseRuns}`);
  lines.push(`- Passed runs: ${summary.counts.passedCaseRuns}`);
  lines.push(`- Failed runs: ${summary.counts.failedCaseRuns}`);
  lines.push(`- Matrix coverage: ${summary.counts.matrixCoveragePercent}%`);
  lines.push('');

  lines.push('## Per-Agent Coverage');
  lines.push('');
  lines.push('| Agent | Total | Passed | Failed | Coverage |');
  lines.push('| --- | ---: | ---: | ---: | ---: |');
  for (const agent of summary.options.agents) {
    const stats = summary.perAgent[agent];
    lines.push(
      `| ${agent} | ${stats.total} | ${stats.passed} | ${stats.failed} | ${stats.coveragePercent}% |`
    );
  }
  lines.push('');

  if (summary.promptInventory.invalidFiles.length > 0) {
    lines.push('## Malformed Prompt Files');
    lines.push('');
    for (const invalid of summary.promptInventory.invalidFiles) {
      lines.push(`- ${invalid.filePath}: ${invalid.error}`);
    }
    lines.push('');
  }

  const preflightFailures = summary.preflight.filter((entry) => !entry.ok);
  if (preflightFailures.length > 0) {
    lines.push('## Preflight Failures');
    lines.push('');
    for (const failure of preflightFailures) {
      lines.push(`- ${failure.agent}: ${failure.reason}`);
    }
    lines.push('');
  }

  const uncovered = summary.perTool.filter((tool) => !tool.covered);
  if (uncovered.length > 0) {
    lines.push('## Uncovered Tools');
    lines.push('');
    lines.push('| Tool | Domain | Status by Agent |');
    lines.push('| --- | --- | --- |');
    for (const tool of uncovered) {
      const status = summary.options.agents
        .map((agent) => `${agent}:${tool.byAgent[agent]}`)
        .join(', ');
      lines.push(`| ${tool.toolName} | ${tool.domain} | ${status} |`);
    }
    lines.push('');
  }

  if (summary.cleanup) {
    lines.push('## Project Cleanup');
    lines.push('');
    lines.push(`- Prefix: ${summary.cleanup.prefix}`);
    lines.push(`- Matched projects: ${summary.cleanup.matchedCount}`);
    lines.push(`- Deleted projects: ${summary.cleanup.deleted.length}`);
    lines.push(`- Failed deletions: ${summary.cleanup.failed.length}`);
    if (summary.cleanup.listError) {
      lines.push(`- List error: ${summary.cleanup.listError}`);
    }
    if (summary.cleanup.deleted.length > 0) {
      lines.push(`- Deleted IDs: ${summary.cleanup.deleted.join(', ')}`);
    }
    if (summary.cleanup.failed.length > 0) {
      lines.push(
        `- Failed IDs: ${summary.cleanup.failed
          .map((item) => `${item.id} (${item.reason})`)
          .join(', ')}`
      );
    }
    lines.push('');
  }

  if (summary.gate.reasons.length > 0) {
    lines.push('## Gate Failure Reasons');
    lines.push('');
    for (const reason of summary.gate.reasons) {
      lines.push(`- ${reason}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function printUsage(): void {
  console.log(
    [
      'Usage: tsx evals/scripts/agent-e2e-runner.ts [options]',
      '',
      'Options:',
      '  --agents=claude,codex,opencode   Comma-separated agents (default: claude)',
      '  --prompt-dir=evals/prompts        Prompt directory root',
      '  --output-dir=evals/results/agent-e2e',
      `  --timeout-ms=${DEFAULT_TIMEOUT_MS}              Timeout per prompt`,
      '  --mcp-config=.mcp.json            Claude MCP config file',
      '  --target=fly|mittwald             Target endpoint selection (default: fly)',
      '  --mcp-url=https://mittwald-mcp-fly2.fly.dev/mcp',
      '  --domains=apps,databases          Restrict domains',
      '  --tools=mcp__mittwald__foo,...    Restrict tools',
      '  --max-tools=10                    Run only first N cases',
      '  --skip-preflight                  Skip readiness probe',
      '  --preflight-only                  Run probes only',
      '  --fail-fast                       Stop on first failed case',
      '  --require-coverage=100            Coverage gate threshold',
      '  --coverage-mode=all-agents|any-agent',
      '  --require-self-assessment         Fail if self-assessment is missing/invalid',
      '  --cleanup-test-projects           Enable project cleanup (default: enabled)',
      '  --no-cleanup-test-projects        Disable project cleanup',
      '  --cleanup-project-prefix=<prefix> Prefix for project tagging/cleanup (default: run ID)',
      '  --codex-mcp-server-name=mittwald  Codex server config name',
      '  --claude-model=<name>',
      '  --codex-model=<name>',
      '  --opencode-model=<provider/model>',
    ].join('\n')
  );
}

async function main(): Promise<void> {
  let options: RunnerOptions;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(
      `Argument error: ${error instanceof Error ? error.message : String(error)}`
    );
    printUsage();
    process.exit(1);
    return;
  }

  const runId = `agent-e2e-${new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, 19)}`;
  const cleanupProjectPrefix = options.cleanupProjectPrefix ?? runId;
  const runDir = path.join(options.outputDir, runId);
  ensureDir(runDir);

  if (options.preflightOnly) {
    options.requireCoverage = 0;
  }

  console.log(`\n[agent-e2e] Run ID: ${runId}`);
  console.log(`[agent-e2e] Agents: ${options.agents.join(', ')}`);
  console.log(`[agent-e2e] Prompt dir: ${options.promptDir}`);
  console.log(`[agent-e2e] Target: ${options.target}`);
  console.log(`[agent-e2e] MCP URL: ${options.mcpUrl}`);
  console.log(
    `[agent-e2e] Cleanup: ${options.cleanupTestProjects ? 'enabled' : 'disabled'} (prefix: ${cleanupProjectPrefix})`
  );
  console.log(`[agent-e2e] Output: ${runDir}`);

  const { cases: promptCases, invalidFiles } = loadPromptCases(options);
  console.log(
    `[agent-e2e] Loaded ${promptCases.length} prompt case(s), ${invalidFiles.length} malformed file(s)`
  );

  const preflight: AgentPreflightResult[] = [];
  if (!options.skipPreflight) {
    console.log('\n[agent-e2e] Running preflight probes...');
    for (const agent of options.agents) {
      const result = await preflightAgent(agent, options);
      preflight.push(result);
      console.log(
        `[agent-e2e] Preflight ${agent}: ${result.ok ? 'OK' : 'FAILED'}${
          result.reason ? ` (${result.reason})` : ''
        }`
      );
    }
  }

  const shouldAbortForPreflight =
    !options.skipPreflight && preflight.some((result) => !result.ok);
  const results: ToolCaseResult[] = [];
  let abortedReason: string | undefined;

  if (!options.preflightOnly && !shouldAbortForPreflight && invalidFiles.length === 0) {
    executionLoop: for (const agent of options.agents) {
      console.log(`\n[agent-e2e] Executing prompt set with ${agent}...`);
      for (let index = 0; index < promptCases.length; index++) {
        const promptCase = promptCases[index];
        console.log(
          `[agent-e2e] [${agent}] ${index + 1}/${promptCases.length} ${promptCase.displayName}`
        );

        const runPrompt = withRunCleanupGuardrails(
          promptCase.prompt,
          cleanupProjectPrefix
        );
        const startedAt = new Date().toISOString();
        const execution = await executePromptWithAgent(agent, runPrompt, options);
        const finishedAt = new Date().toISOString();
        const mcpAvailabilityIssue = detectMcpAvailabilityIssue(agent, execution);
        const evaluation = mcpAvailabilityIssue
          ? {
              status: 'failure' as const,
              failureCategory: 'mcp_server_unavailable' as const,
              failureReason: mcpAvailabilityIssue,
              expectedToolCalled: expectedToolCalledForCase(promptCase, execution),
            }
          : evaluateCase(promptCase, execution, options);

        const rawDir = path.join(
          runDir,
          'raw',
          agent,
          sanitizeFilePart(promptCase.domain)
        );
        ensureDir(rawDir);

        const caseStem = sanitizeFilePart(promptCase.id);
        const rawOutputFile = path.join(rawDir, `${caseStem}.stdout.jsonl`);
        const stdoutFile = path.join(rawDir, `${caseStem}.stdout.txt`);
        const stderrFile = path.join(rawDir, `${caseStem}.stderr.txt`);
        writeText(rawOutputFile, execution.stdout);
        writeText(stdoutFile, execution.messages.join('\n'));
        writeText(stderrFile, execution.stderr);

        const caseResult: ToolCaseResult = {
          runId,
          agent,
          promptCaseId: promptCase.id,
          domain: promptCase.domain,
          promptFile: promptCase.promptFile,
          toolName: promptCase.toolName,
          displayName: promptCase.displayName,
          startedAt,
          finishedAt,
          durationMs: execution.durationMs,
          status: evaluation.status,
          failureCategory: evaluation.failureCategory,
          failureReason: evaluation.failureReason,
          expectedToolCalled: evaluation.expectedToolCalled,
          toolsCalled: execution.toolsCalled,
          toolCallErrors: execution.toolCallErrors,
          selfAssessment: evaluation.selfAssessment,
          rawOutputFile,
          stdoutFile,
          stderrFile,
        };

        const resultFile = path.join(
          runDir,
          'results',
          agent,
          sanitizeFilePart(promptCase.domain),
          `${caseStem}.json`
        );
        writeJson(resultFile, caseResult);
        results.push(caseResult);

        if (caseResult.status === 'failure') {
          console.log(
            `[agent-e2e] [${agent}] FAILED: ${promptCase.displayName} (${caseResult.failureCategory})`
          );
          if (mcpAvailabilityIssue) {
            abortedReason = `[${agent}] ${mcpAvailabilityIssue} at case '${promptCase.displayName}'`;
            console.log(
              `[agent-e2e] [${agent}] Stopping run immediately due to MCP availability issue: ${mcpAvailabilityIssue}`
            );
            break executionLoop;
          }
          if (!options.continueOnFailure) {
            console.log('[agent-e2e] fail-fast enabled, stopping execution');
            break;
          }
        } else {
          console.log(`[agent-e2e] [${agent}] PASSED: ${promptCase.displayName}`);
        }
      }
    }
  } else if (invalidFiles.length > 0) {
    console.log(
      '\n[agent-e2e] Skipping execution because malformed prompt files were detected.'
    );
  } else if (shouldAbortForPreflight) {
    console.log('\n[agent-e2e] Skipping execution due to preflight failures.');
  }

  let cleanupResult: ProjectCleanupResult | undefined;
  if (!options.preflightOnly && options.cleanupTestProjects) {
    console.log(
      `\n[agent-e2e] Cleaning up test projects with prefix '${cleanupProjectPrefix}'...`
    );
    cleanupResult = await cleanupProjectsByPrefix(cleanupProjectPrefix);
    writeJson(path.join(runDir, 'project-cleanup.json'), cleanupResult);

    if (cleanupResult.listError) {
      console.log(`[agent-e2e] Cleanup list error: ${cleanupResult.listError}`);
    } else {
      console.log(
        `[agent-e2e] Cleanup matched ${cleanupResult.matchedCount} project(s), deleted ${cleanupResult.deleted.length}, failed ${cleanupResult.failed.length}`
      );
      if (cleanupResult.deleted.length > 0) {
        console.log(
          `[agent-e2e] Cleanup deleted IDs: ${cleanupResult.deleted.join(', ')}`
        );
      }
      if (cleanupResult.failed.length > 0) {
        console.log(
          `[agent-e2e] Cleanup failed IDs: ${cleanupResult.failed
            .map((item) => `${item.id} (${item.reason})`)
            .join(', ')}`
        );
      }
    }
  }

  const summary = generateSummary(
    runId,
    runDir,
    options,
    cleanupProjectPrefix,
    promptCases,
    invalidFiles,
    preflight,
    results,
    cleanupResult,
    abortedReason
  );

  const summaryJsonFile = path.join(runDir, 'summary.json');
  const summaryMdFile = path.join(runDir, 'summary.md');
  writeJson(summaryJsonFile, summary);
  writeText(summaryMdFile, generateMarkdownSummary(summary));

  console.log('\n[agent-e2e] Summary');
  console.log(`[agent-e2e] Tool coverage: ${summary.counts.toolCoveragePercent}%`);
  console.log(`[agent-e2e] Matrix coverage: ${summary.counts.matrixCoveragePercent}%`);
  console.log(`[agent-e2e] Gate: ${summary.gate.passed ? 'PASS' : 'FAIL'}`);
  console.log(`[agent-e2e] JSON: ${summaryJsonFile}`);
  console.log(`[agent-e2e] Markdown: ${summaryMdFile}`);

  if (!summary.gate.passed) {
    for (const reason of summary.gate.reasons) {
      console.log(`[agent-e2e] Gate reason: ${reason}`);
    }
    process.exit(1);
    return;
  }

  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error in agent-e2e runner:', error);
    process.exit(1);
  });
}
