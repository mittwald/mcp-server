# Research: Agent-Based MCP Tool Evaluation

**Feature**: 013-agent-based-mcp-tool-evaluation
**Date**: 2025-12-18
**Status**: In Progress

## Research Summary

This document captures research findings for updating the eval suite to match the post-012 MCP server architecture. Feature 012 converted the MCP server from CLI process spawning to library-based architecture, reducing the tool count from 175 to 115 tools.

---

## Research Question 1: Current Tool Inventory (Post-012)

### Question
What is the current tool inventory after feature 012's CLI-to-library conversion?

### Findings

**Source**: Live MCP server query to mittwald-mcp-fly2.fly.dev (2025-12-18)

#### Tool Count Summary

**Total Current Tools: 115**

This represents a **reduction of 60 tools** (34.3% decrease) from feature 010's baseline of 175 tools.

#### Tool Distribution by Domain

| Domain | Tool Count | Examples |
|--------|------------|----------|
| user | 12 | api-token/create, session/list, ssh-key/create |
| database | 14 | mysql/create, mysql/user-create, redis/create |
| project | 10 | create, list, membership-list, ssh |
| mail | 10 | address/create, deliverybox/create |
| cronjob | 9 | create, execute, execution-list |
| domain | 9 | dnszone/update, virtualhost-create |
| app | 8 | list, get, upgrade, versions |
| backup | 8 | create, schedule-create |
| organization | 7 | get, invite, membership-list |
| conversation | 5 | create, list, reply |
| ssh | 4 | user-create, user-list |
| registry | 4 | create, delete, list, update |
| stack | 4 | deploy, list, ps, delete |
| context | 3 | get-session, set-session, reset-session |
| certificate | 2 | list, request |
| server | 2 | get, list |
| sftp | 2 | user-delete, user-list |
| container | 1 | list |
| volume | 1 | list |

**Total Domains: 19**

### Decision

**D-001**: Use this 115-tool inventory as the authoritative list for eval prompt reconciliation. All eval prompts must map 1:1 to these tools.

**Rationale**: The live MCP server represents production reality post-012. Feature 010's 175-tool baseline is now historical.

---

## Research Question 2: Tool Inventory Changes (010 → 013)

### Question
What specific tools were removed, renamed, or added during the CLI-to-library conversion?

### Findings

**Source**: Comparison of feature 010 research.md (175 tools) vs current MCP server query (115 tools)

#### High-Level Changes

- **Removed/Consolidated**: ~60 tools (34.3% reduction)
- **Renamed**: TBD (requires detailed mapping)
- **New**: TBD (requires detailed analysis)
- **Unchanged**: ~115 tools retained (some may have parameter changes)

#### Domain-Level Analysis

**Domains in Feature 010 but NOT in Current Inventory**:
- `ddev` (2 tools: init, render-config) - **Status**: May be MCP resources instead of tools
- `login` (3 tools: status, token, reset) - **Status**: Likely consolidated or removed
- `extension` (part of organization domain in 010) - **Status**: Unclear if removed or renamed

**New Domains in Current Inventory**:
- `registry` (4 tools) - **Status**: Possibly renamed from feature 010 or newly exposed
- `volume` (1 tool) - **Status**: Possibly split from containers domain

#### Reconciliation Strategy by Domain

| Feature 010 Domain | Current Domain | Action Required |
|-------------------|----------------|-----------------|
| identity (17 tools) | user (12 tools) | RECONCILE: -5 tools, may include renames |
| organization (14 tools) | organization (7 tools) | RECONCILE: -7 tools |
| project-foundation (16 tools) | project (10 tools), server (2 tools) | RECONCILE: Split or consolidated |
| apps (28 tools) | app (8 tools) | RECONCILE: Major reduction, many install/* tools likely removed |
| containers (15 tools) | container (1 tool), stack (4 tools), volume (1 tool), registry (4 tools) | RECONCILE: Split across multiple domains |
| databases (22 tools) | database (14 tools) | RECONCILE: -8 tools |
| domains-mail (18 tools) | domain (9 tools), mail (10 tools) | RECONCILE: Already split in feature 010, verify mapping |
| access-users (8 tools) | ssh (4 tools), sftp (2 tools) | RECONCILE: -2 tools |
| automation (11 tools) | cronjob (9 tools) | RECONCILE: -2 tools |
| backups (9 tools) | backup (8 tools) | RECONCILE: -1 tool |
| conversation (6 tools) | conversation (5 tools) | RECONCILE: -1 tool |
| login (3 tools) | **REMOVED** | ARCHIVE: All prompts |
| ddev (2 tools) | **REMOVED or MCP resources** | INVESTIGATE: May be resources instead |
| certificate (2 tools) | certificate (2 tools) | VALIDATE: Likely unchanged |

#### Tool Reduction Hypothesis

Based on feature 012's goal (CLI-to-library conversion), the tool reduction likely came from:

1. **Removal of CLI-specific commands**: Commands that wrapped CLI installation, configuration, or help may have been removed
2. **Consolidation of app installers**: Feature 010 had many `app/install/*` tools (wordpress, typo3, joomla, etc.) - these may have been consolidated into fewer tools
3. **Removal of interactive tools**: Tools requiring interactive input (shell, phpmyadmin, port-forward) may have been removed
4. **Simplification**: Tools that were redundant or had overlapping functionality may have been merged

### Decision

**D-002**: Perform detailed tool-by-tool diff analysis in Phase 1 to create precise mapping of removed, renamed, and new tools.

**Rationale**: Cannot accurately reconcile prompts without understanding exact changes. This requires examining both feature 010 prompts and current MCP server schema.

---

## Research Question 3: Eval Prompt Format Compatibility

### Question
Can we reuse feature 010's Langfuse eval prompt format, or does it require updates?

### Findings

**Source**: Feature 010 research.md, sample prompts in `/Users/robert/Code/mittwald-mcp/evals/prompts/`

#### Feature 010 Langfuse Format

```json
{
  "input": {
    "prompt": "...",  // Markdown prompt text with self-assessment instructions
    "tool_name": "mcp__mittwald__mittwald_org_get",
    "display_name": "org/get",
    "context": {
      "dependencies": ["org/list"],
      "setup_instructions": "...",
      "required_resources": []
    }
  },
  "expectedOutput": null,
  "metadata": {
    "domain": "organization",
    "tier": 1,
    "tool_description": "...",
    "success_indicators": ["...", "..."],
    "self_assessment_required": true,
    "eval_version": "1.0.0",
    "created_at": "ISO-8601",
    "tags": ["organization", "tier-1", "read-only"]
  }
}
```

#### Self-Assessment Schema (Feature 010)

```json
{
  "success": true,
  "confidence": "high",
  "tool_executed": "mcp__mittwald__mittwald_org_get",
  "timestamp": "2025-12-16T15:52:11.592Z",
  "problems_encountered": [],
  "resources_created": [],
  "resources_verified": [],
  "tool_response_summary": "...",
  "execution_notes": "..."
}
```

Markers for extraction:
```
<!-- SELF_ASSESSMENT_START -->
{...json...}
<!-- SELF_ASSESSMENT_END -->
```

#### Compatibility Assessment

**Format Changes Required**: MINOR

Changes needed:
1. **Prompt text emphasis**: Add explicit "CALL tool directly, do NOT write scripts" language
2. **Metadata updates**: Update `eval_version` to 2.0.0 to reflect post-012 baseline
3. **Timestamp updates**: Regenerate `created_at` for modified prompts
4. **Domain names**: Verify domain names match current 19-domain structure

**No changes required**:
- Overall JSON structure (input, expectedOutput, metadata)
- Self-assessment schema
- Marker extraction pattern
- Field types and validation

### Decision

**D-003**: Reuse feature 010's Langfuse format with minor updates (version bump, prompt language emphasis, timestamp refresh).

**Rationale**: Format is working and Langfuse-compatible. Changes are additive (emphasis on tool calling) rather than structural.

---

## Research Question 4: Agent Execution Model

### Question
How should eval prompts be structured for manual agent execution via WP files and `/spec-kitty.implement`?

### Findings

**Source**: User confirmation, spec-kitty workflow documentation

#### Execution Flow

1. **User spawns agents** manually (not automated orchestration)
2. **WP prompt files** contain eval instructions embedded
3. **Agents execute** via `/spec-kitty.implement` command on WP file
4. **Agents call MCP tools** directly (not write automation scripts)
5. **Agents provide self-assessment** after execution

#### Prompt Structure Requirements

The `.input.prompt` field must contain complete, standalone instructions that:
- State the goal clearly
- Specify the exact MCP tool to call (with full `mcp__mittwald__` prefix)
- Provide parameter guidance
- **Emphasize calling the tool directly** (not writing scripts)
- Include self-assessment instructions with JSON schema
- Embed marker comments for extraction

#### Critical Language

Feature 010 prompts say:
```markdown
## Task
Execute the `mcp__mittwald__mittwald_org_get` tool and verify the result.
```

Feature 013 prompts must say:
```markdown
## Task
Execute the `mcp__mittwald__mittwald_org_get` MCP tool directly with appropriate parameters.

**IMPORTANT**: You must CALL the MCP tool directly. Do NOT write a script or automation to simulate the tool call.
```

### Decision

**D-004**: Update all prompts to include explicit "CALL tool directly, NOT write scripts" language to prevent agents from misinterpreting instructions.

**Rationale**: User clarification identified this as a risk. Prompts must be unambiguous about execution method.

---

## Research Question 5: Infrastructure Reuse from Feature 010

### Question
What infrastructure from feature 010 can be reused for feature 013?

### Findings

**Source**: Feature 010 file structure at `/Users/robert/Code/mittwald-mcp/kitty-specs/010-langfuse-mcp-eval/`

#### Reusable Components

| Component | Location | Reuse Status |
|-----------|----------|--------------|
| **Eval prompts** | `evals/prompts/{domain}/` | PARTIAL: 115/175 prompts need reconciliation |
| **JSON schemas** | `contracts/*.schema.json` | FULL: Self-assessment schema unchanged |
| **Prompt template** | `templates/eval-prompt.md` | UPDATE: Add "call tool" emphasis |
| **Extraction scripts** | `scripts/extract-self-assessment.ts` | FULL: Marker pattern unchanged |
| **Inventory structure** | `evals/inventory/tools.json` | UPDATE: Regenerate for 115 tools |
| **Dependency graph** | `evals/inventory/dependency-graph.json` | UPDATE: Regenerate for 115 tools |
| **Tier classification** | Tier 0-4 model | REUSE: Concept unchanged, reclassify tools |

#### New Components Needed

| Component | Purpose |
|-----------|---------|
| **Diff report** | Document 010→013 changes (removed, renamed, new) |
| **Archive directory** | Store prompts for 60 removed tools |
| **Tool mapping** | Map old tool names to new names (renames) |
| **Quickstart guide** | Instruct agents how to execute WP prompts |

### Decision

**D-005**: Reuse feature 010 infrastructure (schemas, extraction, templates) with targeted updates (tool inventory, prompt language, diff documentation).

**Rationale**: Feature 010 established sound patterns. Feature 013 is an update/reconciliation, not a redesign.

---

## Open Questions

| # | Question | Status | Priority |
|---|----------|--------|----------|
| 1 | Which specific tools were renamed vs removed? | PENDING | P0 |
| 2 | Are there new tools not in feature 010? | PENDING | P0 |
| 3 | Do any tools have parameter schema changes? | PENDING | P1 |
| 4 | Are ddev tools now MCP resources instead of tools? | PENDING | P2 |
| 5 | Should we regenerate tier classification or reuse 010's? | PENDING | P1 |

These will be resolved during Phase 1 (data-model.md creation and detailed diff analysis).

---

## Evidence References

All sources and findings are based on:
- Feature 010 research.md and prompts (`/Users/robert/Code/mittwald-mcp/kitty-specs/010-langfuse-mcp-eval/`)
- Feature 012 spec.md and data-model.md (`/Users/robert/Code/mittwald-mcp/kitty-specs/012-convert-mittwald-cli/`)
- Live MCP server query (2025-12-18, 115 tools confirmed)
- User clarifications (manual agent spawning, "call tools directly" emphasis, no Langfuse platform deployment)

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-18 | Initial research structure created | Claude |
| 2025-12-18 | Tool inventory discovery and diff analysis | Claude |
