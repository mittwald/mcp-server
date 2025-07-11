# CLI Wrapper Architecture

## Overview

The Mittwald MCP Server uses a CLI wrapper approach instead of direct API client usage. This architectural decision provides better maintainability, compatibility, and resilience to API changes.

## Benefits

### 1. Resilience to API Changes
- CLI maintains backward compatibility, shielding MCP from API changes
- Automatic compatibility with new API versions

### 2. Reduced Complexity
- ~100 lines vs 300+ lines for complex operations
- Focus on argument mapping and output parsing

### 3. Maintained Feature Parity
- Automatically inherits all CLI features and improvements
- No need to manually implement each API feature

### 4. Better Error Messages
- CLI provides polished, user-tested error messages
- No need to interpret API errors manually

## Implementation Pattern

```typescript
export const handleCommandCli: MittwaldToolHandler = async (args) => {
  // 1. Map MCP arguments to CLI arguments
  const cliArgs = ['command', 'subcommand'];
  
  // 2. Execute CLI command
  const result = await executeCli('mw', cliArgs, {
    env: { MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN }
  });
  
  // 3. Parse output and return MCP response
  return formatToolResponse(status, message, data);
};
```

## Authentication

- API token passed via environment variable
- CLI handles all authentication complexity
- No changes needed to existing auth setup

## Docker Configuration

```dockerfile
# Install CLI globally in container
RUN npm install -g @mittwald/cli
```

## Migration Status

The server has been successfully migrated to use CLI wrapper approach for all operations. This provides:

- **Maintainability**: Less code to maintain
- **Compatibility**: Automatic API compatibility
- **Consistency**: Same behavior as CLI users expect
- **Simplicity**: Reduced complexity
- **Future-proof**: CLI is Mittwald's primary interface