import { beforeEach, describe, expect, it } from 'vitest';

import { getToolRegistry, resetToolRegistry } from '../../../src/utils/tool-scanner.js';

describe('tool-scanner registry', () => {
  beforeEach(() => {
    resetToolRegistry();
  });

  it('includes mittwald_container_update registration', async () => {
    const registry = await getToolRegistry();

    expect(registry.tools.has('mittwald_container_update')).toBe(true);
    expect(registry.handlers.has('mittwald_container_update')).toBe(true);
  });
});
