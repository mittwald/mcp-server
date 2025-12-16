import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import {
  generatePromptText,
  generateSetupInstructions,
  inferRequiredResources,
  generateExampleParams,
  generateDatasetItem,
  generateEvalPrompts,
  validatePromptFile,
} from '../generate-eval-prompts';

// Sample tool entries for testing
const sampleTier0Tool = {
  mcp_name: 'mcp__mittwald__mittwald_user_get',
  display_name: 'user/get',
  domain: 'identity',
  tier: 0,
  description: 'Get profile information for a user',
  dependencies: [],
  required_resources: [],
  success_indicators: ['Returns user profile data', 'Response includes user ID'],
  is_destructive: false,
  is_interactive: false,
};

const sampleTier4Tool = {
  mcp_name: 'mcp__mittwald__mittwald_app_create_node',
  display_name: 'app/create/node',
  domain: 'apps',
  tier: 4,
  description: 'Create a Node.js application',
  dependencies: ['project/create'],
  required_resources: ['project'],
  success_indicators: ['Returns new app ID', 'App appears in list'],
  is_destructive: false,
  is_interactive: false,
};

const sampleDestructiveTool = {
  mcp_name: 'mcp__mittwald__mittwald_project_delete',
  display_name: 'project/delete',
  domain: 'project-foundation',
  tier: 4,
  description: 'Delete a project',
  dependencies: ['project/list'],
  required_resources: ['project'],
  success_indicators: ['Project removed from list', 'Confirmation received'],
  is_destructive: true,
  is_interactive: false,
};

describe('generateSetupInstructions', () => {
  it('returns no setup message for Tier 0 tools', () => {
    const instructions = generateSetupInstructions(sampleTier0Tool);
    expect(instructions).toContain('No setup required');
    expect(instructions).toContain('Tier 0');
  });

  it('includes project setup for Tier 4 tools', () => {
    const instructions = generateSetupInstructions(sampleTier4Tool);
    expect(instructions).toContain('project');
    expect(instructions).toContain('mcp__mittwald__mittwald_project');
  });

  it('handles tools with explicit dependencies', () => {
    const tool = {
      ...sampleTier4Tool,
      required_resources: [],
      dependencies: ['project/create', 'server/list'],
    };
    const instructions = generateSetupInstructions(tool);
    expect(instructions.length).toBeGreaterThan(0);
  });
});

describe('inferRequiredResources', () => {
  it('infers project requirement for Tier 4 tools', () => {
    const resources = inferRequiredResources(sampleTier4Tool);
    expect(resources).toContain('project');
  });

  it('infers app requirement for app-specific tools', () => {
    const tool = {
      ...sampleTier4Tool,
      display_name: 'app/get',
    };
    const resources = inferRequiredResources(tool);
    expect(resources).toContain('app');
  });

  it('infers database requirement for mysql tools', () => {
    const tool = {
      ...sampleTier4Tool,
      display_name: 'database/mysql/get',
    };
    const resources = inferRequiredResources(tool);
    expect(resources).toContain('database-mysql');
  });

  it('does not infer app for create/list operations', () => {
    const createTool = { ...sampleTier4Tool, display_name: 'app/create/node' };
    const listTool = { ...sampleTier4Tool, display_name: 'app/list' };

    expect(inferRequiredResources(createTool)).not.toContain('app');
    expect(inferRequiredResources(listTool)).not.toContain('app');
  });

  it('returns empty array for Tier 0 tools', () => {
    const resources = inferRequiredResources(sampleTier0Tool);
    expect(resources).not.toContain('project');
  });
});

describe('generateExampleParams', () => {
  it('returns specific examples for known tools', () => {
    const params = generateExampleParams(sampleTier0Tool);
    expect(params).toContain('No parameters required');
  });

  it('uses provided parameters when available', () => {
    const tool = {
      ...sampleTier4Tool,
      parameters: {
        projectId: 'The project ID',
        siteTitle: 'Optional app name',
      },
    };
    const params = generateExampleParams(tool);
    expect(params).toContain('projectId');
    expect(params).toContain('siteTitle');
  });

  it('generates pattern-based examples for list operations', () => {
    const tool = { ...sampleTier4Tool, display_name: 'backup/list' };
    const params = generateExampleParams(tool);
    expect(params).toContain('No required parameters');
  });

  it('generates pattern-based examples for get operations', () => {
    const tool = { ...sampleTier4Tool, display_name: 'backup/get' };
    const params = generateExampleParams(tool);
    expect(params).toContain('Resource ID');
  });

  it('generates pattern-based examples for delete operations', () => {
    const tool = { ...sampleTier4Tool, display_name: 'backup/delete' };
    const params = generateExampleParams(tool);
    expect(params).toContain('Resource ID');
  });
});

describe('generatePromptText', () => {
  it('includes tool name and description', () => {
    const prompt = generatePromptText(sampleTier0Tool);
    expect(prompt).toContain('user/get');
    expect(prompt).toContain('mcp__mittwald__mittwald_user_get');
    expect(prompt).toContain('Get profile information');
  });

  it('includes self-assessment markers', () => {
    const prompt = generatePromptText(sampleTier0Tool);
    expect(prompt).toContain('<!-- SELF_ASSESSMENT_START -->');
    expect(prompt).toContain('<!-- SELF_ASSESSMENT_END -->');
  });

  it('includes success indicators', () => {
    const prompt = generatePromptText(sampleTier0Tool);
    expect(prompt).toContain('Returns user profile data');
    expect(prompt).toContain('Response includes user ID');
  });

  it('includes destructive warning for destructive tools', () => {
    const prompt = generatePromptText(sampleDestructiveTool);
    expect(prompt).toContain('WARNING');
    expect(prompt).toContain('destructive');
  });

  it('includes tier and domain information', () => {
    const prompt = generatePromptText(sampleTier4Tool);
    expect(prompt).toContain('Dependency Tier**: 4');
    expect(prompt).toContain('Domain**: apps');
  });

  it('mentions no prerequisites for Tier 0', () => {
    const prompt = generatePromptText(sampleTier0Tool);
    expect(prompt).toContain('Tier 0');
    expect(prompt).toContain('no prerequisites');
  });
});

describe('generateDatasetItem', () => {
  it('creates valid Langfuse dataset item structure', () => {
    const item = generateDatasetItem(sampleTier0Tool);

    expect(item).toHaveProperty('input');
    expect(item).toHaveProperty('expectedOutput');
    expect(item).toHaveProperty('metadata');
    expect(item.expectedOutput).toBeNull();
  });

  it('includes correct input fields', () => {
    const item = generateDatasetItem(sampleTier0Tool);

    expect(item.input.tool_name).toBe('mcp__mittwald__mittwald_user_get');
    expect(item.input.display_name).toBe('user/get');
    expect(item.input.prompt).toContain('<!-- SELF_ASSESSMENT_START -->');
    expect(item.input.context.dependencies).toEqual([]);
  });

  it('includes correct metadata fields', () => {
    const item = generateDatasetItem(sampleTier0Tool);

    expect(item.metadata.domain).toBe('identity');
    expect(item.metadata.tier).toBe(0);
    expect(item.metadata.self_assessment_required).toBe(true);
    expect(item.metadata.eval_version).toBe('1.0.0');
    expect(item.metadata.tags).toContain('identity');
    expect(item.metadata.tags).toContain('tier-0');
  });

  it('adds destructive tag for destructive tools', () => {
    const item = generateDatasetItem(sampleDestructiveTool);
    expect(item.metadata.tags).toContain('destructive');
  });

  it('adds operation type tags', () => {
    const listTool = { ...sampleTier0Tool, display_name: 'user/list' };
    const createTool = { ...sampleTier4Tool, display_name: 'app/create/node' };

    const listItem = generateDatasetItem(listTool);
    const createItem = generateDatasetItem(createTool);

    expect(listItem.metadata.tags).toContain('read-only');
    expect(createItem.metadata.tags).toContain('write');
  });
});

describe('validatePromptFile', () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prompt-validation-test-'));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true });
  });

  it('validates correct prompt file', () => {
    const item = generateDatasetItem(sampleTier0Tool);
    const filePath = path.join(tempDir, 'valid.json');
    fs.writeFileSync(filePath, JSON.stringify(item, null, 2));

    const result = validatePromptFile(filePath);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects missing input field', () => {
    const invalid = { expectedOutput: null, metadata: {} };
    const filePath = path.join(tempDir, 'missing-input.json');
    fs.writeFileSync(filePath, JSON.stringify(invalid, null, 2));

    const result = validatePromptFile(filePath);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: input');
  });

  it('detects missing self-assessment markers', () => {
    const item = generateDatasetItem(sampleTier0Tool);
    item.input.prompt = 'A prompt without markers';
    const filePath = path.join(tempDir, 'no-markers.json');
    fs.writeFileSync(filePath, JSON.stringify(item, null, 2));

    const result = validatePromptFile(filePath);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('SELF_ASSESSMENT_START'))).toBe(true);
  });

  it('detects non-null expectedOutput', () => {
    const item = generateDatasetItem(sampleTier0Tool) as any;
    item.expectedOutput = 'should be null';
    const filePath = path.join(tempDir, 'non-null-expected.json');
    fs.writeFileSync(filePath, JSON.stringify(item, null, 2));

    const result = validatePromptFile(filePath);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('expectedOutput must be null');
  });

  it('returns error for non-existent file', () => {
    const result = validatePromptFile('/nonexistent/path.json');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('File not found');
  });

  it('handles invalid JSON', () => {
    const filePath = path.join(tempDir, 'invalid.json');
    fs.writeFileSync(filePath, 'not valid json {');

    const result = validatePromptFile(filePath);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('JSON parse error');
  });
});

describe('generateEvalPrompts', () => {
  let tempDir: string;
  let inventoryPath: string;
  let outputDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-prompts-test-'));
    inventoryPath = path.join(tempDir, 'tools.json');
    outputDir = path.join(tempDir, 'prompts');

    // Create sample inventory
    const inventory = {
      generated_at: new Date().toISOString(),
      tool_count: 2,
      source: 'test',
      domains: { identity: 1, apps: 1 },
      tools: [sampleTier0Tool, sampleTier4Tool],
    };
    fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true });
  });

  it('generates prompts for all tools in inventory', async () => {
    const manifest = await generateEvalPrompts(inventoryPath, outputDir);

    expect(manifest.total_prompts).toBe(2);
    expect(manifest.by_domain['identity']).toHaveLength(1);
    expect(manifest.by_domain['apps']).toHaveLength(1);
  });

  it('creates domain directories', async () => {
    await generateEvalPrompts(inventoryPath, outputDir);

    expect(fs.existsSync(path.join(outputDir, 'identity'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, 'apps'))).toBe(true);
  });

  it('creates valid JSON files', async () => {
    await generateEvalPrompts(inventoryPath, outputDir);

    const userGetPath = path.join(outputDir, 'identity', 'user-get.json');
    expect(fs.existsSync(userGetPath)).toBe(true);

    const validation = validatePromptFile(userGetPath);
    expect(validation.valid).toBe(true);
  });

  it('creates manifest file', async () => {
    await generateEvalPrompts(inventoryPath, outputDir);

    const manifestPath = path.join(outputDir, 'generation-manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(manifest.total_prompts).toBe(2);
    expect(manifest.inventory_source).toBe(inventoryPath);
  });

  it('throws error for missing inventory', async () => {
    await expect(generateEvalPrompts('/nonexistent/inventory.json', outputDir)).rejects.toThrow(
      'Inventory file not found'
    );
  });
});
