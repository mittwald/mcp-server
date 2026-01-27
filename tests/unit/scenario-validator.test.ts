import { describe, it, expect } from 'vitest';
import {
  validateOutcome,
  extractResourcesFromToolCalls,
} from '../../evals/scripts/scenario-validator.js';
import type { ScenarioDefinition } from '../../src/types/scenario.js';
import type { ScenarioExecutionResult } from '../../src/types/scenario-execution.js';

describe('scenario-validator', () => {
  describe('validateOutcome', () => {
    it('should validate successful scenario with correct resources', () => {
      const scenario: ScenarioDefinition = {
        id: 'test',
        name: 'Test',
        prompts: ['Test'],
        success_criteria: {
          resources_created: { project: 1, app: 2 },
        },
      };

      const result: ScenarioExecutionResult = {
        scenario_id: 'test',
        run_id: 'run-2026-01-27T12-00-00',
        executed_at: '2026-01-27T12:00:00.000Z',
        status: 'success',
        tools_called: ['mittwald_project_create', 'mittwald_app_create'],
        execution_time_ms: 1000,
        resources_created: [
          { type: 'project', id: 'p-123' },
          { type: 'app', id: 'a-456' },
          { type: 'app', id: 'a-789' },
        ],
        cleanup_performed: false,
      };

      const validation = validateOutcome(scenario, result);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should fail validation when resource counts mismatch', () => {
      const scenario: ScenarioDefinition = {
        id: 'test',
        name: 'Test',
        prompts: ['Test'],
        success_criteria: {
          resources_created: { project: 2 }, // Expects 2 projects
        },
      };

      const result: ScenarioExecutionResult = {
        scenario_id: 'test',
        run_id: 'run-2026-01-27T12-00-00',
        executed_at: '2026-01-27T12:00:00.000Z',
        status: 'success',
        tools_called: ['mittwald_project_create'],
        execution_time_ms: 1000,
        resources_created: [
          { type: 'project', id: 'p-123' }, // Only 1 project
        ],
        cleanup_performed: false,
      };

      const validation = validateOutcome(scenario, result);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0]).toContain(
        "Resource count mismatch for 'project': expected 2, got 1"
      );
    });

    it('should fail validation when scenario status is failure', () => {
      const scenario: ScenarioDefinition = {
        id: 'test',
        name: 'Test',
        prompts: ['Test'],
        success_criteria: {
          resources_created: { project: 1 },
        },
      };

      const result: ScenarioExecutionResult = {
        scenario_id: 'test',
        run_id: 'run-2026-01-27T12-00-00',
        executed_at: '2026-01-27T12:00:00.000Z',
        status: 'failure',
        tools_called: [],
        execution_time_ms: 1000,
        resources_created: [],
        cleanup_performed: false,
        failure_details: {
          failed_tool: 'mittwald_project_create',
          error_message: 'Permission denied',
          context: {},
        },
      };

      const validation = validateOutcome(scenario, result);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0]).toContain('Permission denied');
    });

    it('should validate expected_tools if provided', () => {
      const scenario: ScenarioDefinition = {
        id: 'test',
        name: 'Test',
        prompts: ['Test'],
        success_criteria: {
          resources_created: {},
        },
        expected_tools: [
          'mittwald_project_create',
          'mittwald_app_create',
        ],
      };

      const result: ScenarioExecutionResult = {
        scenario_id: 'test',
        run_id: 'run-2026-01-27T12-00-00',
        executed_at: '2026-01-27T12:00:00.000Z',
        status: 'success',
        tools_called: ['mittwald_project_create'], // Missing mittwald_app_create
        execution_time_ms: 1000,
        resources_created: [],
        cleanup_performed: false,
      };

      const validation = validateOutcome(scenario, result);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0]).toContain(
        "Expected tool 'mittwald_app_create' was not called"
      );
    });
  });

  describe('extractResourcesFromToolCalls', () => {
    it('should extract project IDs from log output', () => {
      const logOutput = JSON.stringify({
        event: 'tool_call_success',
        toolName: 'mittwald_project_create',
        output: {
          resultPreview: '{"id": "p-abc123", "description": "Test Project"}',
        },
      });

      const resources = extractResourcesFromToolCalls(
        ['mittwald_project_create'],
        logOutput
      );

      expect(resources).toHaveLength(1);
      expect(resources[0].type).toBe('project');
      expect(resources[0].id).toBe('p-abc123');
      expect(resources[0].name).toBe('Test Project');
    });

    it('should extract app IDs from log output', () => {
      const logOutput = JSON.stringify({
        event: 'tool_call_success',
        toolName: 'mittwald_app_create',
        output: {
          resultPreview: '{"id": "a-xyz789", "name": "WordPress"}',
        },
      });

      const resources = extractResourcesFromToolCalls(
        ['mittwald_app_create'],
        logOutput
      );

      expect(resources).toHaveLength(1);
      expect(resources[0].type).toBe('app');
      expect(resources[0].id).toBe('a-xyz789');
      expect(resources[0].name).toBe('WordPress');
    });

    it('should extract database IDs from log output', () => {
      const logOutput = JSON.stringify({
        event: 'tool_call_success',
        toolName: 'mittwald_database_create',
        output: {
          resultPreview: '{"id": "d-def456", "name": "mydb"}',
        },
      });

      const resources = extractResourcesFromToolCalls(
        ['mittwald_database_create'],
        logOutput
      );

      expect(resources).toHaveLength(1);
      expect(resources[0].type).toBe('database');
      expect(resources[0].id).toBe('d-def456');
      expect(resources[0].name).toBe('mydb');
    });

    it('should handle multiple resources in multi-line log', () => {
      const logOutput = [
        JSON.stringify({
          event: 'tool_call_success',
          toolName: 'mittwald_project_create',
          output: {
            resultPreview: '{"id": "p-123"}',
          },
        }),
        JSON.stringify({
          event: 'tool_call_success',
          toolName: 'mittwald_app_create',
          output: {
            resultPreview: '{"id": "a-456"}',
          },
        }),
      ].join('\n');

      const resources = extractResourcesFromToolCalls(
        ['mittwald_project_create', 'mittwald_app_create'],
        logOutput
      );

      expect(resources).toHaveLength(2);
      expect(resources[0].type).toBe('project');
      expect(resources[1].type).toBe('app');
    });

    it('should skip non-JSON lines', () => {
      const logOutput = [
        'Some random text',
        JSON.stringify({
          event: 'tool_call_success',
          toolName: 'mittwald_project_create',
          output: {
            resultPreview: '{"id": "p-123"}',
          },
        }),
        'More random text',
      ].join('\n');

      const resources = extractResourcesFromToolCalls(
        ['mittwald_project_create'],
        logOutput
      );

      expect(resources).toHaveLength(1);
      expect(resources[0].id).toBe('p-123');
    });

    it('should return empty array for empty log', () => {
      const resources = extractResourcesFromToolCalls([], '');
      expect(resources).toEqual([]);
    });
  });
});
