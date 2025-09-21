# Mittwald Studio OAuth Client Configuration

**CURRENT STATUS: CRITICAL FAILURE - ALL OAUTH FLOWS BROKEN (2025-09-21)**

This document specifies the OAuth client configuration registered in Mittwald Studio. Despite extensive investigation and multiple implementation attempts, **all OAuth flows currently fail** and redirect users to studio.mittwald.de/app/dashboard instead of completing the OAuth consent flow.

> **CRITICAL ISSUE**: OAuth flows do not complete. Server-side processing appears successful (logs show "OAuth flow completed successfully") but browser redirects fail, sending users to Mittwald dashboard instead of MCP client callbacks.

## 📋 Static Client Registration

**Client Identifier:** `mittwald-mcp-server`  
**Human-Readable Name:** `mStudio MCP server`  
**Client Type:** Public Client (No Secret)  
**Registration Type:** Static/Pre-registered  

## ⚙️ OAuth Configuration

### Grant Types
```yaml
allowedGrantTypes:
  - "authorization_code"  # OAuth 2.1 with PKCE
```

### Redirect URIs
```yaml
allowedRedirectURIs:
  # Development/Staging OAuth Server (node-oidc-provider)
  - "https://auth.mittwald-mcp-fly.fly.dev/interaction/callback"
  - "https://auth.mittwald-mcp-fly.fly.dev/auth/mittwald/callback"
  
  # Production OAuth Server (Custom Domain)
  - "https://auth.mittwald.de/interaction/callback"
  - "https://auth.mittwald.de/auth/mittwald/callback"
```

**Important Notes:**
- OAuth server (node-oidc-provider) handles Mittwald authentication callbacks
- HTTPS is mandatory for all redirect URIs
- URIs must match exactly (no wildcards or partial matches)
- Development and production OAuth servers have separate URIs
- Mittwald tokens are stored server-side and used for CLI authentication
- MCP clients interact with node-oidc-provider, not directly with Mittwald

### Scopes (40+ Available)

#### Application Management
```yaml
- "app:read"        # Read application details
- "app:write"       # Create/update applications  
- "app:delete"      # Delete applications
```

#### Backup Management
```yaml
- "backup:read"     # Read backup information
- "backup:write"    # Create/schedule backups
- "backup:delete"   # Delete backups
```

#### Contract & Business
```yaml
- "contract:read"   # Read contract information
- "contract:write"  # Update contract details
```

#### Cron Job Management
```yaml
- "cronjob:read"    # Read cron job configurations
- "cronjob:write"   # Create/update cron jobs
- "cronjob:delete"  # Delete cron jobs
```

#### Customer Management
```yaml
- "customer:read"   # Read customer information
- "customer:write"  # Update customer details
```

#### Database Management
```yaml
- "database:read"   # Read database information
- "database:write"  # Create/update databases
- "database:delete" # Delete databases
```

#### Domain & DNS Management
```yaml
- "domain:read"     # Read domain configurations
- "domain:write"    # Update domain settings
- "domain:delete"   # Delete domains
```

#### Extension Management
```yaml
- "extension:read"     # Read extension information
- "extension:write"    # Install/update extensions
- "extension:delete"   # Uninstall extensions
```

#### Mail Management
```yaml
- "mail:read"       # Read mail configurations
- "mail:write"      # Create/update mail settings
- "mail:delete"     # Delete mail configurations
```

#### Order Management
```yaml
- "order:domain-create"   # Create domain orders
- "order:domain-preview"  # Preview domain orders
```

#### Project Management
```yaml
- "project:read"    # Read project information
- "project:write"   # Create/update projects
- "project:delete"  # Delete projects
```

#### Registry Management
```yaml
- "registry:read"   # Read container registry
- "registry:write"  # Push to registry
- "registry:delete" # Delete registry entries
```

#### SSH User Management
```yaml
- "sshuser:read"    # Read SSH user configurations
- "sshuser:write"   # Create/update SSH users
- "sshuser:delete"  # Delete SSH users
```

#### Container Stack Management
```yaml
- "stack:read"      # Read container stack info
- "stack:write"     # Deploy/update stacks
- "stack:delete"    # Delete container stacks
```

#### User Management
```yaml
- "user:read"       # Read user information
- "user:write"      # Update user details
```

## 🔒 Security Configuration

### PKCE Requirements
- **Code Challenge Method:** `S256` (SHA256)
- **Code Challenge:** Required for all authorization requests
- **Code Verifier:** Must be provided during token exchange
- **Client Secret:** Not used (public client)

### Token Configuration
- **Access Token Lifetime:** Managed by Mittwald Studio
- **Refresh Token:** Supported (if implemented by Mittwald)
- **Token Type:** Bearer tokens
- **Scope Validation:** Enforced by Mittwald API
 - **CLI Integration:** MCP passes `--token <access_token>` to every CLI command

## 🌐 OAuth Endpoints

### Mittwald Studio OAuth Endpoints
```
Authorization URL: https://api.mittwald.de/v2/oauth2/authorize
Token URL:         https://api.mittwald.de/v2/oauth2/token
```

### OAuth Discovery (if supported)
```
Discovery URL:     (Not used; AS uses explicit endpoints)
```

## 🏗️ Architecture Overview

### Service Separation
```
MCP Client → node-oidc-provider (OAuth AS) → MCP Server (Resource Server)
                     ↓
               Mittwald Studio (OAuth Provider)
```

**OAuth Server (node-oidc-provider):**
- Hosted at: `https://mittwald-oauth-server.fly.dev`
- Handles DCR (Dynamic Client Registration) for MCP clients
- Authenticates users via Mittwald Studio using this client config
- Issues JWT tokens to MCP clients
- Stores Mittwald tokens server-side

**MCP Server (Resource Server):**
- Hosted at: `https://mittwald-mcp-fly2.fly.dev`
- Validates JWT tokens from node-oidc-provider
- Uses stored Mittwald tokens for CLI authentication
- Executes `mw` commands with `--token <mittwald_access_token>`

### OAuth Flow Sequence
1. **MCP Client** registers with node-oidc-provider via DCR
2. **MCP Client** initiates OAuth flow with node-oidc-provider
3. **node-oidc-provider** redirects user to Mittwald Studio for authentication
4. **Mittwald Studio** redirects back to node-oidc-provider with authorization code
5. **node-oidc-provider** exchanges code for Mittwald access token (using this config)
6. **node-oidc-provider** stores Mittwald token and issues JWT to MCP client
7. **MCP Client** uses JWT for MCP server requests
8. **MCP Server** validates JWT and uses stored Mittwald token for CLI calls

## 🚀 Implementation Notes

### Authorization Request Format (MCP Server → api.mittwald.de)
```http
GET https://api.mittwald.de/v2/oauth2/authorize?
  response_type=code&
  client_id=mittwald-mcp-server&
  redirect_uri=https%3A%2F%2Fmittwald-oauth-server.fly.dev%2Fmittwald%2Fcallback&
  scope=project%3Aread%20project%3Awrite%20database%3Aread&
  state=oauth-server-generated-state&
  code_challenge=oauth-server-generated-challenge&
  code_challenge_method=S256
```

### Token Exchange Format (MCP Server → api.mittwald.de)
```http
POST https://api.mittwald.de/v2/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
client_id=mittwald-mcp-server&
code=mittwald-authorization-code&
redirect_uri=https%3A%2F%2Fmittwald-oauth-server.fly.dev%2Fmittwald%2Fcallback&
code_verifier=oauth-server-generated-verifier
```

**Note**: These requests are made by the node-oidc-provider OAuth server, not by MCP clients. MCP clients interact with the node-oidc-provider endpoints instead.

## 📝 Configuration Validation Checklist

### Pre-Development Validation
- [ ] **Client ID accessible:** Can query Mittwald with `mittwald-mcp-server`
- [ ] **Redirect URIs functional:** All 4 URIs accept OAuth callbacks
- [ ] **Scopes available:** All 40+ scopes can be requested
- [ ] **PKCE enforcement:** Client secret not required, PKCE mandatory
- [ ] **Grant type supported:** Authorization Code flow works

### Development Environment Testing
- [ ] **OAuth server URLs work:** Both interaction callback endpoints
- [ ] **Mittwald integration:** OAuth server can authenticate with Mittwald
- [ ] **Token exchange:** PKCE validation works correctly
- [ ] **Error handling:** Invalid redirects rejected properly
- [ ] **MCP client flows:** End-to-end OAuth via node-oidc-provider works

### Production Readiness
- [ ] **Production URIs:** `https://auth.mittwald.de/*` URIs configured
- [ ] **SSL certificates:** HTTPS works for all redirect URIs
- [ ] **OAuth server deployment:** node-oidc-provider running in production
- [ ] **Scope validation:** API enforces token scopes correctly
- [ ] **Rate limiting:** OAuth flow handles rate limits gracefully

## 🔄 Configuration Updates

### Adding New Redirect URIs
Contact Mittwald support to add new OAuth server redirect URIs:
```yaml
# New URIs must point to OAuth server, not MCP server
- "https://auth.new-domain.com/auth/mittwald/callback"
```

### Scope Modifications
Request scope changes through Mittwald developer portal:
- Additional scopes may require approval
- Scope removal is typically immediate
- Some scopes may require specific account permissions

### Client Name Updates
Human-readable name changes:
- Affects user consent screens
- May require Mittwald review
- Changes are typically immediate

## 🆘 Troubleshooting

### Common Issues

**Invalid Redirect URI**
```
Error: redirect_uri_mismatch
Solution: Ensure OAuth server redirect URIs match registered URIs exactly
         (auth.mittwald-mcp-fly.fly.dev, not mcp.mittwald-mcp-fly.fly.dev)
```

**Invalid Client**
```
Error: invalid_client
Solution: Verify client_id is "mittwald-mcp-server"
```

**Insufficient Scope**
```
Error: invalid_scope
Solution: Request only registered scopes
```

**PKCE Validation Failed**
```
Error: invalid_grant (code_verifier)
Solution: Ensure code_verifier matches code_challenge
```

### Support Contacts
- **Mittwald Developer Support:** developer-support@mittwald.de
- **OAuth Configuration Issues:** Contact via Mittwald Studio
- **Scope Permission Issues:** Account management support
- **node-oidc-provider Integration:** See ARCHITECTURE.md and OAUTH_PROJECT_PLAN.md

---

**Document Version:** 2.0  
**Last Updated:** 2025-09-06  
**Configuration Status:** Updated for node-oidc-provider integration  
**Architecture:** OAuth AS + Resource Server separation  
**Next Review:** After node-oidc-provider deployment

---

*This configuration is used by the node-oidc-provider OAuth server to authenticate users with Mittwald Studio. Redirect URIs must point to the OAuth server, not the MCP server. Any changes must be coordinated with Mittwald Studio and tested thoroughly in development before production deployment.*
