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