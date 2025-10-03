#!/usr/bin/env tsx
/**
 * Audit script to identify actual destructive tools and array parameter usage
 * Replaces assumptions in PROJECT-WIDE-PATTERN-ADOPTION.md with ground truth
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

interface AuditResult {
  file: string;
  isDestructive: boolean;
  hasConfirmFlag: boolean;
  hasConfirmValidation: boolean;
  hasAuditLogging: boolean;
  hasArrayParams: boolean;
  arrayParams?: string[];
  notes?: string[];
}

function auditFile(filePath: string): AuditResult | null {
  const content = readFileSync(filePath, 'utf-8');
  const notes: string[] = [];

  // Check if destructive (delete/revoke in filename)
  const isDestructive = /delete|revoke/i.test(filePath);

  if (!isDestructive) {
    // Still check for array params in non-destructive tools
    const arrayParamMatches = content.match(/args\.(\w+)\.forEach/g);
    const arrayParams = arrayParamMatches
      ? [...new Set(arrayParamMatches.map(m => m.match(/args\.(\w+)/)?.[1]).filter(Boolean))]
      : undefined;

    const hasArrayParams = !!arrayParams && arrayParams.length > 0;

    if (!hasArrayParams) {
      return null; // Not interesting for this audit
    }

    return {
      file: filePath.replace(/.*\/src\//, 'src/'),
      isDestructive: false,
      hasConfirmFlag: false,
      hasConfirmValidation: false,
      hasAuditLogging: false,
      hasArrayParams,
      arrayParams: arrayParams as string[],
    };
  }

  // For destructive tools, check C4 pattern compliance

  // Check for confirm flag in args interface
  const hasConfirmFlag = /confirm\??\s*:\s*boolean/.test(content);

  // Check for confirm validation
  const hasConfirmValidation = /args\.confirm\s*(!==|===)\s*true/.test(content);

  // Check for audit logging with destructive message
  const hasAuditLogging = /logger\.warn.*([Dd]estructive|[Rr]evok|[Dd]elet)/.test(content);

  // Check for array parameters (even in destructive tools)
  const arrayParamMatches = content.match(/args\.(\w+)\.forEach/g);
  const arrayParams = arrayParamMatches
    ? [...new Set(arrayParamMatches.map(m => m.match(/args\.(\w+)/)?.[1]).filter(Boolean))]
    : undefined;
  const hasArrayParams = !!arrayParams && arrayParams.length > 0;

  // Additional checks
  if (hasConfirmFlag && !hasConfirmValidation) {
    notes.push('Has confirm flag but missing validation check');
  }
  if (hasConfirmValidation && !hasConfirmFlag) {
    notes.push('Has validation but confirm flag not in interface (may be old code)');
  }
  if (hasAuditLogging && !hasConfirmValidation) {
    notes.push('Has audit logging but missing confirm validation');
  }

  return {
    file: filePath.replace(/.*\/src\//, 'src/'),
    isDestructive,
    hasConfirmFlag,
    hasConfirmValidation,
    hasAuditLogging,
    hasArrayParams,
    arrayParams: hasArrayParams ? (arrayParams as string[]) : undefined,
    notes: notes.length > 0 ? notes : undefined,
  };
}

function walkDirectory(dir: string): AuditResult[] {
  const results: AuditResult[] = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      results.push(...walkDirectory(fullPath));
    } else if (entry.endsWith('-cli.ts') && entry !== 'index-cli.ts') {
      const result = auditFile(fullPath);
      if (result) results.push(result);
    }
  }

  return results;
}

// Main execution
console.log('# Pattern Adoption Ground-Truth Audit\n');
console.log('**Date**: ' + new Date().toISOString().split('T')[0]);
console.log('**Script**: scripts/audit-actual-patterns.ts\n');

const results = walkDirectory('src/handlers/tools/mittwald-cli');

// ============================================================================
// DESTRUCTIVE TOOLS AUDIT
// ============================================================================
console.log('---\n');
console.log('## Part 1: Destructive Tools (C4 Pattern Compliance)\n');

const destructive = results.filter(r => r.isDestructive);
console.log(`**Total destructive tools found**: ${destructive.length}\n`);

// C4 Fully Compliant (confirm flag + validation + audit logging)
console.log('### ✅ C4 Fully Compliant (confirm + validation + audit)\n');
const fullyCompliant = destructive.filter(
  r => r.hasConfirmFlag && r.hasConfirmValidation && r.hasAuditLogging
);
console.log(`**Count**: ${fullyCompliant.length}\n`);
if (fullyCompliant.length > 0) {
  fullyCompliant.forEach(r => console.log(`- ${r.file}`));
  console.log('');
}

// Partial C4 (has some but not all)
console.log('### ⚠️ Partial C4 Compliance\n');
const partialCompliant = destructive.filter(
  r => (r.hasConfirmFlag || r.hasConfirmValidation || r.hasAuditLogging) &&
       !(r.hasConfirmFlag && r.hasConfirmValidation && r.hasAuditLogging)
);
console.log(`**Count**: ${partialCompliant.length}\n`);
if (partialCompliant.length > 0) {
  partialCompliant.forEach(r => {
    console.log(`- ${r.file}`);
    const flags = [];
    if (r.hasConfirmFlag) flags.push('confirm flag');
    if (r.hasConfirmValidation) flags.push('validation');
    if (r.hasAuditLogging) flags.push('audit log');
    console.log(`  - Has: ${flags.join(', ')}`);
    const missing = [];
    if (!r.hasConfirmFlag) missing.push('confirm flag');
    if (!r.hasConfirmValidation) missing.push('validation');
    if (!r.hasAuditLogging) missing.push('audit log');
    console.log(`  - Missing: ${missing.join(', ')}`);
    if (r.notes) {
      r.notes.forEach(note => console.log(`  - ⚠️ ${note}`));
    }
  });
  console.log('');
}

// No C4 Compliance
console.log('### ❌ No C4 Compliance\n');
const noCompliance = destructive.filter(
  r => !r.hasConfirmFlag && !r.hasConfirmValidation && !r.hasAuditLogging
);
console.log(`**Count**: ${noCompliance.length}\n`);
if (noCompliance.length > 0) {
  noCompliance.forEach(r => console.log(`- ${r.file}`));
  console.log('');
}

// Summary stats
console.log('### Summary Statistics\n');
console.log(`| Status | Count | Percentage |`);
console.log(`|--------|-------|------------|`);
console.log(`| Fully Compliant | ${fullyCompliant.length} | ${((fullyCompliant.length / destructive.length) * 100).toFixed(1)}% |`);
console.log(`| Partial | ${partialCompliant.length} | ${((partialCompliant.length / destructive.length) * 100).toFixed(1)}% |`);
console.log(`| Non-Compliant | ${noCompliance.length} | ${((noCompliance.length / destructive.length) * 100).toFixed(1)}% |`);
console.log(`| **Total** | **${destructive.length}** | **100%** |\n`);

// ============================================================================
// ARRAY PARAMETER TOOLS AUDIT
// ============================================================================
console.log('---\n');
console.log('## Part 2: Array Parameter Tools (C2 Pattern)\n');

const withArrays = results.filter(r => r.hasArrayParams);
console.log(`**Total tools with array parameters**: ${withArrays.length}\n`);

if (withArrays.length > 0) {
  console.log('### Tools Using forEach Pattern\n');
  withArrays.forEach(r => {
    console.log(`- ${r.file}`);
    console.log(`  - Arrays: ${r.arrayParams?.join(', ')}`);
    if (r.isDestructive) {
      console.log(`  - ⚠️ Also a destructive tool`);
    }
  });
  console.log('');
} else {
  console.log('*No tools found using forEach on array parameters.*\n');
  console.log('**This suggests**:');
  console.log('- Either array parameters are not commonly used in current handlers');
  console.log('- Or C2 pattern was already adopted project-wide');
  console.log('- Or handlers use different patterns (join, spread, etc.)\n');
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================
console.log('---\n');
console.log('## Recommendations\n');

console.log('### C4 Pattern Adoption Priority\n');
console.log(`1. **High Priority** (${noCompliance.length} tools): Implement full C4 pattern (confirm + validation + audit)`);
console.log(`   - Effort estimate: ${noCompliance.length} tools × 0.25 days = ${(noCompliance.length * 0.25).toFixed(1)} days\n`);

console.log(`2. **Medium Priority** (${partialCompliant.length} tools): Complete missing C4 components`);
console.log(`   - Effort estimate: ${partialCompliant.length} tools × 0.15 days = ${(partialCompliant.length * 0.15).toFixed(1)} days\n`);

console.log(`3. **Total C4 Effort**: ${((noCompliance.length * 0.25) + (partialCompliant.length * 0.15)).toFixed(1)} days\n`);

if (withArrays.length > 0) {
  console.log('### C2 Pattern Verification\n');
  console.log(`- ${withArrays.length} tools already use forEach pattern`);
  console.log(`- **Action**: Manual review to verify correctness`);
  console.log(`- **Effort**: ${withArrays.length} tools × 0.1 days = ${(withArrays.length * 0.1).toFixed(1)} days\n`);
} else {
  console.log('### C2 Pattern Investigation\n');
  console.log(`- No forEach usage found in current handlers`);
  console.log(`- **Action**: Check if array parameters exist but use different patterns`);
  console.log(`- **Next Step**: Search for array parameter definitions in tool schemas\n`);
}

console.log('---\n');
console.log('**Audit Complete**');
console.log('**Next Steps**:');
console.log('1. Review findings');
console.log('2. Test dependency detection feasibility (separate script)');
console.log('3. Create realistic pattern adoption plan based on these numbers');
