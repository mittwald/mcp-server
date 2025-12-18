---
work_package_id: WP07
title: Create New Tool Prompts & Validate
subtasks:
  - T022
  - T023
  - T024
priority: P2
lane: planned
history:
  - date: 2025-12-18
    action: created
    agent: Claude
---

# Work Package 07: Create New Tool Prompts & Validate

## Objective

Create prompts for any new tools not in feature 010 baseline (likely 0-5 tools), and spot-check unchanged prompts for accuracy.

## Subtask Guidance

### T022: Identify New Tools

**Steps**:
1. From WP01 diff report, extract tools marked as "new"
2. Likely result: 0-5 tools (most changes were removals/renames)
3. For each new tool, gather:
   - MCP tool name, display name, domain
   - Parameter schema from current MCP server
   - Tool description
   - Infer dependency tier (based on parameters - if requires projectId, likely Tier 4)
4. Create list of new tools requiring prompts

**Expected outcome**: 0-5 new tools identified

---

### T023: Create Prompts for New Tools

**Steps** (if new tools exist):
1. For each new tool, use WP02 template (`contracts/eval-prompt-template.md`)
2. Fill in:
   - Tool name, display name, domain, description
   - Dependencies (infer from parameter requirements)
   - Success indicators (based on tool purpose)
   - Self-assessment schema (standard format)
3. Set metadata:
   - eval_version: "2.0.0"
   - created_at: current ISO timestamp
   - domain, tier, tags
4. Save to: `evals/prompts/{domain}/{tool-name}.json`

**Expected outcome**: 0-5 new prompt files created

---

### T024: Spot-Check Unchanged Prompts

**Steps**:
1. From WP01 diff report, identify tools marked as "unchanged" (~85 tools)
2. Select 20% sample per domain for spot-checking (~17 tools)
3. For each sampled tool:
   - Verify tool_name matches current MCP server
   - Verify parameter schema is current (check MCP tool definition)
   - Verify success indicators are still relevant
   - Verify no typos or outdated references
4. Document any issues found
5. If issues found: update prompts (same process as WP05/WP06)

**Expected outcome**: 0-3 issues found and fixed

---

## Definition of Done

- [ ] All new tools (if any) have prompts
- [ ] Spot-check validation confirms existing prompts are accurate
- [ ] No orphaned prompts (tools that don't exist)
- [ ] No missing prompts (tools without prompts)

## Parallelization

T023 and T024 can run in parallel if new tools identified

## Verification

Final count check:
- Current tools (115) = Active prompts (115) + Archived prompts (~60) - Removed from baseline (175)
- Math: 115 active + 60 archived = 175 (baseline coverage complete)

## Reviewer Guidance

Verify final prompt count matches tool count (115 active prompts for 115 current tools)
