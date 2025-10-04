# CLI Adapter Agent Prompts

**Created**: 2025-10-02
**Context**: Breaking down the CLI adapter migration work into focused agent-level tasks

---

## Overview

The MCP server has 37+ handlers still importing from `cli-wrapper` directly, causing `no-restricted-imports` warnings. Additionally, the CLI coverage gap analysis identified 41 missing CLI commands that need wrappers.

This directory contains agent-level prompts to systematically address:
1. **CLI wrapper migration** - Move handlers from cli-wrapper to cli-adapter
2. **Missing command coverage** - Implement wrappers for uncovered CLI commands
3. **Taxonomy alignment** - Rename tools to match CLI structure
4. **Automation tooling** - Coverage tracking and CI enforcement

---

## Agent Breakdown

### Foundation Agents (A-series)

**A1: Coverage Tooling & Automation**
- File: `AGENT-A1-coverage-tooling.md`
- Duration: 2-3 days
- Dependencies: None
- Deliverables: Coverage tracking, CI integration, exclusion allowlist

---

### Taxonomy Agents (B-series)

**B1: Registry & Stack Taxonomy Alignment**
- File: `AGENT-B1-taxonomy-alignment.md`
- Duration: 1-2 days
- Dependencies: A1 (recommended)
- Deliverables: Rename registry/stack tools to match CLI structure

---

### Coverage Gap Agents (C-series)

These agents were ALREADY EXECUTED and are production-ready:
- ✅ **C1**: App Dependencies (DONE - commit 720320e)
- ✅ **C2**: Container Update (DONE - commit 1643517)
- ✅ **C3**: Database Tools (MySQL user + Redis) (DONE - commit 720320e)
- ✅ **C4**: Organisation Management (DONE - commit 720320e)
- ✅ **C5**: Volume Management (prompt created, work done by C6)
- ✅ **C6**: DDEV Resources + Volume Management (DONE - commits fd2bb4b, 10c1bac, be3f5f1, 67de8b3)

**Status**: All C1-C6 agents complete and approved. See `docs/agent-reviews/AGENTS-C1-C6-FINAL-REVIEW.md`.

---

### Migration Agents (D-series)

**D1: Container Handlers Migration**
- File: `AGENT-D1-container-handlers.md`
- Duration: 1-2 days
- Dependencies: None
- Deliverables: Migrate 8 container handlers from cli-wrapper to cli-adapter

**D2: App Handlers Migration**
- File: `AGENT-D2-app-handlers.md`
- Duration: 1-2 days
- Dependencies: None
- Deliverables: Migrate 6 app handlers from cli-wrapper to cli-adapter

**D3: Database Handlers Migration**
- File: `AGENT-D3-database-handlers.md`
- Duration: 1 day
- Dependencies: None
- Deliverables: Migrate 4 database handlers from cli-wrapper to cli-adapter

**D4: Project & Server Handlers Migration**
- File: `AGENT-D4-project-server-handlers.md`
- Duration: 1-2 days
- Dependencies: None
- Deliverables: Migrate 8 project/server handlers from cli-wrapper to cli-adapter

**D5: Infrastructure Handlers Migration**
- File: `AGENT-D5-infrastructure-handlers.md`
- Duration: 1 day
- Dependencies: None
- Deliverables: Migrate remaining handlers (cronjob, backup, domain, mail, SSH/SFTP)

---

### Interactive Command Strategy (E-series)

**E1: Interactive Command Assessment**
- File: `AGENT-E1-interactive-commands.md`
- Duration: 2-3 days
- Dependencies: A1 (for exclusion framework)
- Deliverables: Feasibility assessment, security review, implementation or exclusion

---

## Sequencing Strategy

### Phase 1: Foundation (Week 1)
- **A1**: Coverage tooling (parallel with other work)
- **B1**: Taxonomy alignment (can run parallel)

### Phase 2: Migration (Weeks 2-3)
Agents D1-D5 can run **in parallel** with minimal overlap:
- **D1**: Container handlers (8 handlers)
- **D2**: App handlers (6 handlers)
- **D3**: Database handlers (4 handlers)
- **D4**: Project/Server handlers (8 handlers)
- **D5**: Infrastructure handlers (~11 handlers)

**Total**: 37 handlers migrated

### Phase 3: Interactive Strategy (Week 4)
- **E1**: Interactive command assessment

---

## Priority Matrix

### High Priority (Start Immediately)
1. **A1** - Coverage tooling (enables tracking)
2. **D1** - Container handlers (highest volume)
3. **D2** - App handlers (high user impact)

### Medium Priority (Week 2)
4. **B1** - Taxonomy alignment (reduces confusion)
5. **D3** - Database handlers (moderate volume)
6. **D4** - Project/Server handlers (moderate volume)

### Lower Priority (Week 3+)
7. **D5** - Infrastructure handlers (lower volume)
8. **E1** - Interactive commands (strategic decision)

---

## Success Criteria

### Per-Agent
- [ ] All handlers migrated/implemented
- [ ] All tests passing
- [ ] No ESLint warnings
- [ ] Documentation updated
- [ ] Changes committed with clear messages

### Overall
- [ ] Zero `no-restricted-imports` warnings
- [ ] Coverage report shows 0 missing commands (or documented exclusions)
- [ ] CI enforces coverage tracking
- [ ] All 37+ handlers use cli-adapter

---

## Related Documentation

- **Architecture**: `docs/mcp-cli-gap-architecture.md`
- **Project Plan**: `docs/mcp-cli-gap-project-plan.md`
- **Coverage Report**: `docs/mittwald-cli-coverage.md`
- **CLI Adapter**: `src/tools/cli-adapter.ts`
- **C1-C6 Reviews**: `docs/agent-reviews/AGENTS-C1-C6-FINAL-REVIEW.md`

---

## Notes

- **C-series agents (C1-C6)** already completed and approved - do NOT re-implement
- **D-series agents** focus on MIGRATION (cli-wrapper → cli-adapter), not new features
- **A-series and B-series** provide tooling and alignment
- **E-series** handles strategic decisions for interactive commands
