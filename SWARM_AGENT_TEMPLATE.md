# SWARM AGENT INSTRUCTIONS TEMPLATE

## Agent Assignment: Agent-{NUMBER}

### YOUR MISSION
You are responsible for implementing MCP tools that EXACTLY replicate Mittwald CLI commands. Your implementation must be a perfect 1:1 mapping of CLI functionality to MCP tools.

### YOUR ASSIGNED COMMANDS
See your registry file: `swarm-cli-mapping/registry/agent-{NUMBER}-registry.csv`

### CRITICAL REQUIREMENTS

#### 1. EXACT NAMING CONVENTION
```
CLI Command: mw {category} {subcategory} {action}
MCP Tool Name: mittwald_{category}_{subcategory}_{action}

Examples:
- mw app list → mittwald_app_list
- mw database mysql user create → mittwald_database_mysql_user_create
- mw project create → mittwald_project_create
```

#### 2. PARAMETER MAPPING RULES
```typescript
// CLI Flag → MCP Parameter
--project-id → projectId (camelCase)
--app-installation-id → appInstallationId
--output → output (keep single words)

// CLI Positional Args → Required Parameters
mw app get <app-id> → { appId: string } // REQUIRED

// CLI Optional Flags → Optional Parameters  
--limit → limit?: number
--skip → skip?: number
```

#### 3. IMPLEMENTATION PROCESS

##### Step 1: Locate CLI Implementation
```bash
# Your command file tells you where to look
# Example: app/list → /Users/robert/Code/Mittwald/cli/src/commands/app/list.tsx
```

##### Step 2: Extract EVERYTHING
Create a detailed analysis file first:
```markdown
# Command Analysis: {command}

## CLI Location
File: /Users/robert/Code/Mittwald/cli/src/commands/app/list.tsx

## Command Structure
- Extends: {BaseCommand}
- Args: {list all positional arguments}
- Flags: {list all flags with types}

## Business Logic Flow
1. {Step by step what the CLI does}
2. {Include ALL validation}
3. {Include ALL API calls}
4. {Include ALL transformations}

## API Calls
1. client.{service}.{method}({exact params})
2. {List every API call in order}

## Error Handling
- {List all error cases}
- {Include exact error messages}

## Output Format
- {Describe what CLI returns/displays}
```

##### Step 3: Implement MCP Tool
```typescript
// src/handlers/tools/mittwald-cli/{category}/{command}.ts

import { formatToolResponse } from '../../types.js';
import type { ToolHandler } from '../../types.js';

// EXACT parameter interface from CLI
export interface Mittwald{ToolName}Args {
  // Match CLI args/flags EXACTLY
}

export const handle{ToolName}: ToolHandler<Mittwald{ToolName}Args> = async (args, { mittwaldClient }) => {
  try {
    // 1. EXACT validation from CLI
    if (!args.projectId) {
      throw new Error("Project ID is required"); // Use CLI's exact message
    }

    // 2. EXACT business logic from CLI
    // Copy the logic line by line, adapting only for:
    // - TypeScript vs JavaScript syntax
    // - MCP context vs CLI context
    // - Return format vs console output

    // 3. EXACT API calls from CLI
    const response = await mittwaldClient.api.{service}.{method}({
      // EXACT same parameters as CLI
    });

    // 4. EXACT response processing from CLI
    
    return formatToolResponse({
      message: "Successfully {action}", // Match CLI success message
      result: {
        // Include ALL data that CLI would display
      }
    });
  } catch (error) {
    // EXACT error handling from CLI
    return formatToolResponse({
      status: "error",
      message: error.message, // Use CLI's error format
      error: {
        type: "CLI_ERROR",
        details: error
      }
    });
  }
};
```

##### Step 4: Create Tool Definition
```typescript
// src/constants/tool/mittwald-cli/{category}/{command}.ts

export const mittwald_{tool_name}: Tool = {
  name: "mittwald_{tool_name}",
  description: "{EXACT description from CLI --help}",
  inputSchema: {
    type: "object",
    properties: {
      // EXACT parameters from CLI
    },
    required: [/* CLI required args */]
  }
};
```

#### 4. REGISTRY MAINTENANCE

Update your registry after EACH step:
```csv
command_path,mcp_tool_name,cli_implementation_path,status,implementation_file,test_file,errors,completion_time
app/list,mittwald_app_list,/cli/src/commands/app/list.tsx,analyzing,,,,2024-01-10T10:00:00Z
app/list,mittwald_app_list,/cli/src/commands/app/list.tsx,implementing,src/handlers/tools/mittwald-cli/app/list.ts,,,2024-01-10T11:00:00Z
app/list,mittwald_app_list,/cli/src/commands/app/list.tsx,testing,src/handlers/tools/mittwald-cli/app/list.ts,tests/app/list.test.ts,,2024-01-10T12:00:00Z
app/list,mittwald_app_list,/cli/src/commands/app/list.tsx,completed,src/handlers/tools/mittwald-cli/app/list.ts,tests/app/list.test.ts,,2024-01-10T13:00:00Z
```

#### 5. VALIDATION CHECKLIST

Before marking a command as complete:
- [ ] Tool name exactly matches CLI pattern
- [ ] ALL CLI parameters are present
- [ ] Parameter types match CLI exactly
- [ ] Required/optional status matches CLI
- [ ] Business logic is line-by-line identical
- [ ] API calls are in exact same order
- [ ] Error messages are verbatim from CLI
- [ ] Success response includes all CLI output data
- [ ] Help description matches CLI --help

#### 6. COMMON PATTERNS TO PRESERVE

##### Progress Reporting
If CLI shows progress:
```typescript
// CLI: process.stdout.write('.')
// MCP: Track progress in result
result.progress = { current: i, total: items.length };
```

##### Interactive Confirmations
If CLI asks for confirmation:
```typescript
// CLI: await confirm('Are you sure?')
// MCP: Add `skipConfirmation` parameter or return confirmation request
```

##### Table Output
If CLI shows tables:
```typescript
// CLI: printTable(data)
// MCP: Return structured data that could recreate table
result.tableData = { headers: [...], rows: [...] };
```

### DELIVERABLES

For each command:
1. Analysis file: `swarm-cli-mapping/analysis/agent-{NUMBER}/{command}-analysis.md`
2. Implementation: `src/handlers/tools/mittwald-cli/{category}/{command}.ts`
3. Tool definition: `src/constants/tool/mittwald-cli/{category}/{command}.ts`
4. Test file: `tests/mittwald-cli/{category}/{command}.test.ts`
5. Updated registry with status

### COMMUNICATION

1. Update registry every 2 hours minimum
2. Report blockers immediately in your report file
3. If you need to coordinate with another agent, document in:
   `swarm-cli-mapping/coordination/agent-{NUMBER}-needs.md`

### REMEMBER
- You are NOT creating new functionality
- You are NOT improving the CLI
- You are EXACTLY replicating what exists
- Every decision should be "What does the CLI do?"