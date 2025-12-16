---
work_package_id: "WP31"
subtasks:
  - "T001"
title: "Export Langfuse Dataset"
phase: "Phase 5 - Aggregation & Export"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-12-16T13:31:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP31 – Export Langfuse Dataset

## Objective

Export all eval prompts and baseline metadata in Langfuse-compatible format for future import.

## Prerequisites

- **WP-07 through WP-17** completed (all prompts generated)
- **WP-29** completed (assessments available for metadata)

## Input

- `evals/prompts/{domain}/*.json` - All 175 eval prompts
- `evals/results/self-assessments/` - Baseline results

## Output

### mittwald-mcp-tools.json

Langfuse dataset format:

```json
{
  "name": "mittwald-mcp-tools",
  "description": "Evaluation dataset for Mittwald MCP server tools",
  "metadata": {
    "version": "1.0.0",
    "created_at": "2025-12-16T00:00:00Z",
    "tool_count": 175,
    "domains": 11,
    "baseline_execution": "2025-12-16"
  },
  "items": [
    {
      "id": "eval-identity-user-get",
      "input": {
        "prompt": "...",
        "tool_name": "mcp__mittwald__mittwald_user_get",
        "display_name": "user/get",
        "context": {
          "dependencies": [],
          "setup_instructions": "No setup required",
          "required_resources": []
        }
      },
      "expectedOutput": null,
      "metadata": {
        "domain": "identity",
        "tier": 0,
        "tool_description": "Get profile information for a user",
        "success_indicators": ["..."],
        "baseline_result": {
          "success": true,
          "confidence": "high",
          "executed_at": "2025-12-16T00:00:00Z"
        }
      }
    },
    // ... 174 more items
  ]
}
```

## Export Script

Create `evals/scripts/export-langfuse-dataset.ts`:

```typescript
async function exportDataset() {
  // 1. Load all prompts from evals/prompts/
  // 2. Load all assessments from evals/results/self-assessments/
  // 3. Merge baseline results into metadata
  // 4. Generate dataset JSON
  // 5. Validate against Langfuse schema
  // 6. Write to evals/datasets/mittwald-mcp-tools.json
}
```

## Validation

Before export, validate:
1. All 175 items present
2. All items have valid `input` structure
3. Metadata includes `baseline_result` where available
4. JSON is valid

## Future Import Instructions

Document in `evals/datasets/README.md`:

```markdown
# Langfuse Dataset Import

## Prerequisites
- Langfuse account
- Python SDK or TypeScript SDK installed

## Import via Python
```python
from langfuse import get_client
import json

langfuse = get_client()

with open('mittwald-mcp-tools.json') as f:
    dataset = json.load(f)

# Create dataset
langfuse.create_dataset(
    name=dataset['name'],
    description=dataset['description'],
    metadata=dataset['metadata']
)

# Add items
for item in dataset['items']:
    langfuse.create_dataset_item(
        dataset_name=dataset['name'],
        id=item['id'],
        input=item['input'],
        expected_output=item['expectedOutput'],
        metadata=item['metadata']
    )
```

## Running Experiments
```python
dataset = langfuse.get_dataset("mittwald-mcp-tools")
for item in dataset.items:
    with item.run(run_name="experiment-v2") as root_span:
        output = execute_eval(item.input)
        root_span.score_trace(name="success", value=output["success"])
```
```

## Deliverables

- [ ] `evals/datasets/mittwald-mcp-tools.json` - Complete dataset
- [ ] `evals/datasets/README.md` - Import instructions
- [ ] All 175 items included
- [ ] Baseline results embedded

## Acceptance Criteria

1. Dataset JSON is valid
2. All 175 prompts included
3. Baseline results attached to metadata
4. Import instructions documented
5. Ready for Langfuse import (future sprint)

## Parallelization Notes

- Can run in parallel with WP-30 (different outputs)
- Depends only on WP-29 (assessments) and Phase 3 (prompts)

