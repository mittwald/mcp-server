import { describe, expect, it, beforeAll } from 'vitest';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { initializeTools, TOOLS } from '../../../src/constants/tools.js';

/**
 * Every tool exposed to clients must carry a human-readable title and the
 * applicable behavioural hint, as required by the Claude connector review
 * criteria:
 * https://claude.com/docs/connectors/building/review-criteria#provide-tool-annotations
 */
describe('Tool annotations', () => {
  beforeAll(async () => {
    await initializeTools();
  }, 60_000);

  it('loads tools', () => {
    expect(TOOLS.length).toBeGreaterThan(0);
  });

  it('every tool has a title', () => {
    const missing = TOOLS.filter((tool: Tool) => !tool.title && !tool.annotations?.title).map(
      (tool) => tool.name,
    );

    expect(missing).toEqual([]);
  });

  it('every tool declares readOnlyHint and destructiveHint', () => {
    const missing = TOOLS.filter((tool: Tool) => {
      const annotations = tool.annotations;
      return (
        typeof annotations?.readOnlyHint !== 'boolean' ||
        typeof annotations?.destructiveHint !== 'boolean'
      );
    }).map((tool) => tool.name);

    expect(missing).toEqual([]);
  });

  it('never marks a tool as both read-only and destructive', () => {
    const contradictory = TOOLS.filter(
      (tool: Tool) => tool.annotations?.readOnlyHint && tool.annotations?.destructiveHint,
    ).map((tool) => tool.name);

    expect(contradictory).toEqual([]);
  });

  it('keeps the annotation title in sync with the tool title', () => {
    const mismatched = TOOLS.filter(
      (tool: Tool) => tool.title && tool.annotations?.title && tool.title !== tool.annotations.title,
    ).map((tool) => tool.name);

    expect(mismatched).toEqual([]);
  });
});
