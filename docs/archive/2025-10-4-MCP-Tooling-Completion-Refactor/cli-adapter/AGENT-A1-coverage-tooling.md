# Agent A1: Coverage Tooling & Automation

**Agent ID**: A1
**Task**: Build automated CLI coverage tracking and CI enforcement
**Duration**: 2-3 days
**Priority**: High (Foundation)
**Dependencies**: None

---

## Objective

Create tooling infrastructure to track CLI command coverage, detect version drift, and enforce coverage standards in CI. This enables sustainable CLI parity as the Mittwald CLI evolves.

---

## Context

**Current State**:
- Manual coverage tracking in `docs/mittwald-cli-coverage.md`
- No automated detection of CLI version changes
- No guardrails for missing command coverage
- Docker images may lag behind CLI releases

**Target State**:
- Machine-readable coverage artifact (`mw-cli-coverage.json`)
- CI job regenerates coverage and fails on uncovered commands
- Automated CLI version drift detection
- Exclusion allowlist for intentional gaps (interactive commands, etc.)

---

## Deliverables

### 1. Coverage Data Artifact

**File**: `mw-cli-coverage.json`

**Schema**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "generatedAt": { "type": "string", "format": "date-time" },
    "cliVersion": { "type": "string" },
    "mcpVersion": { "type": "string" },
    "summary": {
      "type": "object",
      "properties": {
        "totalCommands": { "type": "number" },
        "coveredCommands": { "type": "number" },
        "missingCommands": { "type": "number" },
        "excludedCommands": { "type": "number" },
        "coveragePercent": { "type": "number" }
      }
    },
    "topics": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "commands": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "command": { "type": "string" },
                "covered": { "type": "boolean" },
                "excluded": { "type": "boolean" },
                "mcpTool": { "type": "string" },
                "handler": { "type": "string" }
              }
            }
          }
        }
      }
    }
  }
}
```

**Storage**: Commit to repository root as canonical coverage data

---

### 2. Coverage Generation Script

**File**: `scripts/generate-mw-coverage.ts`

**Functionality**:
1. Execute `mw --help` to extract all topics
2. For each topic, execute `mw <topic> --help` to extract commands
3. Parse command list (exclude help/version/deprecated)
4. Scan `src/constants/tool/mittwald-cli/**/*-cli.ts` for tool registrations
5. Match CLI commands to MCP tools by naming convention
6. Load exclusion allowlist from `config/mw-cli-exclusions.json`
7. Generate `mw-cli-coverage.json` with coverage data
8. Optionally regenerate `docs/mittwald-cli-coverage.md` (markdown report)

**Example Implementation Pattern**:
```typescript
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { glob } from 'glob';

interface CliCommand {
  topic: string;
  command: string;
  fullCommand: string;
}

interface CoverageEntry {
  command: string;
  covered: boolean;
  excluded: boolean;
  mcpTool?: string;
  handler?: string;
}

async function extractCliCommands(): Promise<CliCommand[]> {
  // Run `mw --help` and parse topics
  const helpOutput = execSync('docker run --rm mittwald/cli:1.11.2 mw --help').toString();
  const topics = parseTopics(helpOutput);

  const commands: CliCommand[] = [];

  for (const topic of topics) {
    // Run `mw <topic> --help` to get commands
    const topicHelp = execSync(`docker run --rm mittwald/cli:1.11.2 mw ${topic} --help`).toString();
    const topicCommands = parseCommands(topicHelp);

    commands.push(...topicCommands.map(cmd => ({
      topic,
      command: cmd,
      fullCommand: `${topic} ${cmd}`
    })));
  }

  return commands;
}

async function scanMcpTools(): Promise<Map<string, string>> {
  const toolFiles = await glob('src/constants/tool/mittwald-cli/**/*-cli.ts');
  const tools = new Map<string, string>();

  for (const file of toolFiles) {
    // Extract tool name and handler from file
    const toolName = extractToolName(file);
    const cliCommand = mapToolToCliCommand(file);

    if (cliCommand) {
      tools.set(cliCommand, toolName);
    }
  }

  return tools;
}

async function loadExclusions(): Promise<Set<string>> {
  try {
    const exclusions = JSON.parse(readFileSync('config/mw-cli-exclusions.json', 'utf-8'));
    return new Set(exclusions.commands);
  } catch {
    return new Set();
  }
}

async function generateCoverage() {
  const cliCommands = await extractCliCommands();
  const mcpTools = await scanMcpTools();
  const exclusions = await loadExclusions();

  const coverage = {
    generatedAt: new Date().toISOString(),
    cliVersion: getCliVersion(),
    mcpVersion: getMcpVersion(),
    summary: {
      totalCommands: cliCommands.length,
      coveredCommands: 0,
      missingCommands: 0,
      excludedCommands: 0,
      coveragePercent: 0
    },
    topics: [] as any[]
  };

  // Build coverage data
  for (const cmd of cliCommands) {
    const covered = mcpTools.has(cmd.fullCommand);
    const excluded = exclusions.has(cmd.fullCommand);

    if (covered) coverage.summary.coveredCommands++;
    if (excluded) coverage.summary.excludedCommands++;
    if (!covered && !excluded) coverage.summary.missingCommands++;
  }

  coverage.summary.coveragePercent =
    (coverage.summary.coveredCommands / coverage.summary.totalCommands) * 100;

  writeFileSync('mw-cli-coverage.json', JSON.stringify(coverage, null, 2));
  console.log('✅ Coverage report generated');
}

generateCoverage();
```

**Usage**: `npm run coverage:generate` or `tsx scripts/generate-mw-coverage.ts`

---

### 3. Exclusion Allowlist

**File**: `config/mw-cli-exclusions.json`

**Purpose**: Document commands intentionally excluded from MCP coverage

**Schema**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "commands": [
    "app exec",
    "container cp",
    "container exec",
    "container port-forward",
    "container ssh",
    "database redis shell",
    "login status"
  ],
  "rationale": {
    "app exec": "Requires interactive TTY/streaming - not supported by MCP tool responses",
    "container cp": "Requires bidirectional file transfer - streaming not available",
    "container exec": "Requires interactive shell - streaming not available",
    "container port-forward": "Requires persistent connection - not supported by tool model",
    "container ssh": "Requires SSH TTY - streaming not available",
    "database redis shell": "Requires interactive REPL - streaming not available",
    "login status": "OAuth flow handles authentication; CLI login state is irrelevant"
  }
}
```

**Validation**: Coverage script treats excluded commands as "allowed missing"

---

### 4. CI Integration

**File**: `.github/workflows/cli-coverage-check.yml`

**Job**: `cli-coverage-check`

**Steps**:
1. Checkout code
2. Install dependencies
3. Run `npm run coverage:generate`
4. Check for git diff in `mw-cli-coverage.json`
5. If diff exists:
   - Fail build
   - Emit instructions: "CLI coverage changed. Review uncovered commands and update exclusions or implement wrappers."
6. Report coverage percentage as CI artifact

**Example Workflow**:
```yaml
name: CLI Coverage Check

on:
  pull_request:
  push:
    branches: [main]

jobs:
  coverage-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Generate CLI coverage report
        run: npm run coverage:generate

      - name: Check for coverage changes
        run: |
          if ! git diff --exit-code mw-cli-coverage.json; then
            echo "❌ CLI coverage changed. Review new/missing commands:"
            git diff mw-cli-coverage.json
            echo ""
            echo "Action required:"
            echo "1. Review uncovered commands in the diff"
            echo "2. Either implement wrappers or add to config/mw-cli-exclusions.json"
            echo "3. Update mw-cli-coverage.json and commit"
            exit 1
          fi
          echo "✅ CLI coverage unchanged"

      - name: Report coverage percentage
        run: |
          COVERAGE=$(jq -r '.summary.coveragePercent' mw-cli-coverage.json)
          echo "📊 CLI Coverage: ${COVERAGE}%"
```

---

### 5. CLI Version Drift Detection

**File**: `.github/workflows/cli-version-check.yml` (or add to existing workflow)

**Job**: `cli-version-check`

**Steps**:
1. Extract CLI version from Dockerfiles (`grep mittwald/cli:`)
2. Fetch latest published version (`npm view @mittwald/cli version`)
3. Compare versions
4. If mismatch:
   - Fail build (or warning depending on policy)
   - Emit instructions: "CLI version outdated. Update Dockerfiles and regenerate coverage."

**Example Step**:
```yaml
- name: Check CLI version alignment
  run: |
    DOCKER_VERSION=$(grep -oP 'mittwald/cli:\K[0-9.]+' Dockerfile | head -1)
    NPM_VERSION=$(npm view @mittwald/cli version)

    if [ "$DOCKER_VERSION" != "$NPM_VERSION" ]; then
      echo "⚠️ CLI version mismatch:"
      echo "  Docker: $DOCKER_VERSION"
      echo "  NPM:    $NPM_VERSION"
      echo ""
      echo "Action required:"
      echo "1. Update Dockerfile to mittwald/cli:$NPM_VERSION"
      echo "2. Regenerate coverage: npm run coverage:generate"
      echo "3. Review new commands and update coverage"
      exit 1
    fi

    echo "✅ CLI version aligned: $DOCKER_VERSION"
```

---

### 6. Documentation Updates

**Files to Update**:
1. `README.md` - Add "CLI Coverage" section with badge and link
2. `docs/mittwald-cli-coverage.md` - Regenerate from `mw-cli-coverage.json`
3. Create `docs/guides/cli-coverage-maintenance.md` - Operational guide

**Coverage Badge** (README.md):
```markdown
## CLI Coverage

![CLI Coverage](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/mittwald/mcp-server/main/mw-cli-coverage.json&label=CLI%20Coverage&query=$.summary.coveragePercent&suffix=%25&color=brightgreen)

See [CLI Coverage Report](./docs/mittwald-cli-coverage.md) for details.
```

---

## Implementation Steps

### Day 1: Foundation
1. Create `config/mw-cli-exclusions.json` with initial exclusions
2. Define JSON schema for `mw-cli-coverage.json`
3. Write `scripts/generate-mw-coverage.ts` (command extraction)
4. Test script locally and verify output

### Day 2: Automation
5. Add npm script: `"coverage:generate": "tsx scripts/generate-mw-coverage.ts"`
6. Create `.github/workflows/cli-coverage-check.yml`
7. Create `.github/workflows/cli-version-check.yml`
8. Test CI workflows in feature branch

### Day 3: Documentation & Polish
9. Regenerate `docs/mittwald-cli-coverage.md` from JSON
10. Add coverage badge to README.md
11. Write `docs/guides/cli-coverage-maintenance.md` operational guide
12. Update ARCHITECTURE.md to reference coverage tooling

---

## Testing Strategy

### Unit Tests
- Test command extraction from `mw --help` output
- Test tool scanner regex matching
- Test exclusion loading and filtering

### Integration Tests
- Run coverage script against current codebase
- Verify JSON schema validity
- Test CI workflow with intentional coverage change

### Manual Validation
- Review `mw-cli-coverage.json` for accuracy
- Confirm exclusions match documented rationale
- Verify coverage percentage matches manual count

---

## Success Criteria

- [ ] `mw-cli-coverage.json` generated with valid schema
- [ ] Coverage script executable via `npm run coverage:generate`
- [ ] CI fails when coverage changes without exclusion updates
- [ ] CLI version drift detected automatically
- [ ] Documentation updated with badge and maintenance guide
- [ ] Zero false positives in coverage detection
- [ ] All exclusions documented with rationale

---

## Dependencies & Blockers

**None** - This agent can start immediately

**Outputs Used By**:
- Agent B1 (taxonomy alignment will update coverage)
- Agents D1-D5 (migrations will fix no-restricted-imports)
- Agent E1 (interactive command decisions feed exclusions)

---

## Related Documentation

- **Architecture**: `docs/mcp-cli-gap-architecture.md`
- **Project Plan**: `docs/mcp-cli-gap-project-plan.md` (Workstream A)
- **Current Coverage**: `docs/mittwald-cli-coverage.md`

---

**Agent Status**: Ready to execute
**Estimated Effort**: 2-3 days
**Next Steps**: Begin with Day 1 tasks (exclusions config + JSON schema)
