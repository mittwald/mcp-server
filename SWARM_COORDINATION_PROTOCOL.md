# SWARM COORDINATION PROTOCOL

## Communication Channels

### 1. Registry Updates (PRIMARY)
Every agent MUST update their registry file every 2 hours:
```csv
command_path,mcp_tool_name,cli_implementation_path,status,implementation_file,test_file,errors,completion_time
app/list,mittwald_app_list,/cli/src/commands/app/list.tsx,analyzing,,,"",2024-01-10T10:00:00Z
app/list,mittwald_app_list,/cli/src/commands/app/list.tsx,implementing,src/handlers/tools/mittwald-cli/app/list.ts,,"",2024-01-10T11:00:00Z
app/list,mittwald_app_list,/cli/src/commands/app/list.tsx,testing,src/handlers/tools/mittwald-cli/app/list.ts,tests/app/list.test.ts,"",2024-01-10T12:00:00Z
app/list,mittwald_app_list,/cli/src/commands/app/list.tsx,blocked,src/handlers/tools/mittwald-cli/app/list.ts,,"Waiting for shared helper from agent-5",2024-01-10T13:00:00Z
app/list,mittwald_app_list,/cli/src/commands/app/list.tsx,completed,src/handlers/tools/mittwald-cli/app/list.ts,tests/app/list.test.ts,"",2024-01-10T14:00:00Z
```

### 2. Blocking Issues (URGENT)
When blocked, immediately create:
```
swarm-cli-mapping/coordination/BLOCKER-agent-{N}-{timestamp}.md

# BLOCKER: Agent-3 - Cannot find getProjectContext helper

## Command Blocked
- Command: database/mysql/list
- File: src/handlers/tools/mittwald-cli/database/mysql/list.ts

## Issue
The CLI uses `getProjectContext` helper function but I cannot locate its implementation.

## What I Need
- Location of getProjectContext function
- Or agent who has already implemented it

## Attempted Solutions
1. Searched in /cli/src/lib/
2. Searched in /cli/src/helpers/
3. Grepped for "getProjectContext"

## Impact
- 3 commands blocked
- Estimated delay: 4 hours
```

### 3. Shared Resources
When you create a reusable helper:
```
swarm-cli-mapping/coordination/SHARED-{resource-name}.md

# SHARED RESOURCE: getProjectContext

## Created By: Agent-5
## Location: src/handlers/tools/mittwald-cli/helpers/project-context.ts

## Purpose
Extracts project context from args, used by many CLI commands

## Usage
```typescript
import { getProjectContext } from '../helpers/project-context.js';

const projectId = await getProjectContext(args);
```

## Commands Using This
- database/mysql/list (agent-3)
- app/install (agent-1)
- cronjob/list (agent-8)
```

### 4. Daily Status Report
Each agent creates daily report:
```
swarm-cli-mapping/reports/agent-{N}-day-{D}.md

# Agent-3 Daily Report: Day 2

## Progress
- Completed: 8/15 commands (53%)
- In Progress: 2 commands
- Blocked: 1 command
- Not Started: 4 commands

## Completed Today
1. database/mysql/list
2. database/mysql/create
3. database/mysql/delete

## Blockers
- getProjectContext helper (resolved by agent-5)

## Tomorrow's Plan
- Complete database/mysql/user commands
- Start database/redis commands

## Dependencies
- Need agent-7 to complete shared database types
```

## Coordination Rules

### 1. Dependency Management
```yaml
# swarm-cli-mapping/coordination/dependencies.yaml
dependencies:
  helpers:
    getProjectContext:
      created_by: agent-5
      needed_by: [agent-1, agent-3, agent-8]
      status: completed
      file: src/handlers/tools/mittwald-cli/helpers/project-context.ts
    
  types:
    DatabaseConnection:
      created_by: agent-3  
      needed_by: [agent-3, agent-12]
      status: in_progress
      file: src/types/mittwald-cli/database.ts
```

### 2. Merge Coordination
```markdown
# swarm-cli-mapping/coordination/merge-queue.md

## Merge Queue - Day 2

### Ready to Merge
1. agent-5-helpers (PR #101) - ✅ Tests passing
2. agent-3-database-base (PR #102) - ✅ Tests passing

### Waiting for Review
3. agent-1-app-commands (PR #103) - Needs review from agent-5

### Merge Order (to avoid conflicts)
1. First: agent-5-helpers (others depend on it)
2. Then: agent-3-database-base
3. Then: agent-1-app-commands
```

### 3. Pattern Library
When you solve a common pattern:
```markdown
# swarm-cli-mapping/coordination/PATTERN-{name}.md

# PATTERN: Handle Optional Project Context

## Problem
Many CLI commands accept optional --project-id flag but fall back to context

## CLI Pattern
```typescript
const projectId = flags['project-id'] || (await context.getProject());
```

## MCP Solution
```typescript
// Make projectId required in MCP since we have no context
interface Args {
  projectId: string; // Required, not optional
}
```

## Used In
- All project-scoped commands
- Discovered by: agent-1
- Pattern approved by: team consensus
```

## Conflict Resolution

### 1. File Conflicts
If two agents need to modify same file:
```markdown
# swarm-cli-mapping/coordination/CONFLICT-{file-path}.md

## File Conflict: src/types/mittwald-cli/common.ts

### Agent-3 Needs
- Add DatabaseIdentifier type

### Agent-5 Needs  
- Add ProjectIdentifier type

### Resolution
- Agent-5 creates file first (priority)
- Agent-3 adds to existing file
- Coordinate via merge queue
```

### 2. Naming Conflicts
If tool names collide:
```markdown
# swarm-cli-mapping/coordination/NAMING-CONFLICT-{tool}.md

## Naming Conflict: mittwald_project_list

### Issue
- CLI has both 'mw project list' and 'mw server project list'
- Both would map to mittwald_project_list

### Resolution
- mw project list → mittwald_project_list
- mw server project list → mittwald_server_project_list
- Add 'server' to maintain uniqueness
```

## Emergency Protocols

### 1. Build Broken
```bash
# Create immediately:
echo "BUILD BROKEN by agent-{N} at {timestamp}" > swarm-cli-mapping/coordination/BUILD-BROKEN.txt

# Include:
- What broke
- Last working commit
- Attempted fixes
- Rollback if needed
```

### 2. API Changed
If CLI uses API that doesn't exist in SDK:
```markdown
# swarm-cli-mapping/coordination/API-MISMATCH-{endpoint}.md

## API Mismatch: app.installApplication

### CLI Uses
`context.api.app.installApplication()`

### SDK Has
`mittwaldClient.api.app.requestAppinstallation()`

### Mapping
- CLI installApplication → SDK requestAppinstallation
- Same parameters
- Same response
```

## Quality Gates

### Before Marking Complete
Each command must pass:

1. **Self-Review Checklist**
   - [ ] Exact parameter mapping verified
   - [ ] All API calls traced and implemented
   - [ ] Error messages match CLI exactly
   - [ ] Test covers happy path + errors
   - [ ] No creative improvements added

2. **Peer Review** (async)
   - Post in: `swarm-cli-mapping/reviews/agent-{N}-{command}.md`
   - Any agent can review when free
   - Focus on CLI accuracy, not code style

3. **Integration Test**
   - Must run with other completed commands
   - No namespace collisions
   - Shared helpers work correctly

## Progress Tracking

### Master Dashboard
```python
# swarm-cli-mapping/dashboard.py

import csv
import glob
from datetime import datetime

def generate_dashboard():
    print(f"SWARM Progress Dashboard - {datetime.now()}")
    print("=" * 50)
    
    # Read all agent registries
    total_commands = 0
    status_summary = {}
    agent_progress = {}
    
    for i in range(1, 21):
        registry = f"registry/agent-{i}-registry.csv"
        completed = 0
        total = 0
        
        with open(registry) as f:
            reader = csv.DictReader(f)
            for row in reader:
                total += 1
                total_commands += 1
                status = row['status']
                
                if status == 'completed':
                    completed += 1
                
                status_summary[status] = status_summary.get(status, 0) + 1
        
        agent_progress[f"agent-{i}"] = {
            'completed': completed,
            'total': total,
            'percentage': (completed/total*100) if total > 0 else 0
        }
    
    # Print summary
    print(f"\nTotal Commands: {total_commands}")
    print(f"Completed: {status_summary.get('completed', 0)} ({status_summary.get('completed', 0)/total_commands*100:.1f}%)")
    print(f"\nStatus Breakdown:")
    for status, count in sorted(status_summary.items()):
        print(f"  {status}: {count}")
    
    print(f"\nAgent Progress:")
    for agent, progress in sorted(agent_progress.items()):
        print(f"  {agent}: {progress['completed']}/{progress['total']} ({progress['percentage']:.1f}%)")
    
    # Find blockers
    print(f"\nCurrent Blockers:")
    blocker_files = glob.glob("coordination/BLOCKER-*.md")
    for blocker in sorted(blocker_files):
        print(f"  - {blocker}")

if __name__ == "__main__":
    generate_dashboard()
```

## Success Metrics

1. **Velocity**: 10+ commands/day per agent
2. **Quality**: <5% commands need rework
3. **Accuracy**: 100% CLI compatibility
4. **Coverage**: All CLI commands implemented

Remember: Communication prevents duplication and conflicts!