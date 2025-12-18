---
work_package_id: WP08
title: "Execute backups Domain Evals"
lane: "done"
status: planned
priority: P1
subtasks:
  - T: Execute backups domain evals
  - T: Save self-assessments
  - T: Verify all 8 results
history:
  - timestamp: "2025-12-18T23:59:00Z"
    event: "created"
    agent: "planning-agent"
---

# Work Package: Execute backups Domain Evals

**Domain**: backups
**Tool Count**: 8

## Objective

Execute all 8 eval prompts for the backups domain by calling each MCP tool directly and saving self-assessments to disk.

## Instructions

For each JSON file in `evals/prompts/backups/`:

1. **Read the eval prompt**: `jq -r '.input.prompt' evals/prompts/backups/<filename>.json`
2. **Follow the prompt instructions** to execute the MCP tool
3. **Generate self-assessment** in the exact format shown in the prompt
4. **Save immediately** to `evals/results/backups/<tool-name>-result.json`

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

- [ ] All 8 evals executed
- [ ] All 8 self-assessment files saved to `evals/results/backups/*.json`
- [ ] No execution errors
- [ ] All self-assessments contain required fields
- [ ] File count verification: `ls evals/results/backups/*.json | wc -l` outputs 8

## Activity Log

- 2025-12-18T23:22:33Z – agent – lane=doing – Started implementation via workflow command
- 2025-12-18T23:26:48Z – unknown – lane=for_review – All 8 backups domain evals completed successfully. All result files saved to evals/results/backups/.
- 2025-12-18T23:39:04Z – unknown – lane=done – Feature 014 complete
