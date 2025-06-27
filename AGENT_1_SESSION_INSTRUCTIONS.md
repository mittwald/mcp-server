# Agent 1 - User Session Type Fixes

## Your Assignment
Fix TypeScript errors in `src/handlers/tools/mittwald/user/session.ts`

## Working Directory
```bash
cd /Users/robert/Code/Mittwald/agent-final-1-session
```

## Errors to Fix

### Error 1: Line 117 - sessionId doesn't exist
```typescript
// Current (WRONG):
const sessionId = tokenInfo.data?.sessionId;

// Fix to:
const sessionId = tokenInfo.data?.id;
```

### Error 2: Line 123 - refreshSession parameter
```typescript
// Current (WRONG):
const response = await client.typedApi.user.refreshSession({ sessionId });

// Fix to:
// You need to get the current refresh token first
const currentToken = /* figure out how to get current refresh token */;
const response = await client.typedApi.user.refreshSession({ 
  data: { refreshToken: currentToken }
});
```

### Error 3: Line 149 - Status comparison
```typescript
// Current (WRONG):
if (response.status === 200)

// Fix to:
if (String(response.status).startsWith('2'))
```

### Error 4: Line 176 - Type cast for sessions
```typescript
// Current (WRONG):
const sessions = sessionsResponse.data as Session[];

// Fix to:
const sessions = sessionsResponse.data as unknown as Session[];
```

## Commands to Run

1. Pull latest:
```bash
git pull origin fix/typescript-sdk-migration
```

2. Test your file:
```bash
npx tsc --noEmit src/handlers/tools/mittwald/user/session.ts
```

3. Commit:
```bash
git add -A
git commit -m "fix(user/session): resolve TypeScript errors in session handler

- Fixed sessionId property access from checkToken response
- Updated refreshSession call with proper parameter structure
- Changed status comparisons to string check
- Added proper type casting for session arrays"
```

4. Push:
```bash
git push origin fix/final-typescript-agent-1-session
```

5. Final message:
```
Agent 1, STATUS: COMPLETE
```