# Agent E2E Summary: agent-e2e-2026-02-17T11-58-14

- Generated: 2026-02-17T13:21:21.210Z
- Coverage mode: all-agents
- Required coverage: 100%
- Gate: FAIL
- Cleanup test projects: enabled
- Cleanup project prefix: agent-e2e-2026-02-17T11-58-14

## Counts

- Total tools: 70
- Covered tools: 51
- Tool coverage: 72.86%
- Case runs: 70
- Passed runs: 51
- Failed runs: 19
- Matrix coverage: 72.86%

## Per-Agent Coverage

| Agent | Total | Passed | Failed | Coverage |
| --- | ---: | ---: | ---: | ---: |
| claude | 70 | 51 | 19 | 72.86% |

## Uncovered Tools

| Tool | Domain | Status by Agent |
| --- | --- | --- |
| mcp__mittwald__mittwald_database_mysql_delete | databases | claude:failure |
| mcp__mittwald__mittwald_database_mysql_user_create | databases | claude:failure |
| mcp__mittwald__mittwald_database_mysql_user_delete | databases | claude:failure |
| mcp__mittwald__mittwald_database_mysql_user_update | databases | claude:failure |
| mcp__mittwald__mittwald_project_get | project-foundation | claude:failure |
| mcp__mittwald__mittwald_project_invite_get | project-foundation | claude:failure |
| mcp__mittwald__mittwald_project_invite_list | project-foundation | claude:failure |
| mcp__mittwald__mittwald_project_list | project-foundation | claude:failure |
| mcp__mittwald__mittwald_project_membership_get | project-foundation | claude:failure |
| mcp__mittwald__mittwald_project_membership_list | project-foundation | claude:failure |
| mcp__mittwald__mittwald_project_ssh | project-foundation | claude:failure |
| mcp__mittwald__mittwald_project_update | project-foundation | claude:failure |
| mcp__mittwald__mittwald_server_get | project-foundation | claude:failure |
| mcp__mittwald__mittwald_server_list | project-foundation | claude:failure |
| mcp__mittwald__mittwald_ssh_user_create | ssh | claude:failure |
| mcp__mittwald__mittwald_ssh_user_delete | ssh | claude:failure |
| mcp__mittwald__mittwald_ssh_user_list | ssh | claude:failure |
| mcp__mittwald__mittwald_ssh_user_update | ssh | claude:failure |
| mcp__mittwald__mittwald_volume_create | volume | claude:failure |

## Project Cleanup

- Prefix: agent-e2e-2026-02-17T11-58-14
- Matched projects: 2
- Deleted projects: 2
- Failed deletions: 0
- Deleted IDs: 15f5367b-92bd-4761-ac33-f6bbb6f60db8, b009883e-ddc3-447f-a733-d3a6ff609aaf

## Gate Failure Reasons

- Tool coverage 72.86% is below required 100%
