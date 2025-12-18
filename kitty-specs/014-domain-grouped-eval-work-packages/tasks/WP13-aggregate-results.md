---
work_package_id: WP13
title: "Aggregate Results and Generate Baseline Report"
lane: "done"
status: planned
priority: P2
subtasks:
  - T037: Validate all 115 result files exist
  - T038: Run aggregation scripts
  - T039: Generate coverage reports
  - T040: Review baseline report
history:
  - timestamp: "2025-12-18T23:59:00Z"
    event: "created"
    agent: "planning-agent"
---

# Work Package: Aggregate Results and Generate Baseline Report

**Priority**: P2
**Dependencies**: WP01-WP12 (all domain evals must complete first)

## Objective

Aggregate all 115 self-assessments into comprehensive coverage reports showing success rates, problem patterns, and domain/tier breakdowns.

## Context

This is the final phase of feature 014. After all domain WPs execute, we run feature 010's aggregation scripts to produce:
- `coverage-report.json` (machine-readable metrics)
- `baseline-report.md` (human-readable analysis)

These reports establish the post-014 baseline for future MCP server health comparisons.

## Subtasks

### T037: Validate All 115 Result Files Exist

**Goal**: Verify every eval produced a self-assessment file before running aggregation.

**Steps**:
1. Count result files across all domains:
   ```bash
   find evals/results -name "*-result.json" -type f | wc -l
   ```
   Expected: 115

2. List files by domain:
   ```bash
   for domain in access-users apps automation backups containers context databases domains-mail identity misc organization project-foundation; do
     count=$(ls evals/results/$domain/*.json 2>/dev/null | wc -l)
     echo "$domain: $count files"
   done
   ```

3. If count != 115:
   - Identify missing domains: Compare expected counts from tasks.md
   - Document which WPs need re-execution
   - STOP and resolve before proceeding to aggregation

**Definition of Done**:
- [ ] Total file count equals 115
- [ ] All 12 domain directories exist in `evals/results/`
- [ ] No missing result files

---

### T038: Run Aggregation Scripts

**Goal**: Execute feature 010's aggregation scripts to process all self-assessments.

**Steps**:
1. Verify aggregation scripts exist:
   ```bash
   ls evals/scripts/generate-coverage-report.ts
   ```

2. Run aggregation:
   ```bash
   npx tsx evals/scripts/generate-coverage-report.ts \
     evals/results \
     evals/inventory/tools-current.json \
     evals/results
   ```

   This reads all `evals/results/*/*.json` files and produces:
   - `evals/results/coverage-report.json`
   - `evals/results/baseline-report.md`

3. If aggregation fails:
   - Check script compatibility with result file structure
   - Verify all result files contain valid JSON
   - Validate against feature 010 schema
   - Fix issues and re-run

**Definition of Done**:
- [ ] Aggregation script runs without errors
- [ ] `coverage-report.json` generated
- [ ] `baseline-report.md` generated

---

### T039: Validate Coverage Reports

**Goal**: Verify generated reports contain expected metrics and structure.

**Steps**:
1. Check `coverage-report.json` structure:
   ```bash
   jq '{total_tools, executed_count, success_count, failure_count, success_rate}' \
     evals/results/coverage-report.json
   ```

   Expected:
   - `total_tools`: 115
   - `executed_count`: 115
   - `success_count`: (varies)
   - `failure_count`: (varies)
   - `success_rate`: (percentage)

2. Verify domain breakdown exists:
   ```bash
   jq '.domain_breakdown | length' evals/results/coverage-report.json
   ```
   Expected: 12 domains

3. Verify tier breakdown exists:
   ```bash
   jq '.tier_breakdown | length' evals/results/coverage-report.json
   ```
   Expected: 5 tiers (0-4)

4. Check `baseline-report.md` is readable:
   ```bash
   head -50 evals/results/baseline-report.md
   ```

**Definition of Done**:
- [ ] `coverage-report.json` shows 115/115 tools executed
- [ ] Domain breakdown contains 12 domains
- [ ] Tier breakdown contains 5 tiers
- [ ] `baseline-report.md` is human-readable

---

### T040: Review and Document Baseline

**Goal**: Analyze the baseline report to understand MCP server health.

**Steps**:
1. Review success rate:
   ```bash
   jq '.success_rate' evals/results/coverage-report.json
   ```

   Document: What is the overall success rate?

2. Identify failing tools:
   ```bash
   jq '.problem_summary' evals/results/coverage-report.json
   ```

   Document:
   - How many tools failed?
   - What are the primary problem types? (auth_error, api_error, etc.)
   - Which tools are affected?

3. Review domain-specific insights:
   ```bash
   jq '.domain_breakdown[]' evals/results/coverage-report.json
   ```

   Document:
   - Which domains have lowest success rates?
   - Are there domain-specific patterns?

4. Create summary:
   - Overall success rate: X%
   - Top 3 problem types
   - Domains needing attention
   - Recommendations for fixing failures

**Definition of Done**:
- [ ] Success rate documented
- [ ] Problem types categorized and counted
- [ ] Domain-specific insights captured
- [ ] Recommendations for failure remediation documented

---

## Troubleshooting

### Issue: Result file count < 115

**Solution**:
1. Run: `find evals/results -name "*-result.json" -type f | sort`
2. Compare against expected list in tasks.md
3. Identify missing domain WPs
4. Re-execute incomplete WPs
5. Re-run aggregation after all results present

### Issue: Aggregation script fails with schema error

**Solution**:
1. Validate one result file manually:
   ```bash
   jq empty evals/results/identity/user-get-result.json
   ```
2. Check for required fields: success, confidence, tool_executed, timestamp
3. Fix malformed files
4. Re-run aggregation

### Issue: Coverage report shows unexpected metrics

**Solution**:
1. Verify tool inventory is current:
   ```bash
   jq '.tool_count' evals/inventory/tools-current.json
   ```
   Should be 115 (or 116 depending on actual count)
2. Check for duplicate result files
3. Validate domain classification in inventory matches results structure

---

## Definition of Done

- [ ] All 115 result files validated
- [ ] Aggregation scripts run successfully
- [ ] `coverage-report.json` exists with valid metrics
- [ ] `baseline-report.md` exists and is readable
- [ ] Report shows 115/115 tools executed
- [ ] Domain and tier breakdowns present
- [ ] Problem categorization complete
- [ ] Baseline analysis documented
- [ ] Post-014 baseline established

---

## Next Steps

After this WP completes:
1. Document baseline in feature summary
2. Create issues for any MCP server bugs discovered
3. Use baseline for future regression tracking
4. Compare future eval runs against this baseline

## Activity Log

- 2025-12-18T23:28:34Z – agent – lane=doing – Started implementation via workflow command
- 2025-12-18T23:33:41Z – unknown – lane=for_review – Baseline aggregation complete. Generated coverage-report.json and baseline-report.md from all 115 result files. Overall success rate: 53.0% (61/115). Created comprehensive baseline-analysis.md documenting findings, problem patterns, and recommendations. Key finding: org/list ID exposure bug blocks 6 downstream tools.
- 2025-12-18T23:39:14Z – unknown – lane=done – Feature 014 complete
