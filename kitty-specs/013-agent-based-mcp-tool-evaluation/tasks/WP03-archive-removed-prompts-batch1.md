---
work_package_id: WP03
title: Archive Removed Tool Prompts (Batch 1)
subtasks:
  - T009
  - T010
  - T011
priority: P1
lane: planned
history:
  - date: 2025-12-18
    action: created
    agent: Claude
---

# Work Package 03: Archive Removed Tool Prompts (Batch 1)

## Objective

Archive eval prompts for removed tools in app, database, and automation domains (~38 tools total from the 60 removed tools).

## Context

WP01 identified ~60 tools removed during feature 012's CLI-to-library conversion. These prompts must be archived (not deleted) for historical reference and potential future restoration.

## Subtask Guidance

### T009: Archive Removed app/* Tool Prompts (~20 tools)

**Steps**:
1. From WP01 diff report, get list of removed app domain tools
2. For each removed tool:
   - Locate prompt file: `evals/prompts/app/{tool-name}.json` or `evals/prompts/apps/{tool-name}.json`
   - Create archive directory: `evals/prompts/_archived/app/` (if not exists)
   - Move file to archive directory
   - Add archive metadata to JSON (or create separate _metadata.json):
     ```json
     {
       "_archive_metadata": {
         "date": "2025-12-18",
         "reason": "feature-012-removal",
         "feature": "013-agent-based-mcp-tool-evaluation",
         "original_path": "evals/prompts/app/..."
       }
     }
     ```
3. Verify no removed tool prompts remain in active directory

**Likely tools**: app/install/wordpress, app/install/typo3, app/install/joomla, etc.

---

### T010: Archive Removed database/* Tool Prompts (~8 tools)

**Steps**: Same as T009, but for database domain
- Look in: `evals/prompts/database/` or `evals/prompts/databases/`
- Archive to: `evals/prompts/_archived/database/`

**Likely tools**: database/mysql/dump, database/mysql/import, database/mysql/shell, etc.

---

### T011: Archive Removed automation/login/misc Tool Prompts (~10 tools)

**Steps**: Same as T009, but for automation, login, misc domains
- Archive automation tools to: `evals/prompts/_archived/automation/`
- Archive login tools to: `evals/prompts/_archived/login/`
- Archive misc tools to: `evals/prompts/_archived/misc/`

**Likely domains**: cronjob (if tools removed), login (all 3 tools likely removed), ddev (2 tools)

---

## Definition of Done

- [ ] ~38 prompt files moved to `_archived/` directories
- [ ] Archive metadata added to files or accompanying metadata file
- [ ] Original domain directories cleaned (no prompts for non-existent tools)
- [ ] Archive directory structure matches original domain structure

## Parallelization

All 3 subtasks fully parallelizable (different domain directories)

## Verification

Check: `evals/prompts/_archived/` contains ~38 files across app, database, automation, login, misc domains

## Reviewer Guidance

Verify no active prompts exist for tools that don't exist in current inventory (115 tools)
