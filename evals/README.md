# Agent-Native E2E (Current)

`evals/` now contains only the current agent-native E2E path.

Operator start point:
- `docs/FUNCTIONAL-TESTING-OPERATIONS.md`

## Scope

- Prompt corpus for the deployed MCP endpoint: `evals/prompts-fly-live/` (the name predates the move off Fly)
- Runner + auth/bootstrap + reporting: `evals/scripts/`
- Run artifacts: `evals/results/agent-e2e/`

## Commands

```bash
# Configure agent MCP endpoints/auth bootstrap (target: https://mcp.mittwald.de/mcp)
npm run eval:agent:auth

# Check agent readiness (CLI + MCP tool visibility + auth)
npm run eval:agent:preflight -- --agents=claude,codex,opencode

# Execute tool E2E inside agents with coverage gate
npm run eval:agent:e2e -- --agents=claude --require-coverage=100

# Show latest single-run summary
npm run eval:agent:report

# Aggregate exact outcomes across all historical runs
npm run eval:agent:results -- --agent=claude
```
