# Known Limitations - Mittwald MCP Server

## API Endpoint Restrictions

### Redis Versions (403 Forbidden)

**Tool**: `mcp__mittwald__mittwald_database_redis_versions`
**Status**: Returns HTTP 403 via MCP, works via `mw` CLI
**Root Cause**: OAuth token vs direct API token permission difference

**Evidence**:
- `mw database redis versions` → ✅ Returns 4 versions
- MCP tool call → ❌ HTTP 403 Forbidden

**Hypothesis**:
- Redis features may require special account/server tier
- OAuth tokens might have Redis restrictions
- Direct API tokens have broader access

**Workaround**: Use `mw database redis versions` via CLI for Redis version information.

**Impact**: Low (versions endpoint is informational only)

---

## Conversation Tools (403 Forbidden)

**Tools**: All 5 conversation tools (categories, create, list, reply, show)
**Status**: Returns HTTP 403 - No OAuth scopes exist for conversations
**Root Cause**: Conversation endpoints are admin-only, no public OAuth scopes

**Evidence**:
- Mittwald API `/v2/scopes` returns NO conversation scopes
- All conversation endpoints return 403 with valid OAuth tokens

**Resolution**: Tools disabled in tool scanner, marked as admin-only.

---

## MySQL Database Creation (HTTP 500)

**Tool**: `mcp__mittwald__mittwald_database_mysql_create`
**Status**: ~~Returns HTTP 500~~ **FIXED** - was version format issue
**Root Cause**: Invalid version format `"mysql84"` instead of `"MySQL 8.0"`

**Resolution**: Updated eval prompt with correct version format requirements.

---

## Filesystem Access (SSH Key Import/Create)

**Tools**: `user/ssh-key-import`, `user/ssh-key-create`
**Original Issue**: Trying to read files from server filesystem
**Root Cause**: MCP server runs remotely on Fly.io with ephemeral storage

**Resolution**:
- Added `publicKey` parameter to both tools
- Made publicKey mandatory for import
- Added local key generation for create
- Tools now work in stateless MCP environment

---

## Permission-Based Restrictions (Cannot Fix)

**Total**: 15-17 tools with legitimate permission issues

**Categories**:
1. **Role restrictions** (Owner vs Member):
   - org/invite-revoke (requires Owner)
   - org/membership-revoke (requires Owner)
   - project/delete (requires Owner)

2. **Account tier restrictions**:
   - Redis versions/create (may require premium tier)
   - Some project-level operations (Member role limitations)

3. **API access restrictions**:
   - conversation/* (admin-only)
   - Some invite/membership operations

**Resolution**: These are working as designed. Tools correctly report 403 errors.

---

## Summary

**Total Tools**: 115
**Fixable Bugs Fixed**: 24 tools
**Known Limitations**: 31 tools
**Working Correctly**: 60+ tools (success rate: ~75%)

Most limitations are either:
- Legitimate API restrictions (permissions, account tiers)
- Intentionally disabled features (admin-only)
- Edge cases that don't affect core functionality
