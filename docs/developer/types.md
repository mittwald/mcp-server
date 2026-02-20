# Types Directory

This directory contains TypeScript type definitions for the MCP server, ensuring type safety and providing clear contracts for data structures.

## File Structure

```
src/types/
├── index.ts                 # Central export (currently empty)
├── request-context.ts       # MCP handler context types
├── tool-registry.ts         # Dynamic tool registration types
├── tool-validation.ts       # Tool validation types
├── sampling.ts              # MCP sampling operation types
├── sampling-schemas.ts      # JSON Schema definitions
├── scenario.ts              # Scenario test definitions
├── scenario-execution.ts    # Scenario execution results
└── mittwald/                # Mittwald API domain types
    ├── app.ts               # App, AppVersion, AppInstallation
    ├── container.ts         # Container registry types
    ├── conversation.ts      # Conversation/messaging types
    ├── customer.ts          # Customer entity types
    ├── mail.ts              # Email/mailbox types
    ├── marketplace.ts       # Marketplace extension types
    ├── miscellaneous.ts     # Utility types
    ├── notification.ts      # Notification types
    ├── project.ts           # Project entity types
    ├── ssh-backup.ts        # SSH keys and backup types
    └── user.ts              # User/authentication types
```

## Core Type Files

### `request-context.ts`

Defines `MCPToolContext` passed to tool handlers:

```typescript
interface MCPToolContext {
  sessionId: string;      // Unique MCP session ID
  authInfo: AuthInfo;     // Authentication credentials
  abortSignal?: AbortSignal;
}
```

### `tool-registry.ts`

Types for dynamic tool discovery and registration:

- `ToolHandler` - Function signature for tool handlers
- `ToolRegistration` - Tool definition + handler pairing
- `ToolRegistry` - Collection of registered tools
- `ToolScanOptions` / `ToolScanResult` - Tool scanning utilities

### `sampling.ts` / `sampling-schemas.ts`

MCP sampling protocol extensions:
- Sampling request/response formats
- JSON Schema validation definitions

### `scenario.ts` / `scenario-execution.ts`

Test scenario definitions for documentation-driven testing (Feature 018).

## Mittwald Domain Types

The `mittwald/` subdirectory contains types matching the Mittwald API structure:

| File | Contents |
|------|----------|
| `app.ts` | `App`, `AppVersion`, `AppInstallation`, system software |
| `container.ts` | Container registries, images, repositories |
| `customer.ts` | Customer entities and memberships |
| `mail.ts` | Mail addresses, deliveryboxes, forwards |
| `project.ts` | Projects, server configurations |
| `user.ts` | Users, API tokens, SSH keys |

These types are derived from the Mittwald API client (`@mittwald/api-client`) and provide additional structure for MCP tool handlers.

## Usage

Import types directly from their modules:

```typescript
import type { MCPToolContext } from '@/types/request-context.js';
import type { ToolRegistration } from '@/types/tool-registry.js';
import type { AppInstallation } from '@/types/mittwald/app.js';
```

## Adding New Types

1. Create type file in appropriate location (`src/types/` or `src/types/mittwald/`)
2. Export types from the file
3. Import where needed (no central re-export currently)
