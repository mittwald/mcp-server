# Research: Langfuse MCP Eval Suite

**Feature**: 010-langfuse-mcp-eval
**Date**: 2025-12-16
**Status**: In Progress

## Research Summary

This document captures research findings, decisions, and rationale for creating a comprehensive evaluation suite for the Mittwald MCP server with Langfuse-compatible eval prompts.

---

## Research Question 1: Langfuse Eval Dataset Format

### Question
What is the correct Langfuse dataset/eval format structure so that eval prompts and results can be imported into Langfuse?

### Findings

**Source**: Langfuse documentation (https://langfuse.com/docs/evaluation/experiments/datasets), Langfuse Cookbook (https://langfuse.com/guides/cookbook/datasets), JSON Schema Enforcement changelog (https://langfuse.com/changelog/2025-11-06-dataset-schema-enforcement)

#### Langfuse Dataset Structure

Langfuse uses a hierarchical structure:
- **Dataset**: Container for related eval items (named collection)
- **Dataset Item**: Individual test case with input/expected output
- **Dataset Run**: Execution of dataset items via `item.run()` context manager

#### Core Dataset Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `datasetName` | string | Yes | Parent dataset identifier |
| `input` | any | Optional* | The input to evaluate (any Python object/value) |
| `expectedOutput` | any | Optional | Expected result for comparison |
| `metadata` | object | Optional | Custom properties for filtering/context |
| `id` | string | Optional | Item identifier for updates/upserts |
| `sourceTraceId` | string | Optional | Link to production trace |
| `sourceObservationId` | string | Optional | Link to specific span/event |
| `status` | string | Optional | Can be "ARCHIVED" to exclude from experiments |

*Input is technically optional but typically provided

#### JSON Schema Validation (November 2025 Feature)

Langfuse now supports optional JSON Schema validation on datasets:
- Define `inputSchema` and `expectedOutputSchema` when creating datasets
- Automatic validation on item creation, updates, and CSV imports
- Invalid items are rejected with detailed error messages
- Benefits: data quality, early error catching, team consistency

#### Programmatic API

**Python SDK:**
```python
from langfuse import get_client
langfuse = get_client()

# Create dataset
langfuse.create_dataset(name="mittwald-mcp-tools")

# Add item
langfuse.create_dataset_item(
    dataset_name="mittwald-mcp-tools",
    input={"prompt": "...", "tool_name": "..."},
    expected_output=None,  # Baseline collection mode
    metadata={"domain": "apps", "tier": 2}
)
```

**TypeScript/JavaScript SDK:**
```typescript
await langfuse.api.datasetItems.create({
    datasetName: "mittwald-mcp-tools",
    input: {prompt: "...", tool_name: "..."},
    expectedOutput: null,
    metadata: {domain: "apps", tier: 2}
})
```

#### Running Experiments

```python
dataset = langfuse.get_dataset("mittwald-mcp-tools")
for item in dataset.items:
    with item.run(run_name="baseline-2025-12") as root_span:
        output = execute_eval(item.input)
        root_span.score_trace(name="self_assessment", value=output["success"])
```

#### Recommended Schema for MCP Tool Evals

```json
{
  "input": {
    "prompt": "string - the eval prompt text",
    "tool_name": "string - MCP tool identifier (e.g., mittwald_app_create_node)",
    "display_name": "string - human-readable name (e.g., app/create/node)",
    "context": {
      "dependencies": ["array of prerequisite tool display names"],
      "setup_instructions": "string - how to establish prerequisites"
    }
  },
  "expectedOutput": null,
  "metadata": {
    "domain": "string - one of 10 domains",
    "tier": "number - dependency tier 0-4",
    "tool_description": "string - what the tool does",
    "success_indicators": ["array of observable outcomes"],
    "self_assessment_required": true,
    "eval_version": "1.0.0"
  }
}
```

### Decision
**D-001**: Use the schema above for all eval prompts. `expectedOutput` is intentionally null because we're collecting baseline self-assessments, not comparing against expected outputs.

**Rationale**: This format is directly importable into Langfuse's dataset API while containing all MCP-specific metadata needed for our evaluation workflow. The schema supports future JSON Schema enforcement when we define expected outputs in a later sprint.

---

## Research Question 2: MCP Tool Inventory and Dependencies

### Question
What are the prerequisite dependencies for each MCP tool, and what is the complete tool inventory?

### Findings

**Source**: Codebase analysis of `/Users/robert/Code/mittwald-mcp/src/handlers/tools/mittwald-cli/`, existing test harness at `/Users/robert/Code/mittwald-mcp/tests/functional/src/inventory/grouping.ts`

#### Tool Count Verification

**Total CLI tool handlers: 175** (verified via file count of `*-cli.ts` files)

This is the authoritative count - slightly higher than the ~174 estimate in the spec.

#### Tool Distribution by Domain

| Domain | Tool Prefix | Tool Count | Examples |
|--------|-------------|------------|----------|
| apps | `app/` | 28 | create/node, install/wordpress, upgrade |
| databases | `database/` | 22 | mysql/create, mysql/user-create, redis/create |
| domains-mail | `domain/`, `mail/` | 18 | dnszone/update, virtualhost-create, address/create |
| identity | `user/`, `context/` | 17 | get, session/list, ssh-key/create, api-token/create |
| project-foundation | `project/`, `server/` | 16 | create, list, membership-list, filesystem-usage |
| containers | `container/`, `stack/`, `volume/`, `registry/` | 15 | run, logs, deploy, create |
| organization | `org/`, `extension/` | 14 | list, invite, membership-list, install |
| automation | `cronjob/` | 11 | create, execute, execution-list, update |
| backups | `backup/` | 9 | create, download, schedule-create |
| access-users | `sftp/`, `ssh/` | 8 | user-create, user-list, user-update |
| conversation | `conversation/` | 6 | create, list, reply, close |
| login | `login/` | 3 | status, token, reset |
| ddev | `ddev/` | 2 | init, render-config |
| certificate | `certificate/` | 2 | list, request |

**Note**: Some tools like `conversation/` and `ddev/` may need domain assignment refinement.

#### Existing Tier Classification (from test harness)

The existing test harness in `grouping.ts` defines:

| Tier | Description | Patterns |
|------|-------------|----------|
| 0 | No prerequisites | `user/`, `login/status`, `context/`, `org/list`, `org/membership/list/own`, `server/list` |
| 1 | Organization-level | `org/`, `extension/` |
| 2 | Server-level | `server/get` |
| 3 | Project creation | `project/create`, `project/list` |
| 4 | Requires project | Everything else (default) |

#### Cross-Domain Dependencies

Notable cross-domain dependencies identified:
- `backup/create` requires `app/` or `database/` resources (databases → backups)
- `cronjob/create` requires `app/` installation (apps → automation)
- `mail/address/create` requires `domain/` configuration (domains-mail internal)
- `container/run` can reference `registry/` credentials (containers internal)

### Decision
**D-002**: Adopt the existing tier classification from the test harness as the baseline. Refine as needed during eval prompt creation.

**Rationale**: The existing classification has been tested in sprints 005-009. Reusing it ensures consistency and leverages proven categorization.

---

## Research Question 3: Self-Assessment Schema

### Question
How should LLM self-assessments be structured for consistent capture and future scoring?

### Findings

**Source**: LLM evaluation best practices, existing sprint 005-009 infrastructure, Langfuse scoring patterns

#### Design Principles

1. **Machine-parseable**: JSON format for automated extraction
2. **Human-readable**: Clear field names and structure
3. **Future-compatible**: Supports Langfuse score ingestion
4. **Comprehensive**: Captures success, problems, and context
5. **Extractable**: Can be parsed from session logs via regex/JSON parsing

#### Final Self-Assessment Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["success", "confidence", "tool_executed", "timestamp"],
  "properties": {
    "success": {
      "type": "boolean",
      "description": "Whether the tool achieved its intended goal"
    },
    "confidence": {
      "type": "string",
      "enum": ["high", "medium", "low"],
      "description": "Confidence level in the success assessment"
    },
    "tool_executed": {
      "type": "string",
      "description": "The MCP tool name that was executed"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp of assessment"
    },
    "problems_encountered": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["type", "description"],
        "properties": {
          "type": {
            "type": "string",
            "enum": ["auth_error", "resource_not_found", "validation_error", "timeout", "api_error", "permission_denied", "quota_exceeded", "other"],
            "description": "Category of problem"
          },
          "description": {
            "type": "string",
            "description": "What happened"
          },
          "recovery_attempted": {
            "type": "boolean",
            "description": "Whether recovery was attempted"
          },
          "recovered": {
            "type": "boolean",
            "description": "Whether recovery succeeded"
          }
        }
      },
      "default": []
    },
    "resources_created": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["type", "id"],
        "properties": {
          "type": {
            "type": "string",
            "description": "Resource type (project, app, database, backup, etc.)"
          },
          "id": {
            "type": "string",
            "description": "Resource identifier from Mittwald"
          },
          "name": {
            "type": "string",
            "description": "Human-readable name if available"
          },
          "verified": {
            "type": "boolean",
            "description": "Whether existence was confirmed via get/list"
          }
        }
      },
      "default": []
    },
    "resources_verified": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["type", "id", "status"],
        "properties": {
          "type": {
            "type": "string",
            "description": "Resource type verified"
          },
          "id": {
            "type": "string",
            "description": "Resource identifier"
          },
          "status": {
            "type": "string",
            "description": "Verification outcome (exists, not_found, error)"
          }
        }
      },
      "default": []
    },
    "tool_response_summary": {
      "type": "string",
      "description": "Key data extracted from tool output"
    },
    "execution_notes": {
      "type": "string",
      "description": "Free-form observations, unexpected behaviors, or recommendations"
    }
  }
}
```

#### Example Self-Assessment Output

```json
{
  "success": true,
  "confidence": "high",
  "tool_executed": "mittwald_app_create_node",
  "timestamp": "2025-12-16T14:30:00Z",
  "problems_encountered": [],
  "resources_created": [
    {
      "type": "app",
      "id": "a-abc123",
      "name": "my-node-app",
      "verified": true
    }
  ],
  "resources_verified": [
    {
      "type": "app",
      "id": "a-abc123",
      "status": "exists"
    }
  ],
  "tool_response_summary": "Node.js app created successfully with installation ID a-abc123",
  "execution_notes": "App creation took ~30 seconds. No issues encountered."
}
```

#### Extraction Pattern

Self-assessments will be enclosed in markers for reliable extraction:

```
<!-- SELF_ASSESSMENT_START -->
{...json...}
<!-- SELF_ASSESSMENT_END -->
```

### Decision
**D-003**: All eval prompts must include instructions for the LLM to output this exact self-assessment JSON schema at completion, enclosed in the marker comments.

**Rationale**:
1. Consistent structure enables automated extraction from session logs
2. JSON Schema allows future validation
3. Markers ensure reliable parsing even in verbose session logs
4. Schema maps to Langfuse score dimensions (success = boolean score, confidence = categorical score)

---

## Research Question 4: Leveraging Existing Infrastructure

### Question
How do we integrate with sprint 005-009 session log processing?

### Findings

**Source**: Codebase exploration of `/Users/robert/Code/mittwald-mcp/tests/functional/src/`

#### Available Infrastructure

| Component | Location | Purpose | Reuse Potential |
|-----------|----------|---------|-----------------|
| **Session Runner** | `harness/session-runner.ts` | Spawns Claude Code headless sessions | High - execute evals |
| **Stream Parser** | `harness/stream-parser.ts` | Parses JSONL streaming events | High - extract assessments |
| **Manifest** | `harness/manifest.ts` | Tracks test results | High - track eval execution |
| **Coverage** | `harness/coverage.ts` | Tool coverage tracking | High - track eval coverage |
| **Tool Inventory** | `inventory/` | Tool discovery and classification | High - use existing domain/tier mapping |
| **Session Logs** | `session-logs/` | JSONL session records | Reference - ~5,700 lines of prior sessions |

#### Session Log Format (JSONL)

Each line is a JSON object with types:
- `system` - init events (tools, MCP servers, model)
- `assistant` - Claude responses and tool calls
- `user` - user messages and tool results
- `tool_result` - tool execution outputs

#### Integration Points

1. **Tool Discovery**: Use existing `inventory/discovery.ts` to get current tool list from MCP server
2. **Domain/Tier Assignment**: Use existing `inventory/grouping.ts` for classification
3. **Session Execution**: Use `harness/session-runner.ts` with custom eval prompts
4. **Result Tracking**: Use `harness/manifest.ts` for execution status
5. **Self-Assessment Extraction**: Add new parser to extract JSON between markers from session logs

#### Required New Components

| Component | Purpose | Complexity |
|-----------|---------|------------|
| Eval prompt generator | Generate Langfuse-format prompts for each tool | Medium |
| Self-assessment extractor | Parse markers from session logs | Low |
| Langfuse dataset exporter | Export to Langfuse JSON format | Low |
| Coverage reporter | Aggregate by domain | Low (extend existing) |

### Decision
**D-004**: Reuse the existing test harness infrastructure (session runner, manifest, inventory) and add thin layers for eval prompt generation, self-assessment extraction, and Langfuse export.

**Rationale**: The existing infrastructure handles the hard problems (subprocess management, streaming, tool discovery). We only need to add eval-specific logic on top.

---

## Open Questions (Resolved)

| # | Question | Resolution |
|---|----------|------------|
| 1 | Langfuse Import API | Python SDK: `langfuse.create_dataset_item()`. TypeScript: `langfuse.api.datasetItems.create()` |
| 2 | Session Log Format | JSONL with type field. Self-assessments will use marker extraction. |
| 3 | Tool Count | **175 tools** verified via file count |
| 4 | Cross-Domain Dependencies | Documented in Research Question 2 |

## Remaining Open Questions

1. **Eval Prompt Template**: Need to finalize the exact prompt template that instructs the LLM to execute the tool AND produce the self-assessment
2. **Existing Project/Server Context**: Which Mittwald project/server should evals run against?
3. **Destructive Operations**: How to handle delete/uninstall tools safely?
4. **Rate Limits**: Are there Mittwald API rate limits that affect eval execution pace?

---

## Evidence References

All sources and findings are logged in:
- `research/evidence-log.csv` - Findings audit trail
- `research/source-register.csv` - Source documentation

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-16 | Initial research structure created | Claude |
