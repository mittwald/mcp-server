---
work_package_id: WP07
title: "Execute automation Domain Evals"
lane: "done"
status: planned
priority: P1
subtasks:
  - T019: Execute automation domain evals
  - T020: Save self-assessments
  - T021: Verify all 9 results
history:
  - timestamp: "2025-12-18T23:59:00Z"
    event: "created"
    agent: "planning-agent"
---

# Work Package: Execute automation Domain Evals

**Domain**: automation
**Tool Count**: 9

## Objective

Execute all 9 eval prompts for the automation domain by calling each MCP tool directly and saving self-assessments to disk.

## Instructions

For each JSON file in `evals/prompts/automation/`:

1. **Read the eval prompt**: `jq -r '.input.prompt' evals/prompts/automation/<filename>.json`
2. **Follow the prompt instructions** to execute the MCP tool
3. **Generate self-assessment** in the exact format shown in the prompt
4. **Save immediately** to `evals/results/automation/<tool-name>-result.json`

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

- [ ] All 9 evals executed
- [ ] All 9 self-assessment files saved to `evals/results/automation/*.json`
- [ ] No execution errors
- [ ] All self-assessments contain required fields
- [ ] File count verification: `ls evals/results/automation/*.json | wc -l` outputs 9

## Activity Log

- 2025-12-18T23:22:36Z – agent – lane=doing – Started implementation via workflow command
- 2025-12-18T23:26:02Z – unknown – lane=for_review – Completed all 9 automation domain evals. Results: 1/9 successful (cronjob/list), 8/9 blocked by cronjob/create bug (projectId undefined in API calls). All result files validated as valid JSON.
- 2025-12-18T23:39:03Z – unknown – lane=done – Feature 014 complete
