# Eval Prompt Template v2.0.0

**Feature**: 013-agent-based-mcp-tool-evaluation
**Version**: 2.0.0
**Updated**: 2025-12-18

---

## Template Usage

Use this template to create new eval prompts or update existing ones. Replace placeholders in `{curly braces}` with actual values.

---

## JSON Structure

```json
{
  "input": {
    "prompt": "{MARKDOWN_PROMPT_CONTENT}",
    "tool_name": "{MCP_TOOL_NAME}",
    "display_name": "{DISPLAY_NAME}",
    "context": {
      "dependencies": ["{DEPENDENCY_DISPLAY_NAMES}"],
      "setup_instructions": "{SETUP_INSTRUCTIONS}",
      "required_resources": []
    }
  },
  "expectedOutput": null,
  "metadata": {
    "domain": "{DOMAIN}",
    "tier": {TIER_NUMBER},
    "tool_description": "{BRIEF_DESCRIPTION}",
    "success_indicators": [
      "{SUCCESS_INDICATOR_1}",
      "{SUCCESS_INDICATOR_2}"
    ],
    "self_assessment_required": true,
    "eval_version": "2.0.0",
    "created_at": "{ISO_TIMESTAMP}",
    "tags": [
      "{DOMAIN}",
      "tier-{TIER_NUMBER}",
      "{OPERATION_TYPE}"
    ]
  }
}
```

---

## Markdown Prompt Content Template

The `input.prompt` field should contain the following markdown structure:

```markdown
# Eval: {display_name}

## Goal
Test the `{mcp_tool_name}` MCP tool by {brief_action_description}.

## Tool Information
- **MCP Tool Name**: `{mcp_tool_name}`
- **Display Name**: `{display_name}`
- **Domain**: {domain}
- **Dependency Tier**: {tier}
- **Description**: {tool_description}

## Prerequisites
**Dependencies**: {comma_separated_dependencies}

**Setup Instructions**:
{setup_instructions}

Ensure all prerequisites are met before executing the target tool.

## Task
Execute the `{mcp_tool_name}` tool and verify the result.

**IMPORTANT**: You must CALL the MCP tool directly. Do NOT write a script or automation to simulate the tool call.

### Steps:
1. Verify prerequisites are in place (or establish them if needed)
2. **CALL** `{mcp_tool_name}` using the MCP tool interface
3. Verify the operation succeeded by checking the response
4. Record the outcome in your self-assessment

### How to Execute:
Use the MCP tool directly:
- Claude Code: Tool will be available in your tool list
- Provide parameters as specified in the tool schema
- Observe the actual response from the production server

**DO NOT**:
- Write a TypeScript/JavaScript/Python script to call the tool
- Create automation that simulates the tool execution
- Use fetch/axios/HTTP clients to bypass the MCP interface

**DO**:
- Call the tool using your MCP tool interface
- Use actual parameters from the tool schema
- Observe real responses from the Mittwald API

### Example Parameters:
{example_parameters_section}

## Success Indicators
The eval is successful if:
{success_indicators_list}


## Self-Assessment Instructions

After completing the task (whether successful or not), you MUST provide a structured self-assessment. Output your assessment in the following exact format, enclosed in the marker comments:

<!-- SELF_ASSESSMENT_START -->
```json
{
  "success": true,
  "confidence": "high",
  "tool_executed": "{mcp_tool_name}",
  "timestamp": "{ISO_TIMESTAMP}",
  "problems_encountered": [],
  "resources_created": [],
  "resources_verified": [],
  "tool_response_summary": "Brief summary of what the tool returned",
  "execution_notes": "Any observations about the execution"
}
```
<!-- SELF_ASSESSMENT_END -->

### Self-Assessment Field Guide:
- **success**: `true` if the tool achieved its goal, `false` otherwise
- **confidence**: `high` (clear outcome), `medium` (some uncertainty), `low` (unable to determine)
- **tool_executed**: The exact MCP tool name you invoked
- **timestamp**: Current ISO 8601 timestamp
- **problems_encountered**: Array of problem objects with `type` and `description` fields
  - Valid types: `auth_error`, `resource_not_found`, `validation_error`, `timeout`, `api_error`, `permission_denied`, `quota_exceeded`, `dependency_missing`, `other`
- **resources_created**: Array of created resources with `type` and `id` fields
- **resources_verified**: Array of verified resources with `type`, `id`, and `status` fields
- **tool_response_summary**: Key information from the tool's response
- **execution_notes**: Any observations or recommendations

**IMPORTANT**: The self-assessment MUST be valid JSON enclosed in the marker comments exactly as shown.
```

---

## Field Definitions

### Placeholders

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{MCP_TOOL_NAME}` | Full MCP tool identifier | `mcp__mittwald__mittwald_app_list` |
| `{DISPLAY_NAME}` | Human-readable tool name | `app/list` |
| `{DOMAIN}` | Domain classification | `apps` |
| `{TIER_NUMBER}` | Dependency tier (0-4) | `4` |
| `{BRIEF_DESCRIPTION}` | One-line tool description | `List apps in a project` |
| `{DEPENDENCY_DISPLAY_NAMES}` | JSON array of dependencies | `["project/create"]` |
| `{SETUP_INSTRUCTIONS}` | Prerequisites guidance | `Ensure a test project exists...` |
| `{ISO_TIMESTAMP}` | ISO 8601 timestamp | `2025-12-18T15:30:00Z` |
| `{OPERATION_TYPE}` | Tag for operation type | `read-only`, `create`, `delete`, etc. |
| `{success_indicators_list}` | Bulleted list of success criteria | `- Returns app list\n- Apps have IDs` |
| `{example_parameters_section}` | Parameter examples | `- projectId: Use project/list to find ID` |

### Metadata Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `domain` | string | Yes | One of 14 normalized domains |
| `tier` | number | Yes | 0-4 dependency tier |
| `tool_description` | string | Yes | Brief description from tool schema |
| `success_indicators` | array | Yes | Expected outcomes for successful execution |
| `self_assessment_required` | boolean | Yes | Always `true` for feature 013 |
| `eval_version` | string | Yes | Always `"2.0.0"` for feature 013 |
| `created_at` | string | Yes | ISO 8601 timestamp |
| `tags` | array | Yes | Domain, tier, operation type tags |

---

## Domain List (14 Normalized Domains)

Use these normalized domain names:

1. `apps`
2. `automation`
3. `backups`
4. `certificates`
5. `containers`
6. `context`
7. `databases`
8. `domains-mail`
9. `identity`
10. `misc`
11. `organization`
12. `project-foundation`
13. `sftp`
14. `ssh`

---

## Tier Assignment Guide

| Tier | Description | Examples | Dependencies |
|------|-------------|----------|--------------|
| 0 | No dependencies | user/get, org/list, server/list | None |
| 1 | Organization-level | org/invite, org/membership/list | org/list |
| 2 | Server-level | server/get | server/list |
| 3 | Project creation | project/create, project/list | server/get (optional) |
| 4 | Requires project | app/*, database/*, cronjob/*, mail/*, etc. | project/create |

---

## Operation Type Tags

Common tags for `metadata.tags`:
- `read-only` - GET operations (list, get)
- `create` - POST operations (create, install)
- `update` - PUT/PATCH operations (update)
- `delete` - DELETE operations (delete, uninstall)
- `execute` - Action operations (execute, deploy)

---

## Example: Complete Prompt for app/list

```json
{
  "input": {
    "prompt": "# Eval: app/list\n\n## Goal\nTest the `mcp__mittwald__mittwald_app_list` MCP tool by listing apps in a project.\n\n## Tool Information\n- **MCP Tool Name**: `mcp__mittwald__mittwald_app_list`\n- **Display Name**: `app/list`\n- **Domain**: apps\n- **Dependency Tier**: 4\n- **Description**: List all apps in a project\n\n## Prerequisites\n**Dependencies**: project/create\n\n**Setup Instructions**:\nEnsure a test project exists. Use project/list to verify, or project/create to establish one.\n\nEnsure all prerequisites are met before executing the target tool.\n\n## Task\nExecute the `mcp__mittwald__mittwald_app_list` tool and verify the result.\n\n**IMPORTANT**: You must CALL the MCP tool directly. Do NOT write a script or automation to simulate the tool call.\n\n### Steps:\n1. Verify prerequisites are in place (or establish them if needed)\n2. **CALL** `mcp__mittwald__mittwald_app_list` using the MCP tool interface\n3. Verify the operation succeeded by checking the response\n4. Record the outcome in your self-assessment\n\n### How to Execute:\nUse the MCP tool directly:\n- Claude Code: Tool will be available in your tool list\n- Provide parameters as specified in the tool schema\n- Observe the actual response from the production server\n\n**DO NOT**:\n- Write a TypeScript/JavaScript/Python script to call the tool\n- Create automation that simulates the tool execution\n- Use fetch/axios/HTTP clients to bypass the MCP interface\n\n**DO**:\n- Call the tool using your MCP tool interface\n- Use actual parameters from the tool schema\n- Observe real responses from the Mittwald API\n\n### Example Parameters:\n- projectId: Use project/list to find an existing project ID\n\n## Success Indicators\nThe eval is successful if:\n- Returns an array of apps\n- Each app has an ID and description\n- Response matches the project ID requested\n\n\n## Self-Assessment Instructions\n\nAfter completing the task (whether successful or not), you MUST provide a structured self-assessment. Output your assessment in the following exact format, enclosed in the marker comments:\n\n<!-- SELF_ASSESSMENT_START -->\n```json\n{\n  \"success\": true,\n  \"confidence\": \"high\",\n  \"tool_executed\": \"mcp__mittwald__mittwald_app_list\",\n  \"timestamp\": \"2025-12-18T15:30:00Z\",\n  \"problems_encountered\": [],\n  \"resources_created\": [],\n  \"resources_verified\": [],\n  \"tool_response_summary\": \"Brief summary of what the tool returned\",\n  \"execution_notes\": \"Any observations about the execution\"\n}\n```\n<!-- SELF_ASSESSMENT_END -->\n\n### Self-Assessment Field Guide:\n- **success**: `true` if the tool achieved its goal, `false` otherwise\n- **confidence**: `high` (clear outcome), `medium` (some uncertainty), `low` (unable to determine)\n- **tool_executed**: The exact MCP tool name you invoked\n- **timestamp**: Current ISO 8601 timestamp\n- **problems_encountered**: Array of problem objects with `type` and `description` fields\n  - Valid types: `auth_error`, `resource_not_found`, `validation_error`, `timeout`, `api_error`, `permission_denied`, `quota_exceeded`, `dependency_missing`, `other`\n- **resources_created**: Array of created resources with `type` and `id` fields\n- **resources_verified**: Array of verified resources with `type`, `id`, and `status` fields\n- **tool_response_summary**: Key information from the tool's response\n- **execution_notes**: Any observations or recommendations\n\n**IMPORTANT**: The self-assessment MUST be valid JSON enclosed in the marker comments exactly as shown.\n\n",
    "tool_name": "mcp__mittwald__mittwald_app_list",
    "display_name": "app/list",
    "context": {
      "dependencies": [
        "project/create"
      ],
      "setup_instructions": "Ensure a test project exists. Use project/list to verify, or project/create to establish one.",
      "required_resources": []
    }
  },
  "expectedOutput": null,
  "metadata": {
    "domain": "apps",
    "tier": 4,
    "tool_description": "List all apps in a project",
    "success_indicators": [
      "Returns an array of apps",
      "Each app has an ID and description",
      "Response matches the project ID requested"
    ],
    "self_assessment_required": true,
    "eval_version": "2.0.0",
    "created_at": "2025-12-18T15:30:00Z",
    "tags": [
      "apps",
      "tier-4",
      "read-only"
    ]
  }
}
```

---

## Changes from v1.0.0 (Feature 010)

### Version 2.0.0 Updates:
1. **"CALL tool directly" emphasis**: Added 3+ explicit mentions in Task section
2. **DO NOT/DO sections**: Added clear anti-patterns and correct patterns
3. **eval_version**: Bumped from `"1.0.0"` to `"2.0.0"`
4. **Domain alignment**: Updated to 14 normalized domains (from 10)
5. **Timestamp refresh**: New creation timestamps for updated prompts

### Backward Compatibility:
- JSON structure unchanged (fully compatible with Langfuse)
- Self-assessment schema unchanged
- Metadata fields unchanged (except eval_version)
- Can coexist with v1.0.0 prompts in same dataset

---

## Validation Checklist

When creating/updating prompts:
- [ ] `input.prompt` includes "CALL tool directly" language (3+ places)
- [ ] `input.prompt` includes "DO NOT write script" warning
- [ ] `metadata.eval_version` = `"2.0.0"`
- [ ] `metadata.domain` uses normalized domain name
- [ ] `metadata.tier` correctly assigned (0-4)
- [ ] `metadata.created_at` is ISO 8601 timestamp
- [ ] `metadata.tags` includes domain, tier, and operation type
- [ ] Self-assessment schema is complete and properly formatted
- [ ] JSON is valid and properly escaped
