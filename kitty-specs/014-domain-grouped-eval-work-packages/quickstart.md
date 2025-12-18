# Quickstart: Domain-Grouped Eval Work Packages

**Feature**: 014-domain-grouped-eval-work-packages
**Created**: 2025-12-18

## Overview

This guide walks you through executing all 116 MCP tool evaluations and generating the post-014 baseline coverage report.

---

## Prerequisites

- Feature 013 completed (116 eval prompt JSON files exist in `evals/prompts/`)
- Feature 010 aggregation scripts exist (`evals/scripts/`)
- Spec Kitty CLI available
- Access to `mittwald-mcp-fly2.fly.dev` via OAuth

---

## Step 1: Generate Work Package Files

Run the task generation command to create 12 domain WP files:

```bash
cd /Users/robert/Code/mittwald-mcp/.worktrees/014-domain-grouped-eval-work-packages
/spec-kitty.tasks
```

**Expected Output**:
- `kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP-01-access-users.md`
- `kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP-02-apps.md`
- ... (10 more domain WPs)
- `kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP-13-aggregate-results.md`

**Validation**:
```bash
ls kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP-*.md | wc -l
# Should output: 13 (12 domain WPs + 1 aggregation WP)
```

---

## Step 2: Execute Tier 0 Evals (No Dependencies)

Start with domains that have tier-0 tools (no prerequisites):

```bash
# Execute identity domain (tier 0 tools)
/spec-kitty.implement kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP-09-identity.md

# Execute organization domain (tier 0 tools)
/spec-kitty.implement kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP-11-organization.md

# Execute context domain (tier 0 tools)
/spec-kitty.implement kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP-06-context.md
```

**Expected Results**: Self-assessment JSON files saved to:
- `evals/results/identity/*.json`
- `evals/results/organization/*.json`
- `evals/results/context/*.json`

---

## Step 3: Execute Project Foundation (Creates Project for Tier 4)

```bash
/spec-kitty.implement kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP-12-project-foundation.md
```

**Critical**: This creates a project that tier-4 tools depend on.

**Expected Results**:
- `evals/results/project-foundation/*.json`
- Project ID captured in self-assessments (e.g., `p-abc123`)

---

## Step 4: Execute Remaining Domains (Tier 1-4)

Now execute the remaining 8 domain WPs (can be run in any order):

```bash
/spec-kitty.implement kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP-01-access-users.md
/spec-kitty.implement kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP-02-apps.md
/spec-kitty.implement kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP-03-automation.md
/spec-kitty.implement kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP-04-backups.md
/spec-kitty.implement kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP-05-containers.md
/spec-kitty.implement kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP-07-databases.md
/spec-kitty.implement kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP-08-domains-mail.md
/spec-kitty.implement kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP-10-misc.md
```

**Tip**: You can run these in parallel in separate terminal sessions.

---

## Step 5: Aggregate Results

After all domain WPs complete, run the aggregation WP:

```bash
/spec-kitty.implement kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP-13-aggregate-results.md
```

Or manually run the aggregation script:

```bash
cd /Users/robert/Code/mittwald-mcp
npx tsx evals/scripts/generate-coverage-report.ts evals/results evals/inventory/tools-current.json evals/results
```

**Expected Output**:
- `evals/results/coverage-report.json` (machine-readable)
- `evals/results/baseline-report.md` (human-readable)

---

## Step 6: Review Baseline

Open the baseline report:

```bash
cat evals/results/baseline-report.md
```

**Key Metrics to Check**:
- **Total Execution**: Should be 116/116 tools
- **Success Rate**: Percentage of passing evals
- **Domain Breakdown**: Per-domain success rates
- **Tier Breakdown**: Per-tier success rates
- **Problem Summary**: Categorized failures (auth_error, api_error, etc.)

---

## Verification Checklist

After completing all steps:

- [ ] 116 self-assessment files exist in `evals/results/*/`
- [ ] `coverage-report.json` shows `"total_tools": 116`
- [ ] `coverage-report.json` shows `"executed_count": 116`
- [ ] `baseline-report.md` exists and is readable
- [ ] No eval has `confidence: "low"` without investigation
- [ ] Failures are categorized and documented

---

## Troubleshooting

### Problem: Self-assessment not saved

**Symptom**: Agent completes eval but no result file appears in `evals/results/`

**Solution**:
1. Check WP prompt includes save instruction
2. Verify agent has write permissions to `evals/results/`
3. Re-run the specific eval from the WP

### Problem: MCP tool call fails with auth error

**Symptom**: Self-assessment shows `problem_type: "auth_error"`

**Solution**:
1. Verify OAuth connection to `mittwald-mcp-fly2.fly.dev`
2. Check JWT secret synchronization (see CLAUDE.md)
3. Re-run eval after authentication is fixed

### Problem: Coverage report shows <116 tools

**Symptom**: `executed_count` is less than 116

**Solution**:
1. Count result files: `find evals/results -name "*.json" -type f | wc -l`
2. Identify missing results: Compare against `evals/inventory/tools-current.json`
3. Re-run WPs for domains with missing results

### Problem: Aggregation script fails

**Symptom**: `generate-coverage-report.ts` errors

**Solution**:
1. Check all self-assessments are valid JSON: `jq empty evals/results/*/*.json`
2. Verify tool inventory exists: `ls evals/inventory/tools-current.json`
3. Check script compatibility (feature 010 version vs current results format)

---

## Next Steps

After establishing the baseline:

1. **Document Failures**: Investigate any failing evals, categorize root causes
2. **Create Issues**: Open issues for MCP server bugs discovered during evals
3. **Track Trends**: Re-run evals periodically to track regression/improvement
4. **Compare Baselines**: Compare feature 014 baseline against future runs

---

## Quick Reference

**Generate WPs**:
```bash
/spec-kitty.tasks
```

**Execute a domain**:
```bash
/spec-kitty.implement kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP-{N}-{domain}.md
```

**Check progress**:
```bash
find evals/results -name "*.json" -type f | wc -l  # Should reach 116
```

**Aggregate results**:
```bash
npx tsx evals/scripts/generate-coverage-report.ts
```

**View baseline**:
```bash
cat evals/results/baseline-report.md
```
