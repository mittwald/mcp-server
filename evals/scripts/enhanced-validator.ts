/**
 * Enhanced state validation for scenario runner.
 * Verifies actual Mittwald infrastructure state via `mw` CLI.
 */

import { execSync } from 'child_process';
import type { ScenarioDefinition } from '../../src/types/scenario.js';
import type { ProvisionedFixtures } from './template-interpolator.js';

export interface ValidationCheck {
  type: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: unknown;
}

export interface ValidationResult {
  passed: boolean;
  checks: ValidationCheck[];
}

/**
 * Execute `mw` CLI command and return JSON output.
 */
function execMwCommand(args: string[]): unknown {
  try {
    const output = execSync(`mw ${args.join(' ')} --output json`, {
      encoding: 'utf-8',
      timeout: 30000,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    return JSON.parse(output);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`mw CLI error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validate that a project exists and has correct configuration.
 */
async function validateProjectExists(projectId: string): Promise<ValidationCheck> {
  try {
    const project = execMwCommand(['project', 'get', projectId]) as {
      id: string;
      description?: string;
    };

    if (project.id === projectId) {
      return {
        type: 'project',
        name: projectId,
        passed: true,
        details: project,
      };
    }

    return {
      type: 'project',
      name: projectId,
      passed: false,
      error: 'Project ID mismatch',
    };
  } catch (error) {
    return {
      type: 'project',
      name: projectId,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validate that a MySQL database exists.
 */
async function validateMysqlDatabaseExists(dbId: string): Promise<ValidationCheck> {
  try {
    const db = execMwCommand(['database', 'mysql', 'get', dbId]) as {
      id: string;
      description?: string;
    };

    if (db.id === dbId) {
      return {
        type: 'mysql_database',
        name: dbId,
        passed: true,
        details: db,
      };
    }

    return {
      type: 'mysql_database',
      name: dbId,
      passed: false,
      error: 'Database ID mismatch',
    };
  } catch (error) {
    return {
      type: 'mysql_database',
      name: dbId,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validate MySQL database configuration.
 */
async function validateMysqlDatabaseConfig(
  dbId: string,
  expectedDescription: string
): Promise<ValidationCheck> {
  try {
    const db = execMwCommand(['database', 'mysql', 'get', dbId]) as {
      id: string;
      description?: string;
    };

    if (db.description === expectedDescription) {
      return {
        type: 'mysql_database_config',
        name: dbId,
        passed: true,
        details: { description: db.description },
      };
    }

    return {
      type: 'mysql_database_config',
      name: dbId,
      passed: false,
      error: `Description mismatch: expected "${expectedDescription}", got "${db.description}"`,
    };
  } catch (error) {
    return {
      type: 'mysql_database_config',
      name: dbId,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validate that a Redis database exists.
 */
async function validateRedisDatabaseExists(dbId: string): Promise<ValidationCheck> {
  try {
    const db = execMwCommand(['database', 'redis', 'get', dbId]) as {
      id: string;
      description?: string;
    };

    if (db.id === dbId) {
      return {
        type: 'redis_database',
        name: dbId,
        passed: true,
        details: db,
      };
    }

    return {
      type: 'redis_database',
      name: dbId,
      passed: false,
      error: 'Database ID mismatch',
    };
  } catch (error) {
    return {
      type: 'redis_database',
      name: dbId,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validate that an app installation exists.
 */
async function validateAppExists(appId: string): Promise<ValidationCheck> {
  try {
    const app = execMwCommand(['app', 'get', appId]) as {
      id: string;
      description?: string;
    };

    if (app.id === appId) {
      return {
        type: 'app',
        name: appId,
        passed: true,
        details: app,
      };
    }

    return {
      type: 'app',
      name: appId,
      passed: false,
      error: 'App ID mismatch',
    };
  } catch (error) {
    return {
      type: 'app',
      name: appId,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validate that a domain exists (by listing all domains and finding FQDN).
 */
async function validateDomainExists(
  projectId: string,
  fqdn: string
): Promise<ValidationCheck> {
  try {
    const domains = execMwCommand(['domain', 'list', '--project-id', projectId]) as Array<{
      domain?: string;
      fqdn?: string;
    }>;

    const found = domains.some((d) => d.domain === fqdn || d.fqdn === fqdn);

    if (found) {
      return {
        type: 'domain',
        name: fqdn,
        passed: true,
      };
    }

    return {
      type: 'domain',
      name: fqdn,
      passed: false,
      error: 'Domain not found in project',
    };
  } catch (error) {
    return {
      type: 'domain',
      name: fqdn,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validate that a virtualhost exists.
 */
async function validateVirtualhostExists(vhostId: string): Promise<ValidationCheck> {
  try {
    const vhost = execMwCommand(['domain', 'virtualhost', 'get', vhostId]) as {
      id: string;
      hostname?: string;
    };

    if (vhost.id === vhostId) {
      return {
        type: 'virtualhost',
        name: vhostId,
        passed: true,
        details: vhost,
      };
    }

    return {
      type: 'virtualhost',
      name: vhostId,
      passed: false,
      error: 'Virtualhost ID mismatch',
    };
  } catch (error) {
    return {
      type: 'virtualhost',
      name: vhostId,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validate that a mail address exists.
 */
async function validateMailAddressExists(
  projectId: string,
  address: string
): Promise<ValidationCheck> {
  try {
    const addresses = execMwCommand(['mail', 'address', 'list', '--project-id', projectId]) as Array<{
      address?: string;
    }>;

    const found = addresses.some((a) => a.address === address);

    if (found) {
      return {
        type: 'mail_address',
        name: address,
        passed: true,
      };
    }

    return {
      type: 'mail_address',
      name: address,
      passed: false,
      error: 'Mail address not found in project',
    };
  } catch (error) {
    return {
      type: 'mail_address',
      name: address,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validate that an SSL certificate exists for a domain.
 */
async function validateSslCertificate(
  projectId: string,
  domain: string
): Promise<ValidationCheck> {
  try {
    const certs = execMwCommand([
      'certificate',
      'list',
      '--project-id',
      projectId,
      '--domain',
      domain,
    ]) as Array<{ domain?: string }>;

    if (certs.length > 0) {
      return {
        type: 'ssl_certificate',
        name: domain,
        passed: true,
        details: { count: certs.length },
      };
    }

    return {
      type: 'ssl_certificate',
      name: domain,
      passed: false,
      error: 'No certificate found for domain',
    };
  } catch (error) {
    return {
      type: 'ssl_certificate',
      name: domain,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validate that DNS records are configured for a domain.
 */
async function validateDnsRecords(
  projectId: string,
  domainId: string
): Promise<ValidationCheck> {
  try {
    const dnsZone = execMwCommand(['domain', 'dnszone', 'get', domainId]) as {
      recordSets?: Array<{ type: string; records: unknown[] }>;
    };

    if (dnsZone.recordSets && dnsZone.recordSets.length > 0) {
      return {
        type: 'dns_records',
        name: domainId,
        passed: true,
        details: { recordSets: dnsZone.recordSets.length },
      };
    }

    return {
      type: 'dns_records',
      name: domainId,
      passed: false,
      error: 'No DNS records found',
    };
  } catch (error) {
    return {
      type: 'dns_records',
      name: domainId,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validate scenario state against actual Mittwald infrastructure.
 * Combines fixture validation with scenario-specific success criteria.
 */
export async function validateScenarioState(
  scenario: ScenarioDefinition,
  fixtures: ProvisionedFixtures
): Promise<ValidationResult> {
  const checks: ValidationCheck[] = [];

  console.log('\n🔍 Validating scenario state...\n');

  // 1. Validate project exists
  if (fixtures.projectId) {
    console.log(`  Validating project: ${fixtures.projectId}`);
    checks.push(await validateProjectExists(fixtures.projectId));
  }

  // 2. Validate databases
  for (const db of fixtures.databases.mysql) {
    console.log(`  Validating MySQL database: ${db.id}`);
    checks.push(await validateMysqlDatabaseExists(db.id));
    checks.push(await validateMysqlDatabaseConfig(db.id, db.description));
  }

  for (const db of fixtures.databases.redis) {
    console.log(`  Validating Redis database: ${db.id}`);
    checks.push(await validateRedisDatabaseExists(db.id));
  }

  // 3. Validate apps
  for (const app of fixtures.apps) {
    console.log(`  Validating app: ${app.id}`);
    checks.push(await validateAppExists(app.id));
  }

  // 4. Validate domains
  if (fixtures.projectId) {
    for (const domain of fixtures.domains) {
      console.log(`  Validating domain: ${domain.fqdn}`);
      checks.push(await validateDomainExists(fixtures.projectId, domain.fqdn));
    }
  }

  // 5. Validate virtualhosts
  for (const vhost of fixtures.virtualhosts) {
    console.log(`  Validating virtualhost: ${vhost.id}`);
    checks.push(await validateVirtualhostExists(vhost.id));
  }

  // 6. Validate mail addresses
  if (fixtures.projectId) {
    for (const addr of fixtures.mail.addresses) {
      console.log(`  Validating mail address: ${addr.address}`);
      checks.push(await validateMailAddressExists(fixtures.projectId, addr.address));
    }
  }

  // 7. Validate scenario-specific criteria
  const resourcesConfigured = scenario.success_criteria.resources_configured as Record<
    string,
    unknown
  >;

  if (resourcesConfigured?.ssl_requested && fixtures.domains.length > 0 && fixtures.projectId) {
    console.log(`  Validating SSL certificate for: ${fixtures.domains[0].fqdn}`);
    checks.push(
      await validateSslCertificate(fixtures.projectId, fixtures.domains[0].fqdn)
    );
  }

  if (resourcesConfigured?.dns_configured && fixtures.domains.length > 0 && fixtures.projectId) {
    console.log(`  Validating DNS records for: ${fixtures.domains[0].id}`);
    checks.push(await validateDnsRecords(fixtures.projectId, fixtures.domains[0].id));
  }

  // Summary
  const passed = checks.every((c) => c.passed);
  const failedChecks = checks.filter((c) => !c.passed);

  if (passed) {
    console.log(`\n✅ All validation checks passed (${checks.length} checks)`);
  } else {
    console.error(`\n❌ Validation failed: ${failedChecks.length}/${checks.length} checks failed`);
    for (const check of failedChecks) {
      console.error(`  - ${check.type} ${check.name}: ${check.error}`);
    }
  }

  return { passed, checks };
}
