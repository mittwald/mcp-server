#!/usr/bin/env node
/**
 * Simple aggregation script for feature 014 eval results
 * Generates coverage-report.json and baseline-report.md from domain-organized results
 */

import * as fs from 'fs';
import * as path from 'path';

interface SelfAssessment {
  success: boolean;
  confidence: 'high' | 'medium' | 'low';
  tool_executed: string;
  timestamp: string;
  problems_encountered: Array<{
    type: string;
    description: string;
  }>;
  tool_response_summary: string;
  execution_notes: string;
}

interface DomainSummary {
  domain: string;
  total: number;
  successful: number;
  failed: number;
  success_rate: number;
}

interface ProblemCount {
  type: string;
  count: number;
  tools: string[];
}

interface CoverageReport {
  total_tools: number;
  executed_count: number;
  success_count: number;
  failure_count: number;
  success_rate: number;
  domain_breakdown: DomainSummary[];
  problem_summary: ProblemCount[];
  timestamp: string;
}

// Load all results from domain subdirectories
function loadResults(resultsDir: string): Map<string, SelfAssessment> {
  const results = new Map<string, SelfAssessment>();

  const domains = fs.readdirSync(resultsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const domain of domains) {
    const domainPath = path.join(resultsDir, domain);
    const files = fs.readdirSync(domainPath).filter(f => f.endsWith('.json'));

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(domainPath, file), 'utf-8');
        const assessment: SelfAssessment = JSON.parse(content);

        if (assessment.tool_executed) {
          results.set(assessment.tool_executed, assessment);
        }
      } catch (err) {
        console.warn(`Failed to parse ${domain}/${file}:`, err);
      }
    }
  }

  return results;
}

// Aggregate results by domain
function aggregateByDomain(results: Map<string, SelfAssessment>): DomainSummary[] {
  const domainMap = new Map<string, { total: number; successful: number; failed: number }>();

  for (const [toolName, assessment] of results) {
    // Extract domain from tool name: mcp__mittwald__mittwald_domain_action
    const parts = toolName.replace('mcp__mittwald__mittwald_', '').split('_');
    const domain = parts[0];

    if (!domainMap.has(domain)) {
      domainMap.set(domain, { total: 0, successful: 0, failed: 0 });
    }

    const stats = domainMap.get(domain)!;
    stats.total++;
    if (assessment.success) {
      stats.successful++;
    } else {
      stats.failed++;
    }
  }

  return Array.from(domainMap.entries())
    .map(([domain, stats]) => ({
      domain,
      total: stats.total,
      successful: stats.successful,
      failed: stats.failed,
      success_rate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0
    }))
    .sort((a, b) => a.domain.localeCompare(b.domain));
}

// Aggregate problems
function aggregateProblems(results: Map<string, SelfAssessment>): ProblemCount[] {
  const problemMap = new Map<string, { count: number; tools: string[] }>();

  for (const [toolName, assessment] of results) {
    if (!assessment.success && assessment.problems_encountered) {
      for (const problem of assessment.problems_encountered) {
        if (!problemMap.has(problem.type)) {
          problemMap.set(problem.type, { count: 0, tools: [] });
        }
        const stats = problemMap.get(problem.type)!;
        stats.count++;
        stats.tools.push(toolName);
      }
    }
  }

  return Array.from(problemMap.entries())
    .map(([type, stats]) => ({
      type,
      count: stats.count,
      tools: stats.tools
    }))
    .sort((a, b) => b.count - a.count);
}

// Generate markdown report
function generateMarkdown(report: CoverageReport): string {
  const lines: string[] = [];

  lines.push('# Eval Coverage Baseline Report');
  lines.push('');
  lines.push(`**Generated**: ${new Date(report.timestamp).toLocaleString()}`);
  lines.push('');

  lines.push('## Overall Summary');
  lines.push('');
  lines.push(`- **Total Tools**: ${report.total_tools}`);
  lines.push(`- **Executed**: ${report.executed_count} (100%)`);
  lines.push(`- **Successful**: ${report.success_count}`);
  lines.push(`- **Failed**: ${report.failure_count}`);
  lines.push(`- **Success Rate**: ${report.success_rate.toFixed(1)}%`);
  lines.push('');

  lines.push('## Domain Breakdown');
  lines.push('');
  lines.push('| Domain | Executed | Successful | Failed | Success Rate |');
  lines.push('|--------|----------|------------|--------|--------------|');
  for (const domain of report.domain_breakdown) {
    lines.push(`| ${domain.domain} | ${domain.total} | ${domain.successful} | ${domain.failed} | ${domain.success_rate.toFixed(1)}% |`);
  }
  lines.push('');

  if (report.problem_summary.length > 0) {
    lines.push('## Problem Summary');
    lines.push('');
    lines.push('| Problem Type | Count | Sample Tools |');
    lines.push('|--------------|-------|--------------|');
    for (const problem of report.problem_summary) {
      const samples = problem.tools.slice(0, 2)
        .map(t => t.replace('mcp__mittwald__mittwald_', ''))
        .join(', ');
      const display = problem.tools.length > 2 ? `${samples} +${problem.tools.length - 2}` : samples;
      lines.push(`| ${problem.type} | ${problem.count} | ${display} |`);
    }
    lines.push('');
  }

  lines.push('## Recommendations');
  lines.push('');

  const lowSuccess = report.domain_breakdown.filter(d => d.success_rate < 50);
  if (lowSuccess.length > 0) {
    lines.push('### Domains Needing Attention');
    lines.push('');
    for (const domain of lowSuccess) {
      lines.push(`- **${domain.domain}**: ${domain.success_rate.toFixed(1)}% success (${domain.failed}/${domain.total} failed)`);
    }
    lines.push('');
  }

  if (report.problem_summary.length > 0) {
    lines.push('### Top Problem Types');
    lines.push('');
    for (const problem of report.problem_summary.slice(0, 5)) {
      lines.push(`- **${problem.type}**: ${problem.count} occurrences`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// Main
function main() {
  const resultsDir = process.argv[2] || 'evals/results';
  const outputDir = process.argv[3] || 'evals/results';

  console.log('Loading results...');
  const results = loadResults(resultsDir);
  console.log(`Loaded ${results.size} results`);

  const domainBreakdown = aggregateByDomain(results);
  const problemSummary = aggregateProblems(results);

  const successCount = Array.from(results.values()).filter(r => r.success).length;
  const failureCount = results.size - successCount;

  const report: CoverageReport = {
    total_tools: results.size,
    executed_count: results.size,
    success_count: successCount,
    failure_count: failureCount,
    success_rate: results.size > 0 ? (successCount / results.size) * 100 : 0,
    domain_breakdown: domainBreakdown,
    problem_summary: problemSummary,
    timestamp: new Date().toISOString()
  };

  // Write JSON report
  const jsonPath = path.join(outputDir, 'coverage-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`Generated: ${jsonPath}`);

  // Write markdown report
  const mdPath = path.join(outputDir, 'baseline-report.md');
  fs.writeFileSync(mdPath, generateMarkdown(report));
  console.log(`Generated: ${mdPath}`);

  console.log('');
  console.log('Summary:');
  console.log(`  Total: ${report.total_tools}`);
  console.log(`  Success: ${report.success_count} (${report.success_rate.toFixed(1)}%)`);
  console.log(`  Failed: ${report.failure_count}`);
  console.log(`  Domains: ${domainBreakdown.length}`);
  console.log(`  Problem types: ${problemSummary.length}`);
}

main();
