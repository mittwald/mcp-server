---
work_package_id: WP03
title: "Execute context Domain Evals"
lane: "done"
status: planned
priority: P1
subtasks:
  - T007: Execute context domain evals
  - T008: Save self-assessments
  - T009: Verify all 3 results
history:
  - timestamp: "2025-12-18T23:59:00Z"
    event: "created"
    agent: "planning-agent"
---

# Work Package: Execute context Domain Evals

**Domain**: context
**Tool Count**: 3

## Objective

Execute all 3 eval prompts for the context domain by calling each MCP tool directly and saving self-assessments to disk.

## Instructions

For each JSON file in `evals/prompts/context/`:

1. **Read the eval prompt**: `jq -r '.input.prompt' evals/prompts/context/<filename>.json`
2. **Follow the prompt instructions** to execute the MCP tool
3. **Generate self-assessment** in the exact format shown in the prompt
4. **Save immediately** to `evals/results/context/<tool-name>-result.json`

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

- [ ] All 3 evals executed
- [ ] All 3 self-assessment files saved to `evals/results/context/*.json`
- [ ] No execution errors
- [ ] All self-assessments contain required fields
- [ ] File count verification: `ls evals/results/context/*.json | wc -l` outputs 3

## Activity Log

- 2025-12-18T23:12:52Z – agent – lane=doing – Started implementation via workflow command
- 2025-12-18T23:16:16Z – unknown – lane=for_review – All 3 context domain evals completed successfully. Self-assessments saved to evals/results/context/. All tools executed directly via MCP interface.
- 2025-12-18T23:38:56Z – unknown – lane=done – Feature 014 complete
