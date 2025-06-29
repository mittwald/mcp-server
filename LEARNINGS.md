# MCP STDIO Transport Logging Best Practices - Critical Learnings

## The Problem
When implementing STDIO transport for Model Context Protocol (MCP) servers, incorrect logging can completely break the protocol communication, causing Claude Desktop and other MCP clients to receive parsing errors like "Unexpected token" instead of connecting successfully.

## Root Cause: stdout vs stderr Confusion
The fundamental issue is that **STDIO transport in MCP has strict requirements about what goes to stdout vs stderr**:

### MCP STDIO Protocol Requirements:
1. **stdout is RESERVED for JSON-RPC messages ONLY**
2. **ALL logging must go to stderr**
3. **Any non-JSON-RPC output to stdout breaks the protocol**

## Critical Logging Mistakes to Avoid

### ❌ Wrong: Using console.log(), console.info(), console.warn()
```typescript
console.log('Server starting...');     // ❌ Goes to stdout - BREAKS MCP
console.info('Tool called');          // ❌ Goes to stdout - BREAKS MCP  
console.warn('Rate limit warning');   // ❌ Goes to stdout - BREAKS MCP
```

### ✅ Correct: Using console.error() for ALL logging
```typescript
console.error('[INFO] Server starting...');     // ✅ Goes to stderr
console.error('[DEBUG] Tool called');           // ✅ Goes to stderr
console.error('[WARN] Rate limit warning');     // ✅ Goes to stderr
console.error('[ERROR] Something failed');      // ✅ Goes to stderr
```

## Node.js Console Method Output Destinations
- `console.log()` → stdout ❌
- `console.info()` → stdout ❌  
- `console.warn()` → stdout ❌
- `console.debug()` → stdout ❌
- `console.error()` → stderr ✅

## The Fix for Our Logger
In `src/utils/logger.ts`, we needed to change ALL logging methods to use `console.error()`:

```typescript
// Before (BROKEN for STDIO):
info: (...args: any[]) => {
  console.info('[INFO]', ...args);  // ❌ stdout
},

// After (WORKING for STDIO):
info: (...args: any[]) => {
  console.error('[INFO]', ...args); // ✅ stderr
},
```

## Why This Is Critical
When Claude Desktop tries to parse STDIO output, it expects pure JSON-RPC like:
```json
{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2024-11-05",...}}
```

But with incorrect logging, it receives:
```
[INFO] 🚀 Mittwald MCP STDIO server started
{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2024-11-05",...}}
```

The log line breaks JSON parsing, causing "Unexpected token" errors.

## Official MCP Documentation Quote
From the MCP specification:
> "Local MCP servers should not log messages to stdout (standard out), as this will interfere with protocol operation. When building a server that uses the local stdio transport, all messages logged to stderr (standard error) will be captured by the host application (e.g., Claude Desktop) automatically."

## Testing STDIO Servers
To test if your STDIO server has clean stdout:
```bash
echo '{"jsonrpc":"2.0","method":"initialize",...}' | your-server 2>/dev/null
```

Should output ONLY JSON-RPC, no log messages.

## Alternative: Use MCP Protocol Logging
Instead of console logging, consider using the MCP protocol's built-in logging notifications to send structured logs to the client.

## Environment Variables for STDIO
Don't forget to set:
- `DISABLE_OAUTH=true` (if using OAuth-based server)
- Required API tokens
- Any other service-specific variables

## Key Takeaways
1. **STDIO transport requires stderr for ALL logging**
2. **stdout pollution breaks MCP protocol completely** 
3. **Test with `2>/dev/null` to verify clean stdout**
4. **When in doubt, use `console.error()` for everything in STDIO servers**

This learning prevents hours of debugging "connection closed" and "unexpected token" errors that actually stem from simple stdout/stderr confusion.

## MCP Tool Schema Validation Issues

When adding new MCP tools, there are three critical places that must be updated or tools will fail with "no validation schema found":

1. **Tool Definition**: Define the tool with `inputSchema` in `/src/constants/tool/...`
2. **Tool Handler**: Implement the handler function in `/src/handlers/tools/...`  
3. **Tool Registration**: Add to three places in `/src/handlers/tool-handlers.ts`:
   - Import the handler function
   - Add Zod schema to `ToolSchemas` object
   - Add switch case to `handleToolCall` function

**Common Error**: Tool shows in list but fails when called with "MCP error- 32603: no validation schema found for tool: toolname"

**Root Cause**: Missing Zod schema in `ToolSchemas` object in tool-handlers.ts

**Fix**: Always ensure all three registration points are updated when adding new tools.

## Git Worktrees for Parallel Development with Multiple Agents

### The Problem
When running multiple AI agents or Claude Code sessions to work on the same repository in parallel, they can interfere with each other by:
- Modifying the same files simultaneously
- Committing to wrong branches
- Creating merge conflicts
- Overwriting each other's work

### The Solution: Git Worktrees
Git worktrees allow checking out multiple branches from the same repository into separate directories, providing complete isolation between parallel development sessions.

### How to Set Up Worktrees for Parallel Agents
```bash
# Create a worktree for each agent/session
git worktree add ../project-agent-1 -b feature-agent-1
git worktree add ../project-agent-2 -b feature-agent-2
# ... continue for all agents

# Each agent works in their own directory
cd ../project-agent-1
claude code  # Agent 1 works here

cd ../project-agent-2  
claude code  # Agent 2 works here
```

### Benefits for Multi-Agent Development
1. **Complete Isolation**: Each agent has its own working directory
2. **No File Conflicts**: Changes in one worktree don't affect others
3. **Shared Git History**: All worktrees share the same repository history
4. **Parallel Execution**: Multiple agents can work simultaneously without interference
5. **Clean Merging**: Each agent's work stays on its own branch until ready to merge

### Management Commands
```bash
# List all active worktrees
git worktree list

# Remove a worktree when done
git worktree remove ../project-agent-1

# Prune stale worktree information
git worktree prune
```

### Best Practices for Agent Swarms
1. **Naming Convention**: Use descriptive names like `mittwald-agent-1`, `mittwald-agent-2`
2. **Branch Strategy**: Create a dedicated branch for each worktree/agent
3. **Documentation**: Place agent-specific instructions in each worktree
4. **Environment Setup**: Remember to set up dependencies in each worktree
5. **Registry Tracking**: Use a central registry (in main) to track agent progress

### Lesson Learned
In our CLI migration swarm, multiple agents accidentally worked on the same branch (cli-migration-agent-7) because they were all operating in the same directory. Using worktrees would have prevented this by giving each agent their own isolated workspace.

## CRITICAL: MCP Servers Must Use API Client Only - NO CLI Dependencies

### The Fundamental Rule
**MCP servers MUST NEVER depend on external CLI tools being installed or available in the runtime environment.**

### Why This Is Critical
1. **MCP Runtime Environment**: MCP servers run in controlled environments where CLI tools may not be installed
2. **Portability**: MCP servers must work across different systems without external dependencies
3. **Security**: Depending on external CLI execution creates security vulnerabilities
4. **Reliability**: API calls are more reliable than CLI command execution

### What Is TABOO ❌
```typescript
// ❌ NEVER DO THIS IN MCP SERVERS
import { executeCliCommand } from '@/utils/execute-cli-command.js';
const result = await executeCliCommand('mw', ['project', 'list']);

// ❌ NEVER DO THIS
const { exec } = require('child_process');
exec('mw cronjob get ' + cronjobId);

// ❌ NEVER DO THIS  
process.spawn('mw', ['app', 'install', 'wordpress']);
```

### What Is CORRECT ✅
```typescript
// ✅ ALWAYS USE API CLIENT
import { getMittwaldClient } from '@/services/mittwald-client.js';
const client = getMittwaldClient();
const response = await client.project.listProjects({});

// ✅ USE OFFICIAL SDK
const result = await mittwaldClient.app.requestAppInstallation({
  projectId: args.projectId,
  appVersionId: versionId
});
```

### Why CLI Exists in This Project
The Mittwald CLI code in this repository exists ONLY for:
1. **Study purposes** - to understand API usage patterns
2. **Reference implementation** - to see how CLI commands map to API calls
3. **Documentation** - to understand parameter mappings and workflows

**The CLI is NOT for execution in the MCP server!**

### Correct Implementation Pattern
1. Study the CLI command implementation
2. Identify which API client methods it uses
3. Extract the core API calls
4. Implement the same logic using direct API client calls
5. Handle errors and responses properly

### API Client Usage Pattern
```typescript
export async function handleMittwaldToolCall(
  args: ToolArgs,
  context: RequestContext
): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient(context.authStore);
    
    // Use official API client methods
    const response = await client.category.methodName({
      param1: args.param1,
      param2: args.param2
    });
    
    // Handle response
    if (response.status === 200) {
      return formatToolResponse('success', 'Operation completed', response.data);
    }
    
    throw new Error(`API call failed: ${response.status}`);
  } catch (error) {
    return formatToolResponse('error', `Failed: ${error.message}`);
  }
}
```

### Key Takeaway
**MCP servers are API-driven, not CLI-driven. The API client is the only acceptable way to interact with external services.**