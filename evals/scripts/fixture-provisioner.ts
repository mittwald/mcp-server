/**
 * Fixture provisioning for scenario runner.
 * Creates Mittwald resources via MCP tools before scenario execution.
 */

import { spawn } from 'child_process';
import path from 'path';
import type { ScenarioDefinition } from '../../src/types/scenario.js';
import type { ProvisionedFixtures } from './template-interpolator.js';
import { createEmptyFixtures, interpolate } from './template-interpolator.js';

const PROVISION_TIMEOUT = 120000; // 2 minutes per resource

interface ClaudePromptResult {
  toolsCalled: string[];
  logOutput: string;
}

/**
 * Execute a prompt via Claude Code CLI and parse MCP tool output.
 */
async function executeClaudePrompt(
  prompt: string,
  timeout: number = PROVISION_TIMEOUT
): Promise<ClaudePromptResult> {
  return new Promise((resolve, reject) => {
    const projectRoot = process.cwd();
    const mcpConfigPath = path.join(projectRoot, '.mcp.json');

    const args = [
      '--print',
      prompt,
      '--mcp-config', mcpConfigPath,
      '--allowedTools', 'mcp__mittwald__*',
      '--output-format', 'stream-json',
      '--verbose'
    ];

    const child = spawn('claude', args, {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout,
      env: {
        ...process.env,
        HOME: process.env.HOME,
        PATH: process.env.PATH
      }
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        const toolsCalled = parseToolCallsFromOutput(stdout);
        resolve({ toolsCalled, logOutput: stdout });
      } else {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr}`));
      }
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to spawn Claude CLI: ${error.message}`));
    });

    setTimeout(() => {
      if (!child.killed) {
        child.kill();
        reject(new Error(`Provisioning timeout (${timeout}ms)`));
      }
    }, timeout);
  });
}

/**
 * Parse tool calls from Claude CLI output.
 */
function parseToolCallsFromOutput(output: string): string[] {
  const tools: string[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;

    try {
      const json = JSON.parse(line);
      if (json.type === 'assistant' && json.message?.content) {
        for (const content of json.message.content) {
          if (content.type === 'tool_use' && content.name) {
            tools.push(content.name);
          }
        }
      }
    } catch {
      // Skip non-JSON lines
    }
  }

  return tools;
}

/**
 * Extract resource ID from MCP tool output.
 * Looks for patterns like "id": "p-xxxxx" in JSON output.
 */
function extractResourceId(output: string, resourceType: string): string {
  // Try to find ID in JSON format first
  const idPattern = /"id"\s*:\s*"([a-z]+-[a-z0-9]+)"/;
  const match = output.match(idPattern);

  if (match) {
    return match[1];
  }

  // Fallback: look for resource-specific patterns
  const patterns: Record<string, RegExp> = {
    project: /project\s+([a-z]+-[a-z0-9]+)/i,
    mysql: /database\s+([a-z]+-[a-z0-9]+)/i,
    redis: /redis\s+([a-z]+-[a-z0-9]+)/i,
    app: /app\s+([a-z]+-[a-z0-9]+)/i,
    domain: /domain\s+([a-z]+-[a-z0-9]+)/i,
    virtualhost: /virtualhost\s+([a-z]+-[a-z0-9]+)/i,
  };

  const pattern = patterns[resourceType];
  if (pattern) {
    const fallbackMatch = output.match(pattern);
    if (fallbackMatch) {
      return fallbackMatch[1];
    }
  }

  throw new Error(`Failed to extract ${resourceType} ID from output`);
}

/**
 * Create a Mittwald project.
 */
async function createProject(
  description: string,
  serverId?: string
): Promise<string> {
  const serverClause = serverId ? ` on server ${serverId}` : '';
  const prompt = `Create a Mittwald project with description "${description}"${serverClause}`;

  console.log(`  Creating project: ${description}`);
  const { logOutput } = await executeClaudePrompt(prompt);

  const projectId = extractResourceId(logOutput, 'project');
  console.log(`  ✓ Project created: ${projectId}`);

  return projectId;
}

/**
 * Create a MySQL database.
 */
async function createMysqlDatabase(
  projectId: string,
  config: { description: string; version: string; characterSet?: string; collation?: string }
): Promise<{ id: string; description: string }> {
  const charSetClause = config.characterSet ? ` with character set ${config.characterSet}` : '';
  const collationClause = config.collation ? ` and collation ${config.collation}` : '';

  const prompt = `In project ${projectId}, create a MySQL ${config.version} database with description "${config.description}"${charSetClause}${collationClause}`;

  console.log(`  Creating MySQL database: ${config.description}`);
  const { logOutput } = await executeClaudePrompt(prompt);

  const id = extractResourceId(logOutput, 'mysql');
  console.log(`  ✓ MySQL database created: ${id}`);

  return { id, description: config.description };
}

/**
 * Create a Redis database.
 */
async function createRedisDatabase(
  projectId: string,
  config: { description: string; version: string; maxMemory?: string; maxMemoryPolicy?: string }
): Promise<{ id: string; description: string }> {
  const memoryClause = config.maxMemory ? ` with max memory ${config.maxMemory}` : '';
  const policyClause = config.maxMemoryPolicy ? ` and eviction policy ${config.maxMemoryPolicy}` : '';

  const prompt = `In project ${projectId}, create a Redis ${config.version} database with description "${config.description}"${memoryClause}${policyClause}`;

  console.log(`  Creating Redis database: ${config.description}`);
  const { logOutput } = await executeClaudePrompt(prompt);

  const id = extractResourceId(logOutput, 'redis');
  console.log(`  ✓ Redis database created: ${id}`);

  return { id, description: config.description };
}

/**
 * Install an app.
 */
async function createApp(
  projectId: string,
  config: { description: string; appName: string; appVersion: string }
): Promise<{ id: string; description: string }> {
  const prompt = `In project ${projectId}, install ${config.appName} version ${config.appVersion} with description "${config.description}"`;

  console.log(`  Installing app: ${config.description}`);
  const { logOutput } = await executeClaudePrompt(prompt);

  const id = extractResourceId(logOutput, 'app');
  console.log(`  ✓ App installed: ${id}`);

  return { id, description: config.description };
}

/**
 * Create a domain (ingress).
 */
async function createDomain(
  projectId: string,
  fqdn: string
): Promise<{ id: string; fqdn: string }> {
  const prompt = `In project ${projectId}, create ingress for domain ${fqdn}`;

  console.log(`  Creating domain: ${fqdn}`);
  const { logOutput } = await executeClaudePrompt(prompt);

  const id = extractResourceId(logOutput, 'domain');
  console.log(`  ✓ Domain created: ${id}`);

  return { id, fqdn };
}

/**
 * Create a virtualhost.
 */
async function createVirtualhost(
  projectId: string,
  hostname: string
): Promise<{ id: string; hostname: string }> {
  const prompt = `In project ${projectId}, create virtualhost for ${hostname}`;

  console.log(`  Creating virtualhost: ${hostname}`);
  const { logOutput } = await executeClaudePrompt(prompt);

  const id = extractResourceId(logOutput, 'virtualhost');
  console.log(`  ✓ Virtualhost created: ${id}`);

  return { id, hostname };
}

/**
 * Create a mail address.
 */
async function createMailAddress(
  projectId: string,
  config: { address: string; password?: string; quota?: string }
): Promise<{ id: string; address: string }> {
  const passwordClause = config.password ? ` with password "${config.password}"` : ' with random password';
  const quotaClause = config.quota ? ` and quota ${config.quota}` : '';

  const prompt = `In project ${projectId}, create mail address ${config.address}${passwordClause}${quotaClause}`;

  console.log(`  Creating mail address: ${config.address}`);
  const { logOutput } = await executeClaudePrompt(prompt);

  const id = extractResourceId(logOutput, 'mail');
  console.log(`  ✓ Mail address created: ${id}`);

  return { id, address: config.address };
}

/**
 * Create a deliverybox.
 */
async function createDeliverybox(
  projectId: string,
  config: { description: string; password?: string }
): Promise<{ id: string; description: string }> {
  const passwordClause = config.password ? ` with password "${config.password}"` : ' with random password';

  const prompt = `In project ${projectId}, create deliverybox with description "${config.description}"${passwordClause}`;

  console.log(`  Creating deliverybox: ${config.description}`);
  const { logOutput } = await executeClaudePrompt(prompt);

  const id = extractResourceId(logOutput, 'deliverybox');
  console.log(`  ✓ Deliverybox created: ${id}`);

  return { id, description: config.description };
}

/**
 * Create an SSH user.
 */
async function createSshUser(
  projectId: string,
  config: { description: string; publicKey?: string }
): Promise<{ id: string; description: string }> {
  const keyClause = config.publicKey ? ` with public key from "${config.publicKey}"` : '';

  const prompt = `In project ${projectId}, create SSH user with description "${config.description}"${keyClause}`;

  console.log(`  Creating SSH user: ${config.description}`);
  const { logOutput } = await executeClaudePrompt(prompt);

  const id = extractResourceId(logOutput, 'ssh');
  console.log(`  ✓ SSH user created: ${id}`);

  return { id, description: config.description };
}

/**
 * Create a backup schedule.
 */
async function createBackupSchedule(
  projectId: string,
  config: { description: string; schedule: string; ttl: string }
): Promise<{ id: string; description: string }> {
  const prompt = `In project ${projectId}, create backup schedule with description "${config.description}", cron schedule "${config.schedule}", and TTL ${config.ttl}`;

  console.log(`  Creating backup schedule: ${config.description}`);
  const { logOutput } = await executeClaudePrompt(prompt);

  const id = extractResourceId(logOutput, 'backup');
  console.log(`  ✓ Backup schedule created: ${id}`);

  return { id, description: config.description };
}

/**
 * Create a container registry.
 */
async function createRegistry(
  projectId: string,
  config: { description: string; uri: string; username?: string; password?: string }
): Promise<{ id: string; description: string }> {
  const authClause = config.username ? ` with username "${config.username}"` : '';

  const prompt = `In project ${projectId}, create container registry for ${config.uri} with description "${config.description}"${authClause}`;

  console.log(`  Creating registry: ${config.description}`);
  const { logOutput } = await executeClaudePrompt(prompt);

  const id = extractResourceId(logOutput, 'registry');
  console.log(`  ✓ Registry created: ${id}`);

  return { id, description: config.description };
}

/**
 * Setup fixtures for a scenario.
 * Returns provisioned resource IDs for template interpolation.
 */
export async function setupFixtures(
  scenario: ScenarioDefinition,
  runId: string
): Promise<ProvisionedFixtures> {
  const fixtures = createEmptyFixtures();

  if (!scenario.fixtures) {
    console.log('No fixtures defined for this scenario');
    return fixtures;
  }

  const rollbackList: Array<{ type: string; id: string }> = [];

  try {
    // Build initial context (for template interpolation in fixture definitions)
    const initialContext = { RUN_ID: runId };

    // 1. Create project (required first)
    if (scenario.fixtures.project) {
      const description = interpolate(scenario.fixtures.project.description, initialContext);
      const serverId = scenario.fixtures.project.serverId || process.env.DEFAULT_SERVER_ID;

      if (!serverId) {
        throw new Error('No server ID provided and DEFAULT_SERVER_ID environment variable not set');
      }

      fixtures.projectId = await createProject(description, serverId);
      rollbackList.push({ type: 'project', id: fixtures.projectId });
    }

    if (!fixtures.projectId) {
      throw new Error('Project is required for provisioning other resources');
    }

    // 2. Create databases (parallel for speed)
    if (scenario.fixtures.databases?.mysql) {
      const mysqlPromises = scenario.fixtures.databases.mysql.map((db) =>
        createMysqlDatabase(fixtures.projectId!, {
          description: interpolate(db.description, initialContext),
          version: db.version,
          characterSet: db.characterSet,
          collation: db.collation,
        })
      );

      fixtures.databases.mysql = await Promise.all(mysqlPromises);
      fixtures.databases.mysql.forEach((db) =>
        rollbackList.push({ type: 'mysql', id: db.id })
      );
    }

    if (scenario.fixtures.databases?.redis) {
      const redisPromises = scenario.fixtures.databases.redis.map((db) =>
        createRedisDatabase(fixtures.projectId!, {
          description: interpolate(db.description, initialContext),
          version: db.version,
          maxMemory: db.maxMemory,
          maxMemoryPolicy: db.maxMemoryPolicy,
        })
      );

      fixtures.databases.redis = await Promise.all(redisPromises);
      fixtures.databases.redis.forEach((db) =>
        rollbackList.push({ type: 'redis', id: db.id })
      );
    }

    // 3. Create apps (sequential to avoid rate limits)
    if (scenario.fixtures.apps) {
      for (const app of scenario.fixtures.apps) {
        const created = await createApp(fixtures.projectId, {
          description: interpolate(app.description, initialContext),
          appName: app.appName,
          appVersion: app.appVersion,
        });
        fixtures.apps.push(created);
        rollbackList.push({ type: 'app', id: created.id });
      }
    }

    // 4. Create domains and virtualhosts
    if (scenario.fixtures.domains) {
      for (const domain of scenario.fixtures.domains) {
        const fqdn = interpolate(domain.fqdn, initialContext);
        const created = await createDomain(fixtures.projectId, fqdn);
        fixtures.domains.push(created);
        rollbackList.push({ type: 'domain', id: created.id });

        if (domain.virtualhost) {
          const vhost = await createVirtualhost(fixtures.projectId, fqdn);
          fixtures.virtualhosts.push(vhost);
          rollbackList.push({ type: 'virtualhost', id: vhost.id });
        }
      }
    }

    // 5. Create mail resources
    if (scenario.fixtures.mail?.addresses) {
      for (const addr of scenario.fixtures.mail.addresses) {
        const created = await createMailAddress(fixtures.projectId, {
          address: interpolate(addr.address, initialContext),
          password: addr.password,
          quota: addr.quota,
        });
        fixtures.mail.addresses.push(created);
        rollbackList.push({ type: 'mail_address', id: created.id });
      }
    }

    if (scenario.fixtures.mail?.deliveryboxes) {
      for (const box of scenario.fixtures.mail.deliveryboxes) {
        const created = await createDeliverybox(fixtures.projectId, {
          description: interpolate(box.description, initialContext),
          password: box.password,
        });
        fixtures.mail.deliveryboxes.push(created);
        rollbackList.push({ type: 'deliverybox', id: created.id });
      }
    }

    // 6. Create SSH users
    if (scenario.fixtures.ssh_users) {
      for (const user of scenario.fixtures.ssh_users) {
        const created = await createSshUser(fixtures.projectId, {
          description: interpolate(user.description, initialContext),
          publicKey: user.publicKey,
        });
        fixtures.sshUsers.push(created);
        rollbackList.push({ type: 'ssh_user', id: created.id });
      }
    }

    // 7. Create backup schedules
    if (scenario.fixtures.backups?.schedules) {
      for (const schedule of scenario.fixtures.backups.schedules) {
        const created = await createBackupSchedule(fixtures.projectId, {
          description: interpolate(schedule.description, initialContext),
          schedule: schedule.schedule,
          ttl: schedule.ttl,
        });
        fixtures.backups.schedules.push(created);
        rollbackList.push({ type: 'backup_schedule', id: created.id });
      }
    }

    // 8. Create container registries
    if (scenario.fixtures.containers?.registries) {
      for (const registry of scenario.fixtures.containers.registries) {
        const created = await createRegistry(fixtures.projectId, {
          description: interpolate(registry.description, initialContext),
          uri: registry.uri,
          username: registry.username,
          password: registry.password,
        });
        fixtures.containers.registries.push(created);
        rollbackList.push({ type: 'registry', id: created.id });
      }
    }

    return fixtures;
  } catch (error) {
    console.error('\n❌ Fixture provisioning failed, rolling back...');

    // Rollback in reverse order
    for (const resource of rollbackList.reverse()) {
      try {
        await deleteResource(resource.type, resource.id);
        console.log(`  ✓ Rolled back ${resource.type}: ${resource.id}`);
      } catch (rollbackError) {
        console.error(`  ✗ Failed to rollback ${resource.type} ${resource.id}:`, rollbackError);
      }
    }

    throw error;
  }
}

/**
 * Delete a resource (used for rollback).
 */
async function deleteResource(type: string, id: string): Promise<void> {
  const prompts: Record<string, string> = {
    project: `Delete Mittwald project ${id} with confirmation flag set to true`,
    mysql: `Delete MySQL database ${id} with confirmation flag set to true`,
    redis: `Delete Redis database ${id} with confirmation flag set to true`,
    app: `Uninstall app ${id}`,
    domain: `Delete domain ${id}`,
    virtualhost: `Delete virtualhost ${id} with confirmation flag set to true`,
    mail_address: `Delete mail address ${id} with confirmation flag set to true`,
    deliverybox: `Delete deliverybox ${id} with confirmation flag set to true`,
    ssh_user: `Delete SSH user ${id} with confirmation flag set to true`,
    backup_schedule: `Delete backup schedule ${id} with confirmation flag set to true`,
    registry: `Delete container registry ${id} with confirmation flag set to true`,
  };

  const prompt = prompts[type];
  if (!prompt) {
    throw new Error(`Unknown resource type for deletion: ${type}`);
  }

  await executeClaudePrompt(prompt);
}
