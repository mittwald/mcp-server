# Data Model: Agent-Based MCP Tool Evaluation

**Feature**: `013-agent-based-mcp-tool-evaluation`
**Created**: 2025-12-18

---

## Entity Definitions

This document defines the key entities involved in reconciling the eval suite with the post-012 MCP server architecture.

---

## Entity 1: ToolInventorySnapshot

**Description:** Point-in-time capture of MCP server tool inventory.

**Purpose:** Establish baseline for comparison and diff analysis.

### Attributes

```typescript
interface ToolInventorySnapshot {
  captureDate: string;          // ISO 8601 timestamp
  featureContext: string;        // e.g., "010-langfuse-mcp-eval" or "013-agent-based-mcp-tool-evaluation"
  toolCount: number;             // Total tools in snapshot
  domainCount: number;           // Number of domains
  tools: ToolMetadata[];         // Array of tool definitions
}

interface ToolMetadata {
  mcpName: string;               // Full MCP tool name (e.g., "mcp__mittwald__mittwald_app_list")
  displayName: string;           // Human-readable name (e.g., "app/list")
  domain: string;                // Domain classification (e.g., "app")
  description: string;           // What the tool does
  tier?: number;                 // Dependency tier (0-4, optional until classified)
  parameters: ParameterSchema[]; // Tool parameter definitions
  hasEvalPrompt: boolean;        // Whether eval prompt exists
}

interface ParameterSchema {
  name: string;
  type: string;
  required: boolean;
  description: string;
}
```

### Snapshots

- **Feature 010 Baseline** (`tools-baseline.json`): 175 tools, 10 domains, captured 2025-12-16
- **Feature 013 Current** (`tools-current.json`): 115 tools, 19 domains, captured 2025-12-18

### Lifecycle

1. **Capture**: Query MCP server or extract from feature documentation
2. **Store**: Save as JSON in `evals/inventory/`
3. **Compare**: Generate diff report to identify changes

---

## Entity 2: ToolInventoryDiff

**Description:** Analysis of changes between two tool inventory snapshots.

**Purpose:** Drive reconciliation strategy for eval prompts.

### Attributes

```typescript
interface ToolInventoryDiff {
  baselineSnapshot: string;      // Feature/version of baseline (e.g., "010")
  currentSnapshot: string;       // Feature/version of current (e.g., "013")
  generatedAt: string;           // ISO 8601 timestamp
  summary: DiffSummary;
  changes: ToolChange[];         // Detailed change list
}

interface DiffSummary {
  baselineCount: number;         // 175
  currentCount: number;          // 115
  removedCount: number;          // Tools only in baseline
  renamedCount: number;          // Tools with name changes
  newCount: number;              // Tools only in current
  unchangedCount: number;        // Tools in both with no changes
  modifiedCount: number;         // Tools in both with parameter changes
}

interface ToolChange {
  changeType: 'removed' | 'renamed' | 'new' | 'unchanged' | 'modified';
  baselineTool?: ToolMetadata;   // Tool in baseline (null for new tools)
  currentTool?: ToolMetadata;    // Tool in current (null for removed tools)
  details: string;               // Description of change
  reconciliationAction: ReconciliationAction;
}

type ReconciliationAction =
  | { type: 'archive_prompt'; oldPromptPath: string; archivePath: string; }
  | { type: 'update_prompt'; promptPath: string; updates: string[]; }
  | { type: 'create_prompt'; promptPath: string; template: string; }
  | { type: 'validate_prompt'; promptPath: string; checks: string[]; }
  | { type: 'no_action'; reason: string; };
```

### Lifecycle

1. **Generate**: Compare baseline and current snapshots
2. **Analyze**: Categorize each tool change
3. **Plan**: Assign reconciliation actions
4. **Execute**: Perform actions in Phase 2 (via work packages)

### Example Changes

```json
{
  "changeType": "removed",
  "baselineTool": {
    "mcpName": "mcp__mittwald__mittwald_app_install_wordpress",
    "displayName": "app/install/wordpress",
    "domain": "apps"
  },
  "currentTool": null,
  "details": "Tool removed during CLI-to-library conversion (feature 012)",
  "reconciliationAction": {
    "type": "archive_prompt",
    "oldPromptPath": "evals/prompts/apps/app-install-wordpress.json",
    "archivePath": "evals/prompts/_archived/apps/app-install-wordpress.json"
  }
}
```

---

## Entity 3: EvalPrompt (Langfuse Format)

**Description:** Langfuse-compatible eval prompt for testing a single MCP tool.

**Purpose:** Provide complete, standalone instructions for agent execution.

**Reused from Feature 010** with minor updates (version, language emphasis).

### Attributes

```typescript
interface EvalPrompt {
  input: EvalPromptInput;
  expectedOutput: null;          // Baseline collection mode
  metadata: EvalPromptMetadata;
}

interface EvalPromptInput {
  prompt: string;                // Markdown prompt with embedded self-assessment instructions
  tool_name: string;             // MCP tool name (e.g., "mcp__mittwald__mittwald_app_list")
  display_name: string;          // Human-readable (e.g., "app/list")
  context: {
    dependencies: string[];      // Prerequisite tools (display names)
    setup_instructions: string;  // How to establish prerequisites
    required_resources: string[]; // Resources that must exist
  };
}

interface EvalPromptMetadata {
  domain: string;                // Domain classification
  tier: number;                  // Dependency tier (0-4)
  tool_description: string;      // What the tool does
  success_indicators: string[];  // Observable outcomes
  self_assessment_required: boolean; // Always true
  eval_version: string;          // "2.0.0" for feature 013
  created_at: string;            // ISO 8601 timestamp
  updated_at?: string;           // ISO 8601 timestamp (for updated prompts)
  tags: string[];                // Classification tags
}
```

### Prompt Structure (Markdown in `.input.prompt`)

```markdown
# Eval: {display_name}

## Goal
Test the `{tool_name}` MCP tool by {action_description}.

## Tool Information
- **MCP Tool Name**: `{tool_name}`
- **Display Name**: `{display_name}`
- **Domain**: {domain}
- **Dependency Tier**: {tier}
- **Description**: {description}

## Prerequisites
**Dependencies**: {dependencies or "None (Tier 0)"}

**Setup Instructions**:
{setup_instructions or "No setup required for Tier 0 tools."}

## Task
Execute the `{tool_name}` MCP tool directly with appropriate parameters.

**IMPORTANT**: You must CALL the MCP tool directly. Do NOT write a script or automation to simulate the tool call.

### Steps:
1. Verify prerequisites are in place (or establish them if needed)
2. **CALL** `{tool_name}` using the MCP tool interface
3. Verify the operation succeeded by checking the response
4. Record the outcome in your self-assessment

### Example Parameters:
{parameter_examples}

## Success Indicators
The eval is successful if:
{success_indicators_list}

## Self-Assessment Instructions
{self_assessment_schema_with_markers}
```

### Key Update from Feature 010

**Added Language** (Line 23-24):
```markdown
**IMPORTANT**: You must CALL the MCP tool directly. Do NOT write a script or automation to simulate the tool call.
```

### File Naming Convention

`evals/prompts/{domain}/{tool-display-name}.json`

Examples:
- `evals/prompts/app/app-list.json`
- `evals/prompts/database/database-mysql-create.json`
- `evals/prompts/organization/org-get.json`

---

## Entity 4: SelfAssessment

**Description:** Structured LLM output after eval execution.

**Purpose:** Capture success/failure and diagnostic information.

**Reused from Feature 010** without changes.

### Attributes

```typescript
interface SelfAssessment {
  success: boolean;              // Whether the tool achieved its goal
  confidence: 'high' | 'medium' | 'low'; // Confidence in assessment
  tool_executed: string;         // MCP tool name
  timestamp: string;             // ISO 8601 timestamp
  problems_encountered: Problem[];
  resources_created: Resource[];
  resources_verified: Resource[];
  tool_response_summary: string; // Key data from tool output
  execution_notes: string;       // Free-form observations
}

interface Problem {
  type: 'auth_error' | 'resource_not_found' | 'validation_error' |
        'timeout' | 'api_error' | 'permission_denied' |
        'quota_exceeded' | 'dependency_missing' | 'other';
  description: string;
  recovery_attempted?: boolean;
  recovered?: boolean;
}

interface Resource {
  type: string;                  // Resource type (project, app, database, etc.)
  id: string;                    // Resource identifier
  name?: string;                 // Human-readable name
  verified?: boolean;            // Whether existence was confirmed
  status?: string;               // Verification outcome
}
```

### Extraction Markers

```
<!-- SELF_ASSESSMENT_START -->
{...json...}
<!-- SELF_ASSESSMENT_END -->
```

### Lifecycle

1. **Embed**: Self-assessment instructions included in eval prompt
2. **Execute**: Agent calls MCP tool and generates assessment
3. **Extract**: Parser finds markers in session log and extracts JSON
4. **Validate**: JSON validated against schema
5. **Aggregate**: Assessments combined into coverage report

---

## Entity 5: ReconciliationPlan

**Description:** Actionable plan for updating eval prompts to match current inventory.

**Purpose:** Organize work packages by reconciliation action type.

### Attributes

```typescript
interface ReconciliationPlan {
  generatedAt: string;
  baselineToolCount: number;     // 175
  currentToolCount: number;      // 115
  actions: ActionGroup[];
  estimatedWPCount: number;      // Work packages needed
}

interface ActionGroup {
  actionType: 'archive' | 'update' | 'create' | 'validate';
  toolCount: number;
  tools: string[];               // Tool display names
  workPackages: string[];        // WP identifiers (e.g., "WP06", "WP07")
  description: string;
}
```

### Action Groups

| Action Type | Tool Count | Description |
|-------------|------------|-------------|
| **archive** | ~60 | Move prompts for removed tools to `_archived/` |
| **update** | ~20-30 | Update prompts for renamed/modified tools |
| **create** | ~0-5 | Create prompts for new tools (if any) |
| **validate** | ~85 | Spot-check prompts for unchanged tools |

### Work Package Mapping

- **WP06-WP10**: Archive removed tool prompts (by domain batch)
- **WP11-WP15**: Update renamed/changed tool prompts (by domain batch)
- **WP16-WP20**: Create new tool prompts (if any)
- **WP21-WP25**: Validate unchanged prompts (spot checks)

---

## Entity 6: AgentWorkPackage

**Description:** Work package (WP) prompt file for agent execution via `/spec-kitty.implement`.

**Purpose:** Enable manual agent spawning and execution.

### Attributes

```typescript
interface AgentWorkPackage {
  wpId: string;                  // e.g., "WP06"
  title: string;                 // e.g., "Archive removed app/* tool prompts"
  description: string;           // What the WP accomplishes
  actionType: 'archive' | 'update' | 'create' | 'validate';
  tools: string[];               // Tools affected (display names)
  instructions: string;          // Markdown instructions for agent
  successCriteria: string[];     // How to verify completion
}
```

### Instruction Structure

Each WP prompt file contains:
1. **Goal**: What to accomplish
2. **Context**: Why this is needed
3. **Tools Affected**: List of tools to process
4. **Steps**: Detailed action items
5. **Verification**: How to confirm success

### Execution Flow

1. User spawns Claude agent
2. User provides WP prompt file path to agent
3. Agent runs `/spec-kitty.implement` on WP file
4. Agent follows embedded instructions
5. Agent reports completion
6. User verifies and marks WP as done

**Note**: WP files are created by `/spec-kitty.tasks` command (not this planning phase).

---

## Entity 7: CoverageReport

**Description:** Summary of eval prompt coverage after reconciliation.

**Purpose:** Validate 100% coverage of current tools.

### Attributes

```typescript
interface CoverageReport {
  generatedAt: string;
  totalTools: number;            // 115
  toolsWithPrompts: number;      // Should equal totalTools
  coveragePercent: number;       // Should be 100%
  byDomain: DomainCoverage[];
  byTier: TierCoverage[];
  missingPrompts: string[];      // Should be empty
  archivedPrompts: number;       // ~60
}

interface DomainCoverage {
  domain: string;
  totalTools: number;
  promptsExist: number;
  coveragePercent: number;
}

interface TierCoverage {
  tier: number;
  totalTools: number;
  promptsExist: number;
  coveragePercent: number;
}
```

### Success Criteria

- `coveragePercent === 100`
- `missingPrompts.length === 0`
- `toolsWithPrompts === totalTools`
- All domains show 100% coverage
- All tiers show 100% coverage

---

## Entity Relationships Diagram

```
┌─────────────────────────────────────┐
│  ToolInventorySnapshot (010)        │
│  175 tools, 10 domains              │
└──────────────┬──────────────────────┘
               │
               │ Compare with
               │
               ▼
┌─────────────────────────────────────┐
│  ToolInventorySnapshot (013)        │
│  115 tools, 19 domains              │
└──────────────┬──────────────────────┘
               │
               │ Generate
               │
               ▼
┌─────────────────────────────────────┐
│  ToolInventoryDiff                  │
│  60 removed, 0-5 new, 20-30 updated │
└──────────────┬──────────────────────┘
               │
               │ Create
               │
               ▼
┌─────────────────────────────────────┐
│  ReconciliationPlan                 │
│  Action groups + WP mapping         │
└──────────────┬──────────────────────┘
               │
               │ Execute via
               │
               ▼
┌─────────────────────────────────────┐
│  AgentWorkPackage (WP06-WP25)       │
│  Task prompts for manual execution  │
└──────────────┬──────────────────────┘
               │
               │ Modify
               │
               ▼
┌─────────────────────────────────────┐
│  EvalPrompt (115 prompts)           │
│  Langfuse-compatible JSON           │
└──────────────┬──────────────────────┘
               │
               │ Validate via
               │
               ▼
┌─────────────────────────────────────┐
│  CoverageReport                     │
│  100% coverage verification         │
└─────────────────────────────────────┘

   When agents execute evals later:

┌─────────────────────────────────────┐
│  EvalPrompt                         │
└──────────────┬──────────────────────┘
               │ Agent reads
               ▼
┌─────────────────────────────────────┐
│  Agent calls MCP tool directly      │
└──────────────┬──────────────────────┘
               │ Produces
               ▼
┌─────────────────────────────────────┐
│  SelfAssessment                     │
│  Structured JSON output             │
└─────────────────────────────────────┘
```

---

## File Locations

| Entity | Storage Location |
|--------|------------------|
| ToolInventorySnapshot (010) | `evals/inventory/tools-baseline.json` |
| ToolInventorySnapshot (013) | `evals/inventory/tools-current.json` |
| ToolInventoryDiff | `evals/inventory/diff-report.json` |
| ReconciliationPlan | `data-model.md` (this file, documented) |
| AgentWorkPackage | `kitty-specs/013-.../tasks/WP*.md` (generated by /spec-kitty.tasks) |
| EvalPrompt | `evals/prompts/{domain}/*.json` |
| SelfAssessment | Embedded in session logs, extracted to `evals/results/self-assessments/*.json` |
| CoverageReport | `evals/results/coverage-report.json` |

---

## Related Documentation

- **Spec**: `spec.md` - Feature requirements and success criteria
- **Plan**: `plan.md` - Implementation phases and strategy
- **Research**: `research.md` - Tool inventory discovery and decisions
- **Quickstart**: `quickstart.md` - Agent execution guidance (to be created)
- **Contracts**: `contracts/` - JSON schemas (inherited from feature 010)
