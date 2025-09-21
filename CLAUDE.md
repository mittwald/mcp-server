# 🚨 CRITICAL STATUS: OAuth 2.1 Implementation FAILED (2025-09-21)

**ALL OAUTH FLOWS BROKEN** - Users redirected to studio.mittwald.de/app/dashboard instead of completing OAuth consent flow.

## 🏗️ Architecture Status: NON-FUNCTIONAL

This implementation has **FAILED** to achieve working OAuth flows despite extensive development effort:

**OAuth (Mittwald Studio)** - BROKEN
- OAuth 2.1 flows redirect to dashboard instead of consent screen
- oidc-provider incompatible with Mittwald OAuth 2.0 requirements
- Multiple implementation attempts unsuccessful

**MCP Server (Single Service)** - READY
- ✅ Wraps the `mw` CLI; ready for `--token <access_token>` authentication
- ✅ MCP protocol implementation functional
- ❌ Cannot receive OAuth tokens due to broken OAuth flows

## 🔧 Technical Constraints

- Library/Application Support/Claude/claude_desktop_config.json is a generated file — don't edit it
- Claude Code LLM client can't accept http urls for remote MCP servers, so http://localhost:3001/mcp is NOT AN OPTION
- Must be OAuth 2.1 compliant with PKCE
- HTTPS mandatory in production
- No `MITTWALD_API_TOKEN`; no `DISABLE_OAUTH` bypass
- CLI is canonical integration surface; per‑command `--token` always used

## 📋 Implementation Status

**Current Branch:** `oauth-server-v2` (Development)
**Previous Working Version:** `fly` branch (OAuth proxy pattern)

**Phase 1: OAuth + CLI** 🔄
- [x] Architecture planning and analysis
- [ ] OAuth discovery/authorize/callback (PKCE)
- [ ] Centralized CLI invoker appending `--token`
- [ ] Token refresh + single retry on auth failures

**Phase 2: Integration**
- [ ] Ensure all tools use the centralized invoker
- [ ] Strengthen parsing + error mapping
- [ ] Multi‑user testing

**Phase 3: Deployment**
- [ ] Docker containerization
- [ ] Production testing
- [ ] Performance validation

## 🚨 Problems Solved by v2 Architecture

**Issues to avoid:**
- ❌ Server‑side PATs and bypass flags
- ❌ Reimplementing CLI semantics via ad‑hoc API calls

**Solutions in v2:**
- ✅ Clean OAuth 2.1 flows (PKCE)
- ✅ Per‑user token isolation by design
- ✅ CLI as canonical integration surface

## 🎯 Target Architecture

```
MCP Server:    https://mittwald-mcp-fly2.fly.dev  
MCP Endpoint:  https://mittwald-mcp-fly2.fly.dev/mcp
```

**Service Communication:**
1. MCP Client → OAuth Server (OAuth 2.1 flow)
2. OAuth Server → Mittwald Studio (user authentication) 
3. OAuth Server → MCP Client (JWT token)
4. MCP Client → MCP Server (JWT authenticated requests)
5. MCP Server → Mittwald API (direct API calls)

## 🔐 Security Model

- **OAuth 2.1** with mandatory PKCE
- **HTTPS only** in production
- **Per‑command token**: `mw ... --token <access_token>`
- **Token expiration** with refresh capability
- **Scope-based access control**
