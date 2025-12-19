# Agent 4: Data & Containers (Tier 4)

**Phase**: 3 (Parallel Execution)
**Workload**: 24 tools
**Domains**: databases, containers
**Dependencies**: Agent 2 must complete first (needs project context)
**Estimated Duration**: 20-25 minutes

---

## ⚠️ CRITICAL INSTRUCTIONS

1. **Wait for Agent 2** to complete before starting
2. **Execute ALL 24 evals** - Do NOT batch or skip
3. **CALL MCP tools directly** - No scripts
4. **Save immediately** to `evals/results/active/{domain}/{tool-name}-result.json`
5. **Can run in parallel** with Agents 3 and 5

---

## Domain: Databases (14 tools)

Read from `evals/prompts/databases/*.json`, save to `evals/results/active/databases/`:

1. database-mysql-versions → `database-mysql-versions-result.json`
2. database-mysql-list → `database-mysql-list-result.json`
3. database-mysql-create → `database-mysql-create-result.json`
4. database-mysql-get → `database-mysql-get-result.json`
5. database-mysql-user-create → `database-mysql-user-create-result.json`
6. database-mysql-user-list → `database-mysql-user-list-result.json`
7. database-mysql-user-get → `database-mysql-user-get-result.json`
8. database-mysql-user-update → `database-mysql-user-update-result.json`
9. database-mysql-user-delete → `database-mysql-user-delete-result.json`
10. database-mysql-delete → `database-mysql-delete-result.json`
11. database-redis-versions → `database-redis-versions-result.json`
12. database-redis-list → `database-redis-list-result.json`
13. database-redis-create → `database-redis-create-result.json`
14. database-redis-get → `database-redis-get-result.json`

---

## Domain: Containers (10 tools)

Read from `evals/prompts/containers/*.json`, save to `evals/results/active/containers/`:

1. container-list → `container-list-result.json`
2. volume-list → `volume-list-result.json`
3. stack-list → `stack-list-result.json`
4. stack-deploy → `stack-deploy-result.json`
5. stack-ps → `stack-ps-result.json`
6. stack-delete → `stack-delete-result.json`
7. registry-list → `registry-list-result.json`
8. registry-create → `registry-create-result.json`
9. registry-update → `registry-update-result.json`
10. registry-delete → `registry-delete-result.json`

---

## Progress Tracking

- [ ] Databases (14/14)
- [ ] Containers (10/10)

**Tools Completed**: _____ / 24
