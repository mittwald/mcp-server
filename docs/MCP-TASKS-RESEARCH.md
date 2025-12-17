# MCP Tasks Research Report

**Date:** 2025-12-17
**Status:** Research Complete
**Relevance:** Potential solution for timeout issues in long-running operations

## Executive Summary

MCP Tasks is an **experimental feature** introduced in the [November 2025 MCP specification (2025-11-25)](https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/tasks) that enables asynchronous, long-running operations. While promising for solving our timeout problems with operations like backups and database imports, **client support is currently unclear/incomplete**.

The specification includes built-in capability negotiation that allows servers to detect client support and fall back to synchronous operations, making it safe to implement without breaking existing clients.

## What Are MCP Tasks?

Tasks provide a "call-now, fetch-later" pattern for MCP operations:

1. **Create**: Client sends tool call with `task` parameter, receives task ID immediately
2. **Poll**: Client periodically checks status via `tasks/get`
3. **Retrieve**: Client fetches results via `tasks/result` when complete

This decouples request initiation from result retrieval, enabling operations that take minutes or hours without blocking.

## Protocol Details

### Creating a Task-Augmented Tool Call

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "backup_create",
    "arguments": {"projectId": "p-xxxxx"},
    "task": {
      "ttl": 300000
    }
  }
}
```

### Immediate Response (CreateTaskResult)

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "task": {
      "taskId": "786512e2-9e0d-44bd-8f29-789f320fe840",
      "status": "working",
      "statusMessage": "The operation is now in progress.",
      "createdAt": "2025-11-25T10:30:00Z",
      "lastUpdatedAt": "2025-11-25T10:40:00Z",
      "ttl": 300000,
      "pollInterval": 5000
    }
  }
}
```

### Polling for Status (tasks/get)

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tasks/get",
  "params": {
    "taskId": "786512e2-9e0d-44bd-8f29-789f320fe840"
  }
}
```

### Retrieving Results (tasks/result)

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tasks/result",
  "params": {
    "taskId": "786512e2-9e0d-44bd-8f29-789f320fe840"
  }
}
```

### Task States

| State | Description |
|-------|-------------|
| `working` | Request currently being processed (initial state) |
| `input_required` | Receiver needs input from requestor |
| `completed` | Request completed successfully |
| `failed` | Request failed |
| `cancelled` | Request was cancelled before completion |

### State Transitions

```
working
├── → input_required
├── → completed
├── → failed
└── → cancelled

input_required
├── → working
├── → completed
├── → failed
└── → cancelled

completed (terminal)
failed (terminal)
cancelled (terminal)
```

## Capability Negotiation

### Server Capabilities Declaration

```json
{
  "capabilities": {
    "tasks": {
      "list": {},
      "cancel": {},
      "requests": {
        "tools": {
          "call": {}
        }
      }
    }
  }
}
```

### Client Capabilities Declaration

```json
{
  "capabilities": {
    "tasks": {
      "list": {},
      "cancel": {},
      "requests": {
        "sampling": {
          "createMessage": {}
        }
      }
    }
  }
}
```

### Per-Tool Task Support

Tools can declare task support via `execution.taskSupport`:

| Value | Behavior |
|-------|----------|
| Not present / `"forbidden"` | Tool cannot be invoked as task (default) |
| `"optional"` | Client may invoke as task or normal request |
| `"required"` | Client must invoke as task; sync requests return `-32601` |

### Negotiation Rules

1. If client doesn't declare `capabilities.tasks`, server **MUST NOT** create tasks
2. Server processes request normally (synchronous fallback)
3. If `execution.taskSupport` is `"forbidden"` or missing, task attempts return `-32601`
4. This enables **graceful degradation by design**

## Client Support Status (As of 2025-12-17)

| Client | Tasks Support | Notes |
|--------|---------------|-------|
| Claude Desktop | **Unknown** | Not publicly documented |
| Claude Code | **Unknown** | Not publicly documented |
| Cursor | **Unknown** | Not publicly documented |
| Gemini | **Unknown** | Not publicly documented |
| MCP Inspector | **Likely first** | Usually gets features first |

**Key quotes from official sources:**

> "Task-based workflows are a tough problem to solve at scale, so we want to give some time to the specification to be battle-tested in real-world scenarios."
> — [MCP Blog, November 2025](https://blog.modelcontextprotocol.io/posts/2025-11-25-first-mcp-anniversary/)

> "Implement Tasks status/polling now; this will quickly become table stakes."
> — [WorkOS Analysis](https://workos.com/blog/mcp-2025-11-25-spec-update)

> "SDK updates are in progress."
> — [MCP Blog](https://blog.modelcontextprotocol.io/posts/2025-11-25-first-mcp-anniversary/)

## Application to mittwald-mcp Timeout Issues

### Current Problem

```
Client → tools/call (backup_create) → [60s timeout] → FAIL
```

Operations that frequently timeout:
- `mittwald_backup_create` / `mittwald_backup_download`
- `mittwald_database_mysql_dump` / `mittwald_database_mysql_import`
- `mittwald_app_download` / `mittwald_app_upload`
- Any CLI command taking >30 seconds

### How Tasks Would Solve This

```
Client → tools/call + task → immediate task ID (no timeout risk)
Client → tasks/get (poll) → "working"
Client → tasks/get (poll) → "working"
Client → tasks/get (poll) → "completed"
Client → tasks/result → actual result
```

Each request is short-lived; the long-running work happens server-side.

## Implementation Strategy

### Phase 1: Capability Detection (Safe to implement now)

```typescript
// In MCP server initialization handler
function handleInitialize(request: InitializeRequest): InitializeResult {
  const clientCapabilities = request.params.capabilities;
  const supportsTasksForTools = clientCapabilities?.tasks?.requests?.tools?.call;

  // Store in session for later use
  session.clientSupportsTasks = !!supportsTasksForTools;

  return {
    protocolVersion: "2025-11-25",
    capabilities: {
      tools: { /* existing */ },
      tasks: {
        list: {},
        cancel: {},
        requests: {
          tools: { call: {} }
        }
      }
    }
  };
}
```

### Phase 2: Dual-Mode Tool Handlers

```typescript
async function handleBackupCreate(params: BackupCreateParams, context: RequestContext) {
  // Check if client requested task mode AND supports it
  if (params._task && context.session.clientSupportsTasks) {
    return createTaskForBackup(params, context);
  }

  // Synchronous fallback (existing behavior)
  return executeSyncBackup(params, context);
}

async function createTaskForBackup(params: BackupCreateParams, context: RequestContext) {
  const taskId = crypto.randomUUID();

  // Store task state in Redis
  await redis.set(`task:${taskId}`, JSON.stringify({
    taskId,
    status: 'working',
    createdAt: new Date().toISOString(),
    params,
    sessionId: context.session.sessionId
  }), 'EX', params._task.ttl / 1000);

  // Start background execution
  executeBackupInBackground(taskId, params, context);

  return {
    task: {
      taskId,
      status: 'working',
      statusMessage: 'Backup creation started',
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      ttl: params._task.ttl,
      pollInterval: 5000
    }
  };
}
```

### Phase 3: Task Management Handlers

```typescript
// tasks/get handler
async function handleTasksGet(params: { taskId: string }) {
  const task = await redis.get(`task:${params.taskId}`);
  if (!task) {
    throw new McpError(-32602, 'Task not found');
  }
  return JSON.parse(task);
}

// tasks/result handler
async function handleTasksResult(params: { taskId: string }) {
  const task = await redis.get(`task:${params.taskId}`);
  if (!task) {
    throw new McpError(-32602, 'Task not found');
  }

  const taskData = JSON.parse(task);
  if (taskData.status === 'working') {
    // Block until complete (or return current state)
    return { status: 'working' };
  }

  return taskData.result;
}

// tasks/cancel handler
async function handleTasksCancel(params: { taskId: string }) {
  const task = await redis.get(`task:${params.taskId}`);
  if (!task) {
    throw new McpError(-32602, 'Task not found');
  }

  const taskData = JSON.parse(task);
  if (['completed', 'failed', 'cancelled'].includes(taskData.status)) {
    throw new McpError(-32602, 'Cannot cancel terminal task');
  }

  taskData.status = 'cancelled';
  taskData.lastUpdatedAt = new Date().toISOString();
  await redis.set(`task:${params.taskId}`, JSON.stringify(taskData));

  return taskData;
}
```

### Phase 4: Tool Schema Updates

```typescript
{
  name: "mittwald_backup_create",
  description: "Create a new backup",
  execution: {
    taskSupport: "optional"  // Clients can choose sync or async
  },
  inputSchema: {
    // ... existing schema
  }
}
```

## Candidates for Task Support

High-value tools to prioritize for task support:

| Tool | Typical Duration | Priority |
|------|-----------------|----------|
| `mittwald_backup_create` | 1-10 minutes | High |
| `mittwald_backup_download` | 2-30 minutes | High |
| `mittwald_database_mysql_dump` | 1-15 minutes | High |
| `mittwald_database_mysql_import` | 2-30 minutes | High |
| `mittwald_app_download` | 5-60 minutes | High |
| `mittwald_app_upload` | 5-60 minutes | High |
| `mittwald_app_install_*` | 2-10 minutes | Medium |
| `mittwald_app_upgrade` | 2-10 minutes | Medium |

## Limitations and Risks

1. **SDK Support**: TypeScript SDK needs updates for tasks (in progress)
2. **Client Adoption**: No major client has publicly confirmed Tasks support
3. **Experimental Status**: Spec may change based on real-world feedback
4. **Polling Overhead**: Clients must implement polling logic
5. **State Management**: Server must persist task state reliably
6. **Security**: Task results must be scoped to sessions (already have Redis infrastructure)

## Implemented: Client Capability Telemetry

To gather data on client adoption of Tasks and other experimental features before implementing them, we've added passive capability telemetry.

### What's Tracked

| Metric | Type | Purpose |
|--------|------|---------|
| `mcp_client_capabilities_total` | Counter | Connections by capability flags |
| `mcp_client_capabilities_active` | Gauge | Current sessions by capability |
| `mcp_client_versions_total` | Counter | Client name/version distribution |
| `mcp_experimental_features_total` | Counter | Experimental feature declarations |

### Labels Tracked

- `client_name` - e.g., "claude-desktop", "cursor", "claude-code"
- `client_version` - Client version string
- `protocol_version` - Negotiated MCP protocol version
- `supports_roots`, `supports_sampling`, `supports_elicitation` - Standard capabilities
- `supports_experimental_tasks` - The feature we're watching for

### Implementation Details

**Files:**
- `src/metrics/client-capabilities.ts` - Metric definitions and tracking functions
- `src/server/mcp.ts` - `server.oninitialized` callback integration

**Safety measures:**
- All tracking wrapped in try/catch - telemetry failures never affect sessions
- Cleanup tracking in session teardown (with empty catch blocks)
- Gauge drift tolerance - if cleanup fails, only affects gauge accuracy

**How it works:**
1. When client initializes, SDK calls `server.oninitialized`
2. We call `server.getClientCapabilities()` and `server.getClientVersion()`
3. Capabilities are parsed and tracked in Prometheus
4. Flags stored on session for cleanup

### Grafana Queries

```promql
# Clients declaring Tasks support
sum(mcp_experimental_features_total{feature_name="tasks"}) by (client_name)

# Protocol version adoption
sum(mcp_client_versions_total) by (protocol_version)

# Capability adoption rates
sum(rate(mcp_client_capabilities_total{supports_experimental_tasks="true"}[24h]))
  /
sum(rate(mcp_client_capabilities_total[24h]))
```

## Recommendations

### Short-term (Now)

1. ~~**Do not implement yet** - Wait for SDK stabilization~~ **Telemetry implemented** - monitor adoption
2. **Monitor** the [TypeScript SDK repo](https://github.com/modelcontextprotocol/typescript-sdk) for tasks support
3. **Design** task state schema for Redis (compatible with existing session infrastructure)
4. **Identify** all timeout-prone tools and document expected durations
5. **Watch Grafana** for clients declaring `experimental.tasks` support

### Medium-term (When SDK lands)

1. **Test** with MCP Inspector first
2. **Implement** capability detection in initialization
3. **Add** task support to highest-priority tools (backups, database ops)
4. **Use** `taskSupport: "optional"` to maintain backward compatibility

### Long-term

1. **Evaluate** which tools should require tasks (`taskSupport: "required"`)
2. **Add** task progress notifications for better UX
3. **Implement** task cleanup/garbage collection

## References

- [MCP Tasks Specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/tasks)
- [One Year of MCP Blog Post](https://blog.modelcontextprotocol.io/posts/2025-11-25-first-mcp-anniversary/)
- [WorkOS MCP 2025-11-25 Analysis](https://workos.com/blog/mcp-2025-11-25-spec-update)
- [MCP Roadmap](https://modelcontextprotocol.io/development/roadmap)
- [MCP Tasks Overview (MCPJam)](https://www.mcpjam.com/blog/mcp-tasks)
- [SEP-1686 Tasks Proposal](https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1686)
- [TypeScript SDK Repository](https://github.com/modelcontextprotocol/typescript-sdk)
