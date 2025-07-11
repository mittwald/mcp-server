# Mittwald MCP Server - CLI Wrapper Architecture Proposal

## Executive Summary

This document outlines the architectural transformation of the Mittwald MCP (Model Context Protocol) Server from direct API client usage to a CLI wrapper approach. The proof of concept with domain virtualhost commands has demonstrated significant benefits in terms of maintainability, compatibility, and resilience to API changes.

## Current Architecture

### Overview
The Mittwald MCP Server is a TypeScript-based implementation that exposes Mittwald's infrastructure management capabilities through the Model Context Protocol. It currently runs as a Docker container exposing an HTTP endpoint on port 3000.

### Current Implementation Approach
1. **Direct API Client Usage**: Uses `@mittwald/api-client` package directly
2. **Complex API Interactions**: Handles authentication, request formatting, and response parsing
3. **Manual ID Resolution**: Implements logic to resolve short IDs to UUIDs
4. **Error Handling**: Custom error parsing and user-friendly message generation

### Example: Current VirtualHost Create Implementation
```typescript
// Direct API call with complex parameter building
const response = await mittwaldClient.domain.ingressCreateIngress({
  data: {
    projectId: projectId,
    hostname: args.hostname,
    paths: complexPathMappings
  }
});
```

## Proposed Architecture

### Overview
Transform the entire MCP server to use the Mittwald CLI (`@mittwald/cli`) as an execution layer, treating it as a stable interface to Mittwald's services.

### CLI Wrapper Approach
1. **CLI as Interface**: Execute `mw` commands via subprocess
2. **Simplified Implementation**: Delegate complexity to the official CLI
3. **Automatic Compatibility**: Benefit from CLI's maintained compatibility layer
4. **Consistent Behavior**: Users get identical behavior to CLI usage

### Example: New VirtualHost Create Implementation
```typescript
// Simple CLI execution with argument passing
const result = await executeCli('mw', [
  'domain', 'virtualhost', 'create',
  '--hostname', args.hostname,
  '--project-id', args.projectId,
  '--path-to-container', '/:c-abc123:8080/tcp'
]);
```

## Key Benefits

### 1. Resilience to API Changes
- **Current**: Direct API usage breaks when Mittwald changes their API
- **Proposed**: CLI maintains backward compatibility, shielding MCP from changes

### 2. Reduced Complexity
- **Current**: 300+ lines for virtualhost creation with ID resolution, error handling
- **Proposed**: ~100 lines focusing on argument mapping and output parsing

### 3. Maintained Feature Parity
- **Current**: Must manually implement each API feature
- **Proposed**: Automatically inherits all CLI features and improvements

### 4. Better Error Messages
- **Current**: Must interpret API errors and create user-friendly messages
- **Proposed**: CLI provides polished, user-tested error messages

### 5. Simplified Testing
- **Current**: Mock complex API responses
- **Proposed**: Test CLI argument generation and output parsing

## Implementation Details

### Core Components

1. **CLI Wrapper Utility** (`src/utils/cli-wrapper.ts`)
   - Safe command execution with argument escaping
   - Environment variable passing (API token)
   - Output parsing (JSON, quiet mode, text)
   - Error handling and exit code management

2. **Handler Pattern**
   ```typescript
   export const handleDomainVirtualhostCreateCli: MittwaldToolHandler = async (args) => {
     // 1. Map MCP arguments to CLI arguments
     const cliArgs = ['domain', 'virtualhost', 'create'];
     
     // 2. Execute CLI command
     const result = await executeCli('mw', cliArgs, {
       env: { MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN }
     });
     
     // 3. Parse output and return MCP response
     return formatToolResponse(status, message, data);
   };
   ```

### Authentication
- API token from `.env` file passed via environment variable
- CLI handles all authentication complexity
- No changes needed to existing auth setup

### Docker Configuration
```dockerfile
# Install CLI globally in container
RUN npm install -g @mittwald/cli
```

## Migration Strategy

### Phase 1: Proof of Concept ✅
- Implement domain virtualhost commands
- Validate approach and benefits
- Test in production-like environment

### Phase 2: Systematic Migration
1. **Group by Feature Area**
   - App management commands
   - Database commands
   - Project commands
   - Backup commands
   - User/SSH commands

2. **Migration Pattern**
   - Create new CLI wrapper handler
   - Update imports/exports
   - Remove old API-based handler
   - Test functionality

3. **Parallel Implementation**
   - Keep both implementations during migration
   - Feature flag to switch between them
   - Gradual rollout and testing

### Phase 3: Cleanup
- Remove `@mittwald/api-client` dependency
- Remove old handler code
- Update documentation
- Performance optimization

## Considerations

### Pros
1. **Maintainability**: Less code to maintain
2. **Compatibility**: Automatic API compatibility
3. **Consistency**: Same behavior as CLI users expect
4. **Simplicity**: Reduced complexity
5. **Future-proof**: CLI is Mittwald's primary interface

### Cons
1. **Performance**: Subprocess overhead vs direct API calls
2. **Debugging**: Additional layer of indirection
3. **CLI Dependency**: Requires CLI to be installed and maintained
4. **Output Parsing**: Must parse text/JSON output instead of typed responses

### Mitigation Strategies
1. **Performance**: CLI overhead is negligible for typical MCP usage patterns
2. **Debugging**: Comprehensive logging of CLI commands and outputs
3. **CLI Dependency**: Pin CLI version in Dockerfile for stability
4. **Output Parsing**: Use `--output json` for structured data

## Technical Specifications

### Dependencies
- Current: `@mittwald/api-client`, `@mittwald/api-client-commons`
- Proposed: `@mittwald/cli` (installed globally in Docker)

### Error Handling
- Parse CLI exit codes and stderr
- Map common error patterns to user-friendly messages
- Preserve CLI's error messages where appropriate

### Testing Strategy
- Unit tests for argument mapping
- Integration tests with actual CLI (in CI)
- End-to-end tests with Docker container

## Conclusion

The CLI wrapper approach offers significant advantages for the Mittwald MCP Server:
- **Reduced maintenance burden**
- **Improved reliability**
- **Better user experience**
- **Faster feature adoption**

The successful proof of concept with domain virtualhost commands demonstrates that this architecture is both feasible and beneficial. The proposed migration would transform the MCP server into a more maintainable and resilient system while preserving all existing functionality.

## Next Steps

1. Review and approve this architectural proposal
2. Create detailed migration plan with timelines
3. Begin systematic migration of command groups
4. Monitor performance and user feedback
5. Complete migration and optimize as needed