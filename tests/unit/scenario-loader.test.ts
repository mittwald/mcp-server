import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  loadScenario,
  listScenarios,
  validateAllScenarios,
} from '../../evals/scripts/scenario-loader.js';

const TEST_SCENARIO_DIR = 'tests/fixtures/scenarios';

describe('scenario-loader', () => {
  beforeEach(() => {
    // Create test fixtures directory
    const fixturesDir = path.join(process.cwd(), TEST_SCENARIO_DIR);
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test fixtures
    const fixturesDir = path.join(process.cwd(), TEST_SCENARIO_DIR);
    if (fs.existsSync(fixturesDir)) {
      fs.rmSync(fixturesDir, { recursive: true, force: true });
    }
  });

  describe('loadScenario', () => {
    it('should load a valid scenario', () => {
      const validScenario = {
        id: 'test-valid',
        name: 'Valid Test Scenario',
        prompts: ['Test prompt'],
        success_criteria: {
          resources_created: { project: 1 },
        },
      };

      const filePath = path.join(
        process.cwd(),
        TEST_SCENARIO_DIR,
        'test-valid.json'
      );
      fs.writeFileSync(filePath, JSON.stringify(validScenario), 'utf-8');

      const scenario = loadScenario('test-valid', TEST_SCENARIO_DIR);
      expect(scenario.id).toBe('test-valid');
      expect(scenario.name).toBe('Valid Test Scenario');
      expect(scenario.prompts).toHaveLength(1);
    });

    it('should throw error for missing file', () => {
      expect(() => loadScenario('non-existent', TEST_SCENARIO_DIR)).toThrow(
        'Scenario file not found'
      );
    });

    it('should throw error for invalid JSON', () => {
      const filePath = path.join(
        process.cwd(),
        TEST_SCENARIO_DIR,
        'invalid-json.json'
      );
      fs.writeFileSync(filePath, 'invalid json {', 'utf-8');

      expect(() => loadScenario('invalid-json', TEST_SCENARIO_DIR)).toThrow(
        'Failed to parse scenario JSON'
      );
    });

    it('should throw error for invalid schema', () => {
      const invalidScenario = {
        id: 'invalid',
        // Missing required 'name' field
        prompts: ['Test'],
        success_criteria: {},
      };

      const filePath = path.join(
        process.cwd(),
        TEST_SCENARIO_DIR,
        'invalid-schema.json'
      );
      fs.writeFileSync(filePath, JSON.stringify(invalidScenario), 'utf-8');

      expect(() => loadScenario('invalid-schema', TEST_SCENARIO_DIR)).toThrow(
        'Invalid scenario definition'
      );
    });

    it('should validate id pattern (kebab-case)', () => {
      const invalidIdScenario = {
        id: 'Invalid_ID', // Underscores not allowed
        name: 'Test',
        prompts: ['Test'],
        success_criteria: { resources_created: {} },
      };

      const filePath = path.join(
        process.cwd(),
        TEST_SCENARIO_DIR,
        'invalid-id.json'
      );
      fs.writeFileSync(filePath, JSON.stringify(invalidIdScenario), 'utf-8');

      expect(() => loadScenario('invalid-id', TEST_SCENARIO_DIR)).toThrow(
        'Invalid scenario definition'
      );
    });

    it('should require at least one prompt', () => {
      const noPromptsScenario = {
        id: 'no-prompts',
        name: 'No Prompts',
        prompts: [], // Empty array not allowed
        success_criteria: { resources_created: {} },
      };

      const filePath = path.join(
        process.cwd(),
        TEST_SCENARIO_DIR,
        'no-prompts.json'
      );
      fs.writeFileSync(filePath, JSON.stringify(noPromptsScenario), 'utf-8');

      expect(() => loadScenario('no-prompts', TEST_SCENARIO_DIR)).toThrow(
        'Invalid scenario definition'
      );
    });
  });

  describe('listScenarios', () => {
    it('should list all scenario files', () => {
      const scenario1 = {
        id: 'test-1',
        name: 'Test 1',
        prompts: ['Test'],
        success_criteria: { resources_created: {} },
      };
      const scenario2 = {
        id: 'test-2',
        name: 'Test 2',
        prompts: ['Test'],
        success_criteria: { resources_created: {} },
      };

      fs.writeFileSync(
        path.join(process.cwd(), TEST_SCENARIO_DIR, 'test-1.json'),
        JSON.stringify(scenario1),
        'utf-8'
      );
      fs.writeFileSync(
        path.join(process.cwd(), TEST_SCENARIO_DIR, 'test-2.json'),
        JSON.stringify(scenario2),
        'utf-8'
      );

      const scenarios = listScenarios(TEST_SCENARIO_DIR);
      expect(scenarios).toHaveLength(2);
      expect(scenarios).toContain('test-1');
      expect(scenarios).toContain('test-2');
    });

    it('should return empty array for non-existent directory', () => {
      const scenarios = listScenarios('non-existent-dir');
      expect(scenarios).toEqual([]);
    });

    it('should filter out non-JSON files', () => {
      fs.writeFileSync(
        path.join(process.cwd(), TEST_SCENARIO_DIR, 'test.json'),
        JSON.stringify({
          id: 'test',
          name: 'Test',
          prompts: ['Test'],
          success_criteria: {},
        }),
        'utf-8'
      );
      fs.writeFileSync(
        path.join(process.cwd(), TEST_SCENARIO_DIR, 'readme.md'),
        'README',
        'utf-8'
      );

      const scenarios = listScenarios(TEST_SCENARIO_DIR);
      expect(scenarios).toHaveLength(1);
      expect(scenarios).toContain('test');
      expect(scenarios).not.toContain('readme');
    });
  });

  describe('validateAllScenarios', () => {
    it('should validate all scenarios in directory', () => {
      const validScenario = {
        id: 'valid',
        name: 'Valid',
        prompts: ['Test'],
        success_criteria: { resources_created: {} },
      };
      const invalidScenario = {
        id: 'invalid',
        // Missing required 'name' field
        prompts: ['Test'],
        success_criteria: {},
      };

      fs.writeFileSync(
        path.join(process.cwd(), TEST_SCENARIO_DIR, 'valid.json'),
        JSON.stringify(validScenario),
        'utf-8'
      );
      fs.writeFileSync(
        path.join(process.cwd(), TEST_SCENARIO_DIR, 'invalid.json'),
        JSON.stringify(invalidScenario),
        'utf-8'
      );

      const results = validateAllScenarios(TEST_SCENARIO_DIR);
      expect(results).toHaveLength(2);

      const validResult = results.find((r) => r.id === 'valid');
      expect(validResult?.valid).toBe(true);

      const invalidResult = results.find((r) => r.id === 'invalid');
      expect(invalidResult?.valid).toBe(false);
      expect(invalidResult?.error).toContain('Invalid scenario definition');
    });
  });
});
