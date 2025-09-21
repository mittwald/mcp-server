# Option A: Fix oidc-provider Custom Scope Validation - Detailed Task Breakdown

> **Strategy**: Implement custom middleware to override oidc-provider's scope validation while preserving all existing infrastructure and working components.

## 🎯 **Project Overview**

### **Objective**
Fix oidc-provider scope validation inconsistency to enable Claude.ai and ChatGPT OAuth flows while maintaining MCP Jam Inspector compatibility and existing infrastructure.

### **Known Working Configuration**
**Commit Hash**: `bd69f1e` - "fix(oauth-server): correct OAuth scopes to match Mittwald's official client configuration"

**This commit achieved MCP Jam OAuth consent screen success** with the proper scope grid display. The working configuration included:
- ✅ **Correct Mittwald scopes** (40+ official scopes)
- ✅ **No invalid OIDC scopes** (profile, openid removed)
- ✅ **Default scope strategy** (10 essential scopes)
- ✅ **Working consent screen** showing scope grid with approve/deny options

**Evidence**: Screenshot shows beautiful consent screen with scope permissions grid for mStudio MCP server access.

### **Core Problem**
- **oidc-provider advertises**: All Mittwald scopes + `openid` in discovery metadata
- **oidc-provider rejects**: Explicit requests for those same advertised scopes
- **Error**: "scope must only contain Authorization Server supported scope values"

### **Success Criteria**
1. ✅ **Claude.ai**: Successfully completes OAuth flow with all scopes
2. ✅ **ChatGPT**: Successfully completes OAuth flow
3. ✅ **MCP Jam**: Continues working without regression
4. ✅ **Mittwald integration**: No changes to token exchange or callbacks
5. ✅ **Infrastructure**: SQLite, deployment pipeline, TypeScript unchanged

---

## 📋 **Phase 1: Analysis & Preparation (Day 1)**

### **Task 1.1: Deep oidc-provider Source Analysis**
- [ ] **Research oidc-provider scope validation code** in node_modules
- [ ] **Identify exact validation function** that's rejecting scope requests
- [ ] **Map validation flow**: request → validation → error generation
- [ ] **Find hook points**: Where custom middleware can intercept validation
- [ ] **Document validation logic**: How oidc-provider matches scopes internally

**Deliverables:**
- Technical analysis document of oidc-provider scope validation
- List of potential intervention points for custom middleware
- Understanding of validation vs advertising logic separation

### **Task 1.2: Scope Request Pattern Analysis**
- [ ] **Document working scope pattern** (MCP Jam - no explicit scope)
- [ ] **Document failing scope pattern** (Claude.ai - explicit all scopes)
- [ ] **Compare request formats** between working and failing clients
- [ ] **Analyze server default scope behavior** when no scope parameter provided
- [ ] **Map scope advertising logic** in discovery endpoint

**Deliverables:**
- Client scope request pattern documentation
- Default vs explicit scope behavior analysis
- Scope advertising vs validation discrepancy report

### **Task 1.3: Test Environment Setup**
- [ ] **Create local development environment** with oidc-provider debugging
- [ ] **Set up scope validation logging** to trace internal validation steps
- [ ] **Create test client scripts** to reproduce Claude.ai scope requests
- [ ] **Implement validation bypass testing** with known good scopes
- [ ] **Document current SQLite state** for rollback preparation

**Deliverables:**
- Local debugging environment with enhanced logging
- Test scripts reproducing client failure scenarios
- Baseline documentation for rollback scenarios

---

## 🔧 **Phase 2: Custom Scope Validation Implementation (Days 2-3)**

### **Task 2.1: Custom Scope Validation Middleware**
- [ ] **Create scope validation middleware** to intercept oidc-provider requests
- [ ] **Implement scope filtering logic** to allow only valid Mittwald scopes
- [ ] **Add scope transformation** to convert client requests to server-acceptable format
- [ ] **Handle openid scope specially** (allow but don't pass to Mittwald)
- [ ] **Preserve original scope semantics** for token generation

**Technical Implementation:**
```typescript
// packages/oauth-server/src/middleware/scope-validation.ts
interface ScopeValidationOptions {
  allowedScopes: string[];
  defaultScopes: string[];
  handleOpenId: 'allow' | 'strip' | 'reject';
}

class CustomScopeValidator {
  validateAndTransform(requestedScopes: string[]): string[] {
    // 1. Filter out invalid scopes
    // 2. Handle openid scope according to policy
    // 3. Apply default scopes if none provided
    // 4. Return validated scope list
  }
}
```

### **Task 2.2: Middleware Integration Points**
- [ ] **Identify oidc-provider hook points** for scope validation override
- [ ] **Implement pre-authorization middleware** to intercept /auth requests
- [ ] **Add scope transformation** before oidc-provider internal validation
- [ ] **Ensure post-validation consistency** for token generation
- [ ] **Test middleware bypass** for internal oidc-provider flows

**Integration Strategy:**
```typescript
// In server.ts - before oidc-provider routes
app.use('/auth', customScopeValidationMiddleware);
app.use('/token', customScopeValidationMiddleware);
```

### **Task 2.3: Client-Specific Scope Handling**
- [ ] **Implement client detection logic** based on registration metadata
- [ ] **Create Claude.ai specific scope mapping** (all scopes → allowed subset)
- [ ] **Create ChatGPT specific scope mapping** based on observed patterns
- [ ] **Maintain MCP Jam default scope behavior** (no explicit scope requests)
- [ ] **Add comprehensive logging** for scope transformation debugging

**Client-Specific Logic:**
```typescript
const clientScopeStrategies = {
  'Claude': {
    strategy: 'filter-all',
    allowOpenId: true,
    maxScopes: 10, // Limit to essential scopes
  },
  'ChatGPT': {
    strategy: 'use-defaults',
    allowOpenId: false,
  },
  'MCPJam': {
    strategy: 'pass-through', // Already working
  }
};
```

---

## 🧪 **Phase 3: Testing & Validation (Day 4)**

### **Task 3.1: Unit Testing**
- [ ] **Create scope validation unit tests** with various input combinations
- [ ] **Test openid scope handling** in different scenarios
- [ ] **Test scope filtering logic** with invalid scope combinations
- [ ] **Test default scope application** when no scopes provided
- [ ] **Test client-specific scope transformation** logic

**Test Cases:**
```typescript
describe('Custom Scope Validation', () => {
  test('Claude.ai all scopes + openid → filtered valid scopes');
  test('MCP Jam no scopes → default scopes');
  test('Invalid scopes → filtered out');
  test('Mittwald-only scopes → pass through');
});
```

### **Task 3.2: Integration Testing**
- [ ] **Test full OAuth flow** with custom scope validation
- [ ] **Verify Mittwald token exchange** still works with filtered scopes
- [ ] **Test client redirect completion** after scope filtering
- [ ] **Verify SQLite storage compatibility** with scope changes
- [ ] **Test concurrent client flows** (multiple scope validation requests)

### **Task 3.3: Client Compatibility Testing**
- [ ] **Test Claude.ai OAuth flow** end-to-end with scope filtering
- [ ] **Test ChatGPT OAuth flow** with custom scope handling
- [ ] **Verify MCP Jam continues working** without regression
- [ ] **Test edge cases**: empty scopes, invalid scopes, duplicate scopes
- [ ] **Performance testing**: Scope validation overhead measurement

---

## 🚀 **Phase 4: Production Deployment (Day 5)**

### **Task 4.1: Deployment Preparation**
- [ ] **Code review** of scope validation middleware implementation
- [ ] **Performance analysis** of scope validation overhead
- [ ] **Security review** of custom scope handling logic
- [ ] **Documentation update** with scope validation behavior
- [ ] **Rollback plan preparation** with specific rollback triggers

### **Task 4.2: Gradual Deployment Strategy**
- [ ] **Deploy to staging** with enhanced logging and monitoring
- [ ] **Test with controlled client scenarios** (MCP Jam first)
- [ ] **Gradual scope policy activation** (start permissive, tighten gradually)
- [ ] **Monitor error rates** and scope validation success rates
- [ ] **Production deployment** via GitHub Actions pipeline

### **Task 4.3: Production Validation**
- [ ] **Verify all three clients** complete OAuth flows successfully
- [ ] **Monitor scope validation logs** for any edge cases
- [ ] **Validate Mittwald token exchange** continues working
- [ ] **Check SQLite storage** for any scope-related data issues
- [ ] **Performance monitoring** of OAuth flow completion times

---

## 📊 **Phase 5: Monitoring & Optimization (Day 6)**

### **Task 5.1: Production Monitoring**
- [ ] **Set up scope validation metrics** (success/failure rates by client)
- [ ] **Monitor OAuth flow completion rates** across all three clients
- [ ] **Track scope transformation performance** and overhead
- [ ] **Set up alerting** for scope validation failures
- [ ] **Create scope validation dashboard** for operational visibility

### **Task 5.2: Documentation & Knowledge Transfer**
- [ ] **Update ARCHITECTURE.md** with final implementation details
- [ ] **Create troubleshooting guide** for scope validation issues
- [ ] **Document scope policy configuration** for future modifications
- [ ] **Create operational runbook** for scope-related incident response
- [ ] **Update API documentation** with scope behavior specifications

---

## 🔍 **Technical Implementation Details**

### **Core Middleware Architecture**
```typescript
// packages/oauth-server/src/middleware/custom-scope-validation.ts

export interface ScopeValidationConfig {
  allowedMittwaldScopes: string[];
  clientScopeStrategies: Map<string, ClientScopeStrategy>;
  openIdHandling: 'allow' | 'strip' | 'convert-to-sub';
  defaultScopes: string[];
}

export class CustomScopeValidator {
  constructor(config: ScopeValidationConfig) {}

  async validateAuthorizationRequest(ctx: Context, next: Next): Promise<void> {
    // 1. Extract client ID and requested scopes
    // 2. Apply client-specific scope strategy
    // 3. Filter/transform scopes according to policy
    // 4. Override request parameters for oidc-provider
    // 5. Continue to oidc-provider with validated scopes
  }

  async validateTokenRequest(ctx: Context, next: Next): Promise<void> {
    // Handle scope validation for token endpoint
  }
}
```

### **Implementation Strategy**
1. **Middleware interception**: Catch requests before oidc-provider processes them
2. **Scope transformation**: Convert client scope requests to server-acceptable format
3. **Policy-based filtering**: Apply different rules per client type
4. **Transparent passthrough**: Maintain existing working flows (MCP Jam)
5. **Comprehensive logging**: Track all scope transformations for debugging

### **Testing Strategy**
- **Unit tests**: Scope validation logic with edge cases
- **Integration tests**: Full OAuth flows with custom validation
- **Client compatibility tests**: All three major MCP clients
- **Performance tests**: Scope validation overhead measurement
- **Security tests**: Scope privilege escalation prevention

This implementation approach **preserves all existing working infrastructure** while providing a **targeted fix** for the specific scope validation issues preventing Claude.ai and ChatGPT integration! 🎯