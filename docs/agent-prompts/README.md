# Agent Prompts - MCP CLI Parity Project

This directory contains detailed instructions for AI agents working on closing the CLI coverage gap. Each file is a complete, standalone prompt that can be given to a new Claude Code agent to accomplish a specific workstream.

## Quick Start

1. **Start with Agent A1 first** - it creates the automation foundation
2. **Run B1 and B2 in parallel** - taxonomy alignment (can coordinate)
3. **Run C agents in order of priority**: C3 → C4 → C1 → C5
4. **Defer Agent D** - interactive commands need architectural decisions

## Agent Files

### Foundation (Start Here!)

| Agent | File | Workstream | Priority | Effort | Dependencies |
|-------|------|------------|----------|--------|--------------|
| **A1** | `AGENT-A1-coverage-tooling.md` | Coverage automation & CI | 🔥 CRITICAL | 3-5 days | None |

### Taxonomy Alignment (Can Run in Parallel)

| Agent | File | Workstream | Priority | Effort | Dependencies |
|-------|------|------------|----------|--------|--------------|
| **B1** | `AGENT-B1-taxonomy-registry.md` | Registry rename | 🟡 MODERATE | 1-2 days | None |
| **B2** | `AGENT-B2-taxonomy-stack.md` | Stack rename | 🟡 MODERATE | 1-2 days | None |

### Missing Wrappers (Execute in Priority Order)

| Agent | File | Workstream | Priority | Effort | Dependencies |
|-------|------|------------|----------|----------|--------|--------------|
| **C3** | `AGENT-C3-database-extensions.md` | MySQL users + Redis databases | 🚀 HIGHEST | 4-6 days | None |
| **C4** | `AGENT-C4-org-management.md` | Organization CRUD + membership | 🚀 HIGH | 3-4 days | None |
| **C1** | `AGENT-C1-app-dependencies.md` | App dependency metadata | 🟢 MEDIUM | 1-2 days | None |
| **C5** | `AGENT-C5-volume-management.md` | Volume CRUD operations | 🟢 MEDIUM | 1-2 days | None |

### Not Yet Created

| Agent | Workstream | Priority | Reason |
|-------|------------|----------|--------|
| **C2** | Container lifecycle | LOW | Only 1 command (`container update`), can wait |
| **C6** | DDEV tooling | LOW | Niche use case, simple fix |
| **D1-D3** | Interactive commands | DEFERRED | Needs architectural decision on streaming |

## How to Use These Prompts

### Starting a New Agent

1. **Create a new Claude Code conversation**
2. **Copy the entire agent prompt file** (e.g., `AGENT-A1-coverage-tooling.md`)
3. **Paste it into the conversation**
4. **The agent will**:
   - Read all required context files
   - Execute tasks in order
   - Commit frequently with conventional format
   - Ask for help when stuck
   - Report completion status

### Monitoring Progress

Each agent will:
- ✅ Commit after **every completed task**
- ✅ Push every **2-3 commits**
- ✅ Use **conventional commit format**: `feat(scope): description`
- ❌ **Never rebase or force push**

You can monitor by:
```bash
# Watch for new commits
git log --oneline --graph --all -20

# Check agent's branch progress
git log --oneline origin/<agent-branch>

# See what files changed
git diff main --stat
```

### Troubleshooting

If an agent gets stuck:
1. **Check the last commit** - see what they completed
2. **Read the error message** - agents should ask for help
3. **Review the task checklist** in the prompt - see what's left
4. **Provide clarification** - answer their question and they'll continue

## Coordination Between Agents

### Parallel Agents

**B1 and B2** can work simultaneously:
- They work on different directories (`registry/` vs `stack/`)
- Same patterns, different commands
- Should use consistent commit messages
- Can share migration note templates

### Sequential Dependencies

**Must complete before others start:**
- A1 → All others (provides coverage automation)

**Recommended sequence:**
- A1 (foundation) → B1+B2 (taxonomy) → C3+C4 (high priority) → C1+C5 (medium priority)

## Success Criteria

### Agent A1 Complete When:
- [ ] Coverage generator script works
- [ ] CI validates coverage on PR
- [ ] CLI version detector warns on drift
- [ ] Exclusion config exists and is validated

### Agent B1/B2 Complete When:
- [ ] All 4 registry/stack tools renamed
- [ ] Old files deleted
- [ ] Migration notes published
- [ ] Tools discovered by scanner
- [ ] Coverage reports updated

### Agent C1/C3/C4/C5 Complete When:
- [ ] All assigned tools implemented
- [ ] Unit tests passing
- [ ] Integration tests verify session context
- [ ] Usage documentation complete
- [ ] Coverage reports updated

## Deliverables Checklist

After all agents complete, you should have:

- [ ] **Automation** (A1):
  - `scripts/generate-mw-coverage.ts`
  - `scripts/check-cli-version.ts`
  - `.github/workflows/coverage-check.yml`
  - `config/mw-cli-exclusions.json`

- [ ] **Renamed Tools** (B1, B2):
  - `src/constants/tool/mittwald-cli/registry/*.ts` (4 files)
  - `src/constants/tool/mittwald-cli/stack/*.ts` (4 files)
  - `docs/migrations/registry-rename-2025-10.md`
  - `docs/migrations/stack-rename-2025-10.md`

- [ ] **New Tools** (C1, C3, C4, C5):
  - `src/constants/tool/mittwald-cli/app/dependency-*.ts` (3 files)
  - `src/constants/tool/mittwald-cli/database/mysql/user-*.ts` (5 files)
  - `src/constants/tool/mittwald-cli/database/redis/*.ts` (4 files)
  - `src/constants/tool/mittwald-cli/org/*.ts` (7 files)
  - `src/constants/tool/mittwald-cli/volume/*.ts` (3 files)

- [ ] **Documentation**:
  - Usage examples for each tool category
  - Safety guides for destructive operations
  - Migration notes for breaking changes
  - Updated coverage reports

- [ ] **Tests**:
  - Unit tests for all new tools
  - Integration tests verify session context
  - CI validates coverage

## Estimated Timeline

### Week 1: Foundation
- **Day 1-3**: Agent A1 (coverage automation)
- **Day 4-5**: Agent B1+B2 in parallel (taxonomy)

### Week 2-3: High Priority Wrappers
- **Week 2**: Agent C3 (databases) - most complex
- **Week 3**: Agent C4 (organizations)

### Week 4: Medium Priority Wrappers
- **Day 1-2**: Agent C1 (app dependencies)
- **Day 3-4**: Agent C5 (volumes)
- **Day 5**: Integration testing, documentation cleanup

### Total: 4 weeks to 77% → ~95% coverage

(Excludes interactive commands pending Workstream D decisions)

## Questions?

If you're unsure which agent to start:
1. **Always start with A1** - it's the foundation
2. **Prioritize by user impact**: Database/Org management are critical
3. **Run B agents early**: They're fast wins that improve accuracy
4. **Defer D workstream**: Requires architectural decisions

---

**Last Updated**: 2025-10-01
**Project Phase**: CLI Parity Gap Closure
**Target Coverage**: 95% (excluding interactive commands)
