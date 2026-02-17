# MCP Tool Test Scenarios

This directory contains test scenarios that validate MCP tools through natural language interactions with Claude Code CLI.

## Scenario Structure

Each scenario is defined as a JSON file following the [scenario-definition.schema.json](../../kitty-specs/018-documentation-driven-mcp-tool-testing/contracts/scenario-definition.schema.json) format:

```json
{
  "id": "scenario-id",
  "name": "Human Readable Name",
  "source": "path/to/case-study.md",
  "description": "What this scenario tests",
  "prompts": [
    "Natural language prompt 1",
    "Natural language prompt 2"
  ],
  "success_criteria": {
    "resources_created": {
      "project": 1,
      "app": 1
    },
    "resources_configured": {
      "ssl_enabled": true
    }
  },
  "cleanup": [
    "Delete the app",
    "Delete the project"
  ],
  "expected_tools": [
    "mittwald_project_create",
    "mittwald_app_install"
  ],
  "tags": ["case-study", "complexity-level"]
}
```

## Case Study Scenarios

### Read-Only Audit Scenarios (Low Complexity)

**database-performance.json** - Audit MySQL and Redis configurations
- 3 tools: `database/mysql/list`, `database/mysql/get`, `database/redis/get`
- No resource creation
- Tags: `read-only`, `audit`, `databases`

**security-audit-automation.json** - Security audit across API tokens, SSH keys, certificates, sessions
- 4 tools: `user/api/token/list`, `user/ssh/key/list`, `certificate/list`, `user/session/list`
- No resource creation
- Tags: `read-only`, `audit`, `security`

### Low-Complexity Provisioning Scenarios

**developer-onboarding-modified.json** - Onboard developer with org invite and SSH access
- 3 tools: `org/invite`, `ssh/user/create`, `project/membership/list`
- Creates: org invitation, SSH user
- **Modified**: SFTP tools removed (unavailable in tool inventory)
- Tags: `modified`, `sftp-tools-unavailable`, `provisioning`

**ecommerce-launch-day.json** - Pre-launch validation checklist
- 5 tools: `backup/schedule/list`, `backup/create`, `database/mysql/get`, `certificate/list`, `app/get`
- Creates: manual backup
- Tags: `validation`, `ecommerce`

### Medium-Complexity Single-Domain Scenarios

**automated-backup-monitoring.json** - Weekly backup health check
- 6 tools: backup domain tools (list, get, create, schedule/create, schedule/update)
- Creates: backup, backup schedule
- Tags: `backups`, `monitoring`

**agency-multi-project-management.json** - Agency weekly overview
- 6 tools: `org/get`, `project/list`, `org/membership/list`, `conversation/list`, `conversation/create`, `conversation/reply`
- Creates: support conversation
- Tags: `organization`, `reporting`

### High-Complexity Multi-Resource Scenarios

**typo3-multisite-deployment.json** - Multi-language TYPO3 deployment
- 6 tools: `app/copy`, `database/mysql/create`, `domain/virtualhost/create`, `ssh/user/create`, `app/list`, `domain/virtualhost/list`
- Creates: app copy, database, virtual host, SSH user
- Tags: `multi-site`, `typo3`, `apps`

**cicd-pipeline-integration.json** - CI/CD pipeline with cron jobs and container deployment
- 7 tools: `context/get/session`, `context/set/session`, `cronjob/*`, `stack/deploy`
- Creates: cron job, stack deployment
- Tags: `cicd`, `automation`, `containers`

**container-stack-deployment.json** - Docker Compose stack with registry and volumes
- 7 tools: `registry/*`, `stack/*`, `volume/list`, `container/list`
- Creates: registry, stack
- Tags: `containers`, `docker`, `infrastructure`

### Very High Complexity Full Provisioning

**freelancer-client-onboarding.json** - Complete client onboarding workflow
- 10 tools: project, domain, DNS, mail, certificate tools
- Creates: project, virtual host, mail address, deliverybox
- Configures: DNS, SSL
- Tags: `full-provisioning`, `freelancer`, `tier-4`

## Running Scenarios

### Validate All Scenarios

```bash
npm run scenarios:validate-all
```

Checks:
- Schema validation (structure, field types, patterns)
- Tool availability (cross-references against `evals/inventory/tools-current.json`)

### Run a Single Scenario

```bash
npm run scenario:run <scenario-id>
```

Example:
```bash
npm run scenario:run database-performance
```

### Run All Case Study Scenarios

```bash
for scenario in database-performance security-audit-automation developer-onboarding-modified ecommerce-launch-day automated-backup-monitoring agency-multi-project-management typo3-multisite-deployment cicd-pipeline-integration container-stack-deployment freelancer-client-onboarding; do
  npm run scenario:run $scenario
done
```

## Coverage Tracking

Scenario execution automatically updates:
- `evals/coverage/tool-validations.sqlite3` - Tool usage database
- `evals/results/scenarios/<scenario-id>-result.json` - Execution results

Generate coverage reports:
```bash
npm run report:coverage        # JSON + Markdown
npm run coverage:query         # Query validation database
npm run analysis:gaps          # Identify uncovered tools
```

## Known Limitations

### SFTP Tools Unavailable

All 4 SFTP tools are de-registered from the MCP server:
- `sftp/user/create`
- `sftp/user/update`
- `sftp/user/delete`
- `sftp/user/list`

**Reason**: Library functions don't have full parameter support yet.

**Impact**: `developer-onboarding-modified.json` removes SFTP setup steps from the original case study.

## Tool Name Formats

**In scenarios** (`expected_tools` field):
```json
"expected_tools": ["mittwald_project_create", "mittwald_app_list"]
```

**In tool inventory** (`evals/inventory/tools-current.json`):
```json
{ "mcpName": "mcp__mittwald__mittwald_project_create" }
```

The validation script automatically maps `mittwald_*` → `mcp__mittwald__mittwald_*`.

## Related Documentation

- [Feature 018 Plan](../../kitty-specs/018-documentation-driven-mcp-tool-testing/plan.md) - Implementation plan
- [Scenario Schema](../../kitty-specs/018-documentation-driven-mcp-tool-testing/contracts/scenario-definition.schema.json) - JSON Schema definition
- [Case Studies](../../docs/setup-and-guides/src/content/docs/case-studies/) - Source documentation
- [Tool Inventory](../inventory/tools-current.json) - Current MCP tool registry (115 tools)
