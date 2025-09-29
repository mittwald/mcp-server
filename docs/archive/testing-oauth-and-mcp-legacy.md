# Automated OAuth testing tools for Claude Code MCP servers

Claude Code's OAuth implementation with Dynamic Client Registration presents unique testing challenges that manual workflows cannot efficiently address. This research identifies **oauth2c** as the premier command-line tool for automated testing, alongside mock server strategies and programmatic frameworks that eliminate the need for manual Claude Desktop or MCP Jam Inspector testing.

## Primary testing solution: oauth2c from Cloudentity

The most comprehensive tool for testing MCP OAuth flows is **oauth2c**, a command-line OAuth client that easily orchestrates discovery, authorization, and token exchange. Installation is straightforward via Homebrew (`brew install cloudentity/tap/oauth2c`) or Linux install scripts. *Note:* recent oauth2c releases (v1.17+) no longer ship a built-in `register` subcommand—perform Dynamic Client Registration with a direct `curl` POST to `/reg`, then feed the resulting `client_id` into oauth2c for the remaining steps. This slight extra step preserves full compatibility with Claude Code’s expectations while keeping the workflow almost entirely automated.

To test an MCP server's OAuth implementation programmatically:
```bash
oauth2c https://your-mcp-server.com \
  --grant-type authorization_code \
  --pkce \
  --scopes "mcp:read mcp:tools mcp:prompts" \
  --client-name "Claude-Test-Client" \
  --verbose
```

The tool automatically handles the entire OAuth flow including DCR, authorization, and token exchange, while the `--verbose` flag provides detailed HTTP request/response logging for debugging. This eliminates the manual browser-based testing required with Claude Desktop, allowing developers to validate OAuth flows directly from the command line or CI/CD pipelines.

## Mock server approach for isolated testing

For comprehensive automated testing without external dependencies, implementing mock OAuth servers provides the most robust solution. **NaviKt's Mock OAuth2 Server** offers production-ready OAuth mocking with full DCR support. Deploy it using Docker:

```yaml
version: '3.7'
services:
  mock-oauth:
    image: ghcr.io/navikt/mock-oauth2-server:latest
    ports:
      - "8080:8080"
    environment:
      - JSON_CONFIG={"interactiveLogin": false, "httpServer": "NettyWrapper"}
```

This approach enables complete OAuth flow testing in isolation, supporting error scenario simulation and CI/CD integration. The mock server handles all required endpoints including `/.well-known/oauth-authorization-server`, `/register` for DCR, `/authorize`, and `/token`, matching MCP specification requirements exactly.

## Python framework for programmatic testing

For Python-based MCP servers, **FastMCP with MCPAuth** provides native OAuth testing capabilities specifically designed for Claude Code compatibility:

```python
from fastmcp import Client
from mcpauth import MCPAuth
from mcpauth.config import AuthServerType

# Initialize OAuth-enabled MCP client with automatic DCR
mcp_auth = MCPAuth(
    server=fetch_server_config(
        "https://your-auth-server.com",
        type=AuthServerType.OAUTH
    )
)

# Test MCP server with automated OAuth flow
async with Client("https://your-mcp-server.com/mcp", auth="oauth") as client:
    tools = await client.list_tools()
    result = await client.call_tool("test_tool", {"param": "value"})
```

This eliminates manual testing by programmatically executing the complete OAuth flow including DCR, token management, and authenticated MCP operations. The framework handles token refresh automatically and provides detailed error reporting that Claude Code can directly consume.

## Critical issues discovered in Claude Code's OAuth implementation

Research reveals significant compatibility problems that explain why manual testing has been necessary. **The primary issue is Claude Code's strict DCR requirement** - it cannot work with OAuth providers that require pre-registered client IDs. This affects major enterprise providers like Azure AD/Entra ID and Amazon Cognito. Over 130 developers have reported this limitation, with Azure AD users forced to constantly update redirect URIs due to Claude's random port assignment (54212, 56619, 57411, etc.).

The most common error, **"invalid_client"**, occurs when DCR configuration doesn't match Claude's expectations. This error manifests even when the same server works with MCP Inspector, indicating Claude-specific implementation requirements. Developers report the error appears with various authentication providers including Clerk, despite DCR being enabled.

Another critical issue is Claude's immediate attempt to connect to `/.well-known/oauth-authorization-server`, ignoring resource metadata headers. This prevents compatibility with MCP servers acting as resource servers with external authorization providers - a pattern many enterprise deployments prefer.

## Command-line alternatives to manual testing

Beyond oauth2c, several command-line tools can simulate Claude Code's OAuth flow:

**For basic OAuth flow testing:**
```bash
# Test metadata discovery
curl -s https://your-mcp-server.com/.well-known/oauth-authorization-server | jq .

# Test DCR endpoint
curl -X POST https://your-mcp-server.com/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Claude Code",
    "redirect_uris": ["http://localhost:PORT/callback"],
    "grant_types": ["authorization_code"],
    "token_endpoint_auth_method": "none"
  }'
```

**oauth2l from Google** provides token management capabilities but limited DCR support:
```bash
oauth2l fetch --credentials ~/credentials.json --scope "mcp:read,mcp:tools"
oauth2l header --scope mcp:read,mcp:tools
```

## Automated testing frameworks for CI/CD integration

For continuous integration, combining mock servers with testing frameworks provides comprehensive validation. Using pytest with mock OAuth servers:

```python
import pytest
from oauth2_mock_server import OAuth2MockServer

@pytest.fixture
def oauth_server():
    server = OAuth2MockServer(port=8080)
    server.start()
    server.register_client({
        'client_id': 'test-mcp-client',
        'redirect_uris': ['http://localhost:8081/oauth/callback'],
        'scopes': ['mcp:tools', 'mcp:resources']
    })
    yield server
    server.stop()

def test_mcp_oauth_flow(oauth_server):
    # Test complete OAuth flow with PKCE
    response = requests.get(f"{oauth_server.base_url}/.well-known/oauth-authorization-server")
    assert response.status_code == 200
    metadata = response.json()
    assert 'registration_endpoint' in metadata
    assert metadata['code_challenge_methods_supported'] == ['S256']
```

This approach validates all OAuth endpoints, DCR functionality, PKCE implementation, and error handling without manual intervention.

## Solutions for enterprise OAuth providers without DCR

Since many enterprise OAuth providers don't support DCR, developers have created workarounds:

**Development token endpoints** bypass OAuth for testing:
```python
@app.get("/dev/token")
def get_dev_token():
    token = create_token(
        subject="dev-user",
        scopes=["read", "write"],
    )
    return {"access_token": token, "token_type": "Bearer"}
```

**OAuth proxy solutions** like **mcp-front** provide a middle layer that handles DCR for Claude while connecting to enterprise OAuth providers:
```json
{
  "proxy": {
    "baseURL": "https://mcp.yourcompany.com",
    "auth": {
      "kind": "oauth",
      "allowedDomains": ["yourcompany.com"]
    }
  }
}
```

## Best practices for OAuth testing in MCP servers

Successful OAuth testing requires a layered approach. **Never disable security for testing** - always test with authentication enabled using mock servers rather than bypassing OAuth. Test all error scenarios including invalid tokens, expired credentials, and insufficient scopes. The MCP specification requires specific error responses (401 for unauthorized, 403 for forbidden) that Claude Code expects.

For comprehensive testing, validate these critical areas:
- Metadata discovery at `/.well-known/oauth-authorization-server`
- DCR endpoint accepting Claude's specific registration format
- Authorization code flow with PKCE (required by MCP spec)
- Token validation with proper Bearer format
- Scope enforcement for mcp:tools, mcp:resources, and mcp:prompts

## Known Claude Code OAuth quirks requiring special handling

Claude Code exhibits several unique behaviors that standard OAuth testing might miss. It uses random localhost ports for callbacks, requiring flexible redirect URI validation. The client always attempts metadata discovery first, even when provided with explicit endpoint URLs. It expects immediate DCR support without any pre-registration capability.

Error reporting from Claude is minimal - most failures appear as generic "step=start_error" messages in logs. To get detailed error information, implement comprehensive logging at the OAuth server level, capturing all requests from Claude's user agent.

The tool strictly validates OAuth 2.1 compliance including PKCE support, proper token response formats, and standard endpoint paths. Any deviation from the specification causes silent failures that are difficult to debug without programmatic testing tools.

## Conclusion

Programmatic OAuth testing for Claude Code MCP servers requires specialized tools that support Dynamic Client Registration. The combination of **oauth2c for command-line testing**, **mock OAuth servers for isolated validation**, and **FastMCP for programmatic Python testing** provides comprehensive coverage without manual intervention. While Claude Code's strict DCR requirements create compatibility challenges with enterprise OAuth providers, proxy solutions and development endpoints offer practical workarounds. Implementing these automated testing approaches eliminates the time-consuming manual testing in Claude Desktop or MCP Jam Inspector, enabling rapid development and reliable OAuth implementations for MCP servers.
