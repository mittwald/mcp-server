---
work_package_id: WP12
title: "Execute project-foundation Domain Evals"
lane: "done"
status: planned
priority: P1
subtasks:
  - T034: Execute project-foundation domain evals
  - T035: Save self-assessments
  - T036: Verify all 12 results
history:
  - timestamp: "2025-12-18T23:59:00Z"
    event: "created"
    agent: "planning-agent"
---

# Work Package: Execute project-foundation Domain Evals

**Domain**: project-foundation
**Tool Count**: 12

## Objective

Execute all 12 eval prompts for the project-foundation domain by calling each MCP tool directly and saving self-assessments to disk.

## Instructions

For each JSON file in `evals/prompts/project-foundation/`:

1. **Read the eval prompt**: `jq -r '.input.prompt' evals/prompts/project-foundation/<filename>.json`
2. **Follow the prompt instructions** to execute the MCP tool
3. **Generate self-assessment** in the exact format shown in the prompt
4. **Save immediately** to `evals/results/project-foundation/<tool-name>-result.json`

### Self-Assessment Format

Each self-assessment MUST be valid JSON:

```json
{
  "success": true,
  "confidence": "high",
  "tool_executed": "mcp__mittwald__mittwald_...",
  "timestamp": "2025-12-19T00:00:00Z",
  "problems_encountered": [],
  "resources_created": [],
  "tool_response_summary": "Brief summary",
  "execution_notes": "Observations"
}
```

**CRITICAL**: 
- CALL MCP tools directly (not scripts)
- Save self-assessment after EACH eval
- Use file naming: display-name-with-hyphens-result.json

## Definition of Done

- [ ] All 12 evals executed
- [ ] All 12 self-assessment files saved to `evals/results/project-foundation/*.json`
- [ ] No execution errors
- [ ] All self-assessments contain required fields
- [ ] File count verification: `ls evals/results/project-foundation/*.json | wc -l` outputs 12

## Activity Log

- 2025-12-18T23:16:43Z – agent – lane=doing – Started implementation via workflow command
- 2025-12-18T23:22:59Z – unknown – lane=for_review – Completed all 12 project-foundation domain evals. Results: 7 successful, 5 failed (3 permission_denied, 2 dependency_missing). All self-assessments saved to evals/results/project-foundation/*.json
- 2025-12-18T23:39:12Z – unknown – lane=done – Feature 014 complete
