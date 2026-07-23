# Mittwald MCP Documentation Index

## Start Here

- `OPERATIONS-START-HERE.md` — operator entrypoint
- `../README.md` — repository overview
- `../ARCHITECTURE.md` — OAuth bridge and MCP service architecture
- `../DEPLOY.md` — how production is deployed, and how to self-host

## Operator Runbooks

- `DOCS-SITES-OPERATIONS.md` — build and validate both docs sites
- `FUNCTIONAL-TESTING-OPERATIONS.md` — run agent-native functional testing
- `CREDENTIAL-SECURITY.md` — secret/token handling standard
- `operations/redis.md` — Redis configuration, persistence and backup

## End-User Documentation Sites

- Setup & Guides source: `setup-and-guides/`
- Tool Reference source: `reference/` — **generated** from the tool registry; see
  `reference/README.md` before editing

## Maintainer References

- `../CLAUDE.md` — development guidelines (execution model, tool annotations, scopes, DCR)
- `MAINTAINERS-HANDBOOK.md` — operating the deployed system
- `testing.md` — test suites and how to run them
- `coverage.md` — Mittwald CLI coverage policy and regeneration
- `mittwald-cli-coverage.md` — generated coverage matrix (do not edit)
- `tooling-and-safety.md` — safety patterns for tool authors
- `developer/types.md` — type layout in `src/types/`
- `security/risk-register.md` — remediated, accepted and open security risks
- `oauth2c-end-to-end.md` — end-to-end OAuth verification with `oauth2c`
- `LLM-AGENTS.md` — guidance for agents consuming this server

## Functional Testing Assets

- `../evals/README.md`, `../evals/AGENT-E2E-PLAYBOOK.md`, `../evals/scripts/README.md`
- `../tests/functional/use-case-library/README.md`
