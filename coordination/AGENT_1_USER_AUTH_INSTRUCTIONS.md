# Agent 1 - User & Auth API TypeScript Fix

## Your Assignment
Fix TypeScript errors in the User and Authentication APIs.

### Modules to Fix:
- `src/handlers/tools/mittwald/user/auth.ts` (7 errors)
- `src/handlers/tools/mittwald/user/email.ts` (5 errors)
- `src/handlers/tools/mittwald/user/password.ts` (7 errors)
- `src/handlers/tools/mittwald/user/profile.ts` (8 errors)
- `src/handlers/tools/mittwald/user/session.ts` (5 errors)
- `src/handlers/tools/mittwald/user/api-tokens.ts` (3 errors)
- `src/handlers/tools/mittwald/user/unified-handler.ts` (4 errors)

## Working Directory
```bash
cd /Users/robert/Code/Mittwald/agent-fix-1-user-auth
```

## Key SDK Methods to Find

### Authentication
- `getSelf()` → Find correct method in `client.typedApi.user.*`
- `authenticateWithSessionToken()` → Likely `authenticateWithAccessTokenRetrievalKey()`
- `authenticateWithTokenRetrievalKey()` → Check exact name

### User Management
- `updateUser()` → Find in user namespace
- `getPersonalInformation()` → May be `updatePersonalInformation`
- `deleteSelf()` → Likely `deleteUser()`

### Sessions
- `refreshSessions()` → Probably `refreshSession()` (singular)
- Type issues with `SignupUserSession[]` vs `Session[]`

## Common Fixes Needed

1. **Email Verification**:
```typescript
// Old
await client.api.verifyEmail({ token, password })

// New - check if password belongs in data wrapper
await client.typedApi.user.verifyEmail({ 
  token,
  data: { /* check SDK */ }
})
```

2. **Status Code Checks**:
```typescript
// Replace
if (response.status === 200)

// With
if (String(response.status).startsWith('2'))
```

3. **Type Conversions**:
```typescript
// If types don't match
const sessions = response.data as unknown as Session[];
```

## Discovery Process
```bash
# Start Node REPL in your worktree
cd /Users/robert/Code/Mittwald/agent-fix-1-user-auth
node

# Then explore:
> const { MittwaldAPIV2Client } = require('@mittwald/api-client');
> const client = MittwaldAPIV2Client.newWithToken('dummy');
> Object.keys(client.user)
> Object.keys(client.auth)
```

## Validation Commands
```bash
# Check specific files
npx tsc --noEmit src/handlers/tools/mittwald/user/auth.ts

# Full build test
npm run build
```

## Document Your Findings
Create `coordination/agent-1-findings.md` with:
- Method name mappings
- Parameter structure changes
- Response type differences
- Any blockers or questions