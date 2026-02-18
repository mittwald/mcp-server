# Data Model: Documentation-Driven MCP Tool Testing

**Feature**: 018-documentation-driven-mcp-tool-testing
**Date**: 2026-01-27
**Status**: Phase 1 Design

## Overview

This document defines the data entities for scenario-based MCP tool testing. All entities are serialized as JSON and stored in the `evals/` directory structure.

---

## Entity Definitions

### 1. ScenarioDefinition

**Purpose**: Defines a test scenario that exercises MCP tools through natural language prompts.

**Storage**: `evals/scenarios/case-studies/*.json` or `evals/scenarios/custom/*.json`

**Schema**:
```typescript
interface ScenarioDefinition {
  // Identification
  id: string;                    // Unique identifier (kebab-case)
  name: string;                  // Human-readable name
  source?: string;               // Path to case study doc (if applicable)

  // Execution
  prompts: string[];             // Prompts sent to Claude Code CLI

  // Validation
  success_criteria: {
    resources_created?: Record<string, number>;      // e.g., { "project": 1, "app": 2 }
    resources_configured?: Record<string, unknown>;  // e.g., { "ssl_enabled": true }
  };

  // Cleanup
  cleanup?: string[];            // Cleanup prompts for teardown

  // Optional
  expected_tools?: string[];     // Tools expected to be called (for validation)
  tags?: string[];               // Categorization tags
}
```

**Validation Rules**:
- `id` must match pattern `^[a-z0-9-]+$`
- `prompts` array must have at least 1 element
- `success_criteria` must have at least one property

**Example**:
```json
{
  "id": "freelancer-onboarding",
  "name": "Freelancer Client Onboarding",
  "source": "docs/setup-and-guides/src/content/docs/case-studies/freelancer-client-onboarding.md",
  "prompts": [
    "Create a new Mittwald project called 'ACME Client Portal'",
    "Install WordPress in that project",
    "Configure automatic daily backups at 2 AM"
  ],
  "success_criteria": {
    "resources_created": { "project": 1, "app": 1, "backup_schedule": 1 },
    "resources_configured": { "ssl_enabled": true }
  },
  "cleanup": [
    "Delete the backup schedule",
    "Delete the WordPress app",
    "Delete the project"
  ],
  "expected_tools": [
    "mittwald_project_create",
    "mittwald_app_install",
    "mittwald_backup_schedule_create"
  ],
  "tags": ["case-study", "simple", "tier-3"]
}
```

---

### 2. ScenarioExecutionResult

**Purpose**: Records the outcome of running a scenario.

**Storage**: `evals/results/scenarios/run-{timestamp}/{scenario-id}-{status}.json`

**Schema**:
```typescript
interface ScenarioExecutionResult {
  // Identification
  scenario_id: string;
  run_id: string;                     // Timestamp-based run identifier
  executed_at: string;                // ISO 8601 timestamp

  // Outcome
  status: 'success' | 'failure';

  // Execution details
  tools_called: string[];             // MCP tool names in call order
  execution_time_ms: number;

  // Failure information (if status === 'failure')
  failure_details?: {
    failed_tool: string;              // Tool that failed
    error_message: string;
    error_code?: string;
    context: Record<string, unknown>; // Additional context
  };

  // Resources
  resources_created: ResourceIdentifier[];
  cleanup_performed: boolean;
  cleanup_errors?: string[];

  // Log reference
  log_file_path?: string;             // Path to full execution log
}

interface ResourceIdentifier {
  type: 'project' | 'app' | 'database' | 'backup_schedule' | 'domain';
  id: string;
  name?: string;
}
```

**Example**:
```json
{
  "scenario_id": "freelancer-onboarding",
  "run_id": "run-20260127-142345",
  "executed_at": "2026-01-27T14:23:45.123Z",
  "status": "success",
  "tools_called": [
    "mittwald_project_create",
    "mittwald_app_install",
    "mittwald_backup_schedule_create"
  ],
  "execution_time_ms": 45230,
  "resources_created": [
    { "type": "project", "id": "p-abc123", "name": "ACME Client Portal" },
    { "type": "app", "id": "app-xyz789", "name": "WordPress" },
    { "type": "backup_schedule", "id": "bs-def456" }
  ],
  "cleanup_performed": true,
  "log_file_path": "evals/results/scenarios/run-20260127-142345/freelancer-onboarding.log"
}
```

---

### 3. ToolValidationRecord

**Purpose**: Tracks validation status for each of the 115 MCP tools.

**Storage**: `evals/coverage/tool-validation.json` (single file with all 115 tools)

**Schema**:
```typescript
interface ToolValidationRecord {
  // Identification
  tool_name: string;                  // e.g., "mittwald_app_list"
  tool_domain: string;                // e.g., "app"

  // Validation status
  status: 'not_tested' | 'success' | 'failed';

  // Success path (if status === 'success')
  validated_by_scenario?: string;     // Scenario ID that validated this tool
  validated_at?: string;              // ISO 8601 timestamp
  last_success_run?: string;          // Run ID

  // Failure path (if status === 'failed')
  failure_details?: {
    error_message: string;
    error_code?: string;
    failed_in_scenario: string;       // Scenario ID
    failed_at: string;                // ISO 8601 timestamp
    failure_pattern_id?: string;      // Link to FailurePattern
  };

  // Coverage metadata
  tested_in_scenarios: string[];      // All scenarios that called this tool
  total_calls: number;                // Across all scenarios
}
```

**Example** (successful validation):
```json
{
  "tool_name": "mittwald_app_list",
  "tool_domain": "app",
  "status": "success",
  "validated_by_scenario": "freelancer-onboarding",
  "validated_at": "2026-01-27T14:23:50.456Z",
  "last_success_run": "run-20260127-142345",
  "tested_in_scenarios": [
    "freelancer-onboarding",
    "agency-multi-project",
    "developer-onboarding"
  ],
  "total_calls": 8
}
```

**Example** (failed validation):
```json
{
  "tool_name": "mittwald_project_create",
  "tool_domain": "project",
  "status": "failed",
  "failure_details": {
    "error_message": "Missing OAuth scope: project:write",
    "error_code": "OAUTH_SCOPE_MISSING",
    "failed_in_scenario": "agency-multi-project",
    "failed_at": "2026-01-27T15:12:34.789Z",
    "failure_pattern_id": "oauth-scope-missing-a3f5b1"
  },
  "tested_in_scenarios": [
    "agency-multi-project"
  ],
  "total_calls": 1
}
```

---

### 4. FailurePattern

**Purpose**: Clusters related failures by root cause for actionable diagnostics.

**Storage**: `evals/coverage/failure-patterns.json` (array of patterns)

**Schema**:
```typescript
interface FailurePattern {
  // Identification
  pattern_id: string;                 // e.g., "oauth-scope-missing-a3f5b1"
  root_cause: string;                 // Human-readable description

  // Clustering signature
  error_signature: {
    error_type: string;               // e.g., "oauth_scope_missing"
    tool_name: string;                // e.g., "mittwald_project_create"
    http_status?: number;             // e.g., 403
    normalized_message: string;       // Normalized error text
  };

  // Affected scenarios
  affected_scenarios: string[];       // Scenario IDs
  occurrence_count: number;

  // Temporal tracking
  first_seen: string;                 // ISO 8601
  last_seen: string;                  // ISO 8601

  // Recommendations
  recommended_fix?: string;           // Human-readable fix guidance
}
```

**Example**:
```json
{
  "pattern_id": "oauth-scope-missing-a3f5b1",
  "root_cause": "Missing OAuth scope for mittwald_project_create",
  "error_signature": {
    "error_type": "oauth_scope_missing",
    "tool_name": "mittwald_project_create",
    "http_status": 403,
    "normalized_message": "required scope 'project:write' not granted"
  },
  "affected_scenarios": [
    "agency-multi-project",
    "developer-onboarding",
    "cicd-pipeline"
  ],
  "occurrence_count": 3,
  "first_seen": "2026-01-27T15:12:34.789Z",
  "last_seen": "2026-01-27T16:45:12.123Z",
  "recommended_fix": "Update OAuth client configuration to request 'project:write' scope. See: docs/oauth-scopes.md"
}
```

---

### 5. CoverageReport

**Purpose**: Aggregated view of tool validation status across all scenarios.

**Storage**: `evals/reports/coverage-full.json`

**Schema**:
```typescript
interface CoverageReport {
  // Summary statistics
  total_tools: number;                // 115
  validated_tools: number;            // Count with status === 'success'
  failed_tools: number;               // Count with status === 'failed'
  uncovered_tools: number;            // Count with status === 'not_tested'
  validation_rate: number;            // validated / total (percentage)

  // Tool breakdowns
  tools_by_status: {
    success: string[];                // Tool names
    failed: string[];
    not_tested: string[];
  };

  // Domain coverage
  coverage_by_domain: Record<string, {
    total: number;
    validated: number;
    failed: number;
    rate: number;                     // validated / total
  }>;

  // Scenario execution summary
  scenarios_executed: {
    total: number;
    successful: number;
    failed: number;
    scenarios: Array<{
      id: string;
      status: 'success' | 'failure';
      tools_validated: number;
    }>;
  };

  // Failure analysis
  failure_patterns: number;           // Count of distinct patterns
  most_common_failures: Array<{
    pattern_id: string;
    occurrence_count: number;
  }>;

  // Metadata
  generated_at: string;               // ISO 8601
  run_id: string;
}
```

**Example**:
```json
{
  "total_tools": 115,
  "validated_tools": 92,
  "failed_tools": 8,
  "uncovered_tools": 15,
  "validation_rate": 80.0,
  "tools_by_status": {
    "success": ["mittwald_app_list", "mittwald_app_create", "..."],
    "failed": ["mittwald_project_create", "..."],
    "not_tested": ["mittwald_container_stop", "..."]
  },
  "coverage_by_domain": {
    "app": { "total": 8, "validated": 7, "failed": 1, "rate": 87.5 },
    "project": { "total": 10, "validated": 8, "failed": 2, "rate": 80.0 }
  },
  "scenarios_executed": {
    "total": 10,
    "successful": 8,
    "failed": 2,
    "scenarios": [
      {
        "id": "freelancer-onboarding",
        "status": "success",
        "tools_validated": 12
      }
    ]
  },
  "failure_patterns": 3,
  "most_common_failures": [
    { "pattern_id": "oauth-scope-missing-a3f5b1", "occurrence_count": 3 },
    { "pattern_id": "timeout-4d8f3a", "occurrence_count": 2 }
  ],
  "generated_at": "2026-01-27T17:00:00.000Z",
  "run_id": "run-20260127-142345"
}
```

---

## Entity Relationships

```
ScenarioDefinition (10 case studies + ~25 custom)
    ↓ executes
ScenarioExecutionResult (1 per scenario per run)
    ↓ tracks tools
ToolValidationRecord (115 total, one per tool)
    ↓ references
FailurePattern (0-N, clustered failures)
    ↑ aggregates
CoverageReport (1 per run)
```

---

## Data Flow

1. **Scenario Execution**:
   - Read `ScenarioDefinition` from JSON
   - Execute prompts via Claude Code CLI
   - MCP server logs tool calls (Pino structured logs)
   - Save `ScenarioExecutionResult`

2. **Coverage Tracking**:
   - Parse scenario execution logs
   - Update `ToolValidationRecord` for each tool called
   - Mark tool as 'success' if scenario succeeded
   - Mark tool as 'failed' if scenario failed and capture failure details

3. **Failure Clustering**:
   - Collect all failed `ToolValidationRecord` entries
   - Extract error signatures
   - Group into `FailurePattern` entries
   - Link patterns back to tool validation records

4. **Report Generation**:
   - Aggregate all `ToolValidationRecord` entries
   - Calculate coverage statistics
   - Include `FailurePattern` summary
   - Generate `CoverageReport` (JSON + Markdown)

---

## Storage Structure

```
evals/
├── scenarios/
│   ├── case-studies/
│   │   ├── freelancer-onboarding.json          # ScenarioDefinition
│   │   ├── backup-monitoring.json
│   │   └── ...                                 # 10 total
│   └── custom/
│       ├── uncovered-tool-001.json
│       └── ...                                 # ~25 total
│
├── results/
│   └── scenarios/
│       ├── run-20260127-142345/
│       │   ├── freelancer-onboarding-success.json  # ScenarioExecutionResult
│       │   ├── backup-monitoring-failure.json
│       │   ├── summary.json                         # Run summary
│       │   └── *.log                                # Full execution logs
│       └── latest -> run-20260127-142345/           # Symlink
│
├── coverage/
│   ├── tool-validation.json                     # Array of 115 ToolValidationRecord
│   ├── failure-patterns.json                    # Array of FailurePattern
│   └── gap-analysis.json                        # Uncovered tools report
│
└── reports/
    ├── coverage-full.json                       # CoverageReport (JSON)
    └── coverage-summary.md                      # CoverageReport (Markdown)
```

---

## Validation and Type Safety

**Runtime Validation**: Ajv with JSON Schema
```typescript
import Ajv from 'ajv';
import scenarioSchema from '../contracts/scenario-definition.schema.json';

const ajv = new Ajv();
const validateScenario = ajv.compile(scenarioSchema);

if (!validateScenario(data)) {
  throw new Error(`Invalid scenario: ${ajv.errorsText(validateScenario.errors)}`);
}
```

**Type Safety**: Generated TypeScript types
```typescript
// Auto-generated from JSON Schema
import type { ScenarioDefinition } from './types/scenario';
import type { ToolValidationRecord } from './types/tool-validation';
```

---

## Notes

- All timestamps use ISO 8601 format (e.g., `2026-01-27T14:23:45.123Z`)
- All file paths are relative to repository root
- Tool names use MCP naming convention: `mittwald_{domain}_{action}`
- Resource IDs use Mittwald format: `{type}-{alphanumeric}`
- Pattern IDs use format: `{error-type}-{hash-6-chars}`
