# Tasks Directory

This directory contains work package (WP) prompt files with lane status in frontmatter.

## Directory Structure (v0.9.0+)

```
tasks/
├── WP01-setup-infrastructure.md
├── WP02-user-authentication.md
├── WP03-api-endpoints.md
└── README.md
```

All WP files are stored **FLAT** in `tasks/`. The lane (planned, doing, for_review, done) is stored in the YAML frontmatter `lane:` field.

⚠️  **CRITICAL: NO SUBDIRECTORIES ALLOWED**

**DO NOT** create subdirectories in tasks/ for organization:
- ❌ `tasks/phase-1/WP01.md` - WRONG
- ❌ `tasks/backend/WP02.md` - WRONG
- ❌ `tasks/planned/WP03.md` - WRONG (old format)
- ✅ `tasks/WP01.md` - CORRECT

Even if your plan has "Phase 1", "Phase 2", etc., all WP files go directly in `tasks/`.
Use the `phase:` frontmatter field to track phases, not directories.

## Work Package File Format

Each WP file **MUST** use YAML frontmatter:

```yaml
---
work_package_id: "WP01"
title: "Work Package Title"
lane: "planned"
subtasks:
  - "T001"
  - "T002"
phase: "Phase 1 - Setup"
assignee: ""
agent: ""
shell_pid: ""
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-01-01T00:00:00Z"
    lane: "planned"
    agent: "system"
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP01 – Work Package Title

[Content follows...]
```

## Valid Lane Values

- `planned` - Ready for implementation
- `doing` - Currently being worked on
- `for_review` - Awaiting review
- `done` - Completed

## Moving Between Lanes

Use the CLI (updates frontmatter only, no file movement):
```bash
spec-kitty tasks update <WPID> --lane <lane>
```

Or use the helper script:
```bash
.kittify/scripts/bash/tasks-move-to-lane.sh <FEATURE> <WPID> <lane>
```

## File Naming

- Format: `WP01-kebab-case-slug.md`
- Examples: `WP01-setup-infrastructure.md`, `WP02-user-auth.md`
