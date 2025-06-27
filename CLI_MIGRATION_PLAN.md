# Mittwald MCP-CLI Alignment Project Plan

## Overview
Complete architectural migration from raw API calls to CLI-workflow-based MCP tools, ensuring 1:1 mapping with Mittwald CLI commands.

## Phase 1: Archival and Preparation

### 1.1 Create Archive Tag
```bash
# Tag current state before migration
git tag -a v1.0.0-raw-api -m "Last version with raw API approach before CLI alignment"
git push origin v1.0.0-raw-api

# Create archive branch
git checkout -b archive/v1-raw-api
git push origin archive/v1-raw-api
git checkout main
```

### 1.2 Clean Slate Preparation
- Remove all existing Mittwald tools from `/src/handlers/tools/mittwald/`
- Remove all tool constants from `/src/constants/tool/mittwald/`
- Clean up tool-handlers.ts
- Keep only the framework structure and non-Mittwald tools

### 1.3 Directory Structure
```
mittwald-typescript-mcp-systempromptio/
├── cli-commands/              # Individual CLI command files
│   ├── app/
│   ├── backup/
│   ├── context/
│   ├── cronjob/
│   ├── database/
│   ├── domain/
│   ├── mail/
│   ├── org/
│   ├── project/
│   ├── server/
│   ├── ssh-key/
│   └── user/
├── swarm-cli-mapping/         # Swarm coordination
│   ├── registry/              # Command registries
│   │   ├── master-registry.csv
│   │   └── agent-{1-20}-registry.csv
│   ├── instructions/          # Agent instructions
│   │   └── agent-{1-20}-instructions.md
│   └── reports/               # Agent progress reports
│       └── agent-{1-20}-report.md
└── src/
    └── handlers/
        └── tools/
            └── mittwald-cli/  # New CLI-aligned tools
```

## Phase 2: Command Analysis and Distribution

### 2.1 Master Registry Format (CSV)
```csv
command_path,command_name,subcommand,cli_file,mcp_tool_name,parameters,assigned_agent,status,notes
app,app,list,cli-commands/app/list.md,mittwald_app_list,"[limit,skip]",agent-1,pending,
app,app,get,cli-commands/app/get.md,mittwald_app_get,"[app-id]",agent-1,pending,
```

### 2.2 Agent Registry Format (Per Agent CSV)
```csv
command_path,mcp_tool_name,cli_implementation_path,status,implementation_file,test_file,errors,completion_time
app/list,mittwald_app_list,/cli/src/commands/app/list.tsx,in_progress,src/handlers/tools/mittwald-cli/app/list.ts,,
```

## Phase 3: Swarm Agent Instructions Template

### 3.1 Common Instructions for ALL Agents
1. **Exact Naming Convention**:
   - MCP tool name = CLI command path with underscores
   - Example: `mw app install` → `mittwald_app_install`
   - Example: `mw database mysql user list` → `mittwald_database_mysql_user_list`

2. **Parameter Mapping Rules**:
   - CLI flags → MCP tool parameters (camelCase)
   - Example: `--project-id` → `projectId`
   - Example: `--skip-wait` → `skipWait`
   - Required CLI args → Required MCP parameters
   - Optional CLI flags → Optional MCP parameters

3. **Implementation Requirements**:
   - Read the EXACT CLI implementation from `/Users/robert/Code/Mittwald/cli/src/commands/`
   - Copy the EXACT business logic, validation, and error handling
   - Use the SAME API calls in the SAME order
   - Preserve ALL side effects and console outputs as return data
   - Include progress reporting if CLI has progress bars

4. **Code Structure**:
   ```typescript
   // src/handlers/tools/mittwald-cli/{category}/{command}.ts
   export const handle_{mcp_tool_name}: ToolHandler<{ArgType}> = async (args, context) => {
     // 1. Parameter validation (same as CLI)
     // 2. API client initialization
     // 3. Business logic (EXACT copy from CLI)
     // 4. Response formatting
   }
   ```

### 3.2 Agent-Specific Instructions

Each agent will receive:
1. Their assigned commands from the registry
2. Links to specific CLI command implementations
3. Expected delivery timeline
4. Reporting requirements

## Phase 4: Implementation Process (Per Command)

### 4.1 Analysis Steps
1. Locate CLI command file in `/Users/robert/Code/Mittwald/cli/src/commands/`
2. Extract:
   - Command structure and subcommands
   - Parameter definitions (args, flags, options)
   - Business logic flow
   - API calls sequence
   - Error handling
   - Output formatting

### 4.2 Implementation Steps
1. Create tool constant definition
2. Create Zod schema for parameters
3. Implement handler with exact CLI logic
4. Add to tool registry
5. Create tests
6. Update agent registry with status

## Phase 5: Quality Assurance

### 5.1 Validation Checklist (Per Tool)
- [ ] Tool name matches CLI command exactly
- [ ] All CLI parameters are present
- [ ] Required/optional status matches CLI
- [ ] Business logic is identical
- [ ] API calls are in same order
- [ ] Error messages match CLI
- [ ] Success responses include same data

### 5.2 Testing Requirements
- Unit tests for each tool
- Integration tests with real API
- Comparison tests: CLI output vs MCP output

## Phase 6: Swarm Coordination

### 6.1 Agent Distribution
- 20 agents total
- Each agent gets ~15-20 commands
- Grouped by category for context

### 6.2 Communication Protocol
- Daily status updates in registry
- Blockers reported immediately
- Cross-agent dependencies tracked

### 6.3 Merge Strategy
- Each agent works on separate branch
- Daily integration to main
- Continuous testing on integration

## Success Criteria
1. 100% of CLI commands have MCP equivalents
2. All tools pass CLI-MCP comparison tests
3. Documentation complete for all tools
4. No breaking changes to MCP protocol