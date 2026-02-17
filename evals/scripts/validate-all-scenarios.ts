#!/usr/bin/env tsx

import { readdir, readFile } from 'fs/promises';
import path from 'path';
import Ajv from 'ajv';
import scenarioSchema from '../../kitty-specs/018-documentation-driven-mcp-tool-testing/contracts/scenario-definition.schema.json';
import type { ScenarioDefinition } from '../../src/types/scenario.js';

interface Tool {
  mcpName: string;
  displayName: string;
  domain: string;
}

interface ToolInventory {
  metadata: {
    generated: string;
    totalTools: number;
    domains: number;
  };
  tools: Tool[];
}

async function loadToolInventory(): Promise<ToolInventory> {
  const content = await readFile('evals/inventory/tools-current.json', 'utf-8');
  return JSON.parse(content);
}

/**
 * Extract all template variables from a string.
 */
function extractTemplateVariables(text: string): string[] {
  const matches = text.matchAll(/\{\{(\w+)\}\}/g);
  return Array.from(matches, (m) => m[1]);
}

/**
 * Get expected template variables from fixtures.
 */
function getExpectedVariables(scenario: ScenarioDefinition): Set<string> {
  const vars = new Set<string>(['RUN_ID']);

  if (!scenario.fixtures) return vars;

  if (scenario.fixtures.project) {
    vars.add('PROJECT_ID');
  }

  const mysql = scenario.fixtures.databases?.mysql || [];
  mysql.forEach((_, i) => {
    vars.add(`MYSQL_${i}_ID`);
    vars.add(`MYSQL_${i}_DESCRIPTION`);
  });

  const redis = scenario.fixtures.databases?.redis || [];
  redis.forEach((_, i) => {
    vars.add(`REDIS_${i}_ID`);
    vars.add(`REDIS_${i}_DESCRIPTION`);
  });

  const apps = scenario.fixtures.apps || [];
  apps.forEach((_, i) => {
    vars.add(`APP_${i}_ID`);
    vars.add(`APP_${i}_DESCRIPTION`);
  });

  const domains = scenario.fixtures.domains || [];
  domains.forEach((_, i) => {
    vars.add(`DOMAIN_${i}_FQDN`);
    vars.add(`DOMAIN_${i}_ID`);
  });

  domains.forEach((domain, i) => {
    if (domain.virtualhost) {
      vars.add(`VIRTUALHOST_${i}_ID`);
      vars.add(`VIRTUALHOST_${i}_HOSTNAME`);
    }
  });

  const mailAddresses = scenario.fixtures.mail?.addresses || [];
  mailAddresses.forEach((_, i) => {
    vars.add(`MAIL_ADDRESS_${i}_ID`);
    vars.add(`MAIL_ADDRESS_${i}_ADDRESS`);
  });

  const deliveryboxes = scenario.fixtures.mail?.deliveryboxes || [];
  deliveryboxes.forEach((_, i) => {
    vars.add(`DELIVERYBOX_${i}_ID`);
    vars.add(`DELIVERYBOX_${i}_DESCRIPTION`);
  });

  const sshUsers = scenario.fixtures.ssh_users || [];
  sshUsers.forEach((_, i) => {
    vars.add(`SSH_USER_${i}_ID`);
    vars.add(`SSH_USER_${i}_DESCRIPTION`);
  });

  const backupSchedules = scenario.fixtures.backups?.schedules || [];
  backupSchedules.forEach((_, i) => {
    vars.add(`BACKUP_SCHEDULE_${i}_ID`);
    vars.add(`BACKUP_SCHEDULE_${i}_DESCRIPTION`);
  });

  const stacks = scenario.fixtures.containers?.stacks || [];
  stacks.forEach((_, i) => {
    vars.add(`STACK_${i}_ID`);
    vars.add(`STACK_${i}_DESCRIPTION`);
  });

  const registries = scenario.fixtures.containers?.registries || [];
  registries.forEach((_, i) => {
    vars.add(`REGISTRY_${i}_ID`);
    vars.add(`REGISTRY_${i}_DESCRIPTION`);
  });

  return vars;
}

/**
 * Validate template variables in scenario.
 */
function validateTemplates(scenario: ScenarioDefinition, filename: string): string[] {
  const errors: string[] = [];
  const expectedVars = getExpectedVariables(scenario);

  // Check prompts
  scenario.prompts.forEach((prompt, i) => {
    const vars = extractTemplateVariables(prompt);
    vars.forEach((v) => {
      if (!expectedVars.has(v)) {
        errors.push(`Prompt ${i + 1} uses undefined variable: {{${v}}}`);
      }
    });
  });

  // Check cleanup prompts
  scenario.cleanup?.forEach((prompt, i) => {
    const vars = extractTemplateVariables(prompt);
    vars.forEach((v) => {
      if (!expectedVars.has(v)) {
        errors.push(`Cleanup ${i + 1} uses undefined variable: {{${v}}}`);
      }
    });
  });

  return errors;
}

async function validateAll(): Promise<void> {
  const ajv = new Ajv();
  const validate = ajv.compile(scenarioSchema);
  const toolInventory = await loadToolInventory();

  const scenarioDir = 'evals/scenarios/case-studies';
  const files = await readdir(scenarioDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  console.log(`\n📋 Validating ${jsonFiles.length} scenarios...\n`);

  let passCount = 0;
  let failCount = 0;

  for (const file of jsonFiles) {
    const filePath = path.join(scenarioDir, file);
    const content = await readFile(filePath, 'utf-8');
    const scenario = JSON.parse(content) as ScenarioDefinition;

    const validationErrors: string[] = [];

    // Schema validation
    if (!validate(scenario)) {
      validationErrors.push(`Schema validation failed: ${JSON.stringify(validate.errors)}`);
    }

    // Template variable validation
    const templateErrors = validateTemplates(scenario, file);
    validationErrors.push(...templateErrors);

    // Tool existence validation
    const missingTools = [];
    for (const tool of scenario.expected_tools || []) {
      const mcpToolName = `mcp__mittwald__${tool}`;
      const exists = toolInventory.tools.some(t => t.mcpName === mcpToolName);
      if (!exists) {
        missingTools.push(tool);
      }
    }

    if (missingTools.length > 0) {
      validationErrors.push(`Missing tools: ${missingTools.join(', ')}`);
    }

    if (validationErrors.length > 0) {
      console.error(`❌ ${file}:`);
      validationErrors.forEach(err => console.error(`   - ${err}`));
      failCount++;
      continue;
    }

    const fixtureInfo = scenario.fixtures ? ' with fixtures' : '';
    console.log(`✅ ${file}: Valid (${scenario.prompts.length} prompts, ${scenario.expected_tools?.length || 0} tools${fixtureInfo})`);
    passCount++;
  }

  console.log(`\n📊 Results: ${passCount} passed, ${failCount} failed\n`);

  if (failCount > 0) {
    process.exit(1);
  }
}

validateAll().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
