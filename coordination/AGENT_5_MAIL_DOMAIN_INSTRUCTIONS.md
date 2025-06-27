# Agent 5 - Mail & Domain API TypeScript Fix

## Your Assignment
Fix TypeScript errors in Mail and Domain APIs.

### Modules to Fix:
- `src/handlers/tools/mittwald/mail/`
  - mail-addresses.ts
  - delivery-boxes.ts
  - mail-settings.ts
- `src/handlers/tools/mittwald/domain/`
  - domain-management.ts
  - domain-dns.ts
  - domain-ownership.ts

## Working Directory
```bash
cd /Users/robert/Code/Mittwald/agent-fix-5-mail-domain
```

## Expected API Structure

### Mail APIs
- Email address management (create, delete, forward)
- Delivery box operations
- Mail settings and quotas
- Spam filter configuration

### Domain APIs
- Domain registration/management
- DNS record management (A, CNAME, MX, etc.)
- Domain ownership verification
- Domain transfers

## Common Patterns to Fix
1. Mail namespace: `client.api.*` → `client.typedApi.mail.*`
2. Domain namespace: `client.api.*` → `client.typedApi.domain.*`
3. DNS might be separate: `client.typedApi.dns.*`

## Discovery Process
```bash
node
> const { MittwaldAPIV2Client } = require('@mittwald/api-client');
> const client = MittwaldAPIV2Client.newWithToken('dummy');

# Mail namespaces
> Object.keys(client).filter(k => k.includes('mail'))
> Object.keys(client.mail) // if exists

# Domain namespaces
> Object.keys(client).filter(k => k.includes('domain'))
> Object.keys(client).filter(k => k.includes('dns'))
```

## Mail-Specific Considerations
- Email address formats
- Quota specifications
- Forward vs alias differences
- Delivery box passwords

## Domain-Specific Considerations
- DNS record types and validation
- TTL values
- Domain verification methods
- DNSSEC parameters

## Type Issues to Watch For
- Email address validation
- DNS record type unions
- Domain status enums
- Response pagination

## Validation Commands
```bash
# Test mail modules
npx tsc --noEmit src/handlers/tools/mittwald/mail/*.ts

# Test domain modules  
npx tsc --noEmit src/handlers/tools/mittwald/domain/*.ts

# Combined test
npm run build
```

## Document Your Findings
Create `coordination/agent-5-findings.md` with:
- Mail API method mappings
- Domain API method mappings
- DNS-specific methods
- Parameter structure changes
- Any complex type transformations needed