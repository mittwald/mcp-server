# Mittwald MCP Server Migration Plan

## Current State (December 2024)

### What Was Done
ChatGPT implemented a temporary compatibility layer to resolve TypeScript compilation errors and get the Docker build working:

1. **Compatibility Layer in `mittwald-client.ts`**:
   - `api: any` - Untyped legacy surface for existing handlers
   - `typedApi: MittwaldAPIV2Client` - Fully typed surface for migrated code

2. **TypeScript Configuration Relaxed**:
   - Disabled `noUnusedLocals` and `noUnusedParameters`
   - Excluded `**/__tests__/**` from compilation
   - Used `as any` casts where needed

3. **Partial API Migrations Completed**:
   - ✅ Container API (registry, stack, service, volume) - Fully migrated
   - ⚠️ Marketplace handlers - Method names updated, but using type casts
   - ⚠️ Conversation/User/Session - Using compatibility layer
   - ❌ Other APIs - Still using untyped `api` surface

## Migration Strategy

### Phase 1: Stabilization (Immediate)
- [x] Docker build working
- [x] TypeScript compiles without errors
- [ ] Document current API usage per module
- [ ] Create integration tests for critical paths

### Phase 2: Incremental Migration (1-2 weeks)

#### Week 1: Core APIs
1. **User API** (`src/handlers/tools/mittwald/user/`)
   - [ ] Migrate from `api` to `typedApi`
   - [ ] Fix method name mismatches
   - [ ] Remove `as any` casts
   - [ ] Add proper error handling

2. **Project API** (`src/handlers/tools/mittwald/project/`)
   - [ ] Migrate to typed surface
   - [ ] Update request/response types
   - [ ] Test with real API calls

3. **App API** (`src/handlers/tools/mittwald/app/`)
   - [ ] Update to current SDK methods
   - [ ] Fix installation parameter types
   - [ ] Verify system software endpoints

#### Week 2: Extended APIs
4. **SSH/Backup API** 
   - [ ] Migrate to typed API
   - [ ] Fix type mismatches
   - [ ] Test backup operations

5. **Database API**
   - [ ] Update method signatures
   - [ ] Fix connection string handling

6. **Mail API**
   - [ ] Migrate all endpoints
   - [ ] Update delivery box types

### Phase 3: Full Type Safety (Week 3)
1. **Remove Compatibility Layer**:
   - [ ] Ensure all handlers use `typedApi`
   - [ ] Remove `api: any` property
   - [ ] Update imports throughout

2. **Re-enable Strict TypeScript**:
   - [ ] Enable `noUnusedLocals`
   - [ ] Enable `noUnusedParameters`
   - [ ] Fix any new errors

3. **Clean Up Type Casts**:
   - [ ] Remove all `as any` casts
   - [ ] Fix underlying type issues
   - [ ] Update DTOs to match SDK

## Technical Details

### API Migration Checklist
For each API module:
- [ ] Switch from `client.api` to `client.typedApi`
- [ ] Update method names to match SDK v4.169.0
- [ ] Fix request parameter structures
- [ ] Update response handling
- [ ] Test with live API

### Common Issues to Fix
1. **Method Name Changes**:
   ```typescript
   // Old
   client.api.getSelf()
   // New
   client.typedApi.user.getUser()
   ```

2. **Parameter Structure Changes**:
   ```typescript
   // Old
   client.api.createProject({ projectId, data })
   // New
   client.typedApi.project.createProject({ projectId, ...data })
   ```

3. **Response Status Checks**:
   ```typescript
   // Current workaround
   String(response.status).startsWith('2')
   // Target
   response.status === 200
   ```

## Success Criteria
- [ ] All handlers use typed API surface
- [ ] Zero TypeScript errors with strict mode
- [ ] No `any` type usage in production code
- [ ] All tests pass
- [ ] Docker image builds without warnings
- [ ] Integration tests verify API compatibility

## Risks and Mitigation
1. **Risk**: Breaking changes during migration
   - **Mitigation**: Test each module thoroughly before moving to next

2. **Risk**: SDK version mismatch
   - **Mitigation**: Lock SDK version, document any workarounds needed

3. **Risk**: Runtime errors from type fixes
   - **Mitigation**: Comprehensive integration testing

## Post-Migration Cleanup
- [ ] Delete old feature branches
- [ ] Update documentation
- [ ] Remove temporary comments
- [ ] Archive migration notes
- [ ] Create LEARNINGS.md with insights

## Branch Strategy
```bash
# Current working branch
feat/integrate-all-apis

# Create migration branch
git checkout -b fix/typescript-migration

# After each module is fixed and tested
git commit -m "fix: migrate [module] to typed API"

# Once complete
git checkout main
git merge fix/typescript-migration
git branch -d feat/integrate-all-apis
```

## Timeline
- **Week 1**: Core APIs migration
- **Week 2**: Extended APIs migration  
- **Week 3**: Type safety restoration
- **Week 4**: Testing and documentation

This plan ensures systematic migration from the temporary compatibility layer to a fully type-safe implementation while maintaining a working build throughout the process.