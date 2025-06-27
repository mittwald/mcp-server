# Coordinator Instructions - TypeScript SDK Migration

## Overview
You are coordinating 6 agents to fix all TypeScript compilation errors by migrating from the untyped `api` surface to the typed `typedApi` surface.

## Agent Assignments
- **Agent 1**: User & Auth APIs (~39 errors)
- **Agent 2**: Marketplace APIs (~31 errors)
- **Agent 3**: Container, Notification & Conversation APIs (~15 errors)
- **Agent 4**: Database & SSH/Backup APIs (~20 errors)
- **Agent 5**: Mail & Domain APIs (~20 errors)
- **Agent 6**: Project, Customer & App APIs (~20 errors)

## Worktree Locations
```
/Users/robert/Code/Mittwald/agent-fix-1-user-auth
/Users/robert/Code/Mittwald/agent-fix-2-marketplace
/Users/robert/Code/Mittwald/agent-fix-3-container-notification
/Users/robert/Code/Mittwald/agent-fix-4-database-ssh
/Users/robert/Code/Mittwald/agent-fix-5-mail-domain
/Users/robert/Code/Mittwald/agent-fix-6-project-customer-app
```

## Coordination Timeline

### Phase 1: Discovery (0-60 minutes)
1. Ensure all agents have read their instructions
2. Agents explore SDK and document method mappings
3. Collect findings in `coordination/agent-*-findings.md`
4. Create consolidated mapping in `coordination/method-mappings.md`

### Phase 2: Implementation (60-240 minutes)
1. Agents implement fixes based on discovered mappings
2. Regular check-ins every 30 minutes
3. Help resolve any blockers
4. Ensure consistent patterns across agents

### Phase 3: Integration (240-300 minutes)
1. Each agent runs `npm run build` locally
2. Collect status reports
3. Merge branches in order (1-6)
4. Run final build verification
5. Update migration plan with results

## Communication Protocol
- Agents report blockers immediately
- Document any SDK limitations
- Share successful patterns with other agents
- Create issues for unresolvable problems

## Success Metrics
- Zero TypeScript errors
- All modules use `typedApi`
- Docker builds successfully
- No `as any` in production code

## Merge Strategy
```bash
# After all agents complete
git checkout fix/typescript-sdk-migration
git merge fix/typescript-sdk-agent-1-user-auth
git merge fix/typescript-sdk-agent-2-marketplace
git merge fix/typescript-sdk-agent-3-container-notification
git merge fix/typescript-sdk-agent-4-database-ssh
git merge fix/typescript-sdk-agent-5-mail-domain
git merge fix/typescript-sdk-agent-6-project-customer-app

# Test combined result
npm run build
docker compose build

# If successful
git checkout main
git merge fix/typescript-sdk-migration
```

## Risk Management
1. If an agent is blocked, reassign work
2. Keep compatibility layer for truly broken APIs
3. Document all workarounds
4. Create follow-up tasks for remaining issues

## Final Deliverables
1. Zero TypeScript errors
2. Updated MIGRATION_PLAN.md
3. LEARNINGS.md with SDK insights
4. Clean git history
5. Working Docker image