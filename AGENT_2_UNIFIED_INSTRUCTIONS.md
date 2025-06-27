# Agent 2 - User Unified Handler Fixes

## Your Assignment
Fix TypeScript errors in `src/handlers/tools/mittwald/user/unified-handler.ts`

## Working Directory
```bash
cd /Users/robert/Code/Mittwald/agent-final-2-unified
```

## Errors to Fix

### Error 1: Line 72 - Remove data wrapper from initMfa
Look for the initMfa case and ensure it doesn't wrap args in a data object.

### Error 2: Line 81 - Remove getSupportCode case
```typescript
// DELETE this entire case:
case "mittwald_user_get_support_code":
  const supportCodeResponse = await client.typedApi.user.getSupportCode({});
  return formatResponse({ supportCode: supportCodeResponse.data });
```

### Error 3: Line 88 - Remove primary field
```typescript
// Current (WRONG):
data: { phoneNumber: args.phoneNumber, primary: args.primary }

// Fix to:
data: { phoneNumber: args.phoneNumber }
```

### Error 4: Line 96 - Change verificationCode to code
```typescript
// Current (WRONG):
data: { verificationCode: args.verificationCode }

// Fix to:
data: { code: args.verificationCode }
```

## Commands to Run

1. Pull latest:
```bash
git pull origin fix/typescript-sdk-migration
```

2. Test your file:
```bash
npx tsc --noEmit src/handlers/tools/mittwald/user/unified-handler.ts
```

3. Commit:
```bash
git add -A
git commit -m "fix(user/unified): resolve TypeScript errors in unified handler

- Removed data wrapper from initMfa call
- Deleted unsupported getSupportCode case
- Removed primary field from addPhoneNumber
- Changed verificationCode to code parameter name"
```

4. Push:
```bash
git push origin fix/final-typescript-agent-2-unified
```

5. Final message:
```
Agent 2, STATUS: COMPLETE
```