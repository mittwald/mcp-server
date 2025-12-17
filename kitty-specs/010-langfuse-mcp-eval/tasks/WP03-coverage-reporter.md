---
work_package_id: WP03
title: Coverage Reporter Script
lane: done
history:
- timestamp: '2025-12-16T13:03:00Z'
  lane: planned
  agent: system
  shell_pid: ''
  action: Prompt generated via /spec-kitty.tasks
- timestamp: '2025-12-16T16:35:00Z'
  lane: doing
  agent: claude
  shell_pid: '78380'
  action: Started implementation - Phase 1 final script
- timestamp: '2025-12-16T16:34:00Z'
  lane: for_review
  agent: claude
  shell_pid: '78380'
  action: Implementation complete - all 29 unit tests pass
- timestamp: '2025-12-16T15:42:24Z'
  lane: planned
  agent: codex
  shell_pid: '95120'
  action: 'Review submitted: needs changes (CLI defaults & missing generated reports)'
- timestamp: '2025-12-16T16:50:00Z'
  lane: for_review
  agent: claude
  shell_pid: '6748'
  action: 'Addressed review feedback: fixed CLI defaults, ESM compatibility, generated deliverables'
- timestamp: '2025-12-16T15:58:34Z'
  lane: done
  agent: codex
  shell_pid: '22802'
  action: 'Approved after re-review: defaults fixed, reports generated, tests passing'
agent: codex
assignee: ''
phase: Phase 1 - Infrastructure & Schemas
review_status: approved without changes
reviewed_by: codex
shell_pid: '22802'
subtasks:
- T001
---

## Review Feedback

**Status**: ✅ **Approved without changes**

**Notes**:
- CLI now defaults to `evals/results/self-assessments`, `evals/inventory/tools.json`, and `evals/results`, auto-creating the assessments directory so zero-arg runs work as specified.
- Generated deliverables present: `evals/results/coverage-report.json` and `evals/results/baseline-report.md` (0% baseline, 175 tools).
- ESM entry guard updated; coverage report generation writes JSON/Markdown summaries by domain/tier/problem patterns.
- Tests: `npx vitest evals/scripts/__tests__/generate-coverage-report.test.ts` (pass).

# Work Package Prompt: WP03 – Coverage Reporter Script

## Objective

Create a TypeScript script to aggregate eval results into comprehensive coverage reports. This script processes extracted self-assessments and generates both machine-readable JSON and human-readable Markdown reports.

## Context

After eval execution, we need to:
1. Aggregate success/failure rates by domain
2. Aggregate success/failure rates by tier
3. Identify patterns in problems encountered
4. Generate a baseline report for future comparison

## Technical Requirements

### Input
- Directory of extracted self-assessments (`evals/results/self-assessments/`)
- Tool inventory (`evals/inventory/tools.json`)

### Output
- `evals/results/coverage-report.json` - Machine-readable coverage data
- `evals/results/baseline-report.md` - Human-readable analysis

## Implementation Steps

### Step 1: Define Report Interfaces

```typescript
interface DomainCoverage {
  domain: string;
  total_tools: number;
  executed: number;
  success_count: number;
  failure_count: number;
  pending_count: number;
  success_rate: number;    // percentage
  coverage_rate: number;   // percentage
}

interface TierCoverage {
  tier: number;
  total_tools: number;
  executed: number;
  success_count: number;
  failure_count: number;
  success_rate: number;
}

interface ProblemSummary {
  type: string;
  count: number;
  affected_tools: string[];
  sample_descriptions: string[];
}

interface CoverageReport {
  generated_at: string;
  summary: {
    total_tools: number;
    total_executed: number;
    total_success: number;
    total_failure: number;
    overall_success_rate: number;
    overall_coverage_rate: number;
  };
  by_domain: DomainCoverage[];
  by_tier: TierCoverage[];
  problems: ProblemSummary[];
  tools_without_assessment: string[];
  execution_metadata: {
    start_time?: string;
    end_time?: string;
    total_duration_ms?: number;
  };
}
```

### Step 2: Load and Correlate Data

```typescript
async function loadAssessments(dir: string): Promise<Map<string, SelfAssessment>> {
  const assessments = new Map<string, SelfAssessment>();
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(dir, file), 'utf-8');
      const data = JSON.parse(content);

      if (data.assessment) {
        const toolName = data.assessment.tool_executed;
        assessments.set(toolName, data.assessment);
      }
    } catch (e) {
      console.warn(`Failed to load ${file}: ${e}`);
    }
  }

  return assessments;
}

function loadInventory(path: string): ToolInventory {
  return JSON.parse(fs.readFileSync(path, 'utf-8'));
}
```

### Step 3: Calculate Domain Coverage

```typescript
function calculateDomainCoverage(
  inventory: ToolInventory,
  assessments: Map<string, SelfAssessment>
): DomainCoverage[] {
  const domainStats = new Map<string, DomainCoverage>();

  // Initialize all domains
  for (const tool of inventory.tools) {
    if (!domainStats.has(tool.domain)) {
      domainStats.set(tool.domain, {
        domain: tool.domain,
        total_tools: 0,
        executed: 0,
        success_count: 0,
        failure_count: 0,
        pending_count: 0,
        success_rate: 0,
        coverage_rate: 0
      });
    }
    domainStats.get(tool.domain)!.total_tools++;
  }

  // Count results
  for (const tool of inventory.tools) {
    const stats = domainStats.get(tool.domain)!;
    const assessment = assessments.get(tool.mcp_name);

    if (assessment) {
      stats.executed++;
      if (assessment.success) {
        stats.success_count++;
      } else {
        stats.failure_count++;
      }
    } else {
      stats.pending_count++;
    }
  }

  // Calculate rates
  for (const stats of domainStats.values()) {
    stats.coverage_rate = (stats.executed / stats.total_tools) * 100;
    stats.success_rate = stats.executed > 0
      ? (stats.success_count / stats.executed) * 100
      : 0;
  }

  return Array.from(domainStats.values())
    .sort((a, b) => a.domain.localeCompare(b.domain));
}
```

### Step 4: Calculate Tier Coverage

```typescript
function calculateTierCoverage(
  inventory: ToolInventory,
  assessments: Map<string, SelfAssessment>
): TierCoverage[] {
  const tierStats = new Map<number, TierCoverage>();

  // Initialize tiers 0-4
  for (let tier = 0; tier <= 4; tier++) {
    tierStats.set(tier, {
      tier,
      total_tools: 0,
      executed: 0,
      success_count: 0,
      failure_count: 0,
      success_rate: 0
    });
  }

  // Count by tier
  for (const tool of inventory.tools) {
    const stats = tierStats.get(tool.tier)!;
    stats.total_tools++;

    const assessment = assessments.get(tool.mcp_name);
    if (assessment) {
      stats.executed++;
      if (assessment.success) {
        stats.success_count++;
      } else {
        stats.failure_count++;
      }
    }
  }

  // Calculate rates
  for (const stats of tierStats.values()) {
    stats.success_rate = stats.executed > 0
      ? (stats.success_count / stats.executed) * 100
      : 0;
  }

  return Array.from(tierStats.values()).sort((a, b) => a.tier - b.tier);
}
```

### Step 5: Aggregate Problem Patterns

```typescript
function aggregateProblems(
  assessments: Map<string, SelfAssessment>
): ProblemSummary[] {
  const problemMap = new Map<string, ProblemSummary>();

  for (const [toolName, assessment] of assessments) {
    for (const problem of assessment.problems_encountered || []) {
      if (!problemMap.has(problem.type)) {
        problemMap.set(problem.type, {
          type: problem.type,
          count: 0,
          affected_tools: [],
          sample_descriptions: []
        });
      }

      const summary = problemMap.get(problem.type)!;
      summary.count++;
      summary.affected_tools.push(toolName);

      if (summary.sample_descriptions.length < 3) {
        summary.sample_descriptions.push(problem.description);
      }
    }
  }

  return Array.from(problemMap.values())
    .sort((a, b) => b.count - a.count);
}
```

### Step 6: Generate Markdown Report

```typescript
function generateMarkdownReport(report: CoverageReport): string {
  const lines: string[] = [
    '# Baseline Eval Report: Mittwald MCP Tools',
    '',
    `**Generated**: ${report.generated_at}`,
    '',
    '## Executive Summary',
    '',
    `- **Total Tools**: ${report.summary.total_tools}`,
    `- **Executed**: ${report.summary.total_executed} (${report.summary.overall_coverage_rate.toFixed(1)}%)`,
    `- **Successful**: ${report.summary.total_success} (${report.summary.overall_success_rate.toFixed(1)}%)`,
    `- **Failed**: ${report.summary.total_failure}`,
    '',
    '## Coverage by Domain',
    '',
    '| Domain | Tools | Executed | Success | Failure | Success Rate |',
    '|--------|-------|----------|---------|---------|--------------|'
  ];

  for (const domain of report.by_domain) {
    lines.push(`| ${domain.domain} | ${domain.total_tools} | ${domain.executed} | ${domain.success_count} | ${domain.failure_count} | ${domain.success_rate.toFixed(1)}% |`);
  }

  lines.push('', '## Coverage by Tier', '',
    '| Tier | Description | Tools | Executed | Success Rate |',
    '|------|-------------|-------|----------|--------------|');

  const tierDescriptions = [
    'No prerequisites',
    'Organization-level',
    'Server-level',
    'Project creation',
    'Requires project'
  ];

  for (const tier of report.by_tier) {
    lines.push(`| ${tier.tier} | ${tierDescriptions[tier.tier]} | ${tier.total_tools} | ${tier.executed} | ${tier.success_rate.toFixed(1)}% |`);
  }

  if (report.problems.length > 0) {
    lines.push('', '## Problem Patterns', '',
      '| Problem Type | Count | Affected Tools |',
      '|--------------|-------|----------------|');

    for (const problem of report.problems) {
      const toolList = problem.affected_tools.slice(0, 3).join(', ') +
        (problem.affected_tools.length > 3 ? '...' : '');
      lines.push(`| ${problem.type} | ${problem.count} | ${toolList} |`);
    }

    lines.push('', '### Sample Problem Descriptions', '');
    for (const problem of report.problems.slice(0, 5)) {
      lines.push(`**${problem.type}**:`);
      for (const desc of problem.sample_descriptions) {
        lines.push(`- ${desc}`);
      }
      lines.push('');
    }
  }

  if (report.tools_without_assessment.length > 0) {
    lines.push('', '## Tools Without Assessment', '',
      'The following tools were executed but no self-assessment was extracted:', '');
    for (const tool of report.tools_without_assessment) {
      lines.push(`- ${tool}`);
    }
  }

  lines.push('', '## Recommendations', '',
    '1. Investigate tools with `auth_error` problems - may need scope configuration',
    '2. Review `resource_not_found` errors - may indicate dependency issues',
    '3. Consider retry strategy for `timeout` errors',
    '4. Tools with `permission_denied` may need role elevation',
    '',
    '---',
    '',
    '*This baseline report was generated by the Langfuse MCP Eval Suite.*'
  );

  return lines.join('\n');
}
```

### Step 7: Main Report Generation

```typescript
async function generateCoverageReport(
  assessmentsDir: string,
  inventoryPath: string,
  outputDir: string
): Promise<void> {
  console.log('Loading data...');
  const assessments = await loadAssessments(assessmentsDir);
  const inventory = loadInventory(inventoryPath);

  console.log(`Found ${assessments.size} assessments for ${inventory.tool_count} tools`);

  // Find tools without assessments
  const toolsWithoutAssessment: string[] = [];
  for (const tool of inventory.tools) {
    if (!assessments.has(tool.mcp_name)) {
      toolsWithoutAssessment.push(tool.display_name);
    }
  }

  // Build report
  const report: CoverageReport = {
    generated_at: new Date().toISOString(),
    summary: {
      total_tools: inventory.tool_count,
      total_executed: assessments.size,
      total_success: Array.from(assessments.values()).filter(a => a.success).length,
      total_failure: Array.from(assessments.values()).filter(a => !a.success).length,
      overall_success_rate: 0,
      overall_coverage_rate: 0
    },
    by_domain: calculateDomainCoverage(inventory, assessments),
    by_tier: calculateTierCoverage(inventory, assessments),
    problems: aggregateProblems(assessments),
    tools_without_assessment: toolsWithoutAssessment,
    execution_metadata: {}
  };

  // Calculate overall rates
  report.summary.overall_coverage_rate =
    (report.summary.total_executed / report.summary.total_tools) * 100;
  report.summary.overall_success_rate = report.summary.total_executed > 0
    ? (report.summary.total_success / report.summary.total_executed) * 100
    : 0;

  // Write JSON report
  fs.mkdirSync(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, 'coverage-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`JSON report written to: ${jsonPath}`);

  // Write Markdown report
  const mdPath = path.join(outputDir, 'baseline-report.md');
  fs.writeFileSync(mdPath, generateMarkdownReport(report));
  console.log(`Markdown report written to: ${mdPath}`);
}
```

### Step 8: CLI Interface

```typescript
async function main() {
  const args = process.argv.slice(2);

  const assessmentsDir = args[0] || 'evals/results/self-assessments';
  const inventoryPath = args[1] || 'evals/inventory/tools.json';
  const outputDir = args[2] || 'evals/results';

  if (!fs.existsSync(assessmentsDir)) {
    console.error(`Assessments directory not found: ${assessmentsDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(inventoryPath)) {
    console.error(`Inventory file not found: ${inventoryPath}`);
    process.exit(1);
  }

  await generateCoverageReport(assessmentsDir, inventoryPath, outputDir);
}

main().catch(console.error);
```

## Deliverables

- [ ] `evals/scripts/generate-coverage-report.ts` - Main reporter script
- [ ] Script produces valid `coverage-report.json`
- [ ] Script produces formatted `baseline-report.md`
- [ ] All domains and tiers represented
- [ ] Problem patterns aggregated

## Acceptance Criteria

1. JSON report includes all domains and tiers
2. Percentages calculated correctly
3. Problem patterns identified and ranked
4. Markdown report is human-readable
5. Tools without assessments are listed
6. Script handles partial results gracefully

## Parallelization Notes

This WP can run in parallel with:
- **WP-01** (Self-Assessment Extractor) - No dependencies during development
- **WP-02** (Eval Prompt Generator) - No dependencies

Will be used in Phase 5, requires:
- **WP-04** (Tool Inventory) - Needs `tools.json`
- **WP-29** (Extract All Self-Assessments) - Needs extracted assessments

## Dependencies

- Node.js 18+
- TypeScript
- `evals/inventory/tools.json` (from WP-04)
- `evals/results/self-assessments/` (from WP-29)
