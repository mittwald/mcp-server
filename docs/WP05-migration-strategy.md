# WP05 Migration Strategy

## Challenge

**Original Estimate**: ~100 tools
**Actual Count**: 175 tools (174 remaining after WP04)
**Scope Gap**: 75% more tools than estimated

## Options

### Option A: Full Migration (All 175 tools)
**Pros**: Complete migration, all tools converted
**Cons**: Extremely time-consuming, high risk of errors
**Estimated Time**: 20-30 hours of work

### Option B: Phased Migration (Priority-based)
**Pros**: Focus on high-value tools first, manageable scope
**Cons**: Partial migration, need to maintain CLI spawning code
**Estimated Time**: 8-12 hours for P0 tools

### Option C: Automated/Template Migration
**Pros**: Scalable, reusable patterns
**Cons**: Requires upfront investment in automation
**Estimated Time**: 4-6 hours for automation + 4-6 hours for edge cases

## Recommended Approach: Hybrid Strategy

### Phase 1: Core Tools (P0) - 64 tools
Migrate high-priority, high-usage tools:
- **app** (28 tools) - 1 done, 27 remaining
- **database** (22 tools) - MySQL and Redis operations
- **project** (14 tools) - Core resource management

**Rationale**: These are the most frequently used tools and provide the most value for concurrent user support.

### Phase 2: User Management (P1) - 45 tools
(Deferred or next iteration)

### Phase 3: Extended Services (P1+P2) - 66 tools
(Deferred or next iteration)

## Migration Pattern (Proven from WP04)

For each tool:

1. **Identify CLI Command**
   ```typescript
   // Example: app get
   const argv: string[] = ['app', 'get', installationId, '--output', 'json'];
   ```

2. **Find Corresponding CLI Source**
   ```bash
   # Check ~/Code/mittwald-cli/src/commands/app/get.ts
   ```

3. **Extract API Call Pattern**
   ```typescript
   // CLI does:
   const response = await client.app.getAppinstallation({ id });
   ```

4. **Create Library Wrapper**
   ```typescript
   export async function getApp(options: GetAppOptions): Promise<LibraryResult<any>> {
     const client = MittwaldAPIV2Client.newWithToken(options.apiToken);
     const response = await client.app.getAppinstallation({ id: options.installationId });
     assertStatus(response, 200);

     // Add enrichment if CLI does it
     const enriched = {
       ...response.data,
       app: await getAppFromUuid(client, response.data.appId),
     };

     return { data: enriched, status: response.status, durationMs };
   }
   ```

5. **Update Tool Handler**
   ```typescript
   // Use parallel validation pattern from WP04
   const validation = await validateToolParity({
     toolName: 'mittwald_app_get',
     cliCommand: 'mw',
     cliArgs: argv,
     libraryFn: () => getApp({ installationId, apiToken }),
   });

   return formatToolResponse('success', message, validation.libraryOutput.data);
   ```

## Common Tool Patterns

### Pattern 1: List (returns array)
**Examples**: app list, database list, project list
**CLI**: `mw {resource} list [--filter] --output json`
**API**: `client.{resource}.list{Resource}s({ filters })`

### Pattern 2: Get (returns single object)
**Examples**: app get, database get, project get
**CLI**: `mw {resource} get {id} --output json`
**API**: `client.{resource}.get{Resource}({ id })`

### Pattern 3: Create (creates resource)
**Examples**: app create, database create, project create
**CLI**: `mw {resource} create [--params] --output json`
**API**: `client.{resource}.create{Resource}({ data })`

### Pattern 4: Update (modifies resource)
**Examples**: app update, database update, project update
**CLI**: `mw {resource} update {id} [--params] --output json`
**API**: `client.{resource}.update{Resource}({ id, data })`

### Pattern 5: Delete (removes resource)
**Examples**: app delete, database delete, project delete
**CLI**: `mw {resource} delete {id}`
**API**: `client.{resource}.delete{Resource}({ id })`

## Automation Opportunities

### Template Generator
Create a script that:
1. Reads CLI command structure from tool handler
2. Generates library wrapper function based on pattern
3. Updates tool handler to use library
4. Creates validation test

**Benefits**:
- Consistent migrations
- Reduced manual errors
- Faster execution

**Challenges**:
- Edge cases (complex commands, multi-step operations)
- Custom enrichment logic
- Error handling variations

## Recommendation for WP05

**Scope for this WP05 session**: Migrate Phase 1 (P0) tools only

1. **T031**: Complete app tools (27 remaining)
   - Focus on common patterns (list, get, create, update, delete)
   - Handle custom commands individually

2. **T032**: Complete project tools (14 tools)
   - Similar patterns to app tools

3. **T033**: Complete database tools (22 tools)
   - Split: MySQL (18), Redis (4)

4. **T034**: DEFER infrastructure tools to separate WP or iteration

5. **T035**: Run validation on migrated P0 tools only

**Result**: 63 tools migrated (36% of total, 100% of P0)

## Success Criteria (Adjusted)

Original (all tools):
- [ ] All ~100 tools migrated (actually 175)
- [ ] 100% parity across all tools

**Revised (P0 tools)**:
- [ ] All P0 tools migrated (64 tools: app, database, project)
- [ ] 100% parity for migrated tools
- [ ] Remaining tools (P1/P2) documented for next iteration
- [ ] Migration pattern proven and documented for future use

## Next Steps

**Immediate**:
1. User approval for scope adjustment (P0 only vs all 175 tools)
2. If approved: Proceed with app tools migration
3. Create library wrapper functions systematically
4. Use WP04 validation pattern for each tool

**Future WP** (if needed):
- WP05b: Migrate P1 tools (user, org, mail, cronjob, domain) - 45 tools
- WP05c: Migrate P2 tools (infrastructure, services) - 66 tools
