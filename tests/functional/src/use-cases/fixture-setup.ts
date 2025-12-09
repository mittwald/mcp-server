/**
 * Test Fixture Setup Module
 *
 * Creates and manages test resources (apps, databases, etc.) using the mw CLI
 * before tests run, and cleans them up afterward.
 *
 * CRITICAL: Only create resources on the writable server (s-igc7dy / MCP Server Dev)
 */

import { execSync, spawn } from 'node:child_process';

/**
 * Server configuration
 */
export const MITTWALD_CONFIG = {
  // Writable server - use this for creating resources
  writableServer: {
    id: 's-igc7dy',
    name: 'MCP Server Dev',
  },
  // Writable project - default test project
  writableProject: {
    id: 'p-ucvxdj',
    shortId: 'p-ucvxdj',
    name: 'PHP App Project',
  },
  // Read-only server - do NOT create resources here
  readOnlyServer: {
    id: 's-xcd77l',
    name: 'mStudio MCP server (read-only)',
  },
  // Read-only project
  readOnlyProject: {
    id: 'p-ptwfms',
    shortId: 'p-ptwfms',
    name: 'mStudio MCP server',
  },
  // Organization with write access
  writableOrg: {
    id: 'c0256a2f-ccb0-4e00-b6ed-579bdb758675',
    name: 'mittwald MCP Server Dev',
  },
} as const;

/**
 * Fixture types that can be set up
 */
export type FixtureType =
  | 'php-app'
  | 'node-app'
  | 'static-app'
  | 'mysql-database'
  | 'redis-database'
  | 'ssh-user'
  | 'sftp-user'
  | 'cronjob';

/**
 * Created fixture info
 */
export interface CreatedFixture {
  type: FixtureType;
  id: string;
  shortId?: string;
  name?: string;
  projectId: string;
  createdAt: Date;
  metadata: Record<string, unknown>;
}

/**
 * Setup requirement for a use case
 */
export interface SetupRequirement {
  /** Type of fixture needed */
  type: FixtureType;
  /** Configuration for the fixture */
  config?: Record<string, unknown>;
  /** Name/description for the fixture */
  name?: string;
}

/**
 * Execute mw CLI command and return parsed JSON output
 */
function execMw(args: string[], timeout = 60000): unknown {
  const command = `mw ${args.join(' ')} --output json`;
  console.log(`[FixtureSetup] Executing: ${command}`);

  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      timeout,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return JSON.parse(output.trim());
  } catch (error) {
    if (error instanceof Error) {
      const execError = error as { stderr?: string; stdout?: string };
      console.error(`[FixtureSetup] Command failed: ${execError.stderr || execError.stdout || error.message}`);
    }
    throw error;
  }
}

/**
 * Execute mw CLI command without JSON parsing (for commands that don't return JSON)
 */
function execMwRaw(args: string[], timeout = 60000): string {
  const command = `mw ${args.join(' ')}`;
  console.log(`[FixtureSetup] Executing: ${command}`);

  try {
    return execSync(command, {
      encoding: 'utf-8',
      timeout,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error) {
    if (error instanceof Error) {
      const execError = error as { stderr?: string; stdout?: string };
      console.error(`[FixtureSetup] Command failed: ${execError.stderr || execError.stdout || error.message}`);
    }
    throw error;
  }
}

/**
 * Create a PHP app fixture
 */
async function createPhpApp(
  projectId: string,
  name: string,
  config: Record<string, unknown> = {}
): Promise<CreatedFixture> {
  const documentRoot = (config.documentRoot as string) || '/';
  const siteTitle = name || 'Test PHP App';

  const result = execMw([
    'app',
    'create',
    'php',
    '--project-id',
    projectId,
    '--document-root',
    documentRoot,
    '--site-title',
    `"${siteTitle}"`,
    '--wait',
    '--quiet',
  ]) as { id: string; shortId?: string };

  return {
    type: 'php-app',
    id: result.id || 'unknown',
    shortId: result.shortId,
    name: siteTitle,
    projectId,
    createdAt: new Date(),
    metadata: { documentRoot },
  };
}

/**
 * Create a Node.js app fixture
 */
async function createNodeApp(
  projectId: string,
  name: string,
  config: Record<string, unknown> = {}
): Promise<CreatedFixture> {
  const entrypoint = (config.entrypoint as string) || 'index.js';
  const siteTitle = name || 'Test Node App';

  const result = execMw([
    'app',
    'create',
    'node',
    '--project-id',
    projectId,
    '--entrypoint',
    entrypoint,
    '--site-title',
    `"${siteTitle}"`,
    '--wait',
    '--quiet',
  ]) as { id: string; shortId?: string };

  return {
    type: 'node-app',
    id: result.id || 'unknown',
    shortId: result.shortId,
    name: siteTitle,
    projectId,
    createdAt: new Date(),
    metadata: { entrypoint },
  };
}

/**
 * Create a MySQL database fixture
 * NOTE: mw database mysql create does NOT support --output json flag,
 * so we use execMwRaw and parse the output manually
 */
async function createMySqlDatabase(
  projectId: string,
  name: string,
  config: Record<string, unknown> = {}
): Promise<CreatedFixture> {
  const version = (config.version as string) || '8.0';
  const description = name || 'Test MySQL Database';
  const password = (config.password as string) || generatePassword();

  // Use execMwRaw because 'mw database mysql create' doesn't support --output json
  // Must provide --user-password when using --quiet mode (no interactive prompts)
  const output = execMwRaw([
    'database',
    'mysql',
    'create',
    '--project-id',
    projectId,
    '--description',
    `"${description}"`,
    '--version',
    version,
    '--user-password',
    password,
    '--quiet',
  ]);

  // The --quiet flag outputs just the database ID
  const databaseId = output.trim();

  return {
    type: 'mysql-database',
    id: databaseId || 'unknown',
    shortId: databaseId,
    name: description,
    projectId,
    createdAt: new Date(),
    metadata: { version, password },
  };
}

/**
 * Create an SSH user fixture
 */
async function createSshUser(
  projectId: string,
  name: string,
  config: Record<string, unknown> = {}
): Promise<CreatedFixture> {
  const description = name || 'Test SSH User';
  const password = (config.password as string) || generatePassword();

  const result = execMw([
    'ssh-user',
    'create',
    '--project-id',
    projectId,
    '--description',
    `"${description}"`,
    '--password',
    password,
    '--quiet',
  ]) as { id: string; userName?: string };

  return {
    type: 'ssh-user',
    id: result.id || 'unknown',
    name: result.userName || description,
    projectId,
    createdAt: new Date(),
    metadata: { password },
  };
}

/**
 * Create an SFTP user fixture
 */
async function createSftpUser(
  projectId: string,
  name: string,
  config: Record<string, unknown> = {}
): Promise<CreatedFixture> {
  const description = name || 'Test SFTP User';
  const directories = (config.directories as string[]) || ['/'];
  const password = (config.password as string) || generatePassword();

  const result = execMw([
    'sftp-user',
    'create',
    '--project-id',
    projectId,
    '--description',
    `"${description}"`,
    '--directories',
    directories.join(','),
    '--password',
    password,
    '--quiet',
  ]) as { id: string; userName?: string };

  return {
    type: 'sftp-user',
    id: result.id || 'unknown',
    name: result.userName || description,
    projectId,
    createdAt: new Date(),
    metadata: { password, directories },
  };
}

/**
 * Create a cronjob fixture (requires an app installation)
 */
async function createCronjob(
  projectId: string,
  name: string,
  config: Record<string, unknown> = {}
): Promise<CreatedFixture> {
  const installationId = config.installationId as string;
  if (!installationId) {
    throw new Error('Cronjob requires an installationId (app installation)');
  }

  const description = name || 'Test Cronjob';
  const interval = (config.interval as string) || '0 * * * *'; // Every hour
  const command = (config.command as string) || 'echo "test"';

  const result = execMw([
    'cronjob',
    'create',
    '--installation-id',
    installationId,
    '--description',
    `"${description}"`,
    '--interval',
    `"${interval}"`,
    '--command',
    `"${command}"`,
    '--interpreter',
    'bash',
    '--quiet',
  ]) as { id: string; shortId?: string };

  return {
    type: 'cronjob',
    id: result.id || 'unknown',
    shortId: result.shortId,
    name: description,
    projectId,
    createdAt: new Date(),
    metadata: { installationId, interval, command },
  };
}

/**
 * Generate a random password (shell-safe characters only)
 */
function generatePassword(): string {
  // Use only shell-safe characters - avoid !, #, $, %, &, *, etc.
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let password = '';
  for (let i = 0; i < 24; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Delete a fixture
 */
async function deleteFixture(fixture: CreatedFixture): Promise<boolean> {
  const idToUse = fixture.shortId || fixture.id;

  try {
    switch (fixture.type) {
      case 'php-app':
      case 'node-app':
      case 'static-app':
        execMwRaw(['app', 'uninstall', idToUse, '--force', '--quiet']);
        break;
      case 'mysql-database':
        execMwRaw(['database', 'mysql', 'delete', idToUse, '--force', '--quiet']);
        break;
      case 'redis-database':
        // Redis delete not available via CLI, skip
        console.log(`[FixtureSetup] Redis database deletion not supported via CLI`);
        break;
      case 'ssh-user':
        execMwRaw(['ssh-user', 'delete', fixture.id, '--force', '--quiet']);
        break;
      case 'sftp-user':
        execMwRaw(['sftp-user', 'delete', fixture.id, '--force', '--quiet']);
        break;
      case 'cronjob':
        execMwRaw(['cronjob', 'delete', idToUse, '--force', '--quiet']);
        break;
      default:
        console.log(`[FixtureSetup] Unknown fixture type: ${fixture.type}`);
        return false;
    }
    console.log(`[FixtureSetup] Deleted ${fixture.type}: ${idToUse}`);
    return true;
  } catch (error) {
    console.error(`[FixtureSetup] Failed to delete ${fixture.type} ${idToUse}:`, error);
    return false;
  }
}

/**
 * FixtureManager - manages test fixture lifecycle
 */
export class FixtureManager {
  private fixtures: CreatedFixture[] = [];
  private projectId: string;

  constructor(projectId: string = MITTWALD_CONFIG.writableProject.id) {
    this.projectId = projectId;
  }

  /**
   * Set up a fixture
   */
  async setup(requirement: SetupRequirement): Promise<CreatedFixture> {
    const name = requirement.name || `test-${requirement.type}-${Date.now()}`;
    const config = requirement.config || {};

    console.log(`[FixtureManager] Setting up ${requirement.type}: ${name}`);

    let fixture: CreatedFixture;

    switch (requirement.type) {
      case 'php-app':
        fixture = await createPhpApp(this.projectId, name, config);
        break;
      case 'node-app':
        fixture = await createNodeApp(this.projectId, name, config);
        break;
      case 'mysql-database':
        fixture = await createMySqlDatabase(this.projectId, name, config);
        break;
      case 'ssh-user':
        fixture = await createSshUser(this.projectId, name, config);
        break;
      case 'sftp-user':
        fixture = await createSftpUser(this.projectId, name, config);
        break;
      case 'cronjob':
        fixture = await createCronjob(this.projectId, name, config);
        break;
      default:
        throw new Error(`Unsupported fixture type: ${requirement.type}`);
    }

    this.fixtures.push(fixture);
    console.log(`[FixtureManager] Created ${fixture.type}: ${fixture.id}`);

    return fixture;
  }

  /**
   * Set up multiple fixtures
   */
  async setupAll(requirements: SetupRequirement[]): Promise<CreatedFixture[]> {
    const results: CreatedFixture[] = [];

    for (const req of requirements) {
      const fixture = await this.setup(req);
      results.push(fixture);
    }

    return results;
  }

  /**
   * Clean up all fixtures
   */
  async cleanup(): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    // Delete in reverse order (dependencies first)
    const toDelete = [...this.fixtures].reverse();

    for (const fixture of toDelete) {
      const deleted = await deleteFixture(fixture);
      if (deleted) {
        success++;
      } else {
        failed++;
      }
    }

    this.fixtures = [];
    return { success, failed };
  }

  /**
   * Get all fixtures
   */
  getFixtures(): CreatedFixture[] {
    return [...this.fixtures];
  }

  /**
   * Get fixture by type
   */
  getFixtureByType(type: FixtureType): CreatedFixture | undefined {
    return this.fixtures.find((f) => f.type === type);
  }

  /**
   * Get the writable project ID
   */
  getProjectId(): string {
    return this.projectId;
  }
}

/**
 * Create a fixture manager for the default writable project
 */
export function createFixtureManager(projectId?: string): FixtureManager {
  return new FixtureManager(projectId || MITTWALD_CONFIG.writableProject.id);
}

/**
 * Verify the mw CLI is authenticated and working
 */
export async function verifyMwCliAuth(): Promise<boolean> {
  try {
    const result = execMw(['user', 'get', '--output', 'json']) as { userId?: string };
    console.log(`[FixtureSetup] mw CLI authenticated as user: ${result.userId || 'unknown'}`);
    return true;
  } catch {
    console.error('[FixtureSetup] mw CLI not authenticated');
    return false;
  }
}

/**
 * List existing resources in a project
 */
export async function listProjectResources(projectId: string): Promise<{
  apps: unknown[];
  databases: unknown[];
  sshUsers: unknown[];
  sftpUsers: unknown[];
  cronjobs: unknown[];
}> {
  const apps = execMw(['app', 'list', '--project-id', projectId]) as unknown[];
  const databases = execMw(['database', 'mysql', 'list', '--project-id', projectId]) as unknown[];
  const sshUsers = execMw(['ssh-user', 'list', '--project-id', projectId]) as unknown[];
  const sftpUsers = execMw(['sftp-user', 'list', '--project-id', projectId]) as unknown[];
  const cronjobs = execMw(['cronjob', 'list', '--project-id', projectId]) as unknown[];

  return { apps, databases, sshUsers, sftpUsers, cronjobs };
}
