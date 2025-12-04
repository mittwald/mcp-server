# Backups Domain Analysis

## Overview

- **Sessions analyzed**: 10
- **Tools tested**: backup/create, backup/delete, backup/download, backup/get, backup/list, backup/schedule/create, backup/schedule/delete, backup/schedule/list, backup/schedule/update
- **Total token usage**: 1,978

## Confusion Incidents

| Session | Pattern | Severity | Token Waste | Details |
|---------|---------|----------|-------------|---------|
| c891cafa | unnecessary-delegation | high | 71,092 | Spawned Task agent for: "Test the mcp__mittwald__mittwald_backup_get MCP to" |
| c891cafa | unnecessary-delegation | high | 17,117 | Spawned Task agent for: "Find documentation on the mcp__mittwald__mittwald_" |
| c891cafa | wrong-tool-selection | medium | 204 | Used Bash instead of calling mcp__mittwald__mittwald_backup_get directly |
| c891cafa | wrong-tool-selection | medium | 185 | Used Bash instead of calling mcp__mittwald__mittwald_backup_get directly |
| c5cbcb6b | wrong-tool-selection | medium | 126 | Used Bash instead of calling mcp__mittwald__mittwald_backup_download directly |
| 65225b79 | wrong-tool-selection | medium | 119 | Used Bash instead of calling mcp__mittwald__mittwald_backup_schedule_create directly |
| 9dfd8924 | retry-loop | medium | 112 | 3 consecutive errors, session ended without success |
| c891cafa | wrong-tool-selection | medium | 100 | Used Bash instead of calling mcp__mittwald__mittwald_backup_get directly |
| 9dfd8924 | wrong-tool-selection | medium | 94 | Used Bash instead of calling mcp__mittwald__mittwald_backup_delete directly |
| c891cafa | stuck-indicator | low | 23 | 225s gap between events (possible stuck state) |
| f7fdc336 | retry-loop | low | 22 | 3 consecutive errors, session ended without success |
| d9dd91f8 | capability-mismatch | low | 11 | Model claude-3-haiku-20240307 does not support WebSearch |
| 53619bd8 | wrong-tool-selection | low | 8 | Used SlashCommand instead of calling mcp__mittwald__mittwald_backup_schedule_update directly |
| c891cafa | capability-mismatch | low | 8 | Model claude-3-haiku-20240307 does not support WebSearch |
| f4116491 | capability-mismatch | low | 8 | Model claude-3-haiku-20240307 does not support WebSearch |
| 2f3430bb | wrong-tool-selection | low | 3 | Used Bash instead of calling mcp__mittwald__mittwald_backup_schedule_list directly |
| c5cbcb6b | wrong-tool-selection | low | 3 | Used Bash instead of calling mcp__mittwald__mittwald_backup_download directly |
| f7fdc336 | wrong-tool-selection | low | 3 | Used Bash instead of calling mcp__mittwald__mittwald_backup_list directly |
| c891cafa | unnecessary-delegation | low | 0 | Spawned Task agent for: "Find the MCP tool configuration for backup retriev" |

**Summary**: 19 incidents, 89,238 tokens wasted

## Tool Dependencies

Dependencies involving Backups tools:

No dependencies detected for this domain.

## Efficiency Metrics

| Metric | Value |
|--------|-------|
| Average tokens per session | 198 |
| Success rate | 90% |
| Most problematic tool | unknown |
| Incident count | 19 |
| Average session duration | 35.2s |

## Recommendations

- Improve tool descriptions for backups domain tools to reduce wrong tool selection (10 incidents)
- Document model requirements for backups tools with capability mismatches (3 incidents)
- Investigate high token waste in backups domain (89,238 tokens)
- Address 2 high-severity incidents in backups domain
- Focus attention on unknown - most frequent incident source

---
*Generated on 2025-12-04*