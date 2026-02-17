/**
 * Template interpolation for scenario prompts and fixture definitions.
 * Supports {{VARIABLE}} syntax for dynamic resource ID injection.
 */

import type { ScenarioDefinition } from '../../src/types/scenario.js';

export interface ProvisionedFixtures {
  projectId?: string;
  databases: {
    mysql: Array<{ id: string; description: string }>;
    redis: Array<{ id: string; description: string }>;
  };
  apps: Array<{ id: string; description: string }>;
  domains: Array<{ id: string; fqdn: string }>;
  virtualhosts: Array<{ id: string; hostname: string }>;
  mail: {
    addresses: Array<{ id: string; address: string }>;
    deliveryboxes: Array<{ id: string; description: string }>;
  };
  sshUsers: Array<{ id: string; description: string }>;
  backups: {
    schedules: Array<{ id: string; description: string }>;
  };
  containers: {
    stacks: Array<{ id: string; description: string }>;
    registries: Array<{ id: string; description: string }>;
  };
}

export interface FixtureContext {
  RUN_ID: string;
  PROJECT_ID?: string;
  [key: string]: string | undefined;
}

/**
 * Build fixture context from provisioned resources.
 * Creates template variables like {{PROJECT_ID}}, {{DOMAIN_0_FQDN}}, etc.
 */
export function buildFixtureContext(
  fixtures: ProvisionedFixtures,
  runId: string
): FixtureContext {
  const context: FixtureContext = { RUN_ID: runId };

  if (fixtures.projectId) {
    context.PROJECT_ID = fixtures.projectId;
  }

  fixtures.domains.forEach((domain, i) => {
    context[`DOMAIN_${i}_FQDN`] = domain.fqdn;
    context[`DOMAIN_${i}_ID`] = domain.id;
  });

  fixtures.virtualhosts.forEach((vhost, i) => {
    context[`VIRTUALHOST_${i}_ID`] = vhost.id;
    context[`VIRTUALHOST_${i}_HOSTNAME`] = vhost.hostname;
  });

  fixtures.databases.mysql.forEach((db, i) => {
    context[`MYSQL_${i}_ID`] = db.id;
    context[`MYSQL_${i}_DESCRIPTION`] = db.description;
  });

  fixtures.databases.redis.forEach((db, i) => {
    context[`REDIS_${i}_ID`] = db.id;
    context[`REDIS_${i}_DESCRIPTION`] = db.description;
  });

  fixtures.apps.forEach((app, i) => {
    context[`APP_${i}_ID`] = app.id;
    context[`APP_${i}_DESCRIPTION`] = app.description;
  });

  fixtures.mail.addresses.forEach((addr, i) => {
    context[`MAIL_ADDRESS_${i}_ID`] = addr.id;
    context[`MAIL_ADDRESS_${i}_ADDRESS`] = addr.address;
  });

  fixtures.mail.deliveryboxes.forEach((box, i) => {
    context[`DELIVERYBOX_${i}_ID`] = box.id;
    context[`DELIVERYBOX_${i}_DESCRIPTION`] = box.description;
  });

  fixtures.sshUsers.forEach((user, i) => {
    context[`SSH_USER_${i}_ID`] = user.id;
    context[`SSH_USER_${i}_DESCRIPTION`] = user.description;
  });

  fixtures.backups.schedules.forEach((schedule, i) => {
    context[`BACKUP_SCHEDULE_${i}_ID`] = schedule.id;
    context[`BACKUP_SCHEDULE_${i}_DESCRIPTION`] = schedule.description;
  });

  fixtures.containers.stacks.forEach((stack, i) => {
    context[`STACK_${i}_ID`] = stack.id;
    context[`STACK_${i}_DESCRIPTION`] = stack.description;
  });

  fixtures.containers.registries.forEach((registry, i) => {
    context[`REGISTRY_${i}_ID`] = registry.id;
    context[`REGISTRY_${i}_DESCRIPTION`] = registry.description;
  });

  return context;
}

/**
 * Interpolate template variables in a string.
 * Replaces {{VARIABLE}} with values from context.
 */
export function interpolate(template: string, context: FixtureContext): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (context[key] === undefined) {
      throw new Error(`Template variable not found: ${key}`);
    }
    return context[key]!;
  });
}

/**
 * Interpolate all prompts in a scenario definition.
 * Returns a new scenario with interpolated prompts.
 */
export function interpolateScenario(
  scenario: ScenarioDefinition,
  context: FixtureContext
): ScenarioDefinition {
  return {
    ...scenario,
    prompts: scenario.prompts.map((prompt) => interpolate(prompt, context)),
    cleanup: scenario.cleanup?.map((prompt) => interpolate(prompt, context)),
  };
}

/**
 * Create an empty fixtures object.
 */
export function createEmptyFixtures(): ProvisionedFixtures {
  return {
    databases: { mysql: [], redis: [] },
    apps: [],
    domains: [],
    virtualhosts: [],
    mail: { addresses: [], deliveryboxes: [] },
    sshUsers: [],
    backups: { schedules: [] },
    containers: { stacks: [], registries: [] },
  };
}
