# URGENT: Critical MittwaldClient Wrapper Issue

## Problem Statement

The `MittwaldClient` wrapper class in `src/services/mittwald/mittwald-client.ts` does not properly expose the typed SDK methods. This is causing all agents' TypeScript fixes to fail.

## Current Structure

```typescript
// src/services/mittwald/mittwald-client.ts
export class MittwaldClient {
  private client: MittwaldAPIV2Client;
  
  public get api(): MittwaldAPIV2Client {
    return this.client;
  }
  
  public get typedApi(): MittwaldAPIV2Client {
    return this.client;
  }
}
```

## The Issue

1. All agents are trying to access methods like:
   - `client.marketplace.extensionListExtensions()`
   - `client.user.getUser()`
   - `client.project.getProject()`

2. But the wrapper only exposes:
   - `client.api` (returns the full MittwaldAPIV2Client)
   - `client.typedApi` (same as above)

3. This means ALL method calls must go through:
   - `client.api.marketplace.extensionListExtensions()`
   - `client.api.user.getUser()`
   - `client.api.project.getProject()`

## Impact

- **ALL agents' work is affected** - Every single API call migration needs to include `.api`
- **~150+ TypeScript errors** across all modules
- **The migration plan's method mappings are incorrect**

## Solutions

### Option 1: Fix the Wrapper (RECOMMENDED)
Update `MittwaldClient` to expose the typed namespaces directly:

```typescript
export class MittwaldClient {
  private client: MittwaldAPIV2Client;
  
  public get api(): MittwaldAPIV2Client {
    return this.client;
  }
  
  // Add direct namespace access
  public get marketplace() {
    return this.client.marketplace;
  }
  
  public get user() {
    return this.client.user;
  }
  
  public get project() {
    return this.client.project;
  }
  
  // ... add all other namespaces
}
```

### Option 2: Update All Code
Keep the wrapper as-is and update ALL method calls to use `.api`:
- Change: `client.marketplace.extensionListExtensions()`
- To: `client.api.marketplace.extensionListExtensions()`

This requires updating ~150+ method calls across all modules.

### Option 3: Remove the Wrapper
Use `MittwaldAPIV2Client` directly without the wrapper class. This would require updating the `getMittwaldClient` function and all imports.

## Recommendation

**Implement Option 1** - Update the wrapper to expose namespaces directly. This:
- Minimizes changes needed across all agent work
- Maintains the abstraction layer
- Allows for future wrapper enhancements
- Makes the code cleaner and more intuitive

## Action Required

1. **STOP all agent work** until this is resolved
2. **Coordinator should implement Option 1** in the main branch
3. **All agents should then rebase** their branches after the fix
4. **Continue with the original migration plan**

## Example Fix for MittwaldClient

```typescript
export class MittwaldClient {
  private client: MittwaldAPIV2Client;

  constructor(apiToken?: string) {
    const token = apiToken || CONFIG.MITTWALD_API_TOKEN;
    if (!token) {
      throw new Error('Mittwald API token is required');
    }
    this.client = MittwaldAPIV2Client.newWithToken(token);
  }

  // Keep legacy access
  public get api(): MittwaldAPIV2Client {
    return this.client;
  }
  
  public get typedApi(): MittwaldAPIV2Client {
    return this.client;
  }

  // Add direct namespace access
  public get app() { return this.client.app; }
  public get article() { return this.client.article; }
  public get backup() { return this.client.backup; }
  public get container() { return this.client.container; }
  public get contract() { return this.client.contract; }
  public get marketplace() { return this.client.marketplace; }
  public get conversation() { return this.client.conversation; }
  public get cronjob() { return this.client.cronjob; }
  public get customer() { return this.client.customer; }
  public get database() { return this.client.database; }
  public get domain() { return this.client.domain; }
  public get mail() { return this.client.mail; }
  public get notification() { return this.client.notification; }
  public get user() { return this.client.user; }
  public get file() { return this.client.file; }
  public get project() { return this.client.project; }
  public get sshsftpUser() { return this.client.sshsftpUser; }
  
  // Keep existing methods
  public async testConnection(): Promise<boolean> { /* ... */ }
  public async getUserInfo(): Promise<{ email: string } | null> { /* ... */ }
}
```

This fix would make all agent migrations work as intended!