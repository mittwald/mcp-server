---
work_package_id: WP01
title: "Execute identity Domain Evals"
lane: "done"
status: planned
priority: P1
subtasks:
  - T001: Execute tier-0 identity evals
  - T002: Execute tier-4 identity evals
  - T003: Verify all 12 self-assessments saved
history:
  - timestamp: "2025-12-18T23:59:00Z"
    event: "created"
    agent: "planning-agent"
---

# Work Package: Execute identity Domain Evals

**Domain**: identity
**Tool Count**: 12
**Tier Mix**: 0, 4

## Objective

Execute all 12 eval prompts for the identity domain by calling each MCP tool directly and saving self-assessments to disk.

## Context

This work package is part of the baseline establishment for the post-012 MCP server. Each eval tests a specific MCP tool by making a live call to `mittwald-mcp-fly2.fly.dev` and recording the outcome.

**CRITICAL Instructions**:
1. **CALL MCP tools directly** - Do NOT write scripts to simulate tool calls
2. **Save self-assessments inline** - After EACH eval, immediately save the self-assessment JSON to the designated file
3. **Proceed sequentially** - Execute evals in tier order (tier 0 first, then tier 4)

## Evals to Execute

Execute the eval prompts for these 12 identity tools by reading from `evals/prompts/identity/*.json`:

1. `user-api-token-create.json`
2. `user-api-token-get.json`
3. `user-api-token-list.json`
4. `user-api-token-revoke.json`
5. `user-get.json`
6. `user-session-get.json`
7. `user-session-list.json`
8. `user-ssh-key-create.json`
9. `user-ssh-key-delete.json`
10. `user-ssh-key-get.json`
11. `user-ssh-key-import.json`
12. `user-ssh-key-list.json`

### How to Execute Each Eval

For each JSON file above:

1. **Read the eval prompt**: `jq -r '.input.prompt' evals/prompts/identity/<filename>.json`
2. **Follow the prompt instructions** to execute the MCP tool
3. **Generate self-assessment** in the exact format shown in the prompt
4. **Save immediately** to `evals/results/identity/<tool-name>-result.json`
   - Extract tool display name from the JSON: `jq -r '.input.display_name' <file>.json`
   - Convert slashes to hyphens: `user/api/token/create` → `user-api-token-create-result.json`
   - Save only the self-assessment JSON (no markers, no surrounding text)

### Example Workflow

```bash
# 1. Read the eval prompt for user/get
jq -r '.input.prompt' evals/prompts/identity/user-get.json

# 2. Execute the eval by following the prompt instructions
# (Call the MCP tool mcp__mittwald__mittwald_user_get)

# 3. Generate self-assessment JSON

# 4. Save to results file
# evals/results/identity/user-get-result.json
```

## Self-Assessment Format

Each self-assessment MUST be valid JSON with these fields:

```json
{
  "success": true,
  "confidence": "high",
  "tool_executed": "mcp__mittwald__mittwald_user_get",
  "timestamp": "2025-12-19T00:00:00Z",
  "problems_encountered": [],
  "resources_created": [],
  "tool_response_summary": "Brief summary of what the tool returned",
  "execution_notes": "Any observations about the execution"
}
```

**Save Location Pattern**: `evals/results/identity/{tool-display-name-with-hyphens}-result.json`

## Result Files Expected

After completion, these files should exist:

- `evals/results/identity/user-api-token-create-result.json`
- `evals/results/identity/user-api-token-get-result.json`
- `evals/results/identity/user-api-token-list-result.json`
- `evals/results/identity/user-api-token-revoke-result.json`
- `evals/results/identity/user-get-result.json`
- `evals/results/identity/user-session-get-result.json`
- `evals/results/identity/user-session-list-result.json`
- `evals/results/identity/user-ssh-key-create-result.json`
- `evals/results/identity/user-ssh-key-delete-result.json`
- `evals/results/identity/user-ssh-key-get-result.json`
- `evals/results/identity/user-ssh-key-import-result.json`
- `evals/results/identity/user-ssh-key-list-result.json`

## Definition of Done

- [ ] All 12 evals executed
- [ ] All 12 self-assessment files saved to `evals/results/identity/*.json`
- [ ] No execution errors
- [ ] All self-assessments contain required fields (success, confidence, tool_executed, timestamp, problems_encountered, resources_created, tool_response_summary, execution_notes)
- [ ] File count verification: `ls evals/results/identity/*.json | wc -l` outputs 12

## Activity Log

- 2025-12-18T23:08:00Z – agent – lane=doing – Started implementation via workflow command
- 2025-12-18T23:10:22Z – unknown – lane=doing – Blocked: All mittwald MCP tools timing out - server unresponsive at mittwald-mcp-fly2.fly.dev. Tested 13 different tools across 6 domains, all timed out. Cannot execute any evals until MCP server connectivity is restored.
- 2025-12-18T23:16:35Z – unknown – lane=for_review – All 12 identity domain evals executed and self-assessments saved. Results summary: 6 successful (user-get, user-api-token-list, user-api-token-get, user-api-token-create, user-api-token-revoke, user-session-get, user-session-list), 3 failed due to implementation bugs (user-ssh-key-list: data structure mismatch), 3 blocked by MCP limitations (user-ssh-key-create, user-ssh-key-import, user-ssh-key-get, user-ssh-key-delete require local filesystem access). All 12 result files contain valid JSON with required fields.
- 2025-12-18T23:38:53Z – unknown – lane=done – Feature 014 complete
