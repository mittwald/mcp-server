# Agent E2E Summary: agent-e2e-2026-02-17T13-37-29

- Generated: 2026-02-17T13:37:33.650Z
- Coverage mode: all-agents
- Required coverage: 100%
- Gate: FAIL
- Cleanup test projects: enabled
- Cleanup project prefix: agent-e2e-2026-02-17T13-37-29
- Aborted: [claude] MCP server 'mittwald' reported status 'needs-auth' at case 'project/create'

## Counts

- Total tools: 3
- Covered tools: 0
- Tool coverage: 0%
- Case runs: 1
- Passed runs: 0
- Failed runs: 1
- Matrix coverage: 0%

## Per-Agent Coverage

| Agent | Total | Passed | Failed | Coverage |
| --- | ---: | ---: | ---: | ---: |
| claude | 1 | 0 | 1 | 0% |

## Uncovered Tools

| Tool | Domain | Status by Agent |
| --- | --- | --- |
| mcp__mittwald__mittwald_project_create | project-foundation | claude:failure |
| mcp__mittwald__mittwald_project_delete | project-foundation | claude:not_run |
| mcp__mittwald__mittwald_project_get | project-foundation | claude:not_run |

## Project Cleanup

- Prefix: agent-e2e-2026-02-17T13-37-29
- Matched projects: 0
- Deleted projects: 0
- Failed deletions: 0

## Gate Failure Reasons

- Tool coverage 0% is below required 100%
- Execution aborted: [claude] MCP server 'mittwald' reported status 'needs-auth' at case 'project/create'
