---
work_package_id: "WP02"
subtasks:
  - "T005"
  - "T006"
  - "T007"
  - "T008"
title: "Tool Concurrency Documentation"
phase: "Phase 1 - Core Documentation"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
history:
  - timestamp: "2025-11-26T00:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP02 – Tool Concurrency Documentation

## Objectives & Success Criteria

- Create `docs/tool-concurrency.md` categorizing all 173 tools by concurrency safety
- Provide complete lists: 82 safe tools, 91 potentially racy tools
- Explain categorization criteria clearly
- Include actionable recommendations for MCP client implementers

**Success Metrics:**
- Document exists at correct path
- All 173 tools are listed (82 + 91 = 173)
- Categories match research.md exactly
- Recommendations are practical and specific

## Context & Constraints

- **Spec**: `/kitty-specs/002-mcp-documentation-sprint/spec.md` - Deliverable 2
- **Research**: `/kitty-specs/002-mcp-documentation-sprint/research.md` - Section 1 has complete tool lists
- **Constitution**: Documentation-only feature, no code changes

**Key Technical Facts:**
- 173 total tools in mittwald-mcp
- 82 safe (47.4%) - read-only operations
- 91 racy (52.6%) - write/mutation operations
- Safe tools: get, list, show, dump, status, versions
- Racy tools: create, delete, update, deploy, restart

## Subtasks & Detailed Guidance

### Subtask T005 – Write summary section
- **Purpose**: Provide executive summary of tool concurrency characteristics.
- **Steps**:
  1. Create `docs/tool-concurrency.md`
  2. Add title and introduction
  3. Include summary table (total, safe, racy counts)
  4. Explain what "concurrency-safe" vs "potentially racy" means
- **Files**: `docs/tool-concurrency.md`
- **Parallel?**: No (establishes document structure)
- **Notes**: Use clear, non-technical language in summary.

**Suggested Structure:**
```markdown
# Tool Concurrency Guide

## Summary

The Mittwald MCP server provides 173 tools. When executing multiple tools
in parallel (batch requests), understanding their concurrency characteristics
is important:

| Category | Count | Percentage |
|----------|-------|------------|
| **Safe** (read-only) | 82 | 47.4% |
| **Potentially Racy** (mutations) | 91 | 52.6% |
| **Total** | 173 | 100% |

## What This Means

- **Safe tools** can be called concurrently without issues
- **Potentially racy tools** may conflict if called in parallel on the same resource
```

### Subtask T006 – Write safe tools categorized list
- **Purpose**: Provide complete list of concurrency-safe tools organized by domain.
- **Steps**:
  1. Add "Safe Tools" section
  2. Copy tool lists from research.md section 1
  3. Organize by category (App, Backup, Container, etc.)
  4. Include brief description of each category's safety rationale
- **Files**: `docs/tool-concurrency.md`
- **Parallel?**: Yes (independent section)
- **Notes**: Use collapsible details or tables for readability.

**Categories to Include (from research.md):**
- App Management (8): dependency-list, dependency-versions, download, get, list, open, ssh, versions
- Backup (3): download, get, list
- Container (2): list-services, logs
- Context (3): accessible-projects, get, set
- Conversation (4): categories, list, reply, show
- Cronjob (5): execution-get, execution-list, execution-logs, get, list
- Database (16): mysql/redis read operations
- Domain (6): dnszone-get, dnszone-list, get, list, virtualhost-get, virtualhost-list
- Extension (1): list
- Login (2): status, token
- Mail (4): address-get, address-list, deliverybox-get, deliverybox-list
- Organization (5): get, list, membership operations (read)
- Project (8): read operations
- Registry (1): list
- Server (2): get, list
- SFTP (1): user-list
- SSH (1): user-list
- Stack (2): list, ps
- User (7): token/session/ssh-key read operations
- Volume (1): list
- Development (2): ddev-init, ddev-render-config

### Subtask T007 – Write racy tools categorized list
- **Purpose**: Provide complete list of potentially racy tools organized by domain.
- **Steps**:
  1. Add "Potentially Racy Tools" section
  2. Copy tool lists from research.md section 1
  3. Organize by category
  4. Explain why each category is racy (mutations, state changes)
- **Files**: `docs/tool-concurrency.md`
- **Parallel?**: Yes (independent section)
- **Notes**: Emphasize "potentially" - not all concurrent calls will fail.

**Categories to Include (from research.md):**
- App Management (20): copy, create/*, dependency-update, install/*, uninstall, update, upgrade, upload
- Backup (6): create, delete, schedule-*
- Container (7): delete, recreate, restart, run, start, stop, update
- Context (1): reset
- Conversation (2): close, create
- Cronjob (5): create, delete, execute, execution-abort, update
- Database (7): mysql/redis create/delete/import/update operations
- Domain (3): dnszone-update, virtualhost-create, virtualhost-delete
- Extension (3): install, list-installed, uninstall
- Login (1): reset
- Mail (6): address/deliverybox create/delete/update
- Organization (6): delete, invite operations
- Project (6): create, delete, invite operations, update
- Registry (3): create, delete, update
- SFTP (4): user-create, user-delete, user-list, user-update
- SSH (4): user operations
- Stack (2): delete, deploy
- User (5): token/ssh-key create/delete/import/revoke
- Volume (2): create, delete

### Subtask T008 – Write MCP client recommendations section
- **Purpose**: Provide actionable guidance for MCP client implementers.
- **Steps**:
  1. Add "Recommendations for MCP Clients" section
  2. Explain safe parallelization strategies
  3. Describe resource-level coordination for racy tools
  4. Provide example scenarios
- **Files**: `docs/tool-concurrency.md`
- **Parallel?**: Yes (independent section)
- **Notes**: Target audience is MCP client developers, not end users.

**Recommended Content:**
```markdown
## Recommendations for MCP Clients

### Safe Parallelization
All 82 safe tools can be called concurrently without coordination:
- Batch multiple `list` operations freely
- Run `get` operations in parallel
- No resource locking needed

### Racy Tool Coordination
For the 91 potentially racy tools:
1. **Resource-level locks**: Prevent concurrent calls on the same resource ID
2. **Sequential execution**: For dependent operations (create → update)
3. **Idempotency checks**: Verify operation hasn't already completed

### Example Scenarios

**Safe**: Fetching project list + app list + backup list simultaneously
**Racy**: Creating two apps in the same project (may conflict)
**Mixed**: Reading project info while creating a backup (safe - different resources)
```

## Test Strategy

Not applicable (documentation only). Manual review for:
- All 173 tools are listed
- Tool counts match (82 safe, 91 racy)
- Categories match research.md
- No duplicate tools across categories

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Missing tools in lists | Cross-check totals (82 + 91 = 173) |
| Incorrect categorization | Validate against research.md |
| Outdated if tools added | Note document date, link to tool reference |

## Definition of Done Checklist

- [ ] `docs/tool-concurrency.md` exists
- [ ] Summary section with counts (82/91/173)
- [ ] Safe tools section with all 82 tools by category
- [ ] Racy tools section with all 91 tools by category
- [ ] Recommendations section for MCP clients
- [ ] Tool counts verified (82 + 91 = 173)
- [ ] Document renders correctly in GitHub markdown
- [ ] `tasks.md` updated with completion status

## Review Guidance

- Count total tools listed (must equal 173)
- Verify no tool appears in both safe and racy lists
- Check that categorization matches research.md exactly
- Ensure recommendations are actionable

## Activity Log

- 2025-11-26T00:00:00Z – system – lane=planned – Prompt created.
