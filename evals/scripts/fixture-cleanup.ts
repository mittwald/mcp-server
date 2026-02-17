/**
 * Dependency-aware fixture cleanup for scenario runner.
 * Deletes resources in reverse dependency order to avoid orphans.
 */

import { writeFileSync } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import type { ScenarioDefinition } from '../../src/types/scenario.js';
import type { ProvisionedFixtures } from './template-interpolator.js';

const CLEANUP_TIMEOUT = 120000; // 2 minutes per resource

export interface CleanupResult {
  success: boolean;
  deleted: string[];
  failed: Array<{ id: string; type: string; error: string }>;
}

/**
 * Execute a prompt via Claude Code CLI for resource deletion.
 */
async function executeClaudePrompt(
  prompt: string,
  timeout: number = CLEANUP_TIMEOUT
): Promise<void> {
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

    let stderr = '';

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Cleanup failed with code ${code}: ${stderr}`));
      }
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to spawn Claude CLI: ${error.message}`));
    });

    setTimeout(() => {
      if (!child.killed) {
        child.kill();
        reject(new Error(`Cleanup timeout (${timeout}ms)`));
      }
    }, timeout);
  });
}

/**
 * Delete a container stack.
 */
async function deleteStack(id: string): Promise<void> {
  console.log(`  Deleting stack: ${id}`);
  await executeClaudePrompt(
    `Delete container stack ${id} with confirmation flag set to true and include volumes`
  );
  console.log(`  ✓ Stack deleted: ${id}`);
}

/**
 * Delete a container registry.
 */
async function deleteRegistry(id: string): Promise<void> {
  console.log(`  Deleting registry: ${id}`);
  await executeClaudePrompt(
    `Delete container registry ${id} with confirmation flag set to true`
  );
  console.log(`  ✓ Registry deleted: ${id}`);
}

/**
 * Delete an app installation.
 */
async function deleteApp(id: string): Promise<void> {
  console.log(`  Uninstalling app: ${id}`);
  await executeClaudePrompt(`Uninstall app ${id}`);
  console.log(`  ✓ App uninstalled: ${id}`);
}

/**
 * Delete a virtualhost.
 */
async function deleteVirtualhost(id: string): Promise<void> {
  console.log(`  Deleting virtualhost: ${id}`);
  await executeClaudePrompt(
    `Delete virtualhost ${id} with confirmation flag set to true`
  );
  console.log(`  ✓ Virtualhost deleted: ${id}`);
}

/**
 * Delete a domain.
 */
async function deleteDomain(id: string): Promise<void> {
  console.log(`  Deleting domain: ${id}`);
  await executeClaudePrompt(`Delete domain ${id}`);
  console.log(`  ✓ Domain deleted: ${id}`);
}

/**
 * Delete a mail deliverybox.
 */
async function deleteDeliverybox(id: string): Promise<void> {
  console.log(`  Deleting deliverybox: ${id}`);
  await executeClaudePrompt(
    `Delete deliverybox ${id} with confirmation flag set to true`
  );
  console.log(`  ✓ Deliverybox deleted: ${id}`);
}

/**
 * Delete a mail address.
 */
async function deleteMailAddress(id: string): Promise<void> {
  console.log(`  Deleting mail address: ${id}`);
  await executeClaudePrompt(
    `Delete mail address ${id} with confirmation flag set to true`
  );
  console.log(`  ✓ Mail address deleted: ${id}`);
}

/**
 * Delete an SSH user.
 */
async function deleteSshUser(id: string): Promise<void> {
  console.log(`  Deleting SSH user: ${id}`);
  await executeClaudePrompt(
    `Delete SSH user ${id} with confirmation flag set to true`
  );
  console.log(`  ✓ SSH user deleted: ${id}`);
}

/**
 * Delete a backup schedule.
 */
async function deleteBackupSchedule(id: string): Promise<void> {
  console.log(`  Deleting backup schedule: ${id}`);
  await executeClaudePrompt(
    `Delete backup schedule ${id} with confirmation flag set to true`
  );
  console.log(`  ✓ Backup schedule deleted: ${id}`);
}

/**
 * Delete a MySQL database.
 */
async function deleteMysqlDatabase(id: string): Promise<void> {
  console.log(`  Deleting MySQL database: ${id}`);
  await executeClaudePrompt(
    `Delete MySQL database ${id} with confirmation flag set to true`
  );
  console.log(`  ✓ MySQL database deleted: ${id}`);
}

/**
 * Delete a Redis database.
 */
async function deleteRedisDatabase(id: string): Promise<void> {
  console.log(`  Deleting Redis database: ${id}`);
  await executeClaudePrompt(
    `Delete Redis database ${id} with confirmation flag set to true`
  );
  console.log(`  ✓ Redis database deleted: ${id}`);
}

/**
 * Delete a project.
 */
async function deleteProject(id: string): Promise<void> {
  console.log(`  Deleting project: ${id}`);
  await executeClaudePrompt(
    `Delete Mittwald project ${id} with confirmation flag set to true`
  );
  console.log(`  ✓ Project deleted: ${id}`);
}

/**
 * Clean up all provisioned fixtures in dependency order.
 * Deletes leaves first (containers, apps, etc.), then roots (databases, project).
 */
export async function cleanupFixtures(
  fixtures: ProvisionedFixtures,
  scenario: ScenarioDefinition
): Promise<CleanupResult> {
  const deleted: string[] = [];
  const failed: Array<{ id: string; type: string; error: string }> = [];

  console.log('\n🧹 Cleaning up fixtures...\n');

  // Helper to track deletions
  async function tryDelete(
    type: string,
    id: string,
    deleteFn: () => Promise<void>
  ): Promise<void> {
    try {
      await deleteFn();
      deleted.push(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      failed.push({ id, type, error: errorMessage });
      console.error(`  ✗ Failed to delete ${type} ${id}: ${errorMessage}`);
    }
  }

  // Delete in dependency order (leaves first, roots last)

  // 1. Container stacks (topmost leaves)
  for (const stack of fixtures.containers.stacks) {
    await tryDelete('stack', stack.id, () => deleteStack(stack.id));
  }

  // 2. Container registries
  for (const registry of fixtures.containers.registries) {
    await tryDelete('registry', registry.id, () => deleteRegistry(registry.id));
  }

  // 3. Apps (depend on databases and project)
  for (const app of fixtures.apps) {
    await tryDelete('app', app.id, () => deleteApp(app.id));
  }

  // 4. Virtualhosts (depend on domains)
  for (const vhost of fixtures.virtualhosts) {
    await tryDelete('virtualhost', vhost.id, () => deleteVirtualhost(vhost.id));
  }

  // 5. Domains
  for (const domain of fixtures.domains) {
    await tryDelete('domain', domain.id, () => deleteDomain(domain.id));
  }

  // 6. Mail deliveryboxes (depend on mail addresses)
  for (const box of fixtures.mail.deliveryboxes) {
    await tryDelete('deliverybox', box.id, () => deleteDeliverybox(box.id));
  }

  // 7. Mail addresses
  for (const addr of fixtures.mail.addresses) {
    await tryDelete('mail_address', addr.id, () => deleteMailAddress(addr.id));
  }

  // 8. SSH users
  for (const user of fixtures.sshUsers) {
    await tryDelete('ssh_user', user.id, () => deleteSshUser(user.id));
  }

  // 9. Backup schedules
  for (const schedule of fixtures.backups.schedules) {
    await tryDelete('backup_schedule', schedule.id, () =>
      deleteBackupSchedule(schedule.id)
    );
  }

  // 10. Databases (depend on project)
  for (const db of fixtures.databases.mysql) {
    await tryDelete('mysql_database', db.id, () => deleteMysqlDatabase(db.id));
  }

  for (const db of fixtures.databases.redis) {
    await tryDelete('redis_database', db.id, () => deleteRedisDatabase(db.id));
  }

  // 11. Project (LAST - all other resources depend on it)
  if (fixtures.projectId) {
    // Wait 5 seconds for API consistency (Mittwald may need time to deregister resources)
    console.log('  Waiting 5 seconds for API consistency...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    await tryDelete('project', fixtures.projectId, () =>
      deleteProject(fixtures.projectId!)
    );
  }

  // Log orphaned resources if any
  if (failed.length > 0) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logPath = path.join(
      process.cwd(),
      'evals',
      'results',
      `orphaned-resources-${timestamp}.json`
    );

    const orphanLog = {
      scenario_id: scenario.id,
      orphaned_at: new Date().toISOString(),
      resources: failed,
    };

    writeFileSync(logPath, JSON.stringify(orphanLog, null, 2), 'utf-8');
    console.error(`\n⚠️  Orphaned resources logged to: ${logPath}`);
  }

  const success = failed.length === 0;
  if (success) {
    console.log(`\n✅ All fixtures cleaned up successfully (${deleted.length} resources)`);
  } else {
    console.error(
      `\n⚠️  Cleanup completed with errors: ${deleted.length} deleted, ${failed.length} failed`
    );
  }

  return { success, deleted, failed };
}
