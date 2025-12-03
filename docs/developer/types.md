# Types Directory

This directory contains TypeScript type definitions for the entire application, ensuring type safety and providing clear contracts for data structures throughout the codebase.

## Overview

Types define the "what" at the data level:
- What shape data takes
- What parameters functions accept
- What responses look like
- What contracts exist between components

## File Structure

### Core Type Files

#### `index.ts`
Central export point for all types:
- Re-exports all type definitions
- Provides single import point
- Maintains backward compatibility

#### `request-context.ts`
Request context types:
- Authentication information
- Session data
- Handler context
- MCP-specific contexts

### Domain-Specific Types

#### `systemprompt.ts`
SystemPrompt.io integration types:
- API request/response formats
- Callback structures
- Service configuration

### MCP Protocol Extensions

#### `sampling.ts`
Sampling operation types:
- Sampling request formats
- Callback definitions
- Response structures
- Metadata types

#### `sampling-schemas.ts`
JSON Schema definitions:
- Response validation schemas
- Type guards
- Schema constants

## Type Categories

### Entity Types
Core data structures:
```typescript
interface ServerConfig {
  id: string;
  name: string;
  type: string;
  // ... other properties
}
```

### Request/Response Types
API communication:
```typescript
interface CreateServerRequest {
  name: string;
  type: string;
  region?: string;
  resources?: ServerResources;
}

interface CreateServerResponse {
  success: boolean;
  server?: ServerConfig;
  error?: string;
}
```

### Context Types
Handler contexts:
```typescript
interface MCPToolContext {
  sessionId: string;
  authInfo: MittwaldAuthInfo;
}
```

### Configuration Types
Settings and options:
```typescript
interface ServerConfig {
  port: number;
  oauthIssuer: string;
  jwtSecret: string;
}
```

## Type Safety Patterns

### Discriminated Unions
For type-safe variants:
```typescript
type MittwaldResource = 
  | { type: 'server'; data: ServerConfig }
  | { type: 'database'; data: DatabaseConfig }
  | { type: 'domain'; data: DomainConfig };
```

### Type Guards
For runtime type checking:
```typescript
function isServerConfig(content: unknown): content is ServerConfig {
  return typeof content === 'object' && 
         content !== null && 
         'name' in content;
}
```

### Utility Types
For type transformations:
```typescript
type PartialServer = Partial<ServerConfig>;
type RequiredFields = Required<Pick<ServerConfig, 'id' | 'name'>>;
type ServerWithoutMeta = Omit<ServerConfig, 'metadata'>;
```

## Best Practices

### Interface Design
- Use interfaces for objects
- Prefer types for unions/intersections
- Document complex properties
- Make optional fields explicit

### Naming Conventions
- Interfaces: `PascalCase` (e.g., `ServerConfig`)
- Type aliases: `PascalCase` (e.g., `ServerType`)
- Enums: `PascalCase` (e.g., `SortOrder`)
- Properties: `camelCase` (e.g., `createdAt`)

### Organization
- Group related types together
- Export from index.ts
- Avoid circular dependencies
- Keep types close to usage

## Adding New Types

To add new type definitions:

1. **Create Type File**
   ```typescript
   // my-feature.ts
   export interface MyFeature {
     id: string;
     // ... properties
   }
   ```

2. **Export from Index**
   ```typescript
   // index.ts
   export * from './my-feature';
   ```

3. **Document Complex Types**
   ```typescript
   /**
    * Represents a complex operation
    * @param input - The input data
    * @param options - Configuration options
    */
   export interface ComplexOperation {
     input: InputData;
     options?: OperationOptions;
   }
   ```

## Type Migration Guide

When adapting for a new API:

1. **Replace Domain Types**
   - Remove old API-specific types
   - Add your API's types
   - Update entity interfaces

2. **Update Context Types**
   - Modify auth info structure
   - Update session data
   - Change handler contexts

3. **Adjust Tool Types**
   - Define new tool parameters
   - Update response formats
   - Add validation types

4. **Maintain Protocol Types**
   - Keep MCP-related types
   - Preserve sampling types
   - Retain base interfaces

## Testing with Types

Type benefits for testing:
- Compile-time safety
- Auto-completion in tests
- Clear test data structure
- Type inference benefits

Example:
```typescript
const mockServer: ServerConfig = {
  id: 'test123',
  name: 'Test Server',
  // TypeScript ensures all required fields
};
```

This type system provides the foundation for a maintainable, scalable MCP server implementation.