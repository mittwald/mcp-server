# Eval Prompt Template

This template defines the structure for all MCP tool evaluation prompts.

## Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{tool_name}` | MCP tool identifier | `mcp__mittwald__mittwald_app_create_node` |
| `{display_name}` | Human-readable name | `app/create/node` |
| `{domain}` | Functional domain | `apps` |
| `{tier}` | Dependency tier (0-4) | `4` |
| `{tool_description}` | Brief description | `Create a Node.js app` |
| `{action_description}` | What the eval tests | `creating a new Node.js application` |
| `{dependency_list}` | Prerequisites | `project/create` or `None` |
| `{setup_instructions}` | How to establish prereqs | See below |
| `{success_indicators}` | Observable outcomes | See below |
| `{example_params}` | Sample parameters | See below |

---

## Prompt Template

```markdown
# Eval: {display_name}

## Goal
Test the `{tool_name}` MCP tool by {action_description}.

## Tool Information
- **MCP Tool Name**: `{tool_name}`
- **Display Name**: `{display_name}`
- **Domain**: {domain}
- **Dependency Tier**: {tier}
- **Description**: {tool_description}

## Prerequisites
{IF tier == 0}
This is a Tier 0 tool with no prerequisites. You can execute it immediately.
{ELSE}
**Dependencies**: {dependency_list}

**Setup Instructions**:
{setup_instructions}

Ensure all prerequisites are met before executing the target tool.
{ENDIF}

## Task
Execute the `{tool_name}` tool and verify the result.

### Steps:
1. {IF tier > 0}Verify prerequisites are in place (or establish them if needed){ENDIF}
2. Execute `{tool_name}` with appropriate parameters
3. Verify the operation succeeded
4. Record the outcome

### Example Parameters:
{example_params}

## Success Indicators
The eval is successful if:
{success_indicators}

## Self-Assessment Instructions

After completing the task (whether successful or not), you MUST provide a structured self-assessment. Output your assessment in the following exact format, enclosed in the marker comments:

<!-- SELF_ASSESSMENT_START -->
```json
{
  "success": true,
  "confidence": "high",
  "tool_executed": "{tool_name}",
  "timestamp": "2025-12-16T00:00:00Z",
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
- **confidence**: `high` (clear success/failure), `medium` (some uncertainty), `low` (unable to determine)
- **tool_executed**: The exact MCP tool name you invoked
- **timestamp**: Current ISO 8601 timestamp
- **problems_encountered**: Array of issues (empty if none). Each problem has:
  - `type`: One of `auth_error`, `resource_not_found`, `validation_error`, `timeout`, `api_error`, `permission_denied`, `quota_exceeded`, `dependency_missing`, `other`
  - `description`: What happened
  - `recovery_attempted`: Whether you tried to recover
  - `recovered`: Whether recovery succeeded
- **resources_created**: Array of resources created (empty if none). Each has:
  - `type`: Resource type (project, app, database, etc.)
  - `id`: The Mittwald resource ID
  - `name`: Human-readable name if available
  - `verified`: Whether you confirmed the resource exists
- **resources_verified**: Array of resources you checked. Each has:
  - `type`: Resource type
  - `id`: Resource ID
  - `status`: `exists`, `not_found`, or `error`
- **tool_response_summary**: Key information from the tool's response
- **execution_notes**: Any observations, unexpected behaviors, or recommendations

**IMPORTANT**: The self-assessment MUST be valid JSON and MUST be enclosed in the marker comments exactly as shown above.
```

---

## Example: Tier 0 Tool (user/get)

```markdown
# Eval: user/get

## Goal
Test the `mcp__mittwald__mittwald_user_get` MCP tool by retrieving the current user's profile information.

## Tool Information
- **MCP Tool Name**: `mcp__mittwald__mittwald_user_get`
- **Display Name**: `user/get`
- **Domain**: identity
- **Dependency Tier**: 0
- **Description**: Get profile information for a user

## Prerequisites
This is a Tier 0 tool with no prerequisites. You can execute it immediately.

## Task
Execute the `mcp__mittwald__mittwald_user_get` tool and verify the result.

### Steps:
1. Execute `mcp__mittwald__mittwald_user_get` with default parameters (current user)
2. Verify the operation succeeded
3. Record the outcome

### Example Parameters:
- No parameters required (defaults to current authenticated user)
- Optional: `userId` to get a specific user's profile

## Success Indicators
The eval is successful if:
- The tool returns user profile data
- The response includes user ID, email, or name fields
- No authentication errors occur

## Self-Assessment Instructions
[... standard self-assessment block ...]
```

---

## Example: Tier 4 Tool (app/create/node)

```markdown
# Eval: app/create/node

## Goal
Test the `mcp__mittwald__mittwald_app_create_node` MCP tool by creating a new Node.js application.

## Tool Information
- **MCP Tool Name**: `mcp__mittwald__mittwald_app_create_node`
- **Display Name**: `app/create/node`
- **Domain**: apps
- **Dependency Tier**: 4
- **Description**: Create a Node.js app

## Prerequisites
**Dependencies**: project (must exist)

**Setup Instructions**:
1. Ensure you have an existing project to create the app in
2. If no project exists, first use `mcp__mittwald__mittwald_project_list` to find one
3. Or use `mcp__mittwald__mittwald_project_create` to create a new project
4. Note the project ID for use in the app creation

## Task
Execute the `mcp__mittwald__mittwald_app_create_node` tool and verify the result.

### Steps:
1. Verify prerequisites are in place (or establish them if needed)
2. Execute `mcp__mittwald__mittwald_app_create_node` with appropriate parameters
3. Verify the operation succeeded
4. Record the outcome

### Example Parameters:
- `projectId`: The project ID (e.g., "p-xxxxx")
- `siteTitle`: A descriptive name for the app (optional)
- `entrypoint`: Entry file for the Node.js app (optional, defaults to "index.js")

## Success Indicators
The eval is successful if:
- The tool returns an app/installation ID
- The app appears in the project's app list
- No quota or permission errors occur

## Self-Assessment Instructions
[... standard self-assessment block ...]
```

---

## Usage Notes

1. **Tier 0 tools**: Can be executed immediately without setup
2. **Tier 1-4 tools**: Require explicit dependency setup
3. **Destructive tools** (delete, uninstall): Extra caution needed; prefer testing on eval-specific resources
4. **Interactive tools** (ssh, shell): May require special handling for eval context
5. **Long-running tools** (install, backup): Allow sufficient timeout

## JSON Format for Langfuse Dataset

Each eval prompt is stored as a JSON file with this structure:

```json
{
  "input": {
    "prompt": "... full markdown prompt ...",
    "tool_name": "mcp__mittwald__mittwald_app_create_node",
    "display_name": "app/create/node",
    "context": {
      "dependencies": ["project/create"],
      "setup_instructions": "...",
      "required_resources": ["project"]
    }
  },
  "expectedOutput": null,
  "metadata": {
    "domain": "apps",
    "tier": 4,
    "tool_description": "Create a Node.js app",
    "success_indicators": [
      "Tool returns an app/installation ID",
      "App appears in project's app list"
    ],
    "self_assessment_required": true,
    "eval_version": "1.0.0",
    "created_at": "2025-12-16T00:00:00Z"
  }
}
```
