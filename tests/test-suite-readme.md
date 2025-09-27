# OAuth 2.1 + MCP Test Suite

Comprehensive test suite based on ARCHITECTURE.md "Complete OAuth 2.1 + MCP Lifecycle Flow" documentation.

## Test Structure

### 📋 **Integration Tests** (`tests/integration/`)
- **`oauth-lifecycle.test.ts`**: Complete 38-step workflow testing across 5 phases
- **`scope-validation.test.ts`**: Centralized scope configuration and validation
- **`mittwald-integration.test.ts`**: Mittwald IdP integration and constraints

### 🔧 **Unit Tests** (`tests/unit/`)
- **`oauth-bridge/*.test.ts`**: Bridge request validation, PKCE handling, and Mittwald token exchange
- **`mcp-server/jwt-validation.test.ts`**: JWT validation and Mittwald token extraction

### 🌍 **End-to-End Tests** (`tests/e2e/`)
- **`claude-ai-oauth-flow.test.ts`**: Complete Claude.ai OAuth simulation
- **`all-clients-compatibility.test.ts`**: MCP Jam, Claude.ai, ChatGPT compatibility

## Architecture Compliance Testing

These tests validate the implementation against ARCHITECTURE.md documentation:

- **✅ Pure oidc-provider approach** (no custom token endpoints)
- **✅ Centralized scope configuration** (single source of truth - no hardcoding)
- **✅ Standards compliance** (OAuth 2.1, PKCE, RFC7591, MCP spec)
- **✅ All client compatibility** (MCP Jam, Claude.ai, ChatGPT)
- **✅ Proper consent flows** (user transparency and approval)
- **✅ CLI-centric integration** (mw tool with --token parameter)

## Test Coverage: Complete 38-Step Workflow

Based on the comprehensive sequence diagram in ARCHITECTURE.md:

1. **Phase 1-2** (Steps 1-6): Discovery & Authorization Server metadata
2. **Phase 3** (Steps 7-9): Dynamic Client Registration (RFC7591)
3. **Phase 4** (Steps 10-16): Authorization + Mittwald authentication
4. **Phase 5** (Steps 17-21): Token exchange + user session creation
5. **Phase 6** (Steps 22-25): User consent with scope transparency
6. **Phase 7** (Steps 26-29): Standard token exchange via oidc-provider
7. **Phase 8** (Steps 30-36): MCP tool execution with CLI integration
8. **Phase 9** (Steps 37-38): Token refresh capability

---

*Test suite ensures implementation matches documented architecture and provides regression protection for OAuth 2.1 + MCP integration.*
