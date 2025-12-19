#!/usr/bin/env npx tsx

/**
 * Visual Run Comparison Generator
 *
 * Generates rich HTML comparison reports between two runs with:
 * - Side-by-side domain breakdown
 * - Success rate trends
 * - Detailed diff tables
 * - Problem pattern analysis
 *
 * Usage:
 *   npx tsx visual-comparison.ts <run_id_a> <run_id_b> [--output html|md]
 */

import * as fs from 'fs';
import * as path from 'path';
import { compareRuns, type RunComparison } from './run-manager.js';

const RUNS_DIR = path.join(process.cwd(), 'evals', 'results', 'runs');

interface EnrichedComparison extends RunComparison {
  run_a_metadata: any;
  run_b_metadata: any;
  domain_breakdown: Array<{
    domain: string;
    run_a_success_rate: number;
    run_b_success_rate: number;
    delta: number;
    trend: 'improved' | 'regressed' | 'unchanged';
  }>;
}

async function loadRunMetadata(runId: string) {
  const metadataPath = path.join(RUNS_DIR, runId, 'metadata.json');
  return JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
}

async function enrichComparison(comparison: RunComparison): Promise<EnrichedComparison> {
  const metadataA = await loadRunMetadata(comparison.run_a);
  const metadataB = await loadRunMetadata(comparison.run_b);

  // Calculate domain-level changes
  const domainMap = new Map<string, { a_success: number; a_total: number; b_success: number; b_total: number }>();

  for (const diff of comparison.differences) {
    if (!domainMap.has(diff.domain)) {
      domainMap.set(diff.domain, { a_success: 0, a_total: 0, b_success: 0, b_total: 0 });
    }

    const stats = domainMap.get(diff.domain)!;

    if (diff.change_type !== 'new') {
      stats.a_total++;
      if (diff.run_a_success) stats.a_success++;
    }

    if (diff.change_type !== 'missing') {
      stats.b_total++;
      if (diff.run_b_success) stats.b_success++;
    }
  }

  const domain_breakdown = Array.from(domainMap.entries()).map(([domain, stats]) => {
    const a_rate = stats.a_total > 0 ? (stats.a_success / stats.a_total) * 100 : 0;
    const b_rate = stats.b_total > 0 ? (stats.b_success / stats.b_total) * 100 : 0;
    const delta = b_rate - a_rate;

    let trend: 'improved' | 'regressed' | 'unchanged';
    if (Math.abs(delta) < 0.5) trend = 'unchanged';
    else if (delta > 0) trend = 'improved';
    else trend = 'regressed';

    return {
      domain,
      run_a_success_rate: a_rate,
      run_b_success_rate: b_rate,
      delta,
      trend,
    };
  });

  domain_breakdown.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return {
    ...comparison,
    run_a_metadata: metadataA,
    run_b_metadata: metadataB,
    domain_breakdown,
  };
}

function generateMarkdownReport(comparison: EnrichedComparison): string {
  const lines: string[] = [];

  lines.push('# Eval Run Comparison Report');
  lines.push('');
  lines.push(`**Generated**: ${comparison.generated_at}`);
  lines.push('');

  // Run Info
  lines.push('## Run Details');
  lines.push('');
  lines.push('### Run A (Baseline)');
  lines.push(`- **ID**: ${comparison.run_a}`);
  lines.push(`- **Name**: ${comparison.run_a_metadata.name}`);
  lines.push(`- **Created**: ${comparison.run_a_metadata.created_at}`);
  lines.push(`- **Status**: ${comparison.run_a_metadata.status}`);
  if (comparison.run_a_metadata.summary) {
    lines.push(`- **Success Rate**: ${comparison.run_a_metadata.summary.success_rate.toFixed(1)}%`);
  }
  lines.push('');

  lines.push('### Run B (Comparison)');
  lines.push(`- **ID**: ${comparison.run_b}`);
  lines.push(`- **Name**: ${comparison.run_b_metadata.name}`);
  lines.push(`- **Created**: ${comparison.run_b_metadata.created_at}`);
  lines.push(`- **Status**: ${comparison.run_b_metadata.status}`);
  if (comparison.run_b_metadata.summary) {
    lines.push(`- **Success Rate**: ${comparison.run_b_metadata.summary.success_rate.toFixed(1)}%`);
  }
  lines.push('');

  // Executive Summary
  lines.push('## Executive Summary');
  lines.push('');
  lines.push('| Metric | Count | Percentage |');
  lines.push('|--------|-------|------------|');

  const total = comparison.differences.length;
  lines.push(`| ✅ Improved | ${comparison.summary.improved} | ${((comparison.summary.improved / total) * 100).toFixed(1)}% |`);
  lines.push(`| ❌ Regressed | ${comparison.summary.regressed} | ${((comparison.summary.regressed / total) * 100).toFixed(1)}% |`);
  lines.push(`| ➡️ Unchanged | ${comparison.summary.unchanged} | ${((comparison.summary.unchanged / total) * 100).toFixed(1)}% |`);
  lines.push(`| 🆕 New in B | ${comparison.summary.new_in_b} | ${((comparison.summary.new_in_b / total) * 100).toFixed(1)}% |`);
  lines.push(`| ⚠️ Missing in B | ${comparison.summary.missing_in_b} | ${((comparison.summary.missing_in_b / total) * 100).toFixed(1)}% |`);
  lines.push('');

  // Domain Breakdown
  lines.push('## Domain-Level Changes');
  lines.push('');
  lines.push('| Domain | Run A | Run B | Delta | Trend |');
  lines.push('|--------|-------|-------|-------|-------|');

  for (const domain of comparison.domain_breakdown) {
    const trendEmoji = domain.trend === 'improved' ? '📈' : domain.trend === 'regressed' ? '📉' : '➡️';
    const deltaStr = domain.delta >= 0 ? `+${domain.delta.toFixed(1)}%` : `${domain.delta.toFixed(1)}%`;

    lines.push(
      `| ${domain.domain} | ${domain.run_a_success_rate.toFixed(1)}% | ${domain.run_b_success_rate.toFixed(1)}% | ${deltaStr} | ${trendEmoji} ${domain.trend} |`
    );
  }
  lines.push('');

  // Critical Changes
  const regressions = comparison.differences.filter(d => d.change_type === 'regressed');
  const improvements = comparison.differences.filter(d => d.change_type === 'improved');

  if (regressions.length > 0) {
    lines.push('## 🚨 Regressions (Require Investigation)');
    lines.push('');
    lines.push('| Tool | Domain | Notes |');
    lines.push('|------|--------|-------|');

    for (const diff of regressions) {
      lines.push(`| \`${diff.tool}\` | ${diff.domain} | ${diff.notes || 'N/A'} |`);
    }
    lines.push('');
  }

  if (improvements.length > 0) {
    lines.push('## 🎉 Improvements');
    lines.push('');
    lines.push('| Tool | Domain | Notes |');
    lines.push('|------|--------|-------|');

    for (const diff of improvements.slice(0, 20)) {
      lines.push(`| \`${diff.tool}\` | ${diff.domain} | ${diff.notes || 'N/A'} |`);
    }

    if (improvements.length > 20) {
      lines.push(`| ... | ... | *${improvements.length - 20} more improvements* |`);
    }
    lines.push('');
  }

  // New and Missing Tools
  const newTools = comparison.differences.filter(d => d.change_type === 'new');
  const missingTools = comparison.differences.filter(d => d.change_type === 'missing');

  if (newTools.length > 0) {
    lines.push('## 🆕 New Tools in Run B');
    lines.push('');
    for (const diff of newTools) {
      lines.push(`- \`${diff.tool}\` (${diff.domain})`);
    }
    lines.push('');
  }

  if (missingTools.length > 0) {
    lines.push('## ⚠️ Tools Missing in Run B');
    lines.push('');
    for (const diff of missingTools) {
      lines.push(`- \`${diff.tool}\` (${diff.domain})`);
    }
    lines.push('');
  }

  // Recommendations
  lines.push('## Recommendations');
  lines.push('');

  if (regressions.length > 0) {
    lines.push(`1. **Investigate ${regressions.length} regressions** - These tools worked in Run A but failed in Run B`);
  }

  if (comparison.summary.improved > comparison.summary.regressed) {
    lines.push(`2. **Net Positive** - Overall success rate improved (${comparison.summary.improved - comparison.summary.regressed} net improvement)`);
  } else if (comparison.summary.regressed > comparison.summary.improved) {
    lines.push(`2. **Net Negative** - Overall success rate declined (${comparison.summary.regressed - comparison.summary.improved} net regression)`);
  }

  if (missingTools.length > 0) {
    lines.push(`3. **Missing Tools** - ${missingTools.length} tools from Run A were not tested in Run B`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*Generated by Multi-Run Evaluation System*');

  return lines.join('\n');
}

function generateHTMLReport(comparison: EnrichedComparison): string {
  const md = generateMarkdownReport(comparison);

  // Simple HTML wrapper with basic styling
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Eval Run Comparison: ${comparison.run_a} vs ${comparison.run_b}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 { color: #1a1a1a; border-bottom: 3px solid #0066cc; padding-bottom: 0.5rem; }
    h2 { color: #333; border-bottom: 2px solid #e0e0e0; padding-bottom: 0.3rem; margin-top: 2rem; }
    h3 { color: #555; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th { background: #f0f0f0; font-weight: 600; text-align: left; padding: 0.75rem; border: 1px solid #ddd; }
    td { padding: 0.75rem; border: 1px solid #ddd; }
    tr:hover { background: #f9f9f9; }
    code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 3px; font-family: "Courier New", monospace; }
    .improved { color: #28a745; }
    .regressed { color: #dc3545; }
    .unchanged { color: #6c757d; }
    .summary-stat { display: inline-block; margin: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 6px; min-width: 120px; text-align: center; }
    .summary-stat .value { font-size: 2rem; font-weight: bold; }
    .summary-stat .label { font-size: 0.9rem; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    ${md.split('\n').map(line => {
      if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`;
      if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`;
      if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`;
      if (line.startsWith('| ') && line.includes('|---')) return '';
      if (line.startsWith('| ')) {
        // Convert table rows
        return line;
      }
      if (line.trim() === '') return '<br>';
      return `<p>${line}</p>`;
    }).join('\n')}
  </div>
</body>
</html>
  `.trim();
}

async function main() {
  const args = process.argv.slice(2);
  const runA = args[0];
  const runB = args[1];
  const outputFormat = args.includes('--output') ? args[args.indexOf('--output') + 1] : 'md';

  if (!runA || !runB) {
    console.error('Usage: visual-comparison.ts <run_id_a> <run_id_b> [--output html|md]');
    process.exit(1);
  }

  console.log(`Generating visual comparison: ${runA} vs ${runB}`);

  const comparison = await compareRuns(runA, runB);
  const enriched = await enrichComparison(comparison);

  let content: string;
  let extension: string;

  if (outputFormat === 'html') {
    content = generateHTMLReport(enriched);
    extension = 'html';
  } else {
    content = generateMarkdownReport(enriched);
    extension = 'md';
  }

  const outputPath = path.join(
    RUNS_DIR,
    `comparison-${runA}-vs-${runB}.${extension}`
  );

  fs.writeFileSync(outputPath, content);

  console.log(`\n✅ Visual comparison generated:`);
  console.log(`   Format: ${outputFormat.toUpperCase()}`);
  console.log(`   File: ${outputPath}`);
  console.log(`\nSummary:`);
  console.log(`   Improved: ${enriched.summary.improved}`);
  console.log(`   Regressed: ${enriched.summary.regressed}`);
  console.log(`   Unchanged: ${enriched.summary.unchanged}`);

  if (extension === 'html') {
    console.log(`\nOpen in browser: file://${outputPath}`);
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
