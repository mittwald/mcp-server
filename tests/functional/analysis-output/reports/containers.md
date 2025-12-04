# Containers Domain Analysis

## Overview

- **Sessions analyzed**: 20
- **Tools tested**: container/delete, container/list, container/logs, container/recreate, container/restart, container/run, container/start, container/stop, container/update, registry/create, registry/delete, registry/list, registry/update, stack/delete, stack/deploy, stack/list, stack/ps, volume/create, volume/delete, volume/list
- **Total token usage**: 6,659

## Confusion Incidents

| Session | Pattern | Severity | Token Waste | Details |
|---------|---------|----------|-------------|---------|
| fddfebd2 | retry-loop | medium | 310 | 3 consecutive errors before success |
| 65deff6d | wrong-tool-selection | medium | 162 | Used Bash instead of calling mcp__mittwald__mittwald_stack_delete directly |
| 0e3e24d0 | wrong-tool-selection | medium | 135 | Used Bash instead of calling mcp__mittwald__mittwald_volume_delete directly |
| 009148fb | retry-loop | medium | 133 | 3 consecutive errors, session ended without success |
| 65deff6d | wrong-tool-selection | medium | 131 | Used Bash instead of calling mcp__mittwald__mittwald_stack_delete directly |
| d632e97f | wrong-tool-selection | medium | 130 | Used Bash instead of calling mcp__mittwald__mittwald_container_run directly |
| e9bd881b | wrong-tool-selection | medium | 125 | Used Bash instead of calling mcp__mittwald__mittwald_container_logs directly |
| 009148fb | wrong-tool-selection | medium | 115 | Used Bash instead of calling mcp__mittwald__mittwald_registry_create directly |
| d06ffe75 | wrong-tool-selection | medium | 112 | Used Bash instead of calling mcp__mittwald__mittwald_volume_create directly |
| fddfebd2 | wrong-tool-selection | medium | 104 | Used SlashCommand instead of calling mcp__mittwald__mittwald_container_update directly |
| 65deff6d | wrong-tool-selection | medium | 102 | Used Bash instead of calling mcp__mittwald__mittwald_stack_delete directly |
| 7ab00b93 | wrong-tool-selection | medium | 98 | Used Bash instead of calling mcp__mittwald__mittwald_container_recreate directly |
| 7a247f34 | retry-loop | low | 23 | 3 consecutive errors before success |
| 4ec1f00e | retry-loop | low | 21 | 3 consecutive errors before success |
| 15c53b2e | stuck-indicator | low | 12 | 122s gap between events (possible stuck state) |
| a6859c6f | capability-mismatch | low | 11 | Model claude-3-haiku-20240307 does not support WebSearch |
| ff98bc8f | capability-mismatch | low | 11 | Model claude-3-haiku-20240307 does not support WebSearch |
| 14c93128 | wrong-tool-selection | low | 9 | Used Bash instead of calling mcp__mittwald__mittwald_container_list directly |
| 65deff6d | wrong-tool-selection | low | 8 | Used Bash instead of calling mcp__mittwald__mittwald_stack_delete directly |
| 65deff6d | wrong-tool-selection | low | 7 | Used Bash instead of calling mcp__mittwald__mittwald_stack_delete directly |

**Summary**: 26 incidents, 1,785 tokens wasted

## Tool Dependencies

Dependencies involving Containers tools:

No dependencies detected for this domain.

## Efficiency Metrics

| Metric | Value |
|--------|-------|
| Average tokens per session | 333 |
| Success rate | 100% |
| Most problematic tool | stack/delete |
| Incident count | 26 |
| Average session duration | 22.7s |

## Recommendations

- Improve tool descriptions for containers domain tools to reduce wrong tool selection (18 incidents)
- Add error recovery guidance for containers tools to reduce retry loops (4 incidents)
- Document model requirements for containers tools with capability mismatches (3 incidents)
- Focus attention on stack/delete - most frequent incident source

---
*Generated on 2025-12-04*