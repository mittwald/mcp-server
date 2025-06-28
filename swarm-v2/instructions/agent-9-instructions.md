# CLI Migration Agent 9 Instructions

## YOUR CRITICAL RESPONSIBILITIES

### 🚨 COMMIT FREQUENTLY OR LOSE YOUR WORK! 🚨
**You MUST commit after implementing EACH tool. No exceptions!**

## Your Workspace
- **Directory**: `../mittwald-cli-swarm-v2/agent-9`
- **Branch**: `cli-v2-agent-9`
- **Registry**: `swarm-v2/registry/agent-9-registry.csv`

## Your Assigned Tools
You have been assigned 8 tools to implement:\n\n1. **mittwald_database_mysql_dump**\n   - Command: `mw database/mysql/dump`\n   - CLI File: `/Users/robert/Code/Mittwald/cli-commands/mw-database-mysql-dump.md`\n\n2. **mittwald_database_mysql_get**\n   - Command: `mw database/mysql/get`\n   - CLI File: `/Users/robert/Code/Mittwald/cli-commands/mw-database-mysql-get.md`\n\n3. **mittwald_database_mysql_import**\n   - Command: `mw database/mysql/import`\n   - CLI File: `/Users/robert/Code/Mittwald/cli-commands/mw-database-mysql-import.md`\n\n4. **mittwald_database_mysql_list**\n   - Command: `mw database/mysql/list`\n   - CLI File: `/Users/robert/Code/Mittwald/cli-commands/mw-database-mysql-list.md`\n\n5. **mittwald_database_mysql_phpmyadmin**\n   - Command: `mw database/mysql/phpmyadmin`\n   - CLI File: `/Users/robert/Code/Mittwald/cli-commands/mw-database-mysql-phpmyadmin.md`\n\n6. **mittwald_database_mysql_port_forward**\n   - Command: `mw database/mysql/port/forward`\n   - CLI File: `/Users/robert/Code/Mittwald/cli-commands/mw-database-mysql-port-forward.md`\n\n7. **mittwald_database_mysql_shell**\n   - Command: `mw database/mysql/shell`\n   - CLI File: `/Users/robert/Code/Mittwald/cli-commands/mw-database-mysql-shell.md`\n\n8. **mittwald_database_mysql_versions**\n   - Command: `mw database/mysql/versions`\n   - CLI File: `/Users/robert/Code/Mittwald/cli-commands/mw-database-mysql-versions.md`\n\n

## Implementation Workflow - FOLLOW EXACTLY

### For EACH Tool You Implement:

#### Step 1: Start Implementation
```bash
# First, announce what you're working on
echo "Starting implementation of mittwald_{tool_name}" >> progress.log
git add progress.log && git commit -m "chore: starting {tool_name}"
```

#### Step 2: Study CLI Implementation
1. Open the CLI file from your assignment
2. Document the implementation approach
3. Note all parameters, validation, and API calls

#### Step 3: Create Tool Definition
1. Create the file: `src/constants/tool/mittwald-cli/{category}/{file}.ts`
2. Implement the tool definition with exact CLI parameters
3. **SAVE THE FILE**

#### Step 4: Create Handler
1. Create the file: `src/handlers/tools/mittwald-cli/{category}/{file}.ts`
2. Implement the handler matching CLI logic exactly
3. **SAVE THE FILE**

#### Step 5: Register the Tool (3 places)
1. Export from `src/constants/tool/mittwald-cli/{category}/index.ts`
2. Import and add to TOOLS array in `src/constants/tools.ts`
3. In `src/handlers/tool-handlers.ts`:
   - Import the handler
   - Add Zod schema to ToolSchemas
   - Add case to handleToolCall switch

#### Step 6: COMMIT IMMEDIATELY! 
```bash
# Add all files for this tool
git add -A

# Commit with descriptive message
git commit -m "feat(cli): implement mittwald_{category}_{action}

- Added tool definition with {X} parameters
- Implemented handler with CLI workflow replication
- Registered in all required locations
- Follows exact CLI behavior from {cli_file_path}"
```

#### Step 7: Update Registry
```bash
# Update your CSV to mark tool as completed
# Include the commit hash from step 6
echo "Updated registry with completion of {tool_name}" >> progress.log
git add swarm-v2/registry/agent-9-registry.csv progress.log
git commit -m "chore: mark {tool_name} as completed in registry"
```

#### Step 8: Push to Remote
```bash
# Push your branch to remote
git push origin cli-v2-agent-9
```

#### Step 9: Move to Next Tool
Repeat from Step 1 for your next assigned tool.

## MANDATORY COMMIT RULES

### When to Commit:
1. **After EACH tool implementation** (definition + handler + registration)
2. **After EACH registry update**
3. **Every 30 minutes** regardless of progress (WIP commits are fine)
4. **Before ANY break** (even 5 minutes)
5. **If switching context** or reading documentation
6. **After fixing any bug or error**

### Commit Message Format:
```bash
# Feature commits
git commit -m "feat(cli): implement mittwald_{category}_{action}"

# Work in progress
git commit -m "WIP(cli): partial implementation of {tool_name}"

# Registry updates
git commit -m "chore: update registry for {tool_name}"

# Fixes
git commit -m "fix(cli): correct parameter mapping for {tool_name}"
```

## What NOT to Do
1. **DON'T** implement multiple tools before committing
2. **DON'T** wait until "everything is perfect" to commit
3. **DON'T** work in a different agent's directory
4. **DON'T** modify tools that aren't in your assignment
5. **DON'T** skip registry updates

## Progress Tracking
Your registry CSV must be updated after each tool:
```csv
command_path,mcp_tool_name,status,commit_hash,completion_time,notes
app/get,mittwald_app_get,completed,a1b2c3d,2024-01-15T10:30:00Z,"Implemented with 3 parameters"
```

## Emergency Recovery
If something goes wrong:
```bash
# Check your last commit
git log --oneline -5

# If you have uncommitted work, COMMIT IT NOW
git add -A
git commit -m "WIP: emergency commit - {describe state}"

# Push to remote
git push origin cli-v2-agent-9
```

## Success Checklist for Each Tool
- [ ] Tool definition created
- [ ] Handler implemented  
- [ ] Exported from category index
- [ ] Added to TOOLS array
- [ ] Handler imported in tool-handlers.ts
- [ ] Zod schema added
- [ ] Switch case added
- [ ] **COMMITTED TO GIT**
- [ ] Registry updated
- [ ] **REGISTRY COMMIT MADE**
- [ ] Pushed to remote

Remember: **FREQUENT COMMITS PREVENT WORK LOSS!**