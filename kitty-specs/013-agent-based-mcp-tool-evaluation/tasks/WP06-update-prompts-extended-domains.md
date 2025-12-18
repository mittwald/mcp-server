---
work_package_id: WP06
title: Update Tool Prompts (Extended Domains)
subtasks:
  - T018
  - T019
  - T020
  - T021
priority: P1
lane: planned
history:
  - date: 2025-12-18
    action: created
    agent: Claude
---

# Work Package 06: Update Tool Prompts (Extended Domains)

## Objective

Update remaining eval prompts for mail, domain, certificate, user, context, conversation, cronjob, backup, ssh, sftp, stack, container, registry, volume domains (~76 tools).

## Subtask Guidance

### T018: Update mail/domain/certificate Prompts (21 current tools)

**Domains**: mail (10 tools), domain (9 tools), certificate (2 tools)

**Steps**: Same update pattern as WP05:
1. Load existing prompt
2. Update prompt markdown with "CALL tool directly" language
3. Update metadata (eval_version: "2.0.0", updated_at timestamp)
4. Verify tool_name and parameters match current MCP server
5. Save updated prompt

---

### T019: Update user/context/conversation Prompts (20 current tools)

**Domains**: user (12 tools), context (3 tools), conversation (5 tools)

**Steps**: Same update pattern

---

### T020: Update cronjob/backup/ssh/sftp Prompts (23 current tools)

**Domains**: cronjob (9 tools), backup (8 tools), ssh (4 tools), sftp (2 tools)

**Steps**: Same update pattern

---

### T021: Update stack/container/registry/volume Prompts (10 current tools)

**Domains**: stack (4 tools), container (1 tool), registry (4 tools), volume (1 tool)

**Steps**: Same update pattern

---

## Definition of Done

- [ ] 76 additional prompt files updated
- [ ] Total updated across WP05+WP06: 115 prompts (100% coverage)
- [ ] All prompts follow v2.0.0 format
- [ ] Domain distribution matches current inventory (19 domains)

## Parallelization

All 4 subtasks fully parallelizable (independent domains)

## Dependencies

WP05 completion establishes update pattern

## Verification

- Total prompts in `evals/prompts/` (excluding `_archived/`) = 115
- No prompts remain with eval_version "1.0.0"
- Domain count = 19

## Reviewer Guidance

Sample 2-3 prompts per subtask to verify format consistency and "CALL tool" language inclusion
