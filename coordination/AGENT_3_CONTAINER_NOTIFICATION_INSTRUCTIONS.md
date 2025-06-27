# Agent 3 - Container, Notification & Conversation API TypeScript Fix

## Your Assignment
Verify Container API fixes and fix Notification/Conversation APIs.

### Modules to Fix/Verify:
- `src/handlers/tools/mittwald/container/` - **VERIFY** ChatGPT's fixes
  - registry-management.ts
  - service-management.ts  
  - stack-management.ts
  - volume-config-management.ts
- `src/handlers/tools/mittwald/notification/notification-mark-read.ts` (1 error)
- `src/handlers/tools/mittwald/conversation/` - Check all files

## Working Directory
```bash
cd /Users/robert/Code/Mittwald/agent-fix-3-container-notification
```

## Container API - Verification Tasks
ChatGPT claims to have fixed these, but verify:
1. All methods use `typedApi` not `api`
2. Parameter names are correct (registryId vs registry_id)
3. Response handling uses `String(status).startsWith('2')`
4. Field names match (uri vs registryUri)

## Notification API - Known Issue
```typescript
// Current error in notification-mark-read.ts
await client.api.updateNotificationStatus({ notificationId })

// Needs data wrapper
await client.typedApi.notification.updateNotificationStatus({
  notificationId,
  data: { status: 'read' }  // Required wrapper
})
```

## Conversation API - Exploration Needed
1. Check if methods already use typed API
2. Verify parameter structures
3. Look for any type mismatches

## Discovery Commands
```bash
node
> const { MittwaldAPIV2Client } = require('@mittwald/api-client');
> const client = MittwaldAPIV2Client.newWithToken('dummy');
> Object.keys(client.container)
> Object.keys(client.notification)  
> Object.keys(client.conversation)
```

## Container API Patterns (from ChatGPT's notes)
- Path params → flat arguments: `{params: {registryId}}` → `{registryId}`
- Field renames: `uri` → `registryUri`
- Success checks: `String(response.status).startsWith('2')`

## Validation Commands
```bash
# Test container fixes
npx tsc --noEmit src/handlers/tools/mittwald/container/*.ts

# Test notification
npx tsc --noEmit src/handlers/tools/mittwald/notification/*.ts

# Test conversation
npx tsc --noEmit src/handlers/tools/mittwald/conversation/*.ts
```

## Document Your Findings
Create `coordination/agent-3-findings.md` with:
- Container API verification results
- Notification fix confirmation
- Conversation API status
- Any remaining issues