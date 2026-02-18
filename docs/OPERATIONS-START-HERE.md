# Customer Operations: Start Here

This is the fastest path for customer operators who need to:

1. deploy and run the Mittwald MCP server + OAuth bridge
2. build and verify both documentation sites
3. execute functional MCP testing with real coding agents

## 1) Deploy and Operate MCP + OAuth

Read in this order:

1. `README.md` (repo overview and architecture pointers)
2. `ARCHITECTURE.md` (auth flow and service boundaries)
3. `DEPLOY.md` (deployment mechanics)
4. `docs/DEPLOYMENT-GUIDE.md` (operational deployment details)
5. `docs/CREDENTIAL-SECURITY.md` (token and secret handling requirements)

## 2) Build and Validate Both Docs Sites

Primary runbook:

- `docs/DOCS-SITES-OPERATIONS.md`

Single command:

```bash
cd docs
./build-all.sh local
```

## 3) Run Functional Testing in Real Agents

Primary runbook:

- `docs/FUNCTIONAL-TESTING-OPERATIONS.md`

Read alongside:

1. `evals/AGENT-E2E-PLAYBOOK.md`
2. `evals/scripts/README.md`
3. `tests/functional/use-case-library/README.md`

Core commands:

```bash
npm run eval:agent:auth -- --target=fly --agents=claude,codex,opencode
npm run eval:agent:preflight -- --agents=claude,codex,opencode
npm run eval:agent:e2e -- --agents=claude --require-coverage=100
npm run eval:agent:results -- --agent=claude
```

## 4) Canonical Output Locations

- Agent E2E results: `evals/results/agent-e2e/`
- Docs build output:
  - `docs/setup-and-guides/dist/`
  - `docs/reference/dist/`
