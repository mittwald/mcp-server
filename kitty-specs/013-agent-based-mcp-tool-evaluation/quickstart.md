# Quickstart: Agent Execution Guidance

**Feature**: 013-agent-based-mcp-tool-evaluation
**Audience**: Future agents or users spawning agents to execute eval work packages

---

## Overview

This feature updates the eval suite to match the post-012 MCP server architecture (115 tools, down from 175). Work packages (WPs) are designed for **manual agent execution** via the `/spec-kitty.implement` command.

**Key Principle**: Agents must **CALL MCP tools directly**, NOT write automation scripts.

---

## Execution Model

### How It Works

1. **User spawns Claude agent** (manually, via CLI or UI)
2. **User provides WP prompt file** to agent (e.g., `tasks/WP06-archive-removed-apps.md`)
3. **Agent reads embedded instructions** from WP file
4. **Agent executes** via `/spec-kitty.implement` command
5. **Agent performs actions** (archive prompts, update prompts, create prompts, validate)
6. **Agent reports completion** with summary
7. **User verifies results** and marks WP as done

### What Agents Do

Depending on WP type:
- **Archive WPs**: Move eval prompt files from `evals/prompts/{domain}/` to `evals/prompts/_archived/{domain}/`
- **Update WPs**: Modify existing eval prompt JSON files (tool names, parameters, metadata)
- **Create WPs**: Generate new eval prompt JSON files following Langfuse format
- **Validate WPs**: Spot-check existing prompts for accuracy and completeness

---

## Work Package Structure

Each WP prompt file contains:

### 1. Goal
Clear statement of what the WP accomplishes.

Example:
```markdown
## Goal
Archive eval prompts for removed `app/*` tools that no longer exist in the post-012 MCP server.
```

### 2. Context
Why this work is needed (feature 010→013 reconciliation).

### 3. Tools Affected
List of specific tools to process (display names).

Example:
```markdown
## Tools Affected
- app/install/wordpress
- app/install/typo3
- app/install/joomla
...
```

### 4. Steps
Detailed action items for the agent.

Example for Archive WP:
```markdown
## Steps
1. For each tool in the "Tools Affected" list:
   - Locate the eval prompt file in `evals/prompts/app/{tool-name}.json`
   - Create archive directory if needed: `evals/prompts/_archived/app/`
   - Move file to archive directory
   - Add archive metadata comment to file (date, reason, feature)
2. Verify all listed tools have been archived
3. Report summary (count of files moved)
```

### 5. Verification
How to confirm the WP was completed successfully.

Example:
```markdown
## Verification
- All prompt files for removed tools moved to `_archived/`
- Archive directory structure matches original domain structure
- Original `evals/prompts/app/` directory only contains prompts for current tools
```

---

## Eval Prompt Format (Langfuse-Compatible)

All eval prompts follow this JSON structure (inherited from feature 010, version 2.0.0 for feature 013):

```json
{
  "input": {
    "prompt": "# Eval: app/list\n\n## Goal\nTest the `mcp__mittwald__mittwald_app_list` MCP tool...\n\n**IMPORTANT**: You must CALL the MCP tool directly. Do NOT write a script...",
    "tool_name": "mcp__mittwald__mittwald_app_list",
    "display_name": "app/list",
    "context": {
      "dependencies": ["project/create"],
      "setup_instructions": "Ensure a test project exists...",
      "required_resources": []
    }
  },
  "expectedOutput": null,
  "metadata": {
    "domain": "app",
    "tier": 4,
    "tool_description": "List apps in a project",
    "success_indicators": [
      "Returns app list",
      "Apps have IDs and names"
    ],
    "self_assessment_required": true,
    "eval_version": "2.0.0",
    "created_at": "2025-12-18T...",
    "tags": ["app", "tier-4", "read-only"]
  }
}
```

### Critical Fields

| Field | Purpose | Notes |
|-------|---------|-------|
| `input.prompt` | Markdown instructions for agent | MUST include "CALL tool directly" language |
| `input.tool_name` | Full MCP tool name | e.g., `mcp__mittwald__mittwald_app_list` |
| `input.display_name` | Human-readable name | e.g., `app/list` |
| `metadata.domain` | Domain classification | One of 19 current domains |
| `metadata.tier` | Dependency tier (0-4) | 0 = no deps, 4 = requires project |
| `metadata.eval_version` | Version identifier | `2.0.0` for feature 013 |

---

## Agent Instructions for Eval Execution (Future)

**Note**: This section is for when agents execute the actual evals (post-reconciliation), not for reconciliation WPs.

### When You Receive an Eval Prompt

1. **Read the `.input.prompt` field** (Markdown instructions)
2. **Identify the MCP tool** to call (`.input.tool_name`)
3. **Check prerequisites** (`.input.context.dependencies`)
4. **CALL the MCP tool directly** using the tool interface
   - **DO NOT write a script** to simulate the call
   - **DO NOT write TypeScript/Python code** to invoke the tool
   - **USE the MCP tool interface** provided by your environment
5. **Observe the response** from the MCP server
6. **Generate self-assessment** following the embedded schema
7. **Output self-assessment** enclosed in markers

### Self-Assessment Output Format

After calling the MCP tool, provide your assessment:

```markdown
<!-- SELF_ASSESSMENT_START -->
{
  "success": true,
  "confidence": "high",
  "tool_executed": "mcp__mittwald__mittwald_app_list",
  "timestamp": "2025-12-18T14:30:00Z",
  "problems_encountered": [],
  "resources_created": [],
  "resources_verified": [
    {
      "type": "app",
      "id": "a-abc123",
      "status": "exists"
    }
  ],
  "tool_response_summary": "Retrieved 3 apps in project p-test123",
  "execution_notes": "Tool responded quickly. No issues encountered."
}
<!-- SELF_ASSESSMENT_END -->
```

### What NOT to Do

❌ **DON'T** write a script like this:
```typescript
// WRONG - This is writing code, not calling the tool
async function callAppList() {
  const result = await fetch('https://...');
  return result.json();
}
```

✅ **DO** call the MCP tool directly:
```
I will now call the mcp__mittwald__mittwald_app_list tool with projectId="p-test123"
```

---

## Tool Inventory Reference

### Current Inventory (Post-012)
- **Total tools**: 115
- **Domains**: 19
- **Tiers**: 0-4

### Domain Breakdown
| Domain | Tool Count |
|--------|------------|
| user | 12 |
| database | 14 |
| project | 10 |
| mail | 10 |
| cronjob | 9 |
| domain | 9 |
| app | 8 |
| backup | 8 |
| organization | 7 |
| conversation | 5 |
| ssh | 4 |
| registry | 4 |
| stack | 4 |
| context | 3 |
| certificate | 2 |
| server | 2 |
| sftp | 2 |
| container | 1 |
| volume | 1 |

### Baseline Inventory (Feature 010)
- **Total tools**: 175
- **Domains**: 10
- **Delta**: 60 tools removed/consolidated

---

## File Locations

### Feature Documentation
- **Spec**: `kitty-specs/013-agent-based-mcp-tool-evaluation/spec.md`
- **Plan**: `kitty-specs/013-agent-based-mcp-tool-evaluation/plan.md`
- **Research**: `kitty-specs/013-agent-based-mcp-tool-evaluation/research.md`
- **Data Model**: `kitty-specs/013-agent-based-mcp-tool-evaluation/data-model.md`
- **This Guide**: `kitty-specs/013-agent-based-mcp-tool-evaluation/quickstart.md`

### Eval Prompt Storage
- **Current prompts**: `evals/prompts/{domain}/*.json`
- **Archived prompts**: `evals/prompts/_archived/{domain}/*.json`
- **Tool inventory**: `evals/inventory/tools-current.json`
- **Diff report**: `evals/inventory/diff-report.json`

### Work Packages (Generated by `/spec-kitty.tasks`)
- **WP files**: `kitty-specs/013-agent-based-mcp-tool-evaluation/tasks/WP*.md`

---

## Dependency Tiers (Execution Order)

When executing evals (post-reconciliation), follow this order:

| Tier | Description | Examples | Count |
|------|-------------|----------|-------|
| 0 | No dependencies | user/get, org/list, server/list | ~15 |
| 1 | Organization-level | org/invite, org/membership-list | ~10 |
| 2 | Server-level | server/get | ~2 |
| 3 | Project creation | project/create, project/list | ~5 |
| 4 | Requires project | app/*, database/*, cronjob/*, etc. | ~83 |

**Execution Strategy**:
1. Execute Tier 0 first (foundational tools)
2. Then Tier 1 (org context established)
3. Then Tier 2 (server context if needed)
4. Then Tier 3 (create projects for Tier 4)
5. Finally Tier 4 (all project-dependent tools)

---

## Common Questions

### Q: Should I write a script to automate the eval execution?
**A**: NO. You must CALL the MCP tool directly. The eval prompt explicitly instructs this. Writing a script defeats the purpose of testing the actual MCP server.

### Q: What if a tool requires prerequisites?
**A**: Check the `.input.context.dependencies` field. Execute prerequisite tools first, or verify required resources exist.

### Q: What if a tool fails?
**A**: Record the failure in your self-assessment with `success: false` and capture the error in `problems_encountered`.

### Q: How do I know which parameters to use?
**A**: The eval prompt includes example parameters and references the tool schema. Use the MCP tool interface to see required parameters.

### Q: Can I batch multiple tool calls?
**A**: Each eval prompt is for ONE tool. Execute one eval at a time, provide one self-assessment per eval.

---

## Next Steps

After reconciliation completes:
1. **100% coverage achieved** (115 prompts for 115 tools)
2. **Execute evals** by spawning agents with eval prompts
3. **Collect self-assessments** from session logs
4. **Generate coverage report** showing success rates
5. **Establish post-012 baseline** for future validation

---

## Related Documentation

- **Feature 010**: Original eval suite design (`kitty-specs/010-langfuse-mcp-eval/`)
- **Feature 012**: CLI-to-library conversion (`kitty-specs/012-convert-mittwald-cli/`)
- **Langfuse Docs**: https://langfuse.com/docs/evaluation
- **CLAUDE.md**: Agent context file (project root)
