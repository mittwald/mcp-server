# Project Foundation Domain Analysis

## Overview

- **Sessions analyzed**: 25
- **Tools tested**: conversation/categories, conversation/close, conversation/create, conversation/list, conversation/reply, conversation/show, ddev/init, ddev/render/config, project/create, project/delete, project/filesystem/usage, project/get, project/invite/get, project/invite/list, project/invite/list/own, project/list, project/membership/get, project/membership/get/own, project/membership/list, project/membership/list/own, project/ssh, project/update, server/get, server/list
- **Total token usage**: 6,595

## Confusion Incidents

| Session | Pattern | Severity | Token Waste | Details |
|---------|---------|----------|-------------|---------|
| 82fe3a46 | unnecessary-delegation | high | 25,773 | Spawned Task agent for: "Find documentation for the mcp__mittwald__mittwald" |
| 7cd39a72 | unnecessary-delegation | high | 25,472 | Spawned Task agent for: "Test mcp__mittwald__mittwald_project_membership_ge" |
| dc91c8b5 | unnecessary-delegation | high | 21,451 | Spawned Task agent for: "Investigate how to use the "project/invite/list" M" |
| e36145ae | retry-loop | medium | 187 | 3 consecutive errors before success |
| faa23269 | wrong-tool-selection | medium | 137 | Used Bash instead of calling mcp__mittwald__mittwald_project_delete directly |
| faa23269 | wrong-tool-selection | medium | 110 | Used Bash instead of calling mcp__mittwald__mittwald_project_delete directly |
| 87f44ba9 | retry-loop | medium | 105 | 3 consecutive errors before success |
| adb890a5 | retry-loop | low | 35 | 4 consecutive errors, session ended without success |
| d67809ea | retry-loop | low | 30 | 4 consecutive errors before success |
| 77879fc5 | retry-loop | low | 24 | 3 consecutive errors before success |
| dc91c8b5 | retry-loop | low | 24 | 3 consecutive errors, session ended without success |
| 520f7774 | retry-loop | low | 23 | 3 consecutive errors before success |
| 82fe3a46 | retry-loop | low | 23 | 3 consecutive errors before success |
| 257dafcf | retry-loop | low | 20 | 3 consecutive errors before success |
| 7cd39a72 | stuck-indicator | low | 13 | 134s gap between events (possible stuck state) |
| 48d821f7 | stuck-indicator | low | 8 | 77s gap between events (possible stuck state) |
| 77879fc5 | capability-mismatch | low | 8 | Model claude-3-haiku-20240307 does not support WebSearch |
| 87f44ba9 | capability-mismatch | low | 8 | Model claude-3-haiku-20240307 does not support WebSearch |
| d67809ea | capability-mismatch | low | 8 | Model claude-3-haiku-20240307 does not support WebSearch |
| f7c69fde | wrong-tool-selection | low | 8 | Used SlashCommand instead of calling mcp__mittwald__mittwald_project_ssh directly |

**Summary**: 27 incidents, 73,487 tokens wasted

## Tool Dependencies

Dependencies involving Project Foundation tools:

| Prerequisite | Required For | Confidence |
|--------------|--------------|------------|
| server/list | sftp/user/delete | 100% |
| server/list | project/create | 100% |
| sftp/user/create | server/get | 100% |
| org/membership/list | project/list | 50% |

## Efficiency Metrics

| Metric | Value |
|--------|-------|
| Average tokens per session | 264 |
| Success rate | 88% |
| Most problematic tool | project/membership/get |
| Incident count | 27 |
| Average session duration | 38.3s |

## Recommendations

- Improve tool descriptions for project-foundation domain tools to reduce wrong tool selection (7 incidents)
- Add error recovery guidance for project-foundation tools to reduce retry loops (9 incidents)
- Document model requirements for project-foundation tools with capability mismatches (4 incidents)
- Investigate high token waste in project-foundation domain (73,487 tokens)
- Address 3 high-severity incidents in project-foundation domain
- Focus attention on project/membership/get - most frequent incident source

---
*Generated on 2025-12-04*