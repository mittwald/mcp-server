# Multi-Run Evaluation System Guide

## Overview

The multi-run evaluation system allows you to execute the 014 eval set multiple times, capture each result set individually, and compare results across runs. This enables tracking improvements, identifying regressions, and analyzing trends over time.

## Architecture

### Directory Structure

```
evals/
├── results/
│   ├── runs/
│   │   ├── index.json                    # Run registry
│   │   ├── run-20251219-120000/          # Example run directory
│   │   │   ├── metadata.json             # Run metadata
│   │   │   ├── coverage-report.json      # Generated report
│   │   │   ├── baseline-report.md        # Human-readable report
│   │   │   ├── access-users/             # Domain result directories
│   │   │   │   └── *.json
│   │   │   ├── apps/
│   │   │   │   └── *.json
│   │   │   └── ...
│   │   └── run-20251219-130000/
│   │       └── ...
│   └── active -> runs/run-20251219-120000  # Symlink to active run
├── prompts/                              # Eval prompt JSON files (input)
└── scripts/
    ├── run-manager.ts                    # Run lifecycle management
    ├── generate-multi-run-report.ts      # Multi-run coverage reports
    └── save-eval-result.ts               # Helper for saving results

```

### Key Concepts

- **Run**: A complete execution of the eval suite with unique ID, metadata, and isolated result storage
- **Active Run**: The currently selected run where new eval results are saved (managed via symlink)
- **Run Metadata**: Tracks run status, summary statistics, tags, and environment info
- **Run Index**: Central registry (`index.json`) tracking all runs
- **Run Comparison**: Diff report showing improvements/regressions between two runs

## Workflow

### 1. Create a New Run

```bash
# Create a new run with metadata
npx tsx evals/scripts/run-manager.ts create \
  --name "baseline-v1" \
  --description "Initial baseline after feature 014" \
  --tags "baseline,post-014" \
  --set-active

# Output:
# Created run: run-20251219-120000
# Name: baseline-v1
# Description: Initial baseline after feature 014
# Directory: evals/results/runs/run-20251219-120000
# Active run set to: run-20251219-120000
```

**Arguments:**
- `--name`: Human-readable run name (required)
- `--description`: Detailed description (optional)
- `--tags`: Comma-separated tags for filtering (optional)
- `--set-active`: Automatically set as active run (optional)

### 2. Execute Evals

With an active run set, execute the WP files as normal:

```bash
# Execute domain-specific WPs
/spec-kitty.implement kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP01-identity.md
/spec-kitty.implement kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP02-organization.md
# ... continue for all WPs

# Or execute all at once (if supported)
for wp in kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP*.md; do
  /spec-kitty.implement "$wp"
done
```

**Important**: Agents should save results using the active run automatically. If manual saving is needed:

```bash
# Save individual eval result to active run
npx tsx evals/scripts/save-eval-result.ts \
  --tool app-list \
  --domain apps \
  --result /path/to/result.json

# Or inline JSON
npx tsx evals/scripts/save-eval-result.ts \
  --tool app-list \
  --domain apps \
  --json '{"success": true, "tool_executed": "mcp__mittwald__mittwald_app_list", ...}'
```

### 3. Generate Coverage Report

After executing all evals, generate the coverage report:

```bash
# Generate report for active run
npx tsx evals/scripts/generate-multi-run-report.ts

# Generate report for specific run
npx tsx evals/scripts/generate-multi-run-report.ts run-20251219-120000

# Output:
# Generating coverage report for run: run-20251219-120000
# Found 116 assessments for 116 tools
# JSON report written to: evals/results/runs/run-20251219-120000/coverage-report.json
# Markdown report written to: evals/results/runs/run-20251219-120000/baseline-report.md
# ✅ Report generated for run: run-20251219-120000
#    Success rate: 87.9%
#    Executed: 102/116
```

This automatically updates the run metadata with summary statistics and marks the run as `completed`.

### 4. View All Runs

```bash
npx tsx evals/scripts/run-manager.ts list

# Output:
# === Evaluation Runs ===
#
# Total runs: 3
# Active run: run-20251219-120000
#
# ➜ ✅ run-20251219-120000
#    Name: baseline-v1
#    Status: completed
#    Created: 2025-12-19T12:00:00.000Z
#    Results: 102/116 (87.9%)
#    Tags: baseline, post-014
#
#   🔵 run-20251219-130000
#    Name: optimization-test-v1
#    Status: in_progress
#    Created: 2025-12-19T13:00:00.000Z
#    Results: 45 evals executed
#    Tags: optimization
```

### 5. Compare Runs

Compare two runs to identify improvements and regressions:

```bash
npx tsx evals/scripts/run-manager.ts compare run-20251219-120000 run-20251219-130000

# Output:
# === Run Comparison ===
#
# Run A: run-20251219-120000
# Run B: run-20251219-130000
# Generated: 2025-12-19T14:00:00.000Z
#
# Summary:
#   ✅ Improved: 8
#   ❌ Regressed: 2
#   ➡️  Unchanged: 92
#   🆕 New in B: 0
#   ⚠️  Missing in B: 14
#
# 🚨 Regressions:
#   - mcp__mittwald__mittwald_database_mysql_create (databases)
#   - mcp__mittwald__mittwald_cronjob_execute (automation)
#
# 🎉 Improvements:
#   - mcp__mittwald__mittwald_user_get (identity)
#   - mcp__mittwald__mittwald_app_list (apps)
#   ...
#
# Comparison saved to: evals/results/runs/comparison-run-20251219-120000-vs-run-20251219-130000.json
```

### 6. Switch Active Run

```bash
# Switch to a different run
npx tsx evals/scripts/run-manager.ts set-active run-20251219-130000

# Output:
# Active run set to: run-20251219-130000
# Name: optimization-test-v1
# Symlink: evals/results/active -> evals/results/runs/run-20251219-130000

# Get current active run
npx tsx evals/scripts/run-manager.ts get-active
```

## Run Status Lifecycle

Runs progress through these states:

1. **`in_progress`**: Run created, evals being executed
2. **`completed`**: All evals executed, report generated
3. **`failed`**: Run encountered fatal errors
4. **`archived`**: Old run archived for historical reference

Update status manually:

```bash
npx tsx evals/scripts/run-manager.ts update-status run-20251219-120000 archived
```

## Use Cases

### Baseline Establishment

```bash
# Create baseline run
npx tsx evals/scripts/run-manager.ts create \
  --name "baseline-post-014" \
  --description "Initial baseline after feature 014 completion" \
  --tags "baseline" \
  --set-active

# Execute all evals
# ... (WP execution)

# Generate report
npx tsx evals/scripts/generate-multi-run-report.ts
```

### Testing Changes

```bash
# Create test run
npx tsx evals/scripts/run-manager.ts create \
  --name "test-oauth-fix" \
  --description "Testing OAuth token refresh fix" \
  --tags "test,oauth" \
  --set-active

# Execute evals
# ...

# Generate report and compare
npx tsx evals/scripts/generate-multi-run-report.ts
npx tsx evals/scripts/run-manager.ts compare baseline-post-014 run-20251219-130000
```

### Regression Testing

```bash
# After deploying changes, create new run
npx tsx evals/scripts/run-manager.ts create \
  --name "post-deploy-2025-12-20" \
  --description "Regression test after deploy" \
  --tags "deploy,regression" \
  --set-active

# Execute and compare with last stable
npx tsx evals/scripts/generate-multi-run-report.ts
npx tsx evals/scripts/run-manager.ts compare last-stable-run post-deploy-2025-12-20
```

### Performance Tracking

```bash
# Create series of runs with different configs
for config in baseline optimized cached; do
  npx tsx evals/scripts/run-manager.ts create \
    --name "perf-test-$config" \
    --description "Performance test with $config configuration" \
    --tags "performance,$config" \
    --set-active

  # Execute evals
  # ...

  npx tsx evals/scripts/generate-multi-run-report.ts
done

# Compare all performance runs
npx tsx evals/scripts/run-manager.ts compare perf-test-baseline perf-test-optimized
npx tsx evals/scripts/run-manager.ts compare perf-test-optimized perf-test-cached
```

## Integration with WP Execution

### Updating WP Prompts

When generating WP files, include instructions for agents to save to active run:

```markdown
### Eval: app/list

**Tool**: `mcp__mittwald__mittwald_app_list`

**Goal**: List all apps in the default project context.

**Test Instructions**:
1. CALL the MCP tool `mcp__mittwald__mittwald_app_list` directly
2. Verify the response includes a list of apps
3. Generate self-assessment JSON

**After Completion**:
Save your self-assessment immediately using:
\`\`\`bash
npx tsx evals/scripts/save-eval-result.ts --tool app-list --domain apps --json '<your-json>'
\`\`\`
```

### Automated Saving in Agents

Agents should be configured to automatically detect the active run and save results there during execution.

## Advanced Features

### Filtering Runs

```bash
# List only completed runs
npx tsx evals/scripts/run-manager.ts list --status completed

# List runs with specific tag
npx tsx evals/scripts/run-manager.ts list --tag baseline
```

### Run Metadata Fields

Each run's `metadata.json` contains:

```json
{
  "run_id": "run-20251219-120000",
  "name": "baseline-v1",
  "description": "Initial baseline after feature 014",
  "created_at": "2025-12-19T12:00:00.000Z",
  "completed_at": "2025-12-19T14:30:00.000Z",
  "status": "completed",
  "domains_executed": ["identity", "apps", "databases", ...],
  "total_evals_executed": 102,
  "summary": {
    "total_success": 90,
    "total_failure": 12,
    "success_rate": 88.2
  },
  "tags": ["baseline", "post-014"],
  "environment": {
    "mcp_server_url": "https://mittwald-mcp-fly2.fly.dev/mcp",
    "oauth_bridge_url": "https://mittwald-oauth-server.fly.dev"
  },
  "notes": "..."
}
```

### Comparison Report Structure

Comparison JSON (`comparison-runA-vs-runB.json`):

```json
{
  "run_a": "run-20251219-120000",
  "run_b": "run-20251219-130000",
  "generated_at": "2025-12-19T15:00:00.000Z",
  "summary": {
    "improved": 8,
    "regressed": 2,
    "unchanged": 92,
    "new_in_b": 0,
    "missing_in_b": 14
  },
  "differences": [
    {
      "tool": "mcp__mittwald__mittwald_app_list",
      "domain": "apps",
      "run_a_success": false,
      "run_b_success": true,
      "change_type": "improved",
      "notes": "..."
    }
  ]
}
```

## Troubleshooting

### No Active Run Set

```
Error: No active run set and no --run specified
```

**Solution**: Create and activate a run:
```bash
npx tsx evals/scripts/run-manager.ts create --name "my-run" --set-active
```

### Result File Not Found

```
Error: Result file not found: /path/to/result.json
```

**Solution**: Ensure the result file path is correct and file exists. Use `--json` for inline JSON instead.

### Run Directory Not Found

```
Error: Run directory not found: evals/results/runs/run-XXX
```

**Solution**: Verify the run ID is correct using `npx tsx evals/scripts/run-manager.ts list`.

## Best Practices

1. **Always name your runs descriptively**: Use meaningful names like "baseline-v1", "oauth-fix-test", not "test1", "run2"

2. **Tag runs appropriately**: Use tags to organize runs by purpose (baseline, test, deploy, regression)

3. **Compare after changes**: Always compare new runs against the previous baseline to catch regressions

4. **Archive old runs**: Mark completed runs as `archived` after analysis to keep the active list manageable

5. **Document findings**: Add notes to run metadata about significant findings or issues discovered

6. **Generate reports immediately**: Run `generate-multi-run-report.ts` as soon as eval execution completes

7. **Keep baseline runs**: Never delete baseline runs - they're critical for long-term trend analysis

## Future Enhancements

Planned features:
- Automated trend analysis across multiple runs
- Visual dashboard for run comparison
- Slack/email notifications on regression detection
- CI/CD integration for automated regression testing
- Time-series analysis and charting
- Export to external analytics platforms

## Summary

The multi-run system provides:
- ✅ Isolated result storage per run
- ✅ Run lifecycle management (create, activate, archive)
- ✅ Comprehensive comparison tools
- ✅ Historical tracking and trend analysis
- ✅ Backward compatibility with existing workflows
- ✅ Flexible tagging and filtering
- ✅ Automated report generation

Start using it today to track your MCP server's health over time!
