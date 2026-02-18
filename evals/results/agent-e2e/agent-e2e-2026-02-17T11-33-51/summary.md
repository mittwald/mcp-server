# Agent E2E Summary: agent-e2e-2026-02-17T11-33-51

- Generated: 2026-02-17T11:34:09.652Z
- Coverage mode: all-agents
- Required coverage: 0%
- Gate: FAIL
- Cleanup test projects: enabled
- Cleanup project prefix: agent-e2e-2026-02-17T11-33-51

## Counts

- Total tools: 1
- Covered tools: 0
- Tool coverage: 0%
- Case runs: 0
- Passed runs: 0
- Failed runs: 0
- Matrix coverage: 0%

## Per-Agent Coverage

| Agent | Total | Passed | Failed | Coverage |
| --- | ---: | ---: | ---: | ---: |
| codex | 0 | 0 | 0 | 0% |

## Preflight Failures

- codex: Probe did not call expected tool mcp__mittwald__mittwald_user_get Remediation: Ensure server 'mittwald' exists (codex mcp add mittwald --url https://mittwald-mcp-fly2.fly.dev/mcp) and authenticate with 'codex mcp login mittwald'.

## Uncovered Tools

| Tool | Domain | Status by Agent |
| --- | --- | --- |
| mcp__mittwald__mittwald_project_create | project-foundation | codex:not_run |

## Project Cleanup

- Prefix: agent-e2e-2026-02-17T11-33-51
- Matched projects: 0
- Deleted projects: 0
- Failed deletions: 0

## Gate Failure Reasons

- Preflight failed for: codex
