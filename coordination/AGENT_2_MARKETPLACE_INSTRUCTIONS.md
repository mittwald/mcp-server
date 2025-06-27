# Agent 2 - Marketplace API TypeScript Fix

## Your Assignment
Fix TypeScript errors in the Marketplace APIs.

### Modules to Fix:
- `src/handlers/tools/mittwald/marketplace/extension-management.ts` (15 errors)
- `src/handlers/tools/mittwald/marketplace/extension-instance-management.ts` (11 errors)
- `src/handlers/tools/mittwald/marketplace/marketplace-utilities.ts` (5 errors)
- `src/handlers/tools/mittwald/marketplace/contributor-management.ts` (verify)

## Working Directory
```bash
cd /Users/robert/Code/Mittwald/agent-fix-2-marketplace
```

## Key SDK Methods to Find

### Extension Management
- `listExtensions()` → Look for `extensionList*` methods
- `getExtension()` → Likely with prefix
- `createExtension()` → Check exact name
- `updateExtension()` → Find in marketplace namespace
- `deleteExtension()` → Verify method exists
- `uploadExtensionLogo()` → May have different name
- `requestExtensionVerification()` → Check for `extensionRequest*`

### Extension Instances
- `listExtensionInstances()` → Find correct method
- `getExtensionInstance()` → Check marketplace namespace
- `createExtensionInstance()` → Verify parameters
- `authenticateExtensionInstanceSession()` → Complex name, explore carefully

### Utilities
- `listScopes()` → May be in different namespace
- `getPublicKey()` → Check various namespaces
- `getWebhookPublicKey()` → Webhook-related methods
- `dryRunExtensionWebhook()` → Test/dry-run methods

## Common Patterns
```typescript
// ChatGPT already noted these methods use different names
// Old pattern
client.api.listExtensions()

// New pattern - note the namespace prefix
client.typedApi.marketplace.extensionListExtensions()
```

## Discovery Process
```bash
# Explore marketplace namespace thoroughly
node
> const { MittwaldAPIV2Client } = require('@mittwald/api-client');
> const client = MittwaldAPIV2Client.newWithToken('dummy');
> Object.keys(client.marketplace).filter(m => m.includes('extension'))
> Object.keys(client.marketplace).filter(m => m.includes('Extension'))
```

## Special Considerations
- Many marketplace methods have `extension` prefix
- Check for both camelCase and PascalCase variations
- Some methods might be in different namespaces (auth, webhook)

## Validation Commands
```bash
# Test individual files
npx tsc --noEmit src/handlers/tools/mittwald/marketplace/extension-management.ts

# Full marketplace module
npx tsc --noEmit src/handlers/tools/mittwald/marketplace/*.ts
```

## Document Your Findings
Create `coordination/agent-2-findings.md` with complete method mappings.