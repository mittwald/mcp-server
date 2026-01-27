# Implementation Plan: Documentation-Driven MCP Tool Testing

**Branch**: `018-documentation-driven-mcp-tool-testing` | **Date**: 2026-01-27 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/kitty-specs/018-documentation-driven-mcp-tool-testing/spec.md`

## Summary

This feature implements comprehensive diagnostic testing for all 115 MCP tools by executing realistic multi-step scenarios. It extends Feature 014's eval framework with scenario-based testing, production-quality MCP server logging, coverage tracking, and failure pattern analysis. Case study documentation will be rewritten to clearly separate human actions (prompts) from LLM actions (tool calls).

**Key approach**:
- Spawn Claude Code CLI as subprocess (maintains realistic prompt-led usage)
- Extend `evals/` infrastructure from Feature 014
- MCP server structured logging for tool call tracking
- One successful run proves tool is production-ready; failures trigger diagnostic analysis
- Hybrid coverage: 10 case studies (~80%) + custom scenarios (~20%)
- JSON + Markdown reporting (no HTML generation)

## Technical Context

**Language/Version**: TypeScript 5.8.3, Node.js >= 24.11.0 (ES modules)
**Primary Dependencies**:
- @modelcontextprotocol/sdk ^1.13.0 (MCP server framework)
- @mittwald/api-client ^4.169.0 (Mittwald API integration)
- vitest ^3.2.4 (test framework, already used in Feature 014 evals)
- tsx ^4.20.3 (TypeScript execution, already used for eval scripts)
- winston (to be added for structured logging)

**Storage**:
- JSON files in `evals/results/scenarios/` for scenario execution results
- JSON files in `evals/coverage/` for tool validation records
- Markdown reports in `evals/reports/` for human-readable summaries

**Testing**: Vitest (extends existing test suite, reuses Feature 014 patterns)

**Target Platform**: Node.js server (same as MCP server)

**Project Type**: Single project (TypeScript monorepo with workspaces)

**Performance Goals**:
- Scenario execution completes in <2 hours for all scenarios (10 case studies + ~25 custom)
- Tool call logging overhead <10ms per call
- Coverage report generation <5 seconds

**Constraints**:
- Must not break existing Feature 014 tool evals (backward compatibility required)
- Test resource cleanup must complete successfully (zero leaks)
- MCP logging must not expose sensitive data (OAuth tokens, API keys)

**Scale/Scope**:
- 115 MCP tools across 19 domains (from Feature 014 inventory)
- 10 case study workflows (from docs/setup-and-guides/src/content/docs/case-studies/)
- ~25 custom scenarios for gap coverage
- Expected: 92 tools via case studies (80%), 23 tools via custom scenarios (20%)

## Constitution Check

*Constitution file: `.kittify/memory/constitution.md`*

**Status**: Constitution is a test stub with minimal principles. No specific constraints apply to this feature.

**Evaluation**:
- No violations identified (feature extends existing patterns)
- Maintains consistency with Feature 014 architecture
- No new abstraction layers required

## Project Structure

### Documentation (this feature)

```
kitty-specs/018-documentation-driven-mcp-tool-testing/
├── plan.md              # This file
├── research.md          # Phase 0: Node.js MCP logging best practices
├── data-model.md        # Phase 1: Scenario, ToolValidationRecord, FailurePattern schemas
├── quickstart.md        # Phase 1: How to run scenarios and interpret reports
├── contracts/           # Phase 1: Scenario definition JSON schema
└── tasks.md             # Phase 2: Work packages (NOT created by /spec-kitty.plan)
```

### Source Code (repository root)

```
# Extends existing single project structure

evals/                              # Feature 014 eval framework
├── scripts/                        # Existing: tool eval runners
│   ├── scenario-runner.ts          # NEW: Scenario execution orchestrator
│   ├── coverage-tracker.ts         # NEW: Tool validation tracking
│   ├── failure-analyzer.ts         # NEW: Pattern clustering
│   └── generate-coverage-report.ts # NEW: JSON + Markdown report generation
├── scenarios/                      # NEW: Scenario definitions
│   ├── case-studies/               # Case study workflow scenarios
│   │   ├── freelancer-onboarding.json
│   │   ├── backup-monitoring.json
│   │   └── ...                     # 10 total
│   └── custom/                     # Gap-filling scenarios
│       ├── uncovered-tool-001.json
│       └── ...                     # ~25 total
├── results/                        # Existing: eval results
│   └── scenarios/                  # NEW: Scenario execution results
│       ├── run-{timestamp}/
│       │   ├── freelancer-onboarding-success.json
│       │   ├── backup-monitoring-failure.json
│       │   └── summary.json
│       └── latest -> run-{timestamp}/  # Symlink to latest run
├── coverage/                       # NEW: Tool validation records
│   ├── tool-validation.json        # 115 tools with validation status
│   └── gap-analysis.json           # Uncovered tools report
└── reports/                        # NEW: Human-readable reports
    ├── coverage-summary.md         # Markdown: validation status, gaps, failures
    └── coverage-full.json          # JSON: complete tool-by-tool data

src/
├── server/
│   ├── logging.ts                  # NEW: Structured logging infrastructure
│   └── tool-instrumentation.ts     # NEW: MCP tool call interceptor
├── handlers/                       # Existing: MCP tool handlers
│   └── tools/                      # Update: Add logging to each handler
└── utils/
    └── logger.ts                   # NEW: Winston logger configuration

docs/setup-and-guides/src/content/docs/case-studies/
├── freelancer-client-onboarding.md # UPDATE: Human-centric format
├── automated-backup-monitoring.md  # UPDATE: Human-centric format
└── ...                             # 10 case studies to update
```

**Structure Decision**: Extends existing single project structure. New directories (`evals/scenarios/`, `evals/coverage/`, `evals/reports/`) integrate cleanly with Feature 014's `evals/` framework. MCP logging infrastructure added to `src/server/` alongside existing server code.

## Complexity Tracking

*No constitution violations to justify.*

## Parallel Work Analysis

This feature can be implemented in 3 parallel streams after Phase 0 research:

### Dependency Graph

```
Phase 0: Research (Day 1)
  ↓
Wave 1 (Days 2-3, parallel):
  - Stream A: MCP Logging Infrastructure
  - Stream B: Scenario Definition Schema & Runner
  - Stream C: Documentation Format Research
  ↓
Wave 2 (Days 4-5, parallel):
  - Stream A: Coverage Tracker + Failure Analyzer
  - Stream B: Case Study Scenario Definitions (10 files)
  - Stream C: Case Study Doc Rewrites (pilot 2)
  ↓
Wave 3 (Day 6, parallel):
  - Stream A: Report Generation (JSON + Markdown)
  - Stream B: Custom Scenario Definitions (~25 files)
  - Stream C: Case Study Doc Rewrites (remaining 8)
  ↓
Integration (Day 7):
  - End-to-end validation
  - Ensure Feature 014 evals still pass
```

### Work Distribution

**Sequential work (Foundation)**:
- Phase 0 research (Node.js MCP logging, scenario schema design)
- MCP logging infrastructure (required for all testing)

**Parallel streams**:
- **Stream A (Infrastructure)**: MCP logging, coverage tracking, failure analysis, report generation
- **Stream B (Scenarios)**: Scenario runner, case study definitions, custom definitions
- **Stream C (Documentation)**: Case study rewrites with human-centric format

**Agent assignments** (file ownership to avoid conflicts):
- Agent A: `src/server/logging.ts`, `src/server/tool-instrumentation.ts`, `evals/scripts/coverage-tracker.ts`, `evals/scripts/failure-analyzer.ts`, `evals/scripts/generate-coverage-report.ts`
- Agent B: `evals/scripts/scenario-runner.ts`, `evals/scenarios/**/*.json`
- Agent C: `docs/setup-and-guides/src/content/docs/case-studies/*.md`

### Coordination Points

**Sync schedule**:
- End of Wave 1: Verify scenario runner can execute with logging enabled
- End of Wave 2: Validate coverage tracker receives data from scenario executions
- Integration day: Full system test with all scenarios + Feature 014 regression check

**Integration tests**:
- Run 1 case study scenario end-to-end (tests Stream A + B integration)
- Generate coverage report from that scenario (tests Stream A + B + reporting)
- Verify Feature 014 tool evals still pass (regression check)

## Phase 0: Research Tasks

### Research Task 1: Node.js MCP Server Structured Logging Best Practices

**Why**: Production-quality MCP logging is foundational infrastructure. Current logging may not meet requirements for tool call tracking, failure diagnosis, and security (no token leakage).

**Research questions**:
1. What are Node.js logging library best practices? (Winston vs Pino vs Bunyan)
2. How should MCP tool calls be logged? (structure: tool name, args sanitization, timing, success/failure)
3. What log levels are appropriate for different events? (tool call = info, failure = error, auth issues = warn)
4. How to prevent sensitive data leakage in logs? (OAuth tokens, API keys, user data)
5. Log rotation and retention for production MCP servers?

**Expected outputs**:
- Recommended logging library (likely Winston for maturity + structured logging)
- Log entry schema for MCP tool calls
- Sanitization patterns for sensitive data
- Log rotation configuration

### Research Task 2: Scenario Definition Schema Design

**Why**: Scenarios must be portable, version-controlled, and easy to define for both case studies and custom gap-filling scenarios.

**Research questions**:
1. What schema format? (JSON Schema, TypeScript types, or both?)
2. How to represent multi-step workflows with dependencies?
3. How to specify cleanup steps for resource teardown?
4. How to encode success criteria (outcome-focused, not tool-sequence-focused)?
5. How to link scenarios to case study documentation?

**Expected outputs**:
- JSON Schema for scenario definitions
- TypeScript types derived from schema
- Example scenario files for 2-3 case studies

### Research Task 3: Failure Pattern Clustering Algorithms

**Why**: FR-008 requires automatic clustering of failures by pattern. Need to determine how to group failures without hardcoding patterns.

**Research questions**:
1. String similarity algorithms for error messages? (Levenshtein distance, token-based similarity)
2. How to extract root cause from error context? (error type, tool name, HTTP status)
3. When to create new pattern vs merge into existing?
4. How to present patterns to users for actionability?

**Expected outputs**:
- Clustering approach (likely: simple token-based grouping by error type + tool name)
- Pattern representation schema
- Examples of common patterns (OAuth scope, tool not found, timeout)

## Phase 1: Design Artifacts

*Prerequisites: research.md complete*

### Data Model

See `data-model.md` for detailed entity schemas. Key entities:

**ScenarioDefinition**:
- `id`: Unique identifier (e.g., "freelancer-onboarding")
- `name`: Human-readable name
- `source`: Link to case study doc (if applicable)
- `prompts`: Array of prompt strings to send to Claude Code CLI
- `success_criteria`: Outcome-based validation (resources created, states reached)
- `cleanup`: Array of cleanup steps (tool calls to delete resources)
- `expected_tools`: Optional list of tools expected to be called (for validation, not enforcement)

**ToolValidationRecord**:
- `tool_name`: MCP tool name (e.g., "mcp__mittwald__mittwald_app_create")
- `status`: "not_tested" | "success" | "failed"
- `validated_by_scenario`: Scenario ID that validated this tool
- `validated_at`: ISO timestamp
- `failure_details`: Error message, context, reproduction steps (if failed)

**FailurePattern**:
- `pattern_id`: Auto-generated ID
- `root_cause`: Human-readable description (e.g., "Missing OAuth scope: project:write")
- `error_signature`: Normalized error string for clustering
- `affected_scenarios`: Array of scenario IDs
- `first_seen`: ISO timestamp
- `occurrence_count`: Number of failures matching this pattern

**CoverageReport**:
- `total_tools`: 115
- `validated_tools`: Array of tool names
- `failed_tools`: Array of tool names with failure details
- `uncovered_tools`: Array of tool names not yet tested
- `validation_rate`: Percentage (validated / total)
- `scenarios_executed`: Summary of scenario runs

### API Contracts

No HTTP API contracts (internal testing framework). However:

**Scenario Runner CLI**:
```typescript
// Usage: tsx evals/scripts/scenario-runner.ts <scenario-id> [--keep-resources]
interface ScenarioRunnerArgs {
  scenarioId: string;
  keepResources?: boolean; // Skip cleanup for debugging
  outputPath?: string; // Override default result path
}

interface ScenarioExecutionResult {
  scenario_id: string;
  status: 'success' | 'failure';
  tools_called: string[]; // MCP tool names
  execution_time_ms: number;
  failure_details?: {
    failed_tool: string;
    error_message: string;
    context: string;
  };
  resources_created: ResourceIdentifier[];
  cleanup_performed: boolean;
}
```

**Coverage Report Generator CLI**:
```typescript
// Usage: tsx evals/scripts/generate-coverage-report.ts [--format json|markdown|both]
interface CoverageReportArgs {
  format: 'json' | 'markdown' | 'both';
  outputPath?: string;
}
```

See `contracts/` directory for JSON Schema definitions.

### Quickstart

See `quickstart.md` for step-by-step execution guide. Key workflows:

**Run a single scenario**:
```bash
tsx evals/scripts/scenario-runner.ts freelancer-onboarding
```

**Run all case study scenarios**:
```bash
tsx evals/scripts/run-all-scenarios.ts --type case-studies
```

**Generate coverage report**:
```bash
tsx evals/scripts/generate-coverage-report.ts --format both
# Outputs:
# - evals/reports/coverage-full.json
# - evals/reports/coverage-summary.md
```

**Identify uncovered tools**:
```bash
tsx evals/scripts/gap-analysis.ts
# Outputs: evals/coverage/gap-analysis.json
```

**Re-run failed scenarios only**:
```bash
tsx evals/scripts/retry-failures.ts
```

## Agent Context Update

*Will be updated automatically after Phase 1 completion to include:*
- TypeScript 5.8.3
- Winston (structured logging)
- Vitest (scenario testing)
- Scenario-based testing patterns
- MCP tool instrumentation
