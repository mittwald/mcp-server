# Tasks Directory

This directory contains work package prompt files organized in a kanban-style structure.

## Directory Structure

```
tasks/
├── planned/      # Work packages ready to be picked up
├── doing/        # Work packages currently being implemented
├── for_review/   # Work packages completed, awaiting review
└── done/         # Completed and reviewed work packages
```

## Work Package File Format

Each work package file uses YAML frontmatter for metadata:

```yaml
---
work_package_id: "WP01"
subtasks:
  - "T001"
title: "Work Package Title"
phase: "Phase 1 - Infrastructure & Schemas"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-12-16T13:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP01 – Work Package Title

## Objective
...
```

## Lane Transitions

Files move between directories as work progresses:

1. `planned/` → `doing/` - When an agent starts working on the WP
2. `doing/` → `for_review/` - When implementation is complete
3. `for_review/` → `done/` - After review approval
4. `for_review/` → `doing/` - If review finds issues

## Commands

- `/spec-kitty.implement` - Execute work packages from planned
- `/spec-kitty.review` - Review completed work packages

## Work Packages Summary

| Phase | WP Range | Description |
|-------|----------|-------------|
| Phase 1 | WP01-WP06 | Infrastructure & Schemas |
| Phase 2 | WP07-WP17 | Prompt Authoring |
| Phase 3 | WP18-WP28 | Eval Execution |
| Phase 4 | WP29-WP32 | Results & Analysis |
