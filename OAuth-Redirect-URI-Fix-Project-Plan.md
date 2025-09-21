# OAuth Redirect URI Fix - Project Plan

## Executive Summary

**Project Goal**: Fix the critical redirect URI confusion in the OAuth proxy implementation that causes users to loop back to the authorization server instead of being properly redirected to their client applications.

**Timeline**: 3-5 days
**Complexity**: Medium
**Risk Level**: Low (targeted fix with clear rollback path)

---

## Problem Statement

### Core Issue
The OAuth server confuses two different redirect URIs, causing a redirect loop that prevents successful OAuth flows:

1. **Mittwald's Redirect URI** (`MITTWALD_REDIRECT_URI`): `https://mittwald-oauth-server.fly.dev/mittwald/callback`
   - Where Mittwald sends users after authentication
   - Should only be used for Mittwald → OAuth Server communication

2. **Client's Redirect URI** (`details.params.redirect_uri`):
   - Where the OAuth server should send users after completing the full flow
   - Comes from the original client authorization request
   - Currently being ignored

### Current Broken Flow
```
Client → OAuth Server → Mittwald → OAuth Server (/mittwald/callback) → OAuth Server (/mittwald/callback) [LOOP]
```

### Target Fixed Flow
```
Client → OAuth Server → Mittwald → OAuth Server (/mittwald/callback) → Client (success)
```

---

## Root Cause Analysis

### Primary Bug Location
**File**: `packages/oauth-server/src/handlers/interactions.ts`
**Line**: 273
```typescript
// WRONG: Uses Mittwald's redirect URI instead of client's
const clientCallbackUrl = new URL(config.redirectUri);
```

### Supporting Evidence
- `config.redirectUri` comes from `MITTWALD_REDIRECT_URI` environment variable (line 23 in mittwald-oauth-client.ts)
- `details.params.redirect_uri` contains the actual client's redirect URI from the original OAuth request
- No validation that the final redirect goes to the requesting client

---

## Project Phases

## Phase 1: Immediate Fix (Days 1-2)

### 1.1 Core Redirect Fix
**Priority**: Critical
**Risk**: Low

**Changes Required**:
```typescript
// File: packages/oauth-server/src/handlers/interactions.ts, line 273
// BEFORE:
const clientCallbackUrl = new URL(config.redirectUri);

// AFTER:
const clientCallbackUrl = new URL(details.params.redirect_uri);
```

**Validation**:
- Ensure `details.params.redirect_uri` exists and is valid URL
- Add error handling for malformed redirect URIs
- Add logging to track redirect decisions

### 1.2 Safety Enhancements
**Priority**: High
**Risk**: Low

**Security Validations**:
```typescript
// Add redirect URI validation
if (!details.params.redirect_uri) {
  throw new Error('Missing client redirect_uri in OAuth request');
}

// Validate redirect URI format
const redirectUrl = new URL(details.params.redirect_uri);
if (redirectUrl.protocol !== 'https:' && redirectUrl.hostname !== 'localhost') {
  throw new Error('Invalid redirect URI: HTTPS required for non-localhost');
}
```

**Logging Improvements**:
```typescript
logger.info('OAuth redirect decision', {
  mittwardRedirectUri: config.redirectUri,
  clientRedirectUri: details.params.redirect_uri,
  usingClientUri: true,
  authCode: `${authCode.substring(0, 8)}...`
});
```

### 1.3 Testing & Deployment
**Priority**: Critical

**Local Testing**:
1. Start OAuth server locally
2. Initiate OAuth flow with test client
3. Verify redirect goes to client, not back to `/mittwald/callback`
4. Test with multiple client redirect URIs

**Deployment**:
1. Deploy to staging environment
2. Run end-to-end OAuth flow tests
3. Monitor logs for redirect behavior
4. Deploy to production if successful

---

## Phase 2: Storage & Persistence (Days 3-4)

### 2.1 Authorization Code Storage
**Priority**: High
**Risk**: Medium

**Current Problem**:
- Authorization codes generated but not persisted
- Token endpoint cannot validate codes
- Comments acknowledge need for "Redis/database"

**Solution**:
```typescript
// Add in-memory store with TTL for immediate fix
class AuthCodeStore {
  private codes = new Map<string, AuthCodeData>();

  store(code: string, data: AuthCodeData): void {
    this.codes.set(code, data);
    // Auto-expire after 10 minutes
    setTimeout(() => this.codes.delete(code), 10 * 60 * 1000);
  }

  retrieve(code: string): AuthCodeData | null {
    const data = this.codes.get(code);
    if (data) {
      this.codes.delete(code); // One-time use
      return data;
    }
    return null;
  }
}
```

### 2.2 Token Endpoint Integration
**Priority**: High

**Changes Required**:
- Update token endpoint to use stored authorization codes
- Implement proper code exchange validation
- Add PKCE verification if required

---

## Phase 3: Standards Compliance Review (Day 5)

### 3.1 OAuth 2.1 Compliance Assessment
**Priority**: Medium
**Risk**: Low

**Evaluation Points**:
- Review manual authorization code generation vs `provider.interactionFinished()`
- Assess if current proxy pattern can be made fully compliant
- Document any necessary deviations from standards

### 3.2 Architecture Documentation Update
**Priority**: Medium

**Documentation Tasks**:
- Update architecture diagrams with correct redirect flow
- Document the OAuth proxy pattern design decisions
- Add troubleshooting guide for redirect issues

---

## Implementation Details

### File Changes Required

#### 1. `packages/oauth-server/src/handlers/interactions.ts`
```typescript
// Line 273 - Primary fix
const clientCallbackUrl = new URL(details.params.redirect_uri);

// Add validation before line 273
if (!details.params.redirect_uri) {
  logger.error('Missing client redirect_uri in OAuth request', {
    interactionUid: record.uid,
    clientId: details.params.client_id
  });
  ctx.status = 400;
  ctx.body = {
    error: 'invalid_request',
    error_description: 'Missing redirect_uri parameter'
  };
  return;
}
```

#### 2. `packages/oauth-server/src/services/auth-code-store.ts` (New File)
```typescript
export interface AuthCodeData {
  code: string;
  accountId: string;
  accessToken: string;
  refreshToken?: string;
  clientId: string;
  redirectUri: string;
  createdAt: number;
  expiresAt: number;
}

export class AuthCodeStore {
  // Implementation as shown above
}
```

### Environment Variables
**No changes required** - all necessary configuration already exists.

### Testing Strategy

#### Unit Tests
- Test redirect URI extraction from `details.params`
- Test authorization code storage/retrieval
- Test error handling for missing redirect URIs

#### Integration Tests
- Full OAuth flow with real client
- Multiple concurrent OAuth flows
- Error scenarios (invalid redirect URIs, expired codes)

#### End-to-End Tests
- Browser-based OAuth flow testing
- Verify no redirect loops occur
- Test with different OAuth clients (Claude, MCP Inspector, etc.)

---

## Risk Assessment

### Low Risk Items
- ✅ Redirect URI fix (well-understood, easy to revert)
- ✅ Logging improvements (non-functional)
- ✅ Input validation (defensive programming)

### Medium Risk Items
- ⚠️ Authorization code storage (changes token flow behavior)
- ⚠️ Token endpoint modifications (could break existing flows)

### High Risk Items
- 🚨 None identified (targeted, incremental approach)

---

## Success Criteria

### Phase 1 Success
- [ ] OAuth flow completes without redirect loops
- [ ] Users land on client application, not OAuth server
- [ ] Authorization codes reach client applications
- [ ] No regression in Mittwald authentication

### Phase 2 Success
- [ ] Authorization codes properly stored and retrieved
- [ ] Token endpoint validates codes correctly
- [ ] Multiple concurrent OAuth flows work
- [ ] Codes expire appropriately (10 minutes)

### Phase 3 Success
- [ ] Architecture documentation updated
- [ ] Standards compliance documented
- [ ] Troubleshooting guide available

---

## Timeline

| Day | Phase | Tasks | Deliverables |
|-----|-------|-------|--------------|
| 1 | Phase 1 | Core redirect fix, validation, logging | Working redirect logic |
| 2 | Phase 1 | Testing, deployment, monitoring | Production fix deployed |
| 3 | Phase 2 | Authorization code storage implementation | Persistent code storage |
| 4 | Phase 2 | Token endpoint integration, testing | Working token exchange |
| 5 | Phase 3 | Standards review, documentation | Updated architecture docs |

---

## Resources Required

### Development
- 1 developer (full-time for 3-5 days)
- Access to Fly.io deployments
- Access to Mittwald OAuth test environment

### Infrastructure
- Staging environment for testing
- Production deployment access
- Monitoring/logging access

### Testing
- OAuth test clients (Claude, MCP Inspector)
- Browser testing capability
- Load testing tools (optional)

---

## Next Steps

1. **Immediate**: Begin Phase 1 implementation
2. **Day 1**: Deploy redirect URI fix to staging
3. **Day 2**: Deploy to production after validation
4. **Day 3**: Start authorization code storage work
5. **Day 5**: Complete documentation updates

This targeted approach fixes the immediate blocker while preserving the valid OAuth proxy architecture and setting up the foundation for full standards compliance.