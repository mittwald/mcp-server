# Manual OAuth Flow Procedure for Claude Code

## Prerequisites

1. **Server Running**: Ensure Docker containers are running
   ```bash
   docker compose up -d
   ```

2. **Verify Services**:
   - MCP Server: https://localhost:3000 and http://localhost:3001
   - OAuth Provider: http://localhost:8080
   - Redis: localhost:6379

## Step-by-Step OAuth Flow

### Step 1: Initiate OAuth Flow

1. **Open browser** and navigate to:
   ```
   https://localhost:3000/oauth/authorize
   ```

2. **Accept certificate warning** (for development certificates)

3. **You should be redirected** to MockOAuth2Server:
   ```
   http://localhost:8080/default/authorize?client_id=mittwald-mcp-server&...
   ```

### Step 2: Complete Authentication

1. **MockOAuth2Server Login Page** will appear
2. **Enter any credentials** (MockOAuth2Server accepts any username/password)
   - Username: `testuser`
   - Password: `password123`
3. **Click "Authorize"** to grant permissions

### Step 3: Handle Callback

1. **Browser redirects back** to:
   ```
   https://localhost:3000/auth/callback?code=AUTHORIZATION_CODE&state=...
   ```

2. **Copy the authorization code** from the URL parameter

### Step 4: Exchange Code for Token

**Using curl:**
```bash
curl -X POST https://localhost:3000/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=AUTHORIZATION_CODE_HERE" \
  -d "client_id=mittwald-mcp-server" \
  -d "redirect_uri=https://localhost:3000/auth/callback" \
  -k
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_here",
  "scope": "openid profile user:read customer:read project:read"
}
```

### Step 5: Configure Claude Code

**Add MCP server with Bearer token:**
```bash
claude mcp add --transport http mittwald-mcp http://localhost:3001/mcp \
  --headers '{"Authorization": "Bearer ACCESS_TOKEN_HERE"}'
```

**Or for HTTPS (if certificates work):**
```bash
claude mcp add --transport http mittwald-mcp https://localhost:3000/mcp \
  --headers '{"Authorization": "Bearer ACCESS_TOKEN_HERE"}'
```

### Step 6: Test Connection

**Check if server appears in Claude Code:**
```bash
claude mcp list
```

**Test the connection:**
- Start Claude Code session
- The mittwald-mcp server should be available
- Try listing tools or resources

## Troubleshooting

### OAuth Authorization Issues

**Problem**: Redirect fails or shows error
**Solution**: 
- Check that MockOAuth2Server is running on port 8080
- Verify OAuth configuration in docker-compose.yml
- Check server logs: `docker compose logs mcp-server-full`

### Token Exchange Issues

**Problem**: Token endpoint returns error
**Solution**:
- Ensure authorization code is fresh (expires quickly)
- Check that all required parameters are included
- Verify redirect_uri matches exactly

### Claude Code Connection Issues

**Problem**: MCP server not available in Claude Code
**Solution**:
- Verify Bearer token is valid (not expired)
- Check token format in headers configuration
- Test with curl first:
  ```bash
  curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/mcp
  ```

### Certificate Issues

**Problem**: HTTPS endpoints fail
**Solution**:
- Use HTTP endpoint instead: http://localhost:3001/mcp
- Or fix certificate trust:
  ```bash
  mkcert -install
  sudo security add-trusted-cert -d -r trustRoot \
    -k /Library/Keychains/System.keychain \
    "/Users/robert/Library/Application Support/mkcert/rootCA.pem"
  ```

## Token Management

### Token Expiration

**Default Expiry**: 1 hour (3600 seconds)

**Refresh Token Flow** (when needed):
```bash
curl -X POST https://localhost:3000/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=REFRESH_TOKEN_HERE" \
  -d "client_id=mittwald-mcp-server" \
  -k
```

### Re-authentication

When tokens expire:
1. Remove old MCP server: `claude mcp remove mittwald-mcp`
2. Repeat OAuth flow from Step 1
3. Configure with new token

## Development Utilities

### Check Server Status
```bash
# Health check
curl http://localhost:3001/health

# OAuth challenge
curl http://localhost:3001/mcp

# Server logs
docker compose logs -f mcp-server-full
```

### Mock OAuth Server
```bash
# Check OAuth server health
curl http://localhost:8080/default/.well-known/openid_configuration

# View OAuth server logs
docker compose logs mock-oauth
```

### Redis Session Check
```bash
# Connect to Redis
docker exec -it mittwald-mcp-redis-1 redis-cli

# List all keys
KEYS *

# Check session data
GET "session:session_id_here"
```

## Production Considerations

For production deployment:

1. **Use real certificates** (Let's Encrypt)
2. **Replace MockOAuth2Server** with production OAuth provider
3. **Implement token refresh** in MCP client
4. **Add proper error handling** for token expiration
5. **Consider OAuth device flow** for CLI applications

This manual process demonstrates the complete OAuth flow and serves as a foundation for implementing automatic OAuth handling in future MCP client versions.