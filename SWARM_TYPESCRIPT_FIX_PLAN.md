# SWARM TypeScript SDK Migration Plan

## Objective
Fix all TypeScript compilation errors by migrating from the untyped `api` surface to the properly typed `typedApi` surface of the Mittwald SDK v4.169.0.

## Agent Allocation (6 Agents)

### Agent 1: User & Auth APIs
**Modules:** `src/handlers/tools/mittwald/user/`
- auth.ts (7 errors)
- email.ts (5 errors)
- password.ts (7 errors)
- profile.ts (8 errors)
- session.ts (5 errors)
- api-tokens.ts (3 errors)
- unified-handler.ts (4 errors)
**Total Errors:** ~39

### Agent 2: Marketplace APIs
**Modules:** `src/handlers/tools/mittwald/marketplace/`
- extension-management.ts (15 errors)
- extension-instance-management.ts (11 errors)
- marketplace-utilities.ts (5 errors)
- contributor-management.ts (needs verification)
**Total Errors:** ~31

### Agent 3: Container & Notification APIs
**Modules:** 
- `src/handlers/tools/mittwald/container/` (verify ChatGPT's fixes)
- `src/handlers/tools/mittwald/notification/` (1 error)
- `src/handlers/tools/mittwald/conversation/` (needs verification)
**Total Errors:** ~10-15

### Agent 4: Database & SSH/Backup APIs
**Modules:**
- `src/handlers/tools/mittwald/database/`
- `src/handlers/tools/mittwald/ssh-backup/`
**Total Errors:** ~15-20

### Agent 5: Mail & Domain APIs
**Modules:**
- `src/handlers/tools/mittwald/mail/`
- `src/handlers/tools/mittwald/domain/`
**Total Errors:** ~15-20

### Agent 6: Project, Customer & App APIs
**Modules:**
- `src/handlers/tools/mittwald/project/`
- `src/handlers/tools/mittwald/customer/`
- `src/handlers/tools/mittwald/app/`
**Total Errors:** ~15-20

## Coordination Strategy

### Phase 1: Setup (30 minutes)
1. Coordinator creates feature branches and worktrees
2. Each agent pulls latest main
3. Agents read their assigned modules
4. Agents explore the typed SDK to understand correct method names

### Phase 2: Discovery (1 hour)
Each agent must:
1. List all their broken API calls
2. Find the correct method names in `typedApi`
3. Document the mapping (old → new)
4. Share findings in a coordination file

### Phase 3: Implementation (2-3 hours)
1. Fix all TypeScript errors in assigned modules
2. Switch from `client.api` to `client.typedApi`
3. Update method names and parameters
4. Fix response handling
5. Run `npm run build` to verify

### Phase 4: Testing & Integration (1 hour)
1. Each agent runs build locally
2. Create pull request
3. Coordinator merges all branches
4. Final build verification

## Git Worktree Setup Commands

```bash
# Create base migration branch
git checkout main
git pull origin main
git checkout -b fix/typescript-sdk-migration

# Create agent branches and worktrees
git checkout -b fix/typescript-sdk-agent-1-user-auth
git worktree add ../agent-fix-1-user-auth fix/typescript-sdk-agent-1-user-auth

git checkout fix/typescript-sdk-migration
git checkout -b fix/typescript-sdk-agent-2-marketplace
git worktree add ../agent-fix-2-marketplace fix/typescript-sdk-agent-2-marketplace

git checkout fix/typescript-sdk-migration
git checkout -b fix/typescript-sdk-agent-3-container-notification
git worktree add ../agent-fix-3-container-notification fix/typescript-sdk-agent-3-container-notification

git checkout fix/typescript-sdk-migration
git checkout -b fix/typescript-sdk-agent-4-database-ssh
git worktree add ../agent-fix-4-database-ssh fix/typescript-sdk-agent-4-database-ssh

git checkout fix/typescript-sdk-migration
git checkout -b fix/typescript-sdk-agent-5-mail-domain
git worktree add ../agent-fix-5-mail-domain fix/typescript-sdk-agent-5-mail-domain

git checkout fix/typescript-sdk-migration
git checkout -b fix/typescript-sdk-agent-6-project-customer-app
git worktree add ../agent-fix-6-project-customer-app fix/typescript-sdk-agent-6-project-customer-app
```

## Agent Instructions Template

### For Each Agent:
```markdown
# Agent [N] - [API Names] TypeScript Fix

## Your Assignment
Fix TypeScript errors in: [list of modules]

## Key Tasks
1. Change all `client.api.*` calls to `client.typedApi.*`
2. Find correct method names using SDK exploration
3. Fix parameter structures
4. Update response handling
5. Ensure zero TypeScript errors in your modules

## SDK Discovery Commands
```typescript
// In Node REPL or test file:
import { MittwaldAPIV2Client } from '@mittwald/api-client';
const client = MittwaldAPIV2Client.newWithToken('dummy');

// Explore your namespace:
console.log(Object.keys(client.user)); // for user API
console.log(Object.keys(client.marketplace)); // for marketplace API
// etc.
```

## Common Patterns

### Old Pattern → New Pattern
```typescript
// Authentication
client.api.getSelf() → client.user.getUser()
client.api.authenticateWithSessionToken() → client.user.authenticateWithAccessTokenRetrievalKey()

// Status Checks
response.status === 200 → String(response.status).startsWith('2')

// Parameter Wrapping
{ notificationId } → { notificationId, data: { status: 'read' } }
```

## Validation
Run these commands to verify your fixes:
```bash
npm run build
npx tsc --noEmit
```

## Commit Message Format
```
fix(api-name): migrate to typed SDK surface

- Update method names to match SDK v4.169.0
- Fix parameter structures
- Correct response type handling
- Remove dependency on untyped api surface
```
```

## Success Criteria
1. Zero TypeScript compilation errors
2. All handlers use `typedApi` instead of `api`
3. Docker build succeeds
4. No `as any` casts in production code
5. All status checks handle multiple success codes

## Coordination File Structure
```
/Users/robert/Code/Mittwald/mittwald-typescript-mcp-systempromptio/
├── SWARM_TYPESCRIPT_FIX_PLAN.md (this file)
├── coordination/
│   ├── agent-1-findings.md
│   ├── agent-2-findings.md
│   ├── agent-3-findings.md
│   ├── agent-4-findings.md
│   ├── agent-5-findings.md
│   ├── agent-6-findings.md
│   └── method-mappings.md (consolidated)
```

## Timeline
- **Hour 0-1**: Setup and Discovery
- **Hour 1-4**: Implementation
- **Hour 4-5**: Testing and Integration
- **Total Duration**: ~5 hours with 6 parallel agents

## Risk Mitigation
1. Each agent works in isolated worktree
2. Frequent commits to prevent work loss
3. Coordinator reviews method mappings before implementation
4. Incremental builds to catch errors early
5. Fallback: Keep compatibility layer for truly incompatible calls

## Final Notes
- Prioritize compilation success over perfect code
- Document any SDK limitations found
- Create issues for any unresolvable problems
- Update MIGRATION_PLAN.md with learnings