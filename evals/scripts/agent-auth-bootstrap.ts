#!/usr/bin/env npx tsx

import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

type AgentName = 'claude' | 'codex' | 'opencode';
type McpTarget = 'fly' | 'mittwald';
type ClaudeScope = 'local' | 'project' | 'user';

const SUPPORTED_AGENTS: AgentName[] = ['claude', 'codex', 'opencode'];
const MCP_TARGET_URLS: Record<McpTarget, string> = {
  fly: 'https://mittwald-mcp-fly2.fly.dev/mcp',
  mittwald: 'https://mcp.mittwald.de/mcp',
};
const DEFAULT_TARGET: McpTarget = 'fly';

interface BootstrapOptions {
  agents: AgentName[];
  target: McpTarget;
  mcpUrl: string;
  mcpName: string;
  mcpConfigPath: string;
  opencodeConfigPath: string;
  claudeScope: ClaudeScope;
  skipConfigure: boolean;
  skipLogin: boolean;
  runProbe: boolean;
}

function toAbsolute(p: string): string {
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

function parseCsv(value: string): string[] {
  return value
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseArgs(argv: string[]): BootstrapOptions {
  const options: BootstrapOptions = {
    agents: ['claude', 'codex', 'opencode'],
    target: DEFAULT_TARGET,
    mcpUrl: MCP_TARGET_URLS[DEFAULT_TARGET],
    mcpName: 'mittwald',
    mcpConfigPath: toAbsolute('.mcp.json'),
    opencodeConfigPath: toAbsolute('.opencode/opencode.json'),
    claudeScope: 'user',
    skipConfigure: false,
    skipLogin: false,
    runProbe: false,
  };

  let mcpUrlExplicitlySet = false;

  for (const arg of argv) {
    if (!arg.startsWith('--')) {
      throw new Error(`Unknown argument format: ${arg}`);
    }

    const [rawKey, rawValue] = arg.slice(2).split('=', 2);
    const key = rawKey.trim();
    const value = rawValue?.trim();

    switch (key) {
      case 'agents':
        if (!value) throw new Error('--agents requires a value');
        options.agents = parseCsv(value).map((agent) => {
          if (!SUPPORTED_AGENTS.includes(agent as AgentName)) {
            throw new Error(
              `Unsupported agent '${agent}'. Supported: ${SUPPORTED_AGENTS.join(', ')}`
            );
          }
          return agent as AgentName;
        });
        break;
      case 'target':
        if (!value) throw new Error('--target requires a value');
        if (value !== 'fly' && value !== 'mittwald') {
          throw new Error(`Invalid --target '${value}'. Use 'fly' or 'mittwald'`);
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
      case 'mcp-name':
        if (!value) throw new Error('--mcp-name requires a value');
        options.mcpName = value;
        break;
      case 'mcp-config':
        if (!value) throw new Error('--mcp-config requires a value');
        options.mcpConfigPath = toAbsolute(value);
        break;
      case 'opencode-config':
        if (!value) throw new Error('--opencode-config requires a value');
        options.opencodeConfigPath = toAbsolute(value);
        break;
      case 'claude-scope':
        if (!value) throw new Error('--claude-scope requires a value');
        if (value !== 'local' && value !== 'project' && value !== 'user') {
          throw new Error(
            `Invalid --claude-scope '${value}'. Use 'local', 'project', or 'user'`
          );
        }
        options.claudeScope = value;
        break;
      case 'skip-configure':
        options.skipConfigure = true;
        break;
      case 'skip-login':
        options.skipLogin = true;
        break;
      case 'probe':
        options.runProbe = true;
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

function runCommand(
  command: string,
  args: string[],
  options: { allowFailure?: boolean; inheritStdio?: boolean } = {}
): { ok: boolean; exitCode: number; stdout: string; stderr: string } {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: options.inheritStdio ? 'inherit' : 'pipe',
    encoding: 'utf-8',
    env: {
      ...process.env,
    },
  });

  const exitCode = typeof result.status === 'number' ? result.status : 1;
  const stdout = (result.stdout as string | undefined) ?? '';
  const stderr = (result.stderr as string | undefined) ?? '';

  if (!options.allowFailure && exitCode !== 0) {
    throw new Error(
      `Command failed (${command} ${args.join(' ')}): ${stderr || stdout || `exit ${exitCode}`}`
    );
  }

  return {
    ok: exitCode === 0,
    exitCode,
    stdout,
    stderr,
  };
}

function runInteractive(command: string, args: string[]): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: {
        ...process.env,
      },
    });
    child.on('close', (code) => resolve(code ?? 1));
    child.on('error', () => resolve(1));
  });
}

function readJsonObject(filePath: string): Record<string, unknown> {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // fall through
  }
  return {};
}

function writeJson(filePath: string, payload: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
}

function configureClaudeProjectMcpConfig(
  mcpConfigPath: string,
  mcpName: string,
  mcpUrl: string
): void {
  const current = readJsonObject(mcpConfigPath);
  const mcpServers =
    current.mcpServers && typeof current.mcpServers === 'object'
      ? (current.mcpServers as Record<string, unknown>)
      : {};

  mcpServers[mcpName] = {
    type: 'http',
    url: mcpUrl,
  };

  const next = {
    ...current,
    mcpServers,
  };

  writeJson(mcpConfigPath, next);
}

function configureOpencodeProjectConfig(
  opencodeConfigPath: string,
  mcpName: string,
  mcpUrl: string
): void {
  const current = readJsonObject(opencodeConfigPath);
  const mcp =
    current.mcp && typeof current.mcp === 'object'
      ? (current.mcp as Record<string, unknown>)
      : {};

  mcp[mcpName] = {
    type: 'remote',
    url: mcpUrl,
    enabled: true,
  };

  const next = {
    ...current,
    mcp,
  };

  writeJson(opencodeConfigPath, next);
}

function ensureClaudeCliServer(
  mcpName: string,
  mcpUrl: string,
  scope: ClaudeScope
): void {
  runCommand('claude', ['mcp', 'remove', '--scope', scope, mcpName], {
    allowFailure: true,
  });
  runCommand('claude', [
    'mcp',
    'add',
    '--scope',
    scope,
    '--transport',
    'http',
    mcpName,
    mcpUrl,
  ]);
}

function ensureCodexServer(mcpName: string, mcpUrl: string): void {
  const current = runCommand('codex', ['mcp', 'get', mcpName], {
    allowFailure: true,
  });
  if (current.ok && current.stdout.includes(`url: ${mcpUrl}`)) {
    return;
  }

  if (current.ok) {
    runCommand('codex', ['mcp', 'remove', mcpName], { allowFailure: true });
  }

  runCommand('codex', ['mcp', 'add', mcpName, '--url', mcpUrl]);
}

function printStatus(options: BootstrapOptions): void {
  console.log('\n[agent-auth] Current MCP status');
  if (options.agents.includes('claude')) {
    console.log('\n[claude]');
    const result = runCommand('claude', ['mcp', 'list'], { allowFailure: true });
    if (result.stdout) process.stdout.write(result.stdout);
    if (!result.ok && result.stderr) process.stderr.write(result.stderr);
  }

  if (options.agents.includes('codex')) {
    console.log('\n[codex]');
    const result = runCommand('codex', ['mcp', 'list'], { allowFailure: true });
    if (result.stdout) process.stdout.write(result.stdout);
    if (!result.ok && result.stderr) process.stderr.write(result.stderr);
  }

  if (options.agents.includes('opencode')) {
    console.log('\n[opencode]');
    const result = runCommand('opencode', ['mcp', 'list'], { allowFailure: true });
    if (result.stdout) process.stdout.write(result.stdout);
    if (!result.ok && result.stderr) process.stderr.write(result.stderr);
  }
}

function printUsage(): void {
  console.log(
    [
      'Usage: tsx evals/scripts/agent-auth-bootstrap.ts [options]',
      '',
      'Options:',
      '  --agents=claude,codex,opencode   Comma-separated agents (default: all)',
      '  --target=fly|mittwald            Endpoint target (default: fly)',
      '  --mcp-url=<url>                  Explicit MCP URL override',
      '  --mcp-name=mittwald              Shared MCP server name',
      '  --mcp-config=.mcp.json           Claude project MCP config path',
      '  --opencode-config=.opencode/opencode.json',
      '  --claude-scope=user|project|local',
      '  --skip-configure                 Skip writing/updating config',
      '  --skip-login                     Skip OAuth login commands',
      '  --probe                          Run agent preflight probe afterwards',
    ].join('\n')
  );
}

async function main(): Promise<void> {
  let options: BootstrapOptions;
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

  console.log('\n[agent-auth] Bootstrap configuration');
  console.log(`[agent-auth] Agents: ${options.agents.join(', ')}`);
  console.log(`[agent-auth] Target: ${options.target}`);
  console.log(`[agent-auth] MCP URL: ${options.mcpUrl}`);
  console.log(`[agent-auth] MCP Name: ${options.mcpName}`);

  if (!options.skipConfigure) {
    console.log('\n[agent-auth] Configuring agent MCP endpoints...');

    if (options.agents.includes('claude')) {
      configureClaudeProjectMcpConfig(
        options.mcpConfigPath,
        options.mcpName,
        options.mcpUrl
      );
      ensureClaudeCliServer(options.mcpName, options.mcpUrl, options.claudeScope);
      console.log(`[agent-auth] Updated Claude config: ${options.mcpConfigPath}`);
    }

    if (options.agents.includes('codex')) {
      ensureCodexServer(options.mcpName, options.mcpUrl);
      console.log('[agent-auth] Codex MCP server ensured');
    }

    if (options.agents.includes('opencode')) {
      configureOpencodeProjectConfig(
        options.opencodeConfigPath,
        options.mcpName,
        options.mcpUrl
      );
      console.log(
        `[agent-auth] Updated Opencode config: ${options.opencodeConfigPath}`
      );
    }
  }

  if (!options.skipLogin) {
    if (options.agents.includes('codex')) {
      console.log('\n[agent-auth] Running: codex mcp login');
      const code = await runInteractive('codex', ['mcp', 'login', options.mcpName]);
      if (code !== 0) {
        throw new Error('Codex OAuth login failed');
      }
    }

    if (options.agents.includes('opencode')) {
      console.log('\n[agent-auth] Running: opencode mcp auth');
      const code = await runInteractive('opencode', ['mcp', 'auth', options.mcpName]);
      if (code !== 0) {
        throw new Error('Opencode OAuth login failed');
      }
    }

    if (options.agents.includes('claude')) {
      console.log(
        '\n[agent-auth] Claude has no standalone mcp login command; auth completes on first tool call.'
      );
      console.log(
        `[agent-auth] If needed, start 'claude' and authenticate server '${options.mcpName}' via /mcp.`
      );
    }
  }

  printStatus(options);

  if (options.runProbe) {
    console.log('\n[agent-auth] Running preflight probe...');
    const probeArgs = [
      'run',
      'eval:agent:preflight',
      '--',
      `--agents=${options.agents.join(',')}`,
      `--target=${options.target}`,
      `--mcp-url=${options.mcpUrl}`,
    ];
    const probe = runCommand('npm', probeArgs, {
      allowFailure: true,
      inheritStdio: true,
    });
    process.exit(probe.exitCode);
    return;
  }

  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(
      `[agent-auth] Bootstrap failed: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  });
}
