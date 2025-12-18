---
work_package_id: WP02
title: "Execute organization Domain Evals"
lane: "done"
status: planned
priority: P1
subtasks:
  - T004: Execute organization domain evals
  - T005: Save self-assessments
  - T006: Verify all 7 results
history:
  - timestamp: "2025-12-18T23:59:00Z"
    event: "created"
    agent: "planning-agent"
---

# Work Package: Execute organization Domain Evals

**Domain**: organization
**Tool Count**: 7

## Objective

Execute all 7 eval prompts for the organization domain by calling each MCP tool directly and saving self-assessments to disk.

## Instructions

For each JSON file in `evals/prompts/organization/`:

1. **Read the eval prompt**: `jq -r '.input.prompt' evals/prompts/organization/<filename>.json`
2. **Follow the prompt instructions** to execute the MCP tool
3. **Generate self-assessment** in the exact format shown in the prompt
4. **Save immediately** to `evals/results/organization/<tool-name>-result.json`

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

- [ ] All 7 evals executed
- [ ] All 7 self-assessment files saved to `evals/results/organization/*.json`
- [ ] No execution errors
- [ ] All self-assessments contain required fields
- [ ] File count verification: `ls evals/results/organization/*.json | wc -l` outputs 7

## Activity Log

- 2025-12-18T23:12:25Z – agent – lane=doing – Started implementation via workflow command
- 2025-12-18T23:15:53Z – unknown – lane=for_review – All 7 organization domain evals executed. 1/7 successful (org/list), 6/7 blocked by org/list returning 'unknown' instead of actual organization IDs (format: o-XXXXX). All self-assessments saved with detailed problem documentation.
- 2025-12-18T23:38:54Z – unknown – lane=done – Feature 014 complete
