# Functional Testing Operator Runbook

This is the canonical runbook for customer-operated functional testing against deployed Mittwald MCP endpoints using real coding agents.

If you need docs-site build instructions, use:
- `docs/DOCS-SITES-OPERATIONS.md`

## Read In This Order

1. This file (`FUNCTIONAL-TESTING-OPERATIONS.md`)
2. `evals/AGENT-E2E-PLAYBOOK.md`
3. `evals/scripts/README.md`
4. `tests/functional/use-case-library/README.md` (scenario library context)

## Scope

- Executes prompt-based MCP tool tests inside agent CLIs.
- Uses deployed MCP targets (`fly` by default, `mittwald` optional).
- Produces per-run artifacts and aggregate coverage across runs.
- Includes automatic test-project cleanup by default.

## Prerequisites

- Run from repository root.
- Agent CLIs installed for the agents you plan to test:
  - `claude`
  - `codex`
  - `opencode`
- Access/auth in Mittwald for the target account/environment.
- Node/npm installed per repository requirements.

## Operator Flow

### 1) Configure MCP endpoints and auth bootstrap

```bash
npm run eval:agent:auth -- --target=fly --agents=claude,codex,opencode
```

Switch to production endpoint target if needed:

```bash
npm run eval:agent:auth -- --target=mittwald --agents=claude,codex,opencode
```

### 2) Preflight (must pass before full run)

```bash
npm run eval:agent:preflight -- --agents=claude,codex,opencode
```

### 3) Execute full functional run (coverage gate)

```bash
npm run eval:agent:e2e -- \
  --agents=claude,codex,opencode \
  --require-coverage=100 \
  --coverage-mode=all-agents
```

### 4) Read latest run summary

```bash
npm run eval:agent:report
```

### 5) Aggregate exact outcomes across historical runs

```bash
npm run eval:agent:results -- --agent=claude
```

## Resume After Failure (Without Re-running Everything)

Run only failed domains or tools from the failing run.

Domain-limited rerun:

```bash
npm run eval:agent:e2e -- --agents=claude --domains=identity,databases
```

Tool-limited rerun:

```bash
npm run eval:agent:e2e -- --agents=claude --tools=mcp__mittwald__mittwald_user_get,mcp__mittwald__mittwald_project_list
```

Tip: get failing tools from a run summary:

```bash
jq -r '.perTool[] | select(.byAgent.claude=="failure") | .toolName' evals/results/agent-e2e/<run-id>/summary.json
```

## Cleanup Expectations

- Test-project cleanup is enabled by default in the runner.
- Keep cleanup enabled unless you are debugging:
  - default: `--cleanup-test-projects` (enabled)
  - disable only when needed: `--no-cleanup-test-projects`
- Each run can emit a cleanup report:
  - `evals/results/agent-e2e/<run-id>/project-cleanup.json`

## Artifact Locations

- Per-run output:
  - `evals/results/agent-e2e/<run-id>/summary.json`
  - `evals/results/agent-e2e/<run-id>/summary.md`
  - `evals/results/agent-e2e/<run-id>/results/<agent>/<domain>/*.json`
  - `evals/results/agent-e2e/<run-id>/project-cleanup.json` (when generated)
- Prompt corpus:
  - `evals/prompts-fly-live/`
