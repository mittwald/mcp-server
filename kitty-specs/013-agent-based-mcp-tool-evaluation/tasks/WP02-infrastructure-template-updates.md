---
work_package_id: WP02
title: Infrastructure & Template Updates
lane: planned
priority: P0
history:
- date: 2025-12-18
  action: created
  agent: Claude
subtasks:
- T005
- T006
- T007
- T008
---

# Work Package 02: Infrastructure & Template Updates

## Objective

Prepare eval prompt template and supporting infrastructure for reconciliation work. Critical emphasis: ensure all templates instruct agents to **CALL MCP tools directly**, NOT write automation scripts.

## Context

Feature 010 established Langfuse-compatible eval format. Feature 013 reuses this format with minor updates:
- Version bump: `1.0.0` → `2.0.0`
- Added emphasis: "CALL tool directly, do NOT write scripts"
- Timestamp refresh for updated prompts
- Domain alignment (10 → 19 domains)

## Subtask Guidance

### T005: Review Feature 010 Eval Prompt Format

**Goal**: Understand and validate existing Langfuse-compatible format.

**Steps**:
1. Read feature 010 research.md for format specification
2. Examine sample prompt: `evals/prompts/organization/org-get.json`
3. Verify format structure:
   - `input` object (prompt, tool_name, display_name, context)
   - `expectedOutput` = null (baseline mode)
   - `metadata` object (domain, tier, eval_version, etc.)
4. Confirm self-assessment schema is still valid
5. Document format validation in research.md updates (if needed)

**Verification**: Format is reusable with minor updates only

---

### T006: Update Eval Prompt Template

**Goal**: Create v2.0.0 template with "CALL tool directly" emphasis.

**Steps**:
1. Create `contracts/eval-prompt-template.md` based on feature 010 template
2. Add critical language in Task section:

```markdown
## Task
Execute the `{tool_name}` MCP tool directly with appropriate parameters.

**IMPORTANT**: You must CALL the MCP tool directly. Do NOT write a script or automation to simulate the tool call.

### Steps:
1. Verify prerequisites are in place (or establish them if needed)
2. **CALL** `{tool_name}` using the MCP tool interface
3. Verify the operation succeeded by checking the response
4. Record the outcome in your self-assessment

### How to Execute:
Use the MCP tool directly:
- Claude Code: Tool will be available in your tool list
- Provide parameters as specified in the tool schema
- Observe the actual response from the production server
```

3. Update metadata section: `"eval_version": "2.0.0"`
4. Include full self-assessment schema with markers
5. Save template to: `contracts/eval-prompt-template.md`

**Verification**: Template emphasizes direct tool calling in 3+ places

---

### T007: Create Contracts Directory (if missing)

**Goal**: Ensure JSON schemas are present for validation.

**Steps**:
1. Check if `contracts/` directory exists
2. If missing, create directory: `kitty-specs/013-.../contracts/`
3. Copy or reference feature 010 schemas:
   - `self-assessment.schema.json`
   - `eval-prompt-input.schema.json` (optional)
   - `eval-prompt-metadata.schema.json` (optional)
4. Document schema locations in research.md

**Verification**: Schemas available for future validation work

---

### T008: Document Agent Execution Guidance

**Goal**: Update quickstart.md with final agent execution instructions (already mostly complete).

**Steps**:
1. Review existing `quickstart.md` (created during planning phase)
2. Add any missing sections:
   - WP prompt structure example
   - Common pitfalls ("writing scripts instead of calling tools")
   - Self-assessment output format
3. Ensure domain breakdown table is current (19 domains, 115 tools)
4. Add link to eval prompt template
5. Save updates to: `quickstart.md`

**Verification**: Quickstart provides complete guidance for agent spawning and WP execution

---

## Definition of Done

- [ ] Feature 010 format validated as reusable
- [ ] Eval prompt template updated with v2.0.0 and "call tool" emphasis
- [ ] Contracts directory present with schemas (or confirmed location)
- [ ] Quickstart.md provides agent execution guidance

## Success Indicators

- Future prompt updates follow consistent v2.0.0 format
- Agents understand "call tool directly" requirement
- Template is copy-paste ready for new prompts

## Dependencies

- Feature 010 prompt samples available in `evals/prompts/`
- quickstart.md created during planning phase

## Parallelization

T006, T007, T008 can run in parallel (independent files)

## Reviewer Guidance

Verify:
1. Template includes 3+ mentions of "CALL tool directly" (task section, steps, how-to)
2. eval_version = "2.0.0" in template
3. Quickstart covers WP execution model clearly

## Activity Log

- 2025-12-18T21:17:49Z – agent – lane=doing – Started implementation via workflow command
- 2025-12-18T21:18:23Z – unknown – lane=planned – Testing workflow command
- 2025-12-18T21:23:48Z – agent – lane=doing – Started implementation via workflow command
- 2025-12-18T21:24:43Z – unknown – lane=planned – Testing
- 2025-12-18T21:24:43Z – agent – lane=doing – Started implementation via workflow command
- 2025-12-18T21:26:39Z – agent – lane=doing – Started implementation via workflow command
