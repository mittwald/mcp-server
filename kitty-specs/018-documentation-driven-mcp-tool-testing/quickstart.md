# Quickstart: Documentation-Driven MCP Tool Testing

**Feature**: 018-documentation-driven-mcp-tool-testing
**Date**: 2026-01-27
**Audience**: Maintainers running scenario-based tool validation

## Overview

This guide shows how to:
1. Run scenario tests to validate MCP tools
2. Generate coverage reports
3. Identify and fix uncovered tools
4. Interpret failure patterns

**Prerequisites**:
- Node.js >= 24.11.0
- Claude Code CLI installed and configured
- Mittwald test account with OAuth access

---

## Quick Start (3 Commands)

### 1. Run a Single Scenario

```bash
tsx evals/scripts/scenario-runner.ts freelancer-onboarding
```

**What this does**:
- Loads scenario definition from `evals/scenarios/case-studies/freelancer-onboarding.json`
- Spawns Claude Code CLI with scenario prompts
- Tracks MCP tool calls via server logging
- Validates outcome against success criteria
- Cleans up test resources
- Saves result to `evals/results/scenarios/latest/`

**Expected output**:
```
[INFO] Loading scenario: freelancer-onboarding
[INFO] Executing prompt 1/4: "Create a new Mittwald project..."
[INFO] Tool called: mittwald_project_create
[INFO] Executing prompt 2/4: "Install WordPress..."
[INFO] Tool called: mittwald_app_install
[SUCCESS] Scenario completed in 45.2s
[INFO] Tools validated: mittwald_project_create, mittwald_app_install, mittwald_backup_schedule_create
[INFO] Cleanup performed: 3 resources deleted
```

### 2. Generate Coverage Report

```bash
tsx evals/scripts/generate-coverage-report.ts --format both
```

**What this does**:
- Reads all scenario execution results from `evals/results/scenarios/latest/`
- Aggregates tool validation status (115 tools)
- Clusters failure patterns
- Outputs:
  - `evals/reports/coverage-full.json` (machine-readable)
  - `evals/reports/coverage-summary.md` (human-readable)

**Expected output**:
```
Coverage Report Generated
=========================
Total Tools: 115
Validated: 92 (80.0%)
Failed: 8 (7.0%)
Not Tested: 15 (13.0%)

Top Domains:
- app: 7/8 validated (87.5%)
- project: 8/10 validated (80.0%)
- database: 12/14 validated (85.7%)

Failure Patterns: 3 detected
- oauth-scope-missing-a3f5b1: 3 scenarios affected
- timeout-4d8f3a: 2 scenarios affected

Full report: evals/reports/coverage-summary.md
```

### 3. Identify Uncovered Tools

```bash
tsx evals/scripts/gap-analysis.ts
```

**What this does**:
- Compares tools used in scenarios vs complete tool inventory (115 tools)
- Identifies tools not exercised by any scenario
- Outputs `evals/coverage/gap-analysis.json` with recommendations

**Expected output**:
```
Gap Analysis
============
Uncovered Tools: 15/115 (13.0%)

Recommendations:
1. container/stop - Create custom scenario for container lifecycle
2. domain/dns-zone-update - Create custom scenario for DNS management
3. mail/address-delete - Add to case study: "E-commerce Launch Day"

Gap analysis report: evals/coverage/gap-analysis.json
```

---

## Detailed Workflows

### Run All Case Study Scenarios

Execute all 10 case study workflows:

```bash
tsx evals/scripts/run-all-scenarios.ts --type case-studies
```

**Options**:
- `--type case-studies` - Run only case study scenarios
- `--type custom` - Run only custom gap-filling scenarios
- `--parallel 3` - Run 3 scenarios concurrently (default: 1)
- `--keep-resources` - Skip cleanup for debugging

**Example with options**:
```bash
tsx evals/scripts/run-all-scenarios.ts --type case-studies --parallel 2
```

**Duration**: ~60-90 minutes for all 10 case studies (sequential)

---

### Re-run Failed Scenarios Only

After fixing a failure pattern, re-run only scenarios that failed:

```bash
tsx evals/scripts/retry-failures.ts
```

**What this does**:
- Reads latest run results
- Identifies scenarios with `status: 'failure'`
- Re-executes only those scenarios
- Updates coverage report

**Example output**:
```
Retry Failed Scenarios
======================
Found 2 failed scenarios:
1. agency-multi-project (oauth-scope-missing)
2. cicd-pipeline (timeout)

Re-running scenario 1/2: agency-multi-project
[SUCCESS] Passed on retry!

Re-running scenario 2/2: cicd-pipeline
[FAILURE] Still failing (timeout-4d8f3a)

Results: 1 fixed, 1 still failing
```

---

### Create Custom Scenario for Uncovered Tool

For tools not exercised by case studies, create minimal custom scenarios:

**1. Create scenario JSON file**:

```json
// evals/scenarios/custom/container-stop.json
{
  "id": "container-stop-lifecycle",
  "name": "Container Stop Lifecycle Test",
  "prompts": [
    "Create a new project for container testing",
    "Create a Node.js container in that project",
    "Stop the container we just created",
    "Verify the container is stopped"
  ],
  "success_criteria": {
    "resources_created": { "project": 1, "container": 1 },
    "resources_configured": { "container_status": "stopped" }
  },
  "cleanup": [
    "Delete the container",
    "Delete the project"
  ],
  "expected_tools": [
    "mittwald_project_create",
    "mittwald_container_create",
    "mittwald_container_stop",
    "mittwald_container_get"
  ],
  "tags": ["custom", "container", "gap-filling"]
}
```

**2. Validate schema**:

```bash
npx ajv validate \
  -s kitty-specs/018-documentation-driven-mcp-tool-testing/contracts/scenario-definition.schema.json \
  -d evals/scenarios/custom/container-stop.json
```

**3. Run custom scenario**:

```bash
tsx evals/scripts/scenario-runner.ts container-stop-lifecycle
```

---

### Debug a Failed Scenario

When a scenario fails, inspect the full execution log:

**1. Find the result file**:

```bash
ls -lh evals/results/scenarios/latest/*-failure.json
```

**2. Read failure details**:

```bash
cat evals/results/scenarios/latest/agency-multi-project-failure.json
```

**Example output**:
```json
{
  "scenario_id": "agency-multi-project",
  "status": "failure",
  "failure_details": {
    "failed_tool": "mittwald_project_create",
    "error_message": "Missing OAuth scope: project:write",
    "error_code": "OAUTH_SCOPE_MISSING",
    "context": {
      "requested_scopes": ["user:read", "customer:read"],
      "required_scope": "project:write"
    }
  },
  "log_file_path": "evals/results/scenarios/run-20260127-142345/agency-multi-project.log"
}
```

**3. View full execution log**:

```bash
cat evals/results/scenarios/latest/agency-multi-project.log
```

**4. Check failure pattern**:

```bash
jq '.[] | select(.pattern_id == "oauth-scope-missing-a3f5b1")' evals/coverage/failure-patterns.json
```

---

## Understanding Coverage Reports

### JSON Report (`coverage-full.json`)

**Machine-readable format** for programmatic analysis:

```json
{
  "total_tools": 115,
  "validated_tools": 92,
  "validation_rate": 80.0,
  "tools_by_status": {
    "success": ["mittwald_app_list", "mittwald_app_create", "..."],
    "failed": ["mittwald_project_create"],
    "not_tested": ["mittwald_container_stop", "..."]
  },
  "coverage_by_domain": {
    "app": { "total": 8, "validated": 7, "rate": 87.5 }
  }
}
```

**Use cases**:
- CI/CD integration (fail if `validation_rate < 80`)
- Trend analysis (track coverage over time)
- Dashboard visualization

### Markdown Report (`coverage-summary.md`)

**Human-readable format** for documentation and PRs:

```markdown
# MCP Tool Coverage Report

**Generated**: 2026-01-27 14:23:45
**Run ID**: run-20260127-142345

## Summary

| Metric | Count | Percentage |
|--------|-------|------------|
| Total Tools | 115 | 100% |
| Validated | 92 | 80.0% |
| Failed | 8 | 7.0% |
| Not Tested | 15 | 13.0% |

## Coverage by Domain

| Domain | Total | Validated | Rate |
|--------|-------|-----------|------|
| app | 8 | 7 | 87.5% |
| project | 10 | 8 | 80.0% |

## Failure Patterns

### oauth-scope-missing-a3f5b1 (3 occurrences)

**Root Cause**: Missing OAuth scope for mittwald_project_create

**Affected Scenarios**:
- agency-multi-project
- developer-onboarding
- cicd-pipeline

**Recommended Fix**: Update OAuth client to request `project:write` scope
```

---

## Interpreting Failure Patterns

Failure patterns cluster related errors by root cause. Use them to fix systemic issues:

### Pattern: oauth-scope-missing

**Symptoms**:
- Error: "Required scope 'X' not granted"
- HTTP 403 responses
- Tool: Any `_create`, `_update`, or `_delete` tool

**Fix**:
1. Check `packages/oauth-bridge/src/config/mittwald-scopes.ts`
2. Add missing scope to `MITTWALD_SCOPE_STRING`
3. Update test account OAuth registration
4. Re-run failed scenarios

### Pattern: timeout

**Symptoms**:
- Error: "Request timeout after 30s"
- Tool: Database operations, app installations

**Fix**:
1. Check network connectivity
2. Increase timeout in `src/constants.ts`
3. Verify Mittwald API status
4. Re-run with `--keep-resources` to inspect state

### Pattern: resource-not-found

**Symptoms**:
- Error: "Project/App/DB not found"
- HTTP 404 responses
- Tool: Any `_get`, `_update`, or `_delete` tool

**Fix**:
1. Check if previous scenario cleaned up resources
2. Verify resource ID format in prompts
3. Add explicit "wait for resource creation" step
4. Check fixture sharing logic

---

## Advanced Usage

### Parallel Execution (Experimental)

Run multiple scenarios concurrently:

```bash
tsx evals/scripts/run-all-scenarios.ts --type case-studies --parallel 3
```

**Caveats**:
- Requires sufficient test account quotas
- May cause resource contention
- Claude Code CLI must support multiple sessions

### Dry Run (No Execution)

Validate scenario definitions without executing:

```bash
tsx evals/scripts/scenario-runner.ts freelancer-onboarding --dry-run
```

**What this does**:
- Loads and validates scenario JSON
- Checks prompt syntax
- Verifies expected tools exist
- Does NOT execute prompts or call MCP tools

### Keep Resources for Debugging

Skip cleanup to inspect resources manually:

```bash
tsx evals/scripts/scenario-runner.ts freelancer-onboarding --keep-resources
```

**Warning**: You must manually delete resources:
```bash
tsx evals/scripts/cleanup-resources.ts --run-id run-20260127-142345
```

---

## Integration with Feature 014 Evals

This feature extends Feature 014's eval framework:

### Ensure Feature 014 Evals Still Pass

After running scenario tests, verify tool-level evals still pass:

```bash
# Run Feature 014 domain evals
npx tsx evals/scripts/generate-multi-run-report.ts

# Check for regressions
jq '.summary.overall_success_rate' evals/results/multi-run-report.json
```

**Expected**: >80% success rate (same as baseline)

### Fixture Sharing

Scenarios can reference Feature 014 fixtures for resource IDs:

```typescript
// evals/scripts/scenario-runner.ts
import { loadFixtures } from '../fixtures/loader.ts';

const fixtures = loadFixtures();
const projectId = fixtures.project?.id;

// Use in scenario prompts
const prompt = `List apps in project ${projectId}`;
```

---

## Troubleshooting

### Scenario Fails with "Claude Code CLI not found"

**Solution**: Install Claude Code CLI:
```bash
npm install -g @anthropics/claude-code
```

### Scenario Fails with "OAuth token expired"

**Solution**: Refresh OAuth token:
```bash
tsx evals/scripts/refresh-oauth-token.ts
```

### Scenario Times Out

**Solution**: Increase timeout in scenario definition:
```json
{
  "timeout_ms": 120000  // 2 minutes (default: 60000)
}
```

### Cleanup Fails

**Solution**: Manually delete resources:
```bash
# List resources from failed run
jq '.resources_created' evals/results/scenarios/latest/*-failure.json

# Delete manually via Mittwald CLI
mw project delete --project-id p-abc123
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Scenario Tests

on:
  push:
    branches: [main]
  pull_request:

jobs:
  scenario-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '24'

      - name: Install dependencies
        run: npm ci

      - name: Run case study scenarios
        run: tsx evals/scripts/run-all-scenarios.ts --type case-studies

      - name: Generate coverage report
        run: tsx evals/scripts/generate-coverage-report.ts --format both

      - name: Check coverage threshold
        run: |
          RATE=$(jq '.validation_rate' evals/reports/coverage-full.json)
          if (( $(echo "$RATE < 80" | bc -l) )); then
            echo "Coverage below 80%: $RATE"
            exit 1
          fi

      - name: Upload coverage report
        uses: actions/upload-artifact@v3
        with:
          name: coverage-report
          path: evals/reports/
```

---

## Next Steps

After validating tools with scenarios:

1. **Update Documentation**: Rewrite case studies with human-centric format (Priority P3)
2. **Add Failure Monitoring**: Set up alerts for failure patterns (Priority P4)
3. **Expand Custom Scenarios**: Cover remaining 20% of uncovered tools
4. **Automate Regression Testing**: Run scenarios on every MCP server deploy

---

## Reference

- **Spec**: [spec.md](spec.md)
- **Plan**: [plan.md](plan.md)
- **Data Model**: [data-model.md](data-model.md)
- **Research**: [research.md](research.md)
- **Contracts**: [contracts/](contracts/)
