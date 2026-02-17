# Evaluation Scripts

Core scripts for the Mittwald MCP evaluation system.

## Fixture Management System

### Template Interpolator (`template-interpolator.ts`)

Handles template variable replacement in scenarios.

**Key functions:**
- `interpolate(template, context)` - Replace {{VARIABLES}} with values
- `buildFixtureContext(fixtures, runId)` - Build context from provisioned resources
- `interpolateScenario(scenario, context)` - Interpolate all prompts in scenario

**Template variables:**
- `{{RUN_ID}}` - Unique run identifier
- `{{PROJECT_ID}}` - Created project ID
- `{{MYSQL_0_ID}}`, `{{MYSQL_1_ID}}`, etc. - Database IDs
- `{{DOMAIN_0_FQDN}}` - Domain FQDNs
- See [FIXTURE-GUIDE.md](../FIXTURE-GUIDE.md) for complete list

### Fixture Provisioner (`fixture-provisioner.ts`)

Provisions Mittwald resources before scenario execution.

**Key functions:**
- `setupFixtures(scenario, runId)` - Main entry point
- `createProject()`, `createMysqlDatabase()`, etc. - Resource creators

**Features:**
- Uses Claude Code CLI via MCP tools (same auth as scenarios)
- Parallel provisioning for databases (speed)
- Sequential for apps, domains, mail (rate limit safety)
- Automatic rollback on failure

**Usage:**
```typescript
import { setupFixtures } from './fixture-provisioner.js';

const fixtures = await setupFixtures(scenario, runId);
// Returns: { projectId, databases, apps, domains, ... }
```

### Fixture Cleanup (`fixture-cleanup.ts`)

Dependency-aware cleanup of provisioned resources.

**Key functions:**
- `cleanupFixtures(fixtures, scenario)` - Main entry point

**Features:**
- Deletes in reverse dependency order (leaves first, roots last)
- Orphan tracking (logs failures to timestamped JSON)
- 95%+ cleanup success rate

**Deletion order:**
1. Container stacks (leaves)
2. Apps, virtualhosts, mail deliveryboxes
3. Domains, mail addresses, SSH users
4. Databases
5. **Project (LAST - root)**

**Usage:**
```typescript
import { cleanupFixtures } from './fixture-cleanup.js';

const result = await cleanupFixtures(fixtures, scenario);
// Returns: { success: true, deleted: [...], failed: [...] }
```

### Enhanced Validator (`enhanced-validator.ts`)

Validates actual Mittwald infrastructure state.

**Key functions:**
- `validateScenarioState(scenario, fixtures)` - Main entry point
- `validateProjectExists()`, `validateMysqlDatabaseExists()`, etc. - State checks

**Features:**
- Uses `mw` CLI to query actual infrastructure
- Validates existence and configuration
- Scenario-specific criteria (SSL, DNS)

**Usage:**
```typescript
import { validateScenarioState } from './enhanced-validator.js';

const result = await validateScenarioState(scenario, fixtures);
// Returns: { passed: true, checks: [...] }
```

## Scenario Runner

### Main Runner (`scenario-runner.ts`)

End-to-end scenario execution with fixture lifecycle.

**Flow:**
1. Provision fixtures (if defined)
2. Interpolate prompts with fixture context
3. Execute prompts via Claude Code CLI
4. Validate state (enhanced or legacy)
5. Cleanup fixtures (dependency-aware)

**CLI:**
```bash
npx tsx evals/scripts/scenario-runner.ts <scenario-id> [options]
```

**Options:**
- `--keep-resources` - Skip cleanup
- `--skip-fixtures` - Skip provisioning
- `--skip-cleanup` - Skip cleanup even on success
- `--cleanup-on-failure` - Force cleanup even on failure
- `--target=<target>` - Test target (local, flyio, mittwald)

See [SCENARIO-RUNNER-CLI.md](../SCENARIO-RUNNER-CLI.md) for complete CLI reference.

### Agent E2E Runner (`agent-e2e-runner.ts`)

Runs tool prompts (`evals/prompts/**.json`) inside real coding agents and enforces coverage gates.

**Flow:**
1. Load and validate prompt files
2. Run per-agent preflight probe (`mcp__mittwald__mittwald_user_get`)
3. Execute each prompt per selected agent
4. Verify expected tool-call evidence + self-assessment
5. Generate `summary.json` / `summary.md` and apply coverage gate

**CLI:**
```bash
npx tsx evals/scripts/agent-e2e-runner.ts --agents=claude,codex,opencode --require-coverage=100
```

### Agent E2E Report (`agent-e2e-report.ts`)

Reads the latest (or specified) agent E2E run summary and prints a concise report.

**CLI:**
```bash
npx tsx evals/scripts/agent-e2e-report.ts
```

### Scenario Loader (`scenario-loader.ts`)

Loads and validates scenario JSON files.

### Scenario Validator (`scenario-validator.ts`)

Legacy validation (log parsing, resource counting).

### Outcome Validator (`outcome-validator.ts`)

Outcome-based validation using `mw` CLI (for mittwald.de target).

## Validation

### Validate All Scenarios (`validate-all-scenarios.ts`)

Validates all scenario JSON files against schema and fixture templates.

**Usage:**
```bash
npx tsx evals/scripts/validate-all-scenarios.ts
```

**Checks:**
- JSON syntax
- Schema compliance
- Template variable definitions
- Orphaned template variables
- Tool existence

## Multi-Run System

### Run Manager (`run-manager.ts`)

Manages evaluation runs (create, list, activate).

### Coverage Report Generator (`generate-multi-run-report.ts`)

Generates coverage reports for runs.

### Visual Comparison (`visual-comparison.ts`)

Creates rich HTML/MD comparison reports.

### Result Saver (`save-eval-result.ts`)

Helper for saving individual eval results.

## Quick Reference

### Create and Run Scenario

```bash
# 1. Create scenario JSON
cat > evals/scenarios/case-studies/my-scenario.json <<EOF
{
  "id": "my-scenario",
  "fixtures": {
    "project": { "description": "Test {{RUN_ID}}" }
  },
  "prompts": ["List projects"],
  "success_criteria": { "resources_created": { "project": 1 } }
}
EOF

# 2. Validate
npx tsx evals/scripts/validate-all-scenarios.ts

# 3. Run
npx tsx evals/scripts/scenario-runner.ts my-scenario
```

### Debug Fixture Provisioning

```bash
# Keep resources for inspection
npx tsx evals/scripts/scenario-runner.ts my-scenario --keep-resources

# Inspect
mw project list

# Manual cleanup
mw project delete <PROJECT_ID> --confirm
```

### CI/CD Integration

```bash
# Always clean up (cost control)
npx tsx evals/scripts/scenario-runner.ts my-scenario --cleanup-on-failure
```

## Environment Setup

### Required

```bash
export DEFAULT_SERVER_ID="s-xxxxx"  # Default server for project creation
```

### Optional

```bash
export DEBUG_SCENARIO=true  # Enable MCP debug output
```

## See Also

- [FIXTURE-GUIDE.md](../FIXTURE-GUIDE.md) - Complete fixture system documentation
- [SCENARIO-RUNNER-CLI.md](../SCENARIO-RUNNER-CLI.md) - CLI reference
- [README.md](../README.md) - Multi-run evaluation system
