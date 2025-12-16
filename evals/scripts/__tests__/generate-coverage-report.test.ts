import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import {
  loadAssessments,
  loadInventory,
  calculateDomainCoverage,
  calculateTierCoverage,
  aggregateProblems,
  findToolsWithoutAssessment,
  generateReport,
  generateMarkdownReport,
  generateCoverageReport,
} from '../generate-coverage-report';

// Sample test data
const sampleInventory = {
  generated_at: '2025-12-16T00:00:00Z',
  tool_count: 4,
  source: 'test',
  domains: { identity: 2, apps: 2 },
  tools: [
    {
      mcp_name: 'mcp__mittwald__mittwald_user_get',
      display_name: 'user/get',
      domain: 'identity',
      tier: 0,
      description: 'Get user profile',
      dependencies: [],
      required_resources: [],
      success_indicators: ['Returns user data'],
      is_destructive: false,
      is_interactive: false,
    },
    {
      mcp_name: 'mcp__mittwald__mittwald_user_session_list',
      display_name: 'user/session/list',
      domain: 'identity',
      tier: 0,
      description: 'List user sessions',
      dependencies: [],
      required_resources: [],
      success_indicators: ['Returns session array'],
      is_destructive: false,
      is_interactive: false,
    },
    {
      mcp_name: 'mcp__mittwald__mittwald_app_list',
      display_name: 'app/list',
      domain: 'apps',
      tier: 4,
      description: 'List apps',
      dependencies: ['project/create'],
      required_resources: ['project'],
      success_indicators: ['Returns app array'],
      is_destructive: false,
      is_interactive: false,
    },
    {
      mcp_name: 'mcp__mittwald__mittwald_app_create_node',
      display_name: 'app/create/node',
      domain: 'apps',
      tier: 4,
      description: 'Create Node.js app',
      dependencies: ['project/create'],
      required_resources: ['project'],
      success_indicators: ['Returns app ID'],
      is_destructive: false,
      is_interactive: false,
    },
  ],
};

const sampleAssessments: Map<string, any> = new Map([
  [
    'mcp__mittwald__mittwald_user_get',
    {
      success: true,
      confidence: 'high',
      tool_executed: 'mcp__mittwald__mittwald_user_get',
      timestamp: '2025-12-16T12:00:00Z',
      problems_encountered: [],
      resources_created: [],
      resources_verified: [],
    },
  ],
  [
    'mcp__mittwald__mittwald_user_session_list',
    {
      success: true,
      confidence: 'high',
      tool_executed: 'mcp__mittwald__mittwald_user_session_list',
      timestamp: '2025-12-16T12:01:00Z',
      problems_encountered: [],
      resources_created: [],
      resources_verified: [],
    },
  ],
  [
    'mcp__mittwald__mittwald_app_list',
    {
      success: false,
      confidence: 'medium',
      tool_executed: 'mcp__mittwald__mittwald_app_list',
      timestamp: '2025-12-16T12:02:00Z',
      problems_encountered: [
        { type: 'resource_not_found', description: 'No project context available' },
      ],
      resources_created: [],
      resources_verified: [],
    },
  ],
]);

describe('calculateDomainCoverage', () => {
  it('calculates correct domain statistics', () => {
    const coverage = calculateDomainCoverage(sampleInventory, sampleAssessments);

    expect(coverage).toHaveLength(2);

    const identity = coverage.find((c) => c.domain === 'identity')!;
    expect(identity.total_tools).toBe(2);
    expect(identity.executed).toBe(2);
    expect(identity.success_count).toBe(2);
    expect(identity.failure_count).toBe(0);
    expect(identity.success_rate).toBe(100);
    expect(identity.coverage_rate).toBe(100);

    const apps = coverage.find((c) => c.domain === 'apps')!;
    expect(apps.total_tools).toBe(2);
    expect(apps.executed).toBe(1);
    expect(apps.success_count).toBe(0);
    expect(apps.failure_count).toBe(1);
    expect(apps.pending_count).toBe(1);
    expect(apps.success_rate).toBe(0);
    expect(apps.coverage_rate).toBe(50);
  });

  it('handles empty assessments', () => {
    const coverage = calculateDomainCoverage(sampleInventory, new Map());

    for (const domain of coverage) {
      expect(domain.executed).toBe(0);
      expect(domain.coverage_rate).toBe(0);
      expect(domain.success_rate).toBe(0);
    }
  });

  it('returns domains sorted alphabetically', () => {
    const coverage = calculateDomainCoverage(sampleInventory, sampleAssessments);
    expect(coverage[0].domain).toBe('apps');
    expect(coverage[1].domain).toBe('identity');
  });
});

describe('calculateTierCoverage', () => {
  it('calculates correct tier statistics', () => {
    const coverage = calculateTierCoverage(sampleInventory, sampleAssessments);

    expect(coverage).toHaveLength(5); // Tiers 0-4

    const tier0 = coverage.find((c) => c.tier === 0)!;
    expect(tier0.total_tools).toBe(2);
    expect(tier0.executed).toBe(2);
    expect(tier0.success_count).toBe(2);
    expect(tier0.success_rate).toBe(100);

    const tier4 = coverage.find((c) => c.tier === 4)!;
    expect(tier4.total_tools).toBe(2);
    expect(tier4.executed).toBe(1);
    expect(tier4.success_count).toBe(0);
    expect(tier4.failure_count).toBe(1);
    expect(tier4.success_rate).toBe(0);
  });

  it('initializes all tiers even if empty', () => {
    const coverage = calculateTierCoverage(sampleInventory, new Map());

    for (let tier = 0; tier <= 4; tier++) {
      const stats = coverage.find((c) => c.tier === tier);
      expect(stats).toBeDefined();
    }
  });

  it('returns tiers sorted by tier number', () => {
    const coverage = calculateTierCoverage(sampleInventory, sampleAssessments);
    for (let i = 0; i < coverage.length - 1; i++) {
      expect(coverage[i].tier).toBeLessThan(coverage[i + 1].tier);
    }
  });
});

describe('aggregateProblems', () => {
  it('aggregates problems by type', () => {
    const problems = aggregateProblems(sampleAssessments);

    expect(problems).toHaveLength(1);
    expect(problems[0].type).toBe('resource_not_found');
    expect(problems[0].count).toBe(1);
    expect(problems[0].affected_tools).toContain('mcp__mittwald__mittwald_app_list');
  });

  it('returns empty array when no problems', () => {
    const noProblemsAssessments = new Map([
      [
        'tool1',
        {
          success: true,
          problems_encountered: [],
        },
      ],
    ]);

    const problems = aggregateProblems(noProblemsAssessments);
    expect(problems).toHaveLength(0);
  });

  it('limits sample descriptions to 3', () => {
    const manyProblems = new Map<string, any>();
    for (let i = 0; i < 5; i++) {
      manyProblems.set(`tool${i}`, {
        success: false,
        problems_encountered: [{ type: 'auth_error', description: `Error ${i}` }],
      });
    }

    const problems = aggregateProblems(manyProblems);
    expect(problems[0].count).toBe(5);
    expect(problems[0].sample_descriptions).toHaveLength(3);
  });

  it('sorts problems by count descending', () => {
    const mixedProblems = new Map<string, any>([
      ['tool1', { problems_encountered: [{ type: 'auth_error', description: 'Auth 1' }] }],
      ['tool2', { problems_encountered: [{ type: 'timeout', description: 'Timeout 1' }] }],
      ['tool3', { problems_encountered: [{ type: 'timeout', description: 'Timeout 2' }] }],
    ]);

    const problems = aggregateProblems(mixedProblems);
    expect(problems[0].type).toBe('timeout');
    expect(problems[0].count).toBe(2);
    expect(problems[1].type).toBe('auth_error');
    expect(problems[1].count).toBe(1);
  });
});

describe('findToolsWithoutAssessment', () => {
  it('finds tools missing from assessments', () => {
    const missing = findToolsWithoutAssessment(sampleInventory, sampleAssessments);

    expect(missing).toHaveLength(1);
    expect(missing).toContain('app/create/node');
  });

  it('returns empty array when all tools assessed', () => {
    const fullAssessments = new Map(sampleAssessments);
    fullAssessments.set('mcp__mittwald__mittwald_app_create_node', {
      success: true,
      tool_executed: 'mcp__mittwald__mittwald_app_create_node',
    });

    const missing = findToolsWithoutAssessment(sampleInventory, fullAssessments);
    expect(missing).toHaveLength(0);
  });

  it('returns sorted list', () => {
    const missing = findToolsWithoutAssessment(sampleInventory, new Map());
    for (let i = 0; i < missing.length - 1; i++) {
      expect(missing[i].localeCompare(missing[i + 1])).toBeLessThanOrEqual(0);
    }
  });
});

describe('generateReport', () => {
  it('creates complete report structure', () => {
    const report = generateReport(sampleInventory, sampleAssessments);

    expect(report).toHaveProperty('generated_at');
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('by_domain');
    expect(report).toHaveProperty('by_tier');
    expect(report).toHaveProperty('problems');
    expect(report).toHaveProperty('tools_without_assessment');
    expect(report).toHaveProperty('execution_metadata');
  });

  it('calculates correct summary statistics', () => {
    const report = generateReport(sampleInventory, sampleAssessments);

    expect(report.summary.total_tools).toBe(4);
    expect(report.summary.total_executed).toBe(3);
    expect(report.summary.total_success).toBe(2);
    expect(report.summary.total_failure).toBe(1);
    expect(report.summary.overall_coverage_rate).toBe(75);
    expect(report.summary.overall_success_rate).toBeCloseTo(66.67, 1);
  });

  it('handles empty assessments', () => {
    const report = generateReport(sampleInventory, new Map());

    expect(report.summary.total_executed).toBe(0);
    expect(report.summary.total_success).toBe(0);
    expect(report.summary.overall_coverage_rate).toBe(0);
    expect(report.summary.overall_success_rate).toBe(0);
    expect(report.tools_without_assessment).toHaveLength(4);
  });
});

describe('generateMarkdownReport', () => {
  it('generates valid markdown', () => {
    const report = generateReport(sampleInventory, sampleAssessments);
    const markdown = generateMarkdownReport(report);

    expect(markdown).toContain('# Baseline Eval Report');
    expect(markdown).toContain('## Executive Summary');
    expect(markdown).toContain('## Coverage by Domain');
    expect(markdown).toContain('## Coverage by Tier');
  });

  it('includes domain table', () => {
    const report = generateReport(sampleInventory, sampleAssessments);
    const markdown = generateMarkdownReport(report);

    expect(markdown).toContain('| identity |');
    expect(markdown).toContain('| apps |');
  });

  it('includes tier table with descriptions', () => {
    const report = generateReport(sampleInventory, sampleAssessments);
    const markdown = generateMarkdownReport(report);

    expect(markdown).toContain('No prerequisites');
    expect(markdown).toContain('Requires project');
  });

  it('includes problem patterns when present', () => {
    const report = generateReport(sampleInventory, sampleAssessments);
    const markdown = generateMarkdownReport(report);

    expect(markdown).toContain('## Problem Patterns');
    expect(markdown).toContain('resource_not_found');
  });

  it('includes tools without assessment', () => {
    const report = generateReport(sampleInventory, sampleAssessments);
    const markdown = generateMarkdownReport(report);

    expect(markdown).toContain('## Tools Without Assessment');
    expect(markdown).toContain('app/create/node');
  });
});

describe('loadAssessments', () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'assessment-load-test-'));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true });
  });

  it('loads assessments from directory', async () => {
    // Create sample assessment files
    const assessment1 = {
      assessment: {
        tool_executed: 'test_tool_1',
        success: true,
      },
    };
    const assessment2 = {
      tool_executed: 'test_tool_2',
      success: false,
    };

    fs.writeFileSync(path.join(tempDir, 'tool1.json'), JSON.stringify(assessment1));
    fs.writeFileSync(path.join(tempDir, 'tool2.json'), JSON.stringify(assessment2));

    const loaded = await loadAssessments(tempDir);

    expect(loaded.size).toBe(2);
    expect(loaded.has('test_tool_1')).toBe(true);
    expect(loaded.has('test_tool_2')).toBe(true);
  });

  it('returns empty map for non-existent directory', async () => {
    const loaded = await loadAssessments('/nonexistent/directory');
    expect(loaded.size).toBe(0);
  });

  it('skips invalid JSON files', async () => {
    fs.writeFileSync(path.join(tempDir, 'invalid.json'), 'not json');

    const loaded = await loadAssessments(tempDir);
    // Should still have the 2 valid files from previous test
    expect(loaded.size).toBe(2);
  });
});

describe('loadInventory', () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'inventory-load-test-'));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true });
  });

  it('loads inventory from file', () => {
    const inventoryPath = path.join(tempDir, 'tools.json');
    fs.writeFileSync(inventoryPath, JSON.stringify(sampleInventory));

    const loaded = loadInventory(inventoryPath);

    expect(loaded.tool_count).toBe(4);
    expect(loaded.tools).toHaveLength(4);
  });

  it('throws error for non-existent file', () => {
    expect(() => loadInventory('/nonexistent/inventory.json')).toThrow('Inventory file not found');
  });
});

describe('generateCoverageReport', () => {
  let tempDir: string;
  let assessmentsDir: string;
  let inventoryPath: string;
  let outputDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coverage-report-test-'));
    assessmentsDir = path.join(tempDir, 'assessments');
    outputDir = path.join(tempDir, 'output');
    inventoryPath = path.join(tempDir, 'tools.json');

    fs.mkdirSync(assessmentsDir);
    fs.writeFileSync(inventoryPath, JSON.stringify(sampleInventory));

    // Create assessment files
    for (const [toolName, assessment] of sampleAssessments) {
      const filename = toolName.replace(/mcp__mittwald__mittwald_/g, '') + '.json';
      fs.writeFileSync(path.join(assessmentsDir, filename), JSON.stringify({ assessment }));
    }
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true });
  });

  it('generates both JSON and Markdown reports', async () => {
    await generateCoverageReport(assessmentsDir, inventoryPath, outputDir);

    expect(fs.existsSync(path.join(outputDir, 'coverage-report.json'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, 'baseline-report.md'))).toBe(true);
  });

  it('produces valid JSON report', async () => {
    await generateCoverageReport(assessmentsDir, inventoryPath, outputDir);

    const jsonPath = path.join(outputDir, 'coverage-report.json');
    const report = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    expect(report.summary).toBeDefined();
    expect(report.by_domain).toBeDefined();
    expect(report.by_tier).toBeDefined();
  });

  it('returns report object', async () => {
    const report = await generateCoverageReport(assessmentsDir, inventoryPath, outputDir);

    expect(report.summary.total_tools).toBe(4);
    expect(report.generated_at).toBeDefined();
  });
});
