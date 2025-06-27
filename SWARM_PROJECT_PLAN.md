# Mittwald MCP API Implementation - Swarm Project Plan

## Overview

This plan coordinates the implementation of all Mittwald API endpoints (~520+ endpoints across 21 domains) as MCP tools using a swarm of Claude Code agents. Each agent will work on a specific domain to ensure clean separation of concerns and minimal merge conflicts.

## Important Architecture Notes

The systempromptio boilerplate has a specific architecture that we must follow:

1. **Tool Definitions** are in `src/constants/tool/` - these define the tool metadata (name, description, input schema)
2. **Tool Handlers** are in `src/handlers/tools/` - these implement the actual logic 
3. **Tool Registration** happens in:
   - `src/constants/tools.ts` - aggregates all tool definitions
   - `src/handlers/tool-handlers.ts` - routes tool calls to handlers
4. **We work ALONGSIDE Reddit tools** - do not replace or remove any existing Reddit functionality
5. **All Mittwald tools must be prefixed** with `mittwald_` to avoid naming conflicts

## Why Git Worktrees?

Using git worktrees (Anthropic's recommended approach) provides significant advantages:

1. **Complete Isolation** - Each agent has their own full copy of the codebase
2. **No Coordination Overhead** - Agents can modify ANY file without conflicts
3. **Independent Testing** - Each agent can run the full test suite
4. **Simpler Mental Model** - Just work normally, no special rules
5. **Better Performance** - No shared file locks or conflicts
6. **Easier Debugging** - Issues are isolated to specific worktrees

## API Domain Distribution

Based on analysis of the OpenAPI specification (/Users/robert/Code/Mittwald/mittwald-typescript-mcp-systempromptio/openapi.json), we have 21 API domains with the following endpoint counts:

### Tier 1 - High Complexity Domains (5 agents)
1. **User API** (109 endpoints) - Agent 1
2. **Domain API** (67 endpoints) - Agent 2  
3. **Mail API** (46 endpoints) - Agent 3
4. **App API** (43 endpoints) - Agent 4
5. **Marketplace API** (36 endpoints) - Agent 5

### Tier 2 - Medium Complexity Domains (5 agents)
6. **Project API** (33 endpoints) - Agent 6
7. **Contract API** (29 endpoints) - Agent 7
8. **Customer API** (28 endpoints) - Agent 8
9. **Database API** (24 endpoints) - Agent 9
10. **Container API** (23 endpoints) - Agent 10

### Tier 3 - Lower Complexity Domains (3 agents)
11. **Conversation + Notification APIs** (14 + 9 = 23 endpoints) - Agent 11
12. **SSH/SFTP User + Backup APIs** (12 + 12 = 24 endpoints) - Agent 12
13. **Cronjob + Project File System + File APIs** (10 + 9 + 8 = 27 endpoints) - Agent 13

### Tier 4 - Small Domains (1 agent)
14. **Page Insights + Misc + Relocation + Article APIs** (6 + 4 + 2 + 2 = 14 endpoints) - Agent 14

**Total: 14 Agents**

## Git Workflow & Coordination Strategy

### Using Git Worktrees for Complete Isolation

Each agent will work in their own git worktree, providing complete file isolation while sharing the same Git repository. This is Anthropic's recommended approach for running parallel Claude Code sessions.

### Setup Instructions for Coordinator

From the main repository, create a worktree for each agent:

```bash
# From /Users/robert/Code/Mittwald/mittwald-typescript-mcp-systempromptio
git worktree add ../agent-1-user -b feat/api-user
git worktree add ../agent-2-domain -b feat/api-domain
git worktree add ../agent-3-mail -b feat/api-mail
git worktree add ../agent-4-app -b feat/api-app
git worktree add ../agent-5-marketplace -b feat/api-marketplace
git worktree add ../agent-6-project -b feat/api-project
git worktree add ../agent-7-contract -b feat/api-contract
git worktree add ../agent-8-customer -b feat/api-customer
git worktree add ../agent-9-database -b feat/api-database
git worktree add ../agent-10-container -b feat/api-container
git worktree add ../agent-11-conversation -b feat/api-conversation-notification
git worktree add ../agent-12-ssh-backup -b feat/api-ssh-backup
git worktree add ../agent-13-cronjob-files -b feat/api-cronjob-files
git worktree add ../agent-14-misc -b feat/api-misc
```

### Branch Naming Convention
Each worktree/branch follows the pattern:
```
feat/api-{domain-name}
```

### Directory Structure
```
src/
├── tools/
│   ├── user/
│   │   ├── index.ts
│   │   ├── user-management.ts
│   │   ├── user-auth.ts
│   │   └── ...
│   ├── domain/
│   │   ├── index.ts
│   │   ├── domain-management.ts
│   │   └── ...
│   └── ... (one directory per domain)
├── utils/
│   └── mittwald-api-helpers.ts
└── types/
    └── mittwald/
        ├── user.ts
        ├── domain.ts
        └── ... (shared types)
```

### Benefits of Worktree Approach

1. **Complete Isolation** - Each agent has their own directory copy, no file conflicts possible
2. **Independent Development** - npm install, test, and develop without affecting others  
3. **Simplified Workflow** - No complex coordination rules needed
4. **Parallel Testing** - Each agent can run tests independently

### Simplified Coordination Rules

With worktrees, coordination becomes much simpler:

1. **File Organization**
   - Work freely in your worktree - you have complete isolation!
   - Create all files following the structure:
     - `src/constants/tool/mittwald/{domain}/` for tool definitions
     - `src/handlers/tools/mittwald/{domain}/` for handler implementations
     - `src/types/mittwald/{domain}.ts` for domain-specific types
   - Can create/modify ANY files needed - no restrictions!

2. **Development Process**
   - Each worktree needs setup: `npm install` and copy `.env` file
   - Develop and test completely independently
   - No need to worry about breaking other agents' work

3. **Commit Strategy**
   - Frequent small commits (every 2-3 tools implemented)
   - Clear commit messages: `feat(domain): implement {specific-operation} tool`
   - Push to origin whenever ready - no conflicts with other agents

4. **Testing Strategy**
   - Create tests in `src/handlers/tools/mittwald/{domain}/__tests__/`
   - Run full test suite without affecting others
   - Integration tests with actual API work independently

## Agent Instructions Template

### For Each Agent:

```markdown
You are Agent {N} responsible for implementing the Mittwald {DOMAIN} API as MCP tools.

## Your Assignment
- API Domain: {DOMAIN}  
- Endpoints to implement: {COUNT}
- Worktree directory: /Users/robert/Code/Mittwald/agent-{N}-{domain-lowercase}
- Branch name: feat/api-{domain-lowercase}

## Setup Instructions

Your worktree has already been created. Start by:

1. Navigate to your isolated worktree:
   ```bash
   cd /Users/robert/Code/Mittwald/agent-{N}-{domain-lowercase}
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment file:
   ```bash
   cp ../mittwald-typescript-mcp-systempromptio/.env .env
   ```

4. Create your working directory structure:
   ```bash
   mkdir -p src/constants/tool/mittwald/{domain-lowercase}
   mkdir -p src/handlers/tools/mittwald/{domain-lowercase}/__tests__
   mkdir -p src/types/mittwald
   ```

5. **CRITICAL: Set up git remote and push regularly**:
   ```bash
   # Verify remote is set (should show origin pointing to main repo)
   git remote -v
   
   # If remote is missing, add it:
   git remote add origin /Users/robert/Code/Mittwald/mittwald-typescript-mcp-systempromptio
   
   # Push your branch to remote (do this every 10-15 commits!)
   git push -u origin feat/api-{domain-lowercase}
   ```

6. Reference the Mittwald API client docs:
   - SDK: https://github.com/mittwald/api-client-js
   - Use the existing client: `import { getMittwaldClient } from '../../services/mittwald/index.js'`

## Implementation Guidelines

1. **File Organization**:
   - Group related operations in logical files
   - Create an index.ts that exports all tools
   - One tool per API operation

2. **Tool Naming Convention**:
   - Use clear, descriptive names: `{domain}_{operation}`
   - Examples: `user_list`, `user_create`, `user_delete`

3. **Tool Implementation Pattern**:
   ```typescript
   export const user_list = {
     name: "user_list",
     description: "List all users with optional filtering",
     inputSchema: {
       type: "object",
       properties: {
         limit: { type: "number", description: "Maximum number of results" },
         offset: { type: "number", description: "Pagination offset" }
       }
     },
     handler: async (params: any) => {
       const client = getMittwaldClient();
       // Implementation using client.api.{domain}.{method}
     }
   };
   ```

4. **Error Handling**:
   - Wrap all API calls in try-catch
   - Return meaningful error messages
   - Include status codes and API errors

5. **Testing Requirements**:
   - Write at least one test per tool
   - Test both success and error cases
   - Use mock data for unit tests

6. **Commit and Push Guidelines**:
   - Commit every 2-3 tools implemented
   - Message format: `feat({domain}): implement {operation} tool`
   - **CRITICAL: Push every 10-15 commits**: `git push -u origin feat/api-{domain-lowercase}`
   - **Your work is invisible until pushed to remote!**

7. **Available Resources**:
   - OpenAPI spec: /Users/robert/Code/Mittwald/mittwald-typescript-mcp-systempromptio/openapi.json
   - Legacy reference: /Users/robert/Code/Mittwald/Mittwald-MCP-V1/src/tools/ (READ-ONLY)
   - API client docs: https://github.com/mittwald/api-client-js
   - Existing Reddit tools as examples: src/constants/tool/*.ts and src/handlers/tools/*.ts

## Coordination Points
- DO NOT edit files outside your assigned directory
- DO NOT modify src/tools/index.ts (coordinator will handle)
- DO check existing utils in src/utils/mittwald-api-helpers.ts
- DO add shared types to src/types/mittwald/{domain}.ts

## Progress Tracking
Create a TODO list at the start with all endpoints to implement. Update as you complete each one.

Remember: Quality over speed. Each tool should be well-implemented, properly typed, and tested.
```

## Specific Agent Assignments

### Agent 1 - User API
- 109 endpoints including user management, authentication, permissions, avatars, feedback
- Complex domain requiring careful organization
- Suggested file split: user-management.ts, user-auth.ts, user-permissions.ts, user-profile.ts

### Agent 2 - Domain API  
- 67 endpoints for domain management, DNS, ownership, redirects
- Suggested file split: domain-management.ts, domain-dns.ts, domain-ownership.ts

### Agent 3 - Mail API
- 46 endpoints for email addresses, mailboxes, forwarders, catch-all
- Suggested file split: mail-addresses.ts, mail-boxes.ts, mail-settings.ts

### Agent 4 - App API
- 43 endpoints for app installations, versions, updates, system software
- Critical for WordPress/Shopware deployments
- Suggested file split: app-installation.ts, app-management.ts, app-versions.ts

### Agent 5 - Marketplace API
- 36 endpoints for extensions, templates, reviews
- Suggested file split: marketplace-extensions.ts, marketplace-contrib.ts

### Agent 6 - Project API
- 33 endpoints for project creation, management, memberships, invites
- Core functionality for Mittwald
- Suggested file split: project-management.ts, project-membership.ts

### Agent 7 - Contract API
- 29 endpoints for contracts, billing, invoices, orders
- Suggested file split: contract-management.ts, contract-billing.ts

### Agent 8 - Customer API
- 28 endpoints for customer management, profiles, categories
- Suggested file split: customer-management.ts, customer-profile.ts

### Agent 9 - Database API
- 24 endpoints for MySQL/Redis databases and users
- Suggested file split: database-mysql.ts, database-redis.ts, database-users.ts

### Agent 10 - Container API
- 23 endpoints for container registry, images, volumes
- Suggested file split: container-registry.ts, container-management.ts

### Agent 11 - Conversation + Notification APIs
- 23 total endpoints for support conversations and notifications
- Single file each: conversation.ts, notification.ts

### Agent 12 - SSH/SFTP User + Backup APIs
- 24 total endpoints for SSH users and backup management
- Single file each: ssh-users.ts, backup.ts

### Agent 13 - Cronjob + File System APIs
- 27 total endpoints for cron jobs and file operations
- Files: cronjob.ts, filesystem.ts, file-operations.ts

### Agent 14 - Miscellaneous APIs
- 14 total endpoints across Page Insights, Misc, Relocation, Article
- Single file: miscellaneous.ts

## Coordinator Integration Phase

After all agents complete their work:

### 1. **Verify All Branches**:
```bash
# From main repository
git worktree list  # See all worktrees
git branch -r      # See all remote branches
```

### 2. **Smart Integration**:
Since each agent has complete freedom in their worktree, we need careful merging:

```bash
cd /Users/robert/Code/Mittwald/mittwald-typescript-mcp-systempromptio
git checkout main
git pull origin main

# Create integration branch
git checkout -b feat/integrate-all-apis

# Merge each branch carefully
for branch in feat/api-user feat/api-domain feat/api-mail feat/api-app \
             feat/api-marketplace feat/api-project feat/api-contract \
             feat/api-customer feat/api-database feat/api-container \
             feat/api-conversation-notification feat/api-ssh-backup \
             feat/api-cronjob-files feat/api-misc; do
  echo "Merging $branch..."
  git merge $branch --no-ff -m "feat: integrate $branch implementation"
done
```

### 3. **Resolve Conflicts**:
Key files that will have conflicts:
- `src/constants/tools.ts` - Combine all tool imports and TOOLS array additions
- `src/handlers/tool-handlers.ts` - Merge all schemas, imports, and switch cases
- `src/utils/mittwald-api-helpers.ts` - Deduplicate shared utilities

### 4. **Final Testing**:
```bash
npm install
npm test
npm run dev  # Test that both Reddit and Mittwald tools work
```

### 5. **Cleanup**:
```bash
# Remove all worktrees
git worktree list | grep -v main | awk '{print $1}' | xargs -I {} git worktree remove {}
```

## Success Criteria

1. All ~520+ API endpoints implemented as MCP tools
2. Comprehensive test coverage (>80%)
3. Clean, maintainable code structure
4. No merge conflicts between agents
5. All tools properly typed and documented
6. Successfully tested with real Mittwald API

## Timeline Estimate

- Each agent working in parallel: 4-6 hours
- Integration and testing: 2 hours
- Total project time: 6-8 hours with 14 agents working concurrently

## Launch Instructions

### 1. Create Worktrees (Coordinator)
Run the worktree setup commands from the main repository to create isolated workspaces for each agent.

### 2. Launch Agents
For each agent:
```bash
# Navigate to agent's worktree
cd /Users/robert/Code/Mittwald/agent-{N}-{domain}

# Start Claude Code
claude
```

### 3. Provide Each Agent
- This plan document (SWARM_PROJECT_PLAN.md)
- Their specific agent number and domain assignment
- Reminder to run setup (npm install, copy .env)

### 4. Monitor Progress
```bash
# From main repository, see all active worktrees
git worktree list

# Check each agent's progress
cd ../agent-1-user && git log --oneline -10
```

## Handling Blocking Issues (Simplified with Worktrees!)

With worktrees, you have much more freedom to solve problems:

### 1. **Shared Utilities**
- **Just create them!** Add to `src/utils/mittwald-api-helpers.ts` 
- Document what you added in your final report
- Coordinator will merge and deduplicate during integration

### 2. **Shared Types**
- Create in `src/types/mittwald/shared.ts` or appropriate file
- Use them freely across your implementation
- Document new shared types in your report

### 3. **Need to Update Core Files**
- **You can do it!** Update `src/constants/tools.ts` and `src/handlers/tool-handlers.ts`
- Add your tool registrations and handler cases
- The isolation means you won't break other agents

### 4. **Cross-Domain Dependencies**
- If another domain's tools exist in your worktree, use them
- If not, mock the expected response for testing
- Document dependencies in your final report

### 5. **Final Report Format**
End your work with a summary:
```markdown
## Implementation Summary for {DOMAIN} API

### Tools Implemented
- Total: {X} tools covering {Y} endpoints
- Key tools: [list important ones]

### Shared Resources Created
- Utilities added to mittwald-api-helpers.ts: [list]
- Shared types created: [list with files]

### Dependencies on Other Domains
- Tool X depends on mittwald_project_get
- Tool Y uses shared type from Domain API

### Testing Status
- Unit tests: {X}% coverage
- Integration tests: Passed/Failed
- Known issues: [list any]

### Notes for Integration
- [Any special considerations for merging]
```

## Common Pitfalls to Avoid

1. **🚨 MOST CRITICAL: Not pushing work** - Your commits are invisible until pushed with `git push -u origin feat/api-{domain}`
2. **Wrong Directory**: Use the correct structure - `src/constants/tool/mittwald/` and `src/handlers/tools/mittwald/`
3. **Forgetting Prefix**: All Mittwald tools must start with `mittwald_` to avoid conflicts
4. **Breaking Reddit Tools**: Test that Reddit tools still work after your changes
5. **Missing Exports**: Remember to export from index files in both constants and handlers directories
6. **Type Mismatches**: Ensure handler argument types match the tool's inputSchema
7. **Auth Issues**: Use the existing Mittwald client from `services/mittwald/` - don't create new auth logic
8. **Missing Remote**: If `git remote -v` shows no origin, add it: `git remote add origin /Users/robert/Code/Mittwald/mittwald-typescript-mcp-systempromptio`

Note: With worktrees, you CAN modify core files like `src/constants/tools.ts` and `src/handlers/tool-handlers.ts` - the coordinator will merge all changes during integration!

Ready to launch the swarm!