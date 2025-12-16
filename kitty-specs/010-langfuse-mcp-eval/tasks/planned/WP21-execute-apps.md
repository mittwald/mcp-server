---
work_package_id: "WP21"
subtasks:
  - "T001"
title: "Execute Evals - apps (28 evals)"
phase: "Phase 4 - Eval Execution"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-12-16T13:21:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP21 – Execute Evals - apps (28 evals)

## Objective

Execute all 28 apps domain evals. This is the largest domain and covers app creation, installation, and lifecycle.

## Prerequisites

- **WP-10** completed (prompts generated)
- **WP-20** completed (project exists)
- Read project ID from `evals/state/current-project.json`

## Execution Order

### Phase A: List/Query (no resources needed)
| # | Tool | Notes |
|---|------|-------|
| 1 | `app/list` | List existing apps |
| 2 | `app/versions` | Available versions |
| 3 | `app/dependency-versions` | Dependency versions |

### Phase B: Create Simple App
| # | Tool | Notes |
|---|------|-------|
| 4 | `app/create/node` | Create Node.js app (track ID) |
| 5 | `app/get` | Get app details |
| 6 | `app/dependency-list` | App dependencies |
| 7 | `app/update` | Update description |
| 8 | `app/list-upgrade-candidates` | Check upgrades |

### Phase C: Other Create Types
| # | Tool | Notes |
|---|------|-------|
| 9 | `app/create/php` | Create PHP app |
| 10 | `app/create/php-worker` | Create PHP worker |
| 11 | `app/create/python` | Create Python app |
| 12 | `app/create/static` | Create static site |

### Phase D: Install Operations (LONG-RUNNING)
| # | Tool | Notes |
|---|------|-------|
| 13 | `app/install/wordpress` | ~5 min, track ID |
| 14-20 | Other installs | Optional based on time |

### Phase E: File Operations
| # | Tool | Notes |
|---|------|-------|
| 21 | `app/download` | Download app files |
| 22 | `app/upload` | Upload files |
| 23 | `app/copy` | Copy app |

### Phase F: Interactive/Info
| # | Tool | Notes |
|---|------|-------|
| 24 | `app/open` | Open in browser |
| 25 | `app/ssh` | SSH connection info |
| 26 | `app/upgrade` | Upgrade app |
| 27 | `app/dependency-update` | Update deps |

### Phase G: Cleanup (LAST)
| # | Tool | Notes |
|---|------|-------|
| 28 | `app/uninstall` | Uninstall created apps |

## Time Considerations

- `app/install/*` tools: 2-5 minutes each
- May skip some install types to manage total time
- Self-assess skipped tools with note

## Resource Tracking

Track all created apps:
```json
{
  "domain": "apps",
  "apps_created": [
    {"type": "node", "id": "a-xxx", "tool": "app/create/node"},
    {"type": "wordpress", "id": "a-yyy", "tool": "app/install/wordpress"}
  ]
}
```

## Session Log Storage

```
evals/results/sessions/apps/
├── app-list.jsonl
├── app-create-node.jsonl
└── ... (28 files)
```

## Deliverables

- [ ] 28 session logs (some installs may be skipped)
- [ ] At least 2 apps created and verified
- [ ] Created apps uninstalled at end

## Parallelization Notes

- Runs after WP-20 (needs project)
- Can run **in parallel** with WP-22 through WP-28
- Internal execution is sequential within domain

