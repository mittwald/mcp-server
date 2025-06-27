# Agent 6 - Project, Customer & App API TypeScript Fix

## Your Assignment
Fix TypeScript errors in Project, Customer, and App APIs.

### Modules to Fix:
- `src/handlers/tools/mittwald/project/`
  - project-management.ts
  - project-invitation.ts
  - project-membership.ts
  - project-resources.ts
- `src/handlers/tools/mittwald/customer/`
  - customer-management.ts
  - customer-profile.ts
  - customer-contracts.ts
  - customer-invitations.ts
  - customer-misc.ts
- `src/handlers/tools/mittwald/app/`
  - app-management.ts
  - app-installations.ts
  - app-versions.ts
  - app-actions.ts
  - system-software.ts

## Working Directory
```bash
cd /Users/robert/Code/Mittwald/agent-fix-6-project-customer-app
```

## Expected API Structure

### Project APIs
- Project creation/deletion
- Member management
- Resource quotas
- Project invitations

### Customer APIs
- Customer profile management
- Contract operations
- Billing information
- Customer invitations

### App APIs
- App installation (WordPress, etc.)
- Version management
- App actions (restart, backup)
- System software updates

## Key Patterns to Fix
1. Project: `client.api.*` → `client.typedApi.project.*`
2. Customer: `client.api.*` → `client.typedApi.customer.*`
3. App: `client.api.*` → `client.typedApi.app.*`

## App-Specific Considerations
- App names (e.g., "WordPress" with capital W)
- Installation parameters vary by app type
- User inputs configuration
- System requirements

## Discovery Process
```bash
node
> const { MittwaldAPIV2Client } = require('@mittwald/api-client');
> const client = MittwaldAPIV2Client.newWithToken('dummy');

# Explore namespaces
> Object.keys(client.project)
> Object.keys(client.customer)
> Object.keys(client.app)

# Look for app-specific methods
> Object.keys(client).filter(k => k.includes('app'))
> Object.keys(client).filter(k => k.includes('installation'))
```

## Common Issues
- Project/customer relationship
- App installation userInputs structure
- Resource quota formats
- Invitation token handling

## Validation Commands
```bash
# Test each module group
npx tsc --noEmit src/handlers/tools/mittwald/project/*.ts
npx tsc --noEmit src/handlers/tools/mittwald/customer/*.ts
npx tsc --noEmit src/handlers/tools/mittwald/app/*.ts

# Full build
npm run build
```

## Document Your Findings
Create `coordination/agent-6-findings.md` with:
- Complete method mappings for all three APIs
- App-specific parameter structures
- Customer/project relationship patterns
- Any complex installation configurations