import { beforeEach, describe, expect, it } from 'vitest';

import { getToolRegistry, resetToolRegistry } from '../../src/utils/tool-scanner.js';

const ORGANIZATION_TOOLS = [
  'mittwald_org_list',
  'mittwald_org_get',
  'mittwald_org_delete',
  'mittwald_org_invite',
  'mittwald_org_membership_list',
  'mittwald_org_membership_list_own',
  'mittwald_org_membership_revoke',
];

describe('Organization tool discovery (integration)', () => {
  beforeEach(() => {
    resetToolRegistry();
  });

  it('registers all organization management tools', async () => {
    const registry = await getToolRegistry();

    for (const toolName of ORGANIZATION_TOOLS) {
      expect(registry.tools.has(toolName)).toBe(true);
      expect(typeof registry.handlers.get(toolName)).toBe('function');
    }
  });

  it('exposes schemas for organization tools', async () => {
    const registry = await getToolRegistry();

    for (const toolName of ORGANIZATION_TOOLS) {
      const schema = registry.schemas.get(toolName);
      expect(schema).toBeDefined();
      expect(schema?.type).toBe('object');
    }
  });
});
