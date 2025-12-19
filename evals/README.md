# Multi-Run Evaluation System

Complete system for running, tracking, and comparing MCP tool evaluations across multiple runs.

## Quick Start

```bash
# Create a new run interactively
npm run eval:quick-start

# Or manually
npm run eval:run:create -- --name "my-run" --description "Testing OAuth fixes" --set-active

# Execute WP files (via Spec Kitty)
/spec-kitty.implement kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP01-identity.md

# Generate report for active run
npm run eval:report

# List all runs
npm run eval:run:list

# Compare two runs
npm run eval:run:compare run-20251219-001 run-20251219-002

# Generate visual HTML comparison
npm run eval:compare:visual run-20251219-001 run-20251219-002 -- --output html
```

## Available Scripts

### Run Management

- **`npm run eval:quick-start`** - Interactive setup for new eval run
- **`npm run eval:run:create`** - Create new run manually
- **`npm run eval:run:list`** - List all runs with status
- **`npm run eval:run:set-active`** - Set active run for evals
- **`npm run eval:run:get-active`** - Show current active run

### Report Generation

- **`npm run eval:report`** - Generate coverage report for active run
- **`npm run eval:report -- run-123`** - Generate report for specific run

### Comparison Tools

- **`npm run eval:run:compare`** - Compare two runs (text output)
- **`npm run eval:compare:visual`** - Generate rich HTML/MD comparison report

### Result Management

- **`npm run eval:save-result`** - Save individual eval result to active run

## Directory Structure

```
evals/
├── README.md                      # This file
├── MULTI-RUN-GUIDE.md            # Complete documentation
├── prompts/                       # Eval prompt JSON files
│   ├── apps/
│   ├── databases/
│   └── ...
├── results/
│   ├── runs/
│   │   ├── index.json            # Run registry
│   │   ├── run-20251219-001/     # Individual run results
│   │   │   ├── metadata.json
│   │   │   ├── coverage-report.json
│   │   │   ├── baseline-report.md
│   │   │   ├── apps/
│   │   │   │   └── *.json
│   │   │   └── ...
│   │   └── run-20251219-002/
│   │       └── ...
│   └── active -> runs/run-X      # Symlink to active run
├── inventory/
│   └── tools-current.json        # Tool inventory (116 tools)
└── scripts/
    ├── run-manager.ts            # Core run management
    ├── generate-multi-run-report.ts  # Report generation
    ├── visual-comparison.ts      # Rich comparison reports
    ├── save-eval-result.ts       # Result saving helper
    └── quick-start.sh            # Interactive setup

```

## Workflow

### 1. Create and Activate Run

```bash
# Interactive (recommended for first-time users)
npm run eval:quick-start

# Manual
npm run eval:run:create -- \
  --name "baseline-v2" \
  --description "Post-OAuth fix baseline" \
  --tags "baseline,oauth" \
  --set-active
```

### 2. Execute Evaluations

Execute WP files to run evals. Results automatically save to active run:

```bash
# Execute individual WP
/spec-kitty.implement kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP01-identity.md

# Execute all WPs (bash loop)
for wp in kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP*.md; do
  /spec-kitty.implement "$wp"
done
```

### 3. Generate Coverage Report

```bash
# For active run
npm run eval:report

# For specific run
npm run eval:report -- run-20251219-001
```

### 4. Compare Runs

```bash
# Text comparison
npm run eval:run:compare run-20251219-001 run-20251219-002

# Visual HTML report
npm run eval:compare:visual run-20251219-001 run-20251219-002 -- --output html
```

## Manual Result Saving

Agents typically save results automatically during WP execution. For manual saves:

```bash
# From JSON file
npm run eval:save-result -- \
  --tool app-list \
  --domain apps \
  --result /path/to/result.json

# Inline JSON
npm run eval:save-result -- \
  --tool app-list \
  --domain apps \
  --json '{"success": true, "tool_executed": "mcp__mittwald__mittwald_app_list", "timestamp": "2025-12-19T12:00:00Z", "confidence": "high", "problems_encountered": [], "resources_created": []}'

# To specific run (non-active)
npm run eval:save-result -- \
  --tool app-list \
  --domain apps \
  --result result.json \
  --run run-20251219-001
```

## Example: Baseline + Test + Compare

```bash
# 1. Create baseline run
npm run eval:run:create -- \
  --name "baseline-v1" \
  --description "Initial baseline" \
  --tags "baseline" \
  --set-active

# 2. Execute all evals
for wp in kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP*.md; do
  /spec-kitty.implement "$wp"
done

# 3. Generate baseline report
npm run eval:report
BASELINE_RUN=$(npm run eval:run:get-active --silent | jq -r '.run_id')

# 4. Make code changes, create test run
npm run eval:run:create -- \
  --name "test-oauth-fix" \
  --description "Testing OAuth token refresh" \
  --tags "test,oauth" \
  --set-active

# 5. Execute evals again
for wp in kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP*.md; do
  /spec-kitty.implement "$wp"
done

# 6. Generate test report
npm run eval:report
TEST_RUN=$(npm run eval:run:get-active --silent | jq -r '.run_id')

# 7. Compare
npm run eval:run:compare $BASELINE_RUN $TEST_RUN
npm run eval:compare:visual $BASELINE_RUN $TEST_RUN -- --output html
```

## Continuous Integration Example

```yaml
# .github/workflows/eval-regression.yml
name: Eval Regression Test

on:
  pull_request:
    paths:
      - 'src/**'
      - 'packages/**'

jobs:
  regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '24'

      - name: Install dependencies
        run: npm ci

      - name: Create test run
        run: |
          npm run eval:run:create -- \
            --name "ci-${{ github.run_number }}" \
            --description "PR #${{ github.event.pull_request.number }}" \
            --tags "ci,pr" \
            --set-active

      - name: Execute evals
        run: |
          for wp in kitty-specs/014-domain-grouped-eval-work-packages/tasks/WP*.md; do
            /spec-kitty.implement "$wp" || true
          done

      - name: Generate report
        run: npm run eval:report

      - name: Compare with baseline
        run: |
          npm run eval:run:compare baseline-main $(npm run eval:run:get-active --silent | jq -r '.run_id')

      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: eval-results
          path: evals/results/runs/
```

## Tips

1. **Always name runs descriptively**: Use `baseline-v1`, `oauth-fix-test`, not `test1`
2. **Tag appropriately**: Use tags like `baseline`, `test`, `deploy`, `regression` for filtering
3. **Compare after changes**: Always compare new runs against baseline to catch regressions
4. **Archive old runs**: Mark completed runs as `archived` to keep list manageable
5. **Generate reports immediately**: Don't wait to generate coverage reports

## Troubleshooting

### No active run set
```bash
Error: No active run set and no --run specified
```
**Solution**: Create and activate a run:
```bash
npm run eval:quick-start
```

### Result file not found
```bash
Error: Result file not found
```
**Solution**: Check file path or use `--json` for inline JSON

### Run not found
```bash
Error: Run directory not found
```
**Solution**: List runs to verify ID:
```bash
npm run eval:run:list
```

## Documentation

- **[MULTI-RUN-GUIDE.md](./MULTI-RUN-GUIDE.md)** - Complete documentation with examples
- **Feature 014 Spec**: `kitty-specs/014-domain-grouped-eval-work-packages/spec.md`
- **Feature 013 Spec**: `kitty-specs/013-agent-based-mcp-tool-evaluation/spec.md`

## Architecture

The multi-run system extends the existing feature 010/013/014 eval infrastructure with:

- **Isolated run storage**: Each run has its own directory
- **Run registry**: Central `index.json` tracks all runs
- **Active run symlink**: `evals/results/active` points to current run
- **Metadata tracking**: Rich metadata per run (name, tags, status, summary)
- **Backward compatibility**: Works with existing aggregation scripts

## Support

For issues or questions:
1. Check [MULTI-RUN-GUIDE.md](./MULTI-RUN-GUIDE.md)
2. Review feature 014 spec
3. Open an issue in the repo

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: 2025-12-19
