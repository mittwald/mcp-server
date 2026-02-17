# Scenario Runner CLI Reference

Quick reference for the scenario runner command-line interface.

## Basic Usage

```bash
npx tsx evals/scripts/scenario-runner.ts <scenario-id> [options]
```

## Command-Line Options

### Resource Management

| Flag | Description | Use Case |
|------|-------------|----------|
| `--keep-resources` | Skip cleanup (keep resources after run) | Debugging, manual inspection |
| `--skip-cleanup` | Skip cleanup even on success | Keep resources for multiple test runs |
| `--cleanup-on-failure` | Force cleanup even if scenario fails | CI/CD environments, cost control |

### Fixture Control

| Flag | Description | Use Case |
|------|-------------|----------|
| `--skip-fixtures` | Skip fixture provisioning | Testing prompts without provisioning |

### Test Target

| Flag | Description | Use Case |
|------|-------------|----------|
| `--target=local` | Test against local MCP server | Development |
| `--target=flyio` | Test against Fly.io MCP server | Staging |
| `--target=mittwald` | Test against mittwald.de production | Production validation |

## Examples

### Standard Run
```bash
npx tsx evals/scripts/scenario-runner.ts fixture-test-simple
```
- Provisions fixtures
- Executes prompts
- Validates state
- Cleans up resources (on success)

### Debug Run (Keep Resources)
```bash
npx tsx evals/scripts/scenario-runner.ts fixture-test-simple --keep-resources
```
- Provisions fixtures
- Executes prompts
- Validates state
- **Skips cleanup** (resources remain)

Then inspect manually:
```bash
mw project list
mw database mysql list --project-id <PROJECT_ID>
```

### Test Prompts Only
```bash
npx tsx evals/scripts/scenario-runner.ts fixture-test-simple --skip-fixtures
```
- **Skips provisioning**
- Executes prompts as-is (no template interpolation)
- Uses legacy validation

### CI/CD Run (Always Clean Up)
```bash
npx tsx evals/scripts/scenario-runner.ts fixture-test-simple --cleanup-on-failure
```
- Provisions fixtures
- Executes prompts
- Validates state
- **Cleans up even on failure** (prevents orphaned resources)

### Staging Test
```bash
npx tsx evals/scripts/scenario-runner.ts fixture-test-simple --target=flyio
```
- Tests against Fly.io MCP server
- Uses Fly.io logs for validation

## Environment Variables

### Required

```bash
export DEFAULT_SERVER_ID="s-xxxxx"  # Default server for project creation
```

### Optional

```bash
export DEBUG_SCENARIO=true  # Enable MCP debug output during provisioning
```

## Output

### Success
```
🎯 Test Target: Local
🔧 Provisioning fixtures...
  Creating project: Test Project 2026-01-28T06-00-00
  ✓ Project created: p-xxxxx
  Creating MySQL database: Test MySQL DB 2026-01-28T06-00-00
  ✓ MySQL database created: mysql-xxxxx
  Creating Redis database: Test Redis Cache 2026-01-28T06-00-00
  ✓ Redis database created: redis-xxxxx

✅ Fixtures provisioned successfully

Prompt 1/3:
  "List all MySQL databases in project p-xxxxx and show me the test database"
  Tools called: mcp__mittwald__mittwald_database_mysql_list

Prompt 2/3:
  "Get detailed configuration for MySQL database mysql-xxxxx"
  Tools called: mcp__mittwald__mittwald_database_mysql_get

Prompt 3/3:
  "Get detailed configuration for Redis database redis-xxxxx"
  Tools called: mcp__mittwald__mittwald_database_redis_get

🔍 Validating scenario state...

  Validating project: p-xxxxx
  Validating MySQL database: mysql-xxxxx
  Validating Redis database: redis-xxxxx

✅ All validation checks passed (5 checks)

🧹 Cleaning up fixtures...

  Deleting Redis database: redis-xxxxx
  ✓ Redis database deleted: redis-xxxxx
  Deleting MySQL database: mysql-xxxxx
  ✓ MySQL database deleted: mysql-xxxxx
  Waiting 5 seconds for API consistency...
  Deleting project: p-xxxxx
  ✓ Project deleted: p-xxxxx

✅ All fixtures cleaned up successfully (3 resources)

Scenario success: fixture-test-simple
Execution time: 145382ms
Tools called: 3
Result saved: evals/results/scenarios/run-2026-01-28T06-00-00/fixture-test-simple-success.json
```

### Failure (with orphaned resources)
```
❌ Fixture provisioning failed: ...
(Rollback messages)

OR

❌ Validation failed: 2/5 checks failed
  - mysql_database mysql-xxxxx: Database not found
  - redis_database redis-xxxxx: Database not found

🧹 Cleaning up fixtures...

  ✗ Failed to delete mysql_database mysql-xxxxx: Timeout during deletion

⚠️  Orphaned resources logged to: evals/results/orphaned-resources-2026-01-28T06-00-00.json

⚠️  Cleanup completed with errors: 2 deleted, 1 failed
```

## Orphaned Resources

If cleanup fails, check the orphaned resources log:

```bash
cat evals/results/orphaned-resources-*.json
```

Format:
```json
{
  "scenario_id": "fixture-test-simple",
  "orphaned_at": "2026-01-28T06:00:00.000Z",
  "resources": [
    {
      "id": "mysql-xxxxx",
      "type": "mysql_database",
      "error": "Timeout during deletion"
    }
  ]
}
```

Clean up manually:
```bash
mw database mysql delete mysql-xxxxx --confirm
mw project delete p-xxxxx --confirm
```

## Common Workflows

### Development Cycle
```bash
# 1. Write scenario with fixtures
vim evals/scenarios/case-studies/my-scenario.json

# 2. Validate schema
npx tsx evals/scripts/validate-all-scenarios.ts

# 3. Test run (keep resources for inspection)
npx tsx evals/scripts/scenario-runner.ts my-scenario --keep-resources

# 4. Inspect resources
mw project get <PROJECT_ID>

# 5. Manual cleanup when done
mw project delete <PROJECT_ID> --confirm

# 6. Final run (full cleanup)
npx tsx evals/scripts/scenario-runner.ts my-scenario
```

### CI/CD Pipeline
```bash
# Always clean up, even on failure
npx tsx evals/scripts/scenario-runner.ts my-scenario --cleanup-on-failure --target=flyio
```

### Debugging Failed Scenario
```bash
# 1. Run with resources kept
npx tsx evals/scripts/scenario-runner.ts my-scenario --keep-resources

# 2. Inspect failure
cat evals/results/scenarios/*/my-scenario-failure.json

# 3. Manually test prompts
mw database mysql list --project-id <PROJECT_ID>

# 4. Clean up when done
npx tsx evals/scripts/scenario-runner.ts my-scenario --skip-fixtures --cleanup-on-failure
```

## Exit Codes

- `0` - Scenario passed successfully
- `1` - Scenario failed (validation error, tool error, etc.)

## Tips

1. **Use `--keep-resources` for first-time scenarios** to verify resources are created correctly
2. **Always set `DEFAULT_SERVER_ID`** in your environment (or specify `serverId` in fixtures)
3. **Check orphaned resources logs** if cleanup warnings appear
4. **Use `--skip-fixtures` for prompt testing** without waiting for provisioning
5. **Enable `DEBUG_SCENARIO=true`** if provisioning fails mysteriously

## See Also

- [FIXTURE-GUIDE.md](FIXTURE-GUIDE.md) - Complete fixture system documentation
- [README.md](README.md) - Multi-run evaluation system guide
