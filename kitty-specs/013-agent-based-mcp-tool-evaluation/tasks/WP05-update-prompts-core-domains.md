---
work_package_id: WP05
title: Update Tool Prompts (Core Domains)
subtasks:
  - T014
  - T015
  - T016
  - T017
priority: P0
lane: planned
history:
  - date: 2025-12-18
    action: created
    agent: Claude
---

# Work Package 05: Update Tool Prompts (Core Domains)

## Objective

Update eval prompts for current tools in app, database, project, and organization domains (~39 tools). Apply v2.0.0 format with "CALL tool directly" emphasis.

## Subtask Guidance

### T014: Identify Tools Requiring Updates

**Steps**:
1. From WP01 diff report, identify tools marked as "unchanged" or "modified"
2. For each current tool (115 total), determine if prompt needs updates:
   - Tool name changed → requires update
   - Parameter schema changed → requires update
   - Tool description changed → requires update
   - Format version needs bump (1.0.0 → 2.0.0) → requires update (all tools)
3. Create update list by domain

---

### T015: Update app Domain Prompts (8 current tools)

**Current app tools**: app/list, app/get, app/update, app/upgrade, app/uninstall, app/copy, app/versions, app/list-upgrade-candidates

**Steps for each tool**:
1. Load existing prompt: `evals/prompts/app/{tool-name}.json`
2. Update `.input.prompt` markdown:
   - Add "**IMPORTANT**: You must CALL the MCP tool directly..." language
   - Verify tool_name matches current MCP name
   - Update parameter examples if schema changed
3. Update `.metadata`:
   - `eval_version`: "2.0.0"
   - `updated_at`: current ISO timestamp
   - `domain`: verify matches current domain structure
4. Save updated prompt
5. Repeat for all 8 tools

---

### T016: Update database Domain Prompts (14 current tools)

**Current database tools**: database/mysql/create, database/mysql/list, database/mysql/get, database/mysql/delete, database/mysql/versions, database/mysql/user-create, database/mysql/user-list, database/mysql/user-get, database/mysql/user-update, database/mysql/user-delete, database/redis/create, database/redis/list, database/redis/get, database/redis/versions

**Steps**: Same as T015, for 14 database tools

---

### T017: Update project/organization Domain Prompts (17 current tools)

**Current project tools**: project/create, project/list, project/get, project/delete, project/update, project/invite-get, project/invite-list, project/membership-get, project/membership-list, project/ssh

**Current organization tools**: org/list, org/get, org/invite, org/invite-list, org/invite-revoke, org/membership-list, org/membership-revoke

**Steps**: Same as T015, for 17 tools across both domains

---

## Definition of Done

- [ ] 39 prompt files updated with v2.0.0 format
- [ ] All prompts include "CALL tool directly" language
- [ ] Metadata updated (`eval_version`, `updated_at`)
- [ ] Parameter schemas verified against current MCP server

## Parallelization

T015, T016, T017 fully parallelizable (independent domains)

## Dependencies

- WP02 completion (template ready)
- WP01 completion (tool inventory available)

## Verification

Check sample prompts for:
- eval_version = "2.0.0"
- "CALL tool directly" language present in Task section
- tool_name matches current MCP tool registry

## Reviewer Guidance

Spot-check 3-5 updated prompts per domain to verify format consistency
