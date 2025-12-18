---
work_package_id: WP01
title: Tool Inventory & Diff Analysis
subtasks:
  - T001
  - T002
  - T003
  - T004
priority: P0
lane: planned
history:
  - date: 2025-12-18
    action: created
    agent: Claude
---

# Work Package 01: Tool Inventory & Diff Analysis

## Objective

Generate authoritative tool inventory for the current MCP server (115 tools) and create a detailed diff report comparing against feature 010 baseline (175 tools). This work package establishes the foundation for all prompt reconciliation work by identifying which tools were removed, renamed, modified, or added.

## Context

Feature 012 converted the MCP server from CLI process spawning to library-based architecture, reducing the tool count from 175 to 115 tools (34.3% reduction). Feature 010 created eval prompts for the 175-tool baseline. This work package quantifies the changes and categorizes them to drive reconciliation strategy.

**Key Facts**:
- **Current inventory**: 115 tools across 19 domains (queried 2025-12-18)
- **Baseline inventory**: 175 tools across 10 domains (feature 010)
- **Delta**: 60 tools removed/consolidated
- **Primary cause**: CLI-to-library conversion (feature 012)

## Subtask Guidance

### T001: Generate Current Tool Inventory JSON

**Goal**: Query the live MCP server and capture complete tool metadata for all 115 current tools.

**Steps**:
1. You already have access to the mittwald MCP server tools (list available in your function registry)
2. Extract all `mcp__mittwald__` tool names and metadata
3. Group tools by domain (extract domain from tool name pattern)
4. For each tool, capture:
   - MCP tool name (e.g., `mcp__mittwald__mittwald_app_list`)
   - Display name (e.g., `app/list`)
   - Domain (e.g., `app`)
   - Description (from tool schema)
   - Parameter schema (names, types, required fields)
5. Generate JSON output following this structure:

```json
{
  "captureDate": "2025-12-18T...",
  "featureContext": "013-agent-based-mcp-tool-evaluation",
  "toolCount": 115,
  "domainCount": 19,
  "tools": [
    {
      "mcpName": "mcp__mittwald__mittwald_app_list",
      "displayName": "app/list",
      "domain": "app",
      "description": "List apps in a project",
      "parameters": [
        {"name": "projectId", "type": "string", "required": true, "description": "..."}
      ]
    },
    ...
  ]
}
```

6. Write to: `evals/inventory/tools-current.json`

**Verification**:
- Tool count matches your function registry count (115 tools)
- All 19 domains represented
- No duplicate tool names
- All required fields populated

---

### T002: Create Diff Report

**Goal**: Compare current inventory against feature 010 baseline to identify all changes.

**Steps**:
1. Load feature 010 baseline from main branch:
   - Check `evals/prompts/` directories for existing prompts
   - OR use the 175-tool count from feature 010 research.md as reference
2. For each tool in baseline (175 tools):
   - Check if it exists in current inventory (115 tools)
   - If missing: mark as "removed"
   - If exists: check for parameter schema changes → mark as "modified" or "unchanged"
3. For each tool in current inventory (115 tools):
   - Check if it existed in baseline
   - If not found: mark as "new" (likely 0-5 tools)
4. Generate diff report JSON:

```json
{
  "baselineSnapshot": "010-langfuse-mcp-eval",
  "currentSnapshot": "013-agent-based-mcp-tool-evaluation",
  "generatedAt": "2025-12-18T...",
  "summary": {
    "baselineCount": 175,
    "currentCount": 115,
    "removedCount": 60,
    "renamedCount": 0,
    "newCount": 0,
    "unchangedCount": 85,
    "modifiedCount": 30
  },
  "changes": [
    {
      "changeType": "removed",
      "baselineTool": {
        "mcpName": "mcp__mittwald__mittwald_app_install_wordpress",
        "displayName": "app/install/wordpress",
        "domain": "apps"
      },
      "currentTool": null,
      "details": "Tool removed during CLI-to-library conversion (feature 012)",
      "reconciliationAction": {
        "type": "archive_prompt",
        "oldPromptPath": "evals/prompts/apps/app-install-wordpress.json",
        "archivePath": "evals/prompts/_archived/apps/app-install-wordpress.json"
      }
    },
    ...
  ]
}
```

5. Write to: `evals/inventory/diff-report.json`

**Verification**:
- Summary counts add up correctly (removed + renamed + new + unchanged + modified should relate to baseline and current counts)
- All 60 removed tools identified
- Change categorization makes sense

---

### T003: Categorize Tool Changes

**Goal**: Group removed, modified, and new tools by domain for batched reconciliation work.

**Steps**:
1. From diff report, extract all "removed" tools
2. Group by domain (apps, databases, identity, etc.)
3. Count tools per domain
4. Create categorization summary:

```markdown
## Removed Tools by Domain (60 total)

### apps (20 tools)
- app/install/wordpress
- app/install/typo3
- ...

### databases (8 tools)
- database/mysql/dump
- database/mysql/import
- ...

### identity (12 tools)
- user/ssh-key/import-legacy
- ...

[Continue for all domains...]
```

5. Append to diff report or create separate markdown file: `evals/inventory/removed-tools-by-domain.md`

**Verification**:
- All 60 removed tools accounted for
- Domain grouping matches current domain structure (19 domains)
- No tools miscategorized

---

### T004: Document Tool Mapping

**Goal**: Identify and document any renamed or consolidated tools.

**Steps**:
1. Analyze diff report "renamed" entries
2. Look for patterns:
   - Tool name changed but functionality similar
   - Multiple old tools consolidated into one new tool
   - Domain reorganization (tool moved from one domain to another)
3. Create mapping table:

```markdown
## Tool Renames/Consolidations

| Old Tool (010) | New Tool (013) | Change Type | Notes |
|----------------|----------------|-------------|-------|
| `mcp__mittwald__mittwald_...` | `mcp__mittwald__mittwald_...` | renamed | Parameter schema unchanged |
| `mcp__mittwald__mittwald_...` | `mcp__mittwald__mittwald_...` | consolidated | Multiple tools merged into one |

```

4. Write to: `evals/inventory/tool-mapping.md`

**Likely Result**: 0-5 renames (most changes are removals, not renames)

**Verification**:
- Mapping entries supported by evidence from tool schemas
- No ambiguous mappings (if unclear, mark as "needs manual review")

---

## Definition of Done

- [ ] `evals/inventory/tools-current.json` exists with 115 tools
- [ ] `evals/inventory/diff-report.json` shows detailed change analysis
- [ ] Removed tools categorized by domain (60 tools accounted for)
- [ ] Tool mapping documented (renames/consolidations identified)
- [ ] Summary counts validated (baseline 175 → current 115)

## Success Indicators

- Coverage analysis can be performed (115/115 tools mapped)
- WP03-WP07 can proceed with clear reconciliation targets
- No orphaned prompts after reconciliation (all removals identified)

## Risks & Mitigations

**Risk**: Tool renames misidentified as removals
**Mitigation**: Cross-reference tool descriptions and parameter schemas; when in doubt, mark as "needs manual review"

**Risk**: New tools missed
**Mitigation**: Iterate through entire current inventory (115 tools) to ensure no tools skipped

## Reviewer Guidance

Verify:
1. Tool count matches MCP server reality (115 tools)
2. Diff report summary counts add up correctly
3. No obvious missing tools or miscategorizations
4. Removed tool count (~60) matches expectation from feature 012 changes
