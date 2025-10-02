import { beforeEach, describe, expect, it } from 'vitest';
import { resolve } from 'node:path';

import { getToolRegistry, resetToolRegistry, scanTools } from '../../../src/utils/tool-scanner.js';

const VOLUME_TOOL_NAMES = [
  'mittwald_volume_create',
  'mittwald_volume_list',
  'mittwald_volume_delete',
];

describe('Volume tool integration', () => {
  beforeEach(() => {
    resetToolRegistry();
  });

  it('discovers volume tools via tool scanner', async () => {
    const baseDir = resolve(process.cwd(), 'src', 'constants', 'tool', 'mittwald-cli');
    const result = await scanTools({ baseDir });

    expect(result.toolNames).toEqual(expect.arrayContaining(VOLUME_TOOL_NAMES));
  });

  it('loads volume tools into the registry with handlers', async () => {
    const registry = await getToolRegistry();

    for (const toolName of VOLUME_TOOL_NAMES) {
      expect(registry.tools.has(toolName)).toBe(true);
      expect(registry.handlers.has(toolName)).toBe(true);
      expect(typeof registry.handlers.get(toolName)).toBe('function');
    }
  });
});
