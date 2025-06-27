# Agent Launch Commands

All worktrees have been created and .env files copied. Launch each agent with these commands:

## Agent 1 - User API (109 endpoints)
```bash
cd /Users/robert/Code/Mittwald/agent-1-user && claude
```

## Agent 2 - Domain API (67 endpoints)
```bash
cd /Users/robert/Code/Mittwald/agent-2-domain && claude
```

## Agent 3 - Mail API (46 endpoints)
```bash
cd /Users/robert/Code/Mittwald/agent-3-mail && claude
```

## Agent 4 - App API (43 endpoints)
```bash
cd /Users/robert/Code/Mittwald/agent-4-app && claude
```

## Agent 5 - Marketplace API (36 endpoints)
```bash
cd /Users/robert/Code/Mittwald/agent-5-marketplace && claude
```

## Agent 6 - Project API (33 endpoints)
```bash
cd /Users/robert/Code/Mittwald/agent-6-project && claude
```

## Agent 7 - Contract API (29 endpoints)
```bash
cd /Users/robert/Code/Mittwald/agent-7-contract && claude
```

## Agent 8 - Customer API (28 endpoints)
```bash
cd /Users/robert/Code/Mittwald/agent-8-customer && claude
```

## Agent 9 - Database API (24 endpoints)
```bash
cd /Users/robert/Code/Mittwald/agent-9-database && claude
```

## Agent 10 - Container API (23 endpoints)
```bash
cd /Users/robert/Code/Mittwald/agent-10-container && claude
```

## Agent 11 - Conversation + Notification APIs (23 endpoints)
```bash
cd /Users/robert/Code/Mittwald/agent-11-conversation && claude
```

## Agent 12 - SSH/SFTP User + Backup APIs (24 endpoints)
```bash
cd /Users/robert/Code/Mittwald/agent-12-ssh-backup && claude
```

## Agent 13 - Cronjob + File System APIs (27 endpoints)
```bash
cd /Users/robert/Code/Mittwald/agent-13-cronjob-files && claude
```

## Agent 14 - Miscellaneous APIs (14 endpoints)
```bash
cd /Users/robert/Code/Mittwald/agent-14-misc && claude
```

## Monitor Progress

From the main repository:
```bash
cd /Users/robert/Code/Mittwald/mittwald-typescript-mcp-systempromptio
git worktree list
```

Check individual agent progress:
```bash
cd ../agent-1-user && git log --oneline -5
```

## Important Files to Provide Each Agent

1. The SWARM_PROJECT_PLAN.md
2. Their specific agent number and domain

Each agent should first run:
```bash
npm install
```

Then begin implementing their assigned API domain following the plan.