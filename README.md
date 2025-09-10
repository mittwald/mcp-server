# Mittwald MCP Server (CLI‑centric)

✅ Design principle: The server wraps the official `mw` CLI and passes `--token <access_token>` on every command. OAuth 2.1 with PKCE is used to obtain per‑user tokens. There is no `MITTWALD_API_TOKEN` fallback and no `DISABLE_OAUTH` bypass.

A production-ready Model Context Protocol (MCP) server with OAuth 2.1 authentication that provides secure access to the **Mittwald hosting platform**. The server invokes the official Mittwald CLI for all operations and authenticates each invocation via `--token`.

## 🏗️ Architecture Overview

### Production-Ready Architecture
- **CLI Wrapper**: Executes official Mittwald CLI commands for maximum compatibility
- **143 Tools**: Comprehensive coverage of Mittwald CLI functionality
- **TypeScript**: Full type safety with comprehensive interfaces
- **Docker Support**: Containerized deployment with health checks
- **Error Handling**: Robust error management with detailed diagnostics
- **Session Management**: Proper MCP session handling for multiple concurrent clients

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Mittwald API token ([Get one here](https://studio.mittwald.de/app/profile/api-tokens))

### Installation & Setup

1. **Clone the repository**
```bash
git clone https://github.com/robertDouglass/mittwald-mcp.git
cd mittwald-mcp
```

2. **Configure environment variables**
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your Mittwald API token
MITTWALD_API_TOKEN=your_api_token_here
DISABLE_OAUTH=true
PORT=3000
```

3. **Build and run with Docker**

The project provides three different Dockerfiles for different use cases:

```bash
# For HTTP-based MCP server (default)
docker build -t mittwald/mcp-http -f Dockerfile .
docker run -d -p 3000:3000 --env-file .env --name mittwald-mcp-container mittwald/mcp-http

# For STDIO-based MCP server (Claude Desktop integration)
docker build -t mittwald/mcp -f stdio.Dockerfile .
docker run -d --env-file .env --name mittwald-mcp-container mittwald/mcp

# For OpenAPI wrapper server
docker build -t mittwald/mcp-openapi -f openapi.Dockerfile .
docker run -d -p 3000:3000 --env-file .env --name mittwald-mcp-container mittwald/mcp-openapi
```

4. **Verify the server is running**
```bash
# Check health endpoint
curl http://localhost:3000/health

# Check MCP endpoint
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"clientInfo":{"name":"test-client","version":"1.0.0"}}}'
```

## 🐳 Docker Deployment Options

The project provides **three different Dockerfiles** for different deployment scenarios:

### Dockerfile Types

| Dockerfile           | Purpose                 | Entry Point                       | Best For                                   |
|----------------------|-------------------------|-----------------------------------|--------------------------------------------|
| `Dockerfile`         | HTTP-based MCP server   | `build/index.js`                  | API integrations, web clients, development |
| `stdio.Dockerfile`   | STDIO-based MCP server  | `build/stdio-server.js`           | Claude Desktop, direct MCP clients         |
| `openapi.Dockerfile` | OpenAPI wrapper server  | `build/index.js`, wrapped by mcpo | Open WebUI, REST API compatibility         |

### Building Different Variants

```bash
# HTTP MCP Server (default)
docker build -t mittwald/mcp-http -f Dockerfile .

# STDIO MCP Server (for Claude Desktop)
docker build -t mittwald/mcp -f stdio.Dockerfile .

# OpenAPI Wrapper Server (REST API layer)
docker build -t mittwald/mcp-openapi -f openapi.Dockerfile .
```

### Using with MCP Clients

The Mittwald MCP Server supports **multiple communication modes**:

#### Mode 1: STDIO (for Claude Desktop)
**Best for:** Claude Desktop integration, direct MCP client connections

Add to your Claude Desktop MCP configuration:
```json
{
  "mcpServers": {
    "mittwald": {
      "command": "docker",
      "args": ["exec", "-i", "mittwald-mcp-container", "node", "build/stdio-server.js"],
      "env": {
        "MITTWALD_API_TOKEN": "your_api_token_here"
      }
    }
  }
}
```

**Requirements:**
- The `-i` (interactive) flag is **required** for STDIN/STDOUT communication
- Uses `stdio-server.js` entry point
- Environment variables passed directly to Docker exec

#### Mode 2: HTTP (for API integrations)
**Best for:** Web applications, API integrations, development/testing

Connect to the HTTP endpoint:
```bash
# Start container with HTTP server
docker run -d -p 3000:3000 --env-file .env --name mittwald-mcp-container mittwald/mcp-http

# Test connection
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"clientInfo":{"name":"test-client","version":"1.0.0"}}}'
```

**Features:**
- MCP-over-HTTP endpoint at `http://localhost:3000/mcp`
- Uses `index.js` entry point  
- Environment variables from `.env` file or `--env-file`
- Health check endpoint: `http://localhost:3000/health`

#### Mode 3: OpenAPI (wrapper server)
**Best for:** Open WebUI and other OpenAPI-compatible clients

Start the OpenAPI wrapper server:
```bash
# Start container with OpenAPI server
docker run -d -p 3000:3000 --env-file .env --name mittwald-mcp-container mittwald/mcp-openapi
```

**Features:**
- OpenAPI compatibility wrapper over MCP functionality
- Compatible with Open WebUI and similar clients
- Custom entrypoint with Python/uv dependencies

**Entry Points Comparison:**
- **`build/stdio-server.js`** - STDIO mode for Claude Desktop
- **`build/index.js`** - HTTP mode for web/API integrations  
- **Custom entrypoint** - OpenAPI wrapper for REST compatibility

#### Testing All Modes

**Test STDIO mode:**
```bash
# Test STDIO server responds to MCP protocol
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"clientInfo":{"name":"test","version":"1.0"}}}' | docker run --rm -i mittwald/mcp
```

**Test HTTP mode:**
```bash
# Test HTTP server health
curl http://localhost:3000/health

# Test HTTP MCP endpoint  
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"clientInfo":{"name":"test","version":"1.0"}}}'
```

**Test OpenAPI mode:**
```bash
# Test that the OpenAPI container starts successfully
curl -X GET http://localhost:3000/openapi.json
```

## 🛠️ Available Tools

The server provides 143 tools covering all major Mittwald CLI functionality:

### Application Management (24 tools)
- `mittwald_app_install_wordpress` - Install WordPress
- `mittwald_app_install_shopware6` - Install Shopware 6
- `mittwald_app_install_typo3` - Install TYPO3
- `mittwald_app_list` - List applications
- `mittwald_app_get` - Get application details
- `mittwald_app_update` - Update application
- `mittwald_app_versions` - List available versions
- And 17 more app management tools...

### Database Management (11 tools)
- `mittwald_database_mysql_create` - Create MySQL database
- `mittwald_database_mysql_list` - List MySQL databases
- `mittwald_database_mysql_get` - Get database details
- `mittwald_database_mysql_delete` - Delete database
- `mittwald_database_redis_create` - Create Redis database
- And 6 more database tools...

### Project Management (12 tools)
- `mittwald_project_create` - Create new project
- `mittwald_project_list` - List projects
- `mittwald_project_get` - Get project details
- `mittwald_project_delete` - Delete project
- `mittwald_project_update` - Update project
- And 7 more project tools...

### Domain & DNS Management (7 tools)
- `mittwald_domain_virtualhost_create` - Create virtual host
- `mittwald_domain_dnszone_update` - Update DNS records
- `mittwald_domain_list` - List domains
- And 4 more domain tools...

### Container Management (17 tools)
- `mittwald_container_stack_deploy` - Deploy container stack
- `mittwald_container_list_services` - List container services
- `mittwald_container_logs` - View container logs
- `mittwald_container_restart` - Restart containers
- And 13 more container tools...

### Additional Categories
- **Backup Management**: 8 tools for backup operations
- **Cron Jobs**: 8 tools for scheduled task management
- **Mail Management**: 10 tools for email configuration
- **User Management**: 13 tools for SSH/SFTP users
- **Organization Management**: 3 tools for org operations
- **And more**: Extension, context, and server management tools

## 🏗️ Architecture

This server uses a **CLI Wrapper Architecture** for maximum compatibility:
>>>>>>> origin/main

```
┌─────────────────────────────────────────────────────────┐
│                   MCP Client                            │
│              (Claude, VS Code, etc.)                   │
└────────────────────────┬────────────────────────────────┘
                         │ MCP Protocol + JWT Auth
┌────────────────────────┴────────────────────────────────┐
│                 MCP Server                              │
│                https://mcp.domain.com                  │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │    JWT      │  │   Mittwald  │  │     MCP        │  │
│  │ Validation  │  │ API Client  │  │   Protocol     │  │
│  └─────────────┘  └─────────────┘  └────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ User Management
┌────────────────────────┴────────────────────────────────┐
│               OAuth Server                              │
│              https://auth.domain.com                   │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │  OAuth 2.1  │  │    PKCE     │  │      JWT       │  │
│  │   + PKCE    │  │   Flows     │  │    Issuing     │  │
│  └─────────────┘  └─────────────┘  └────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ User Authentication
┌────────────────────────┴────────────────────────────────┐
│                Mittwald Studio                          │
│            (External OAuth Provider)                    │
└─────────────────────────────────────────────────────────┘
```

### Key Components

- **🔐 OAuth**: OAuth 2.1 with PKCE to obtain user tokens
- **🛠️ CLI Integration**: All tools call `mw ... --token <access_token>`
- **🤖 MCP Server**: HTTPS/SSE transport, tool routing, output parsing
- **🔒 Security**: HTTPS mandatory; no privileged server tokens

## 📋 Development Status

**Current Branch:** `oauth-server-v2` (active development)  
**Status:** Consolidating CLI‑centric architecture  
**Target:** Production-ready OAuth 2.1 + CLI wrapper

### 🏗️ Implementation Roadmap (CLI‑centric)

**Phase 1: OAuth + CLI**  
- [x] Architecture analysis and planning
- [ ] OAuth discovery/authorize/callback (PKCE)
- [ ] Centralized CLI invoker appending `--token`
- [ ] Secure token storage/refresh; single retry on auth errors

**Phase 2: Tooling**  
- [ ] Confirm all handlers call through the centralized invoker
- [ ] Strengthen output parsing and error mapping
- [ ] Concurrency/timeout limits

**Phase 3: Ops**  
- [ ] Containerization and deployment
- [ ] Observability (durations, exit codes)
- [ ] Documentation and migration guide

### 🔧 Quick Development Setup

## 🚀 How to Connect (Production)

Use these canonical endpoints:

- MCP (Resource Server)
  - Base: https://mittwald-mcp-fly2.fly.dev
  - Endpoint: https://mittwald-mcp-fly2.fly.dev/mcp
  - Protected Resource Metadata: https://mittwald-mcp-fly2.fly.dev/.well-known/oauth-protected-resource

- OAuth Authorization Server (AS)
  - Base: https://mittwald-oauth-server.fly.dev
  - AS Metadata: https://mittwald-oauth-server.fly.dev/.well-known/oauth-authorization-server
  - Endpoints: /auth, /token, /jwks, /reg, /token/revocation, /me

MCP clients connect to the MCP endpoint and receive a 401 with a WWW-Authenticate challenge that points to the oauth-server /auth. The browser completes the authorization code + PKCE flow with the oauth-server, and the MCP client exchanges the code for tokens as per the MCP spec.

Notes:
- The MCP server does not host OAuth endpoints; it publishes protected resource metadata at /.well-known/oauth-protected-resource and issues the 401 challenge.
- A compatibility route exists at /.well-known/oauth-authorization-server/mcp to 302-redirect to the AS metadata for clients that probe that path.

## 🔬 Postman Test Suite

We include a Postman collection and environment to validate the full flow:

- Collection: `tests/postman/Mittwald-MCP.postman_collection.json`
- Environment: `tests/postman/Mittwald-MCP.postman_environment.json`

Environment defaults:
- `mcp_base = https://mittwald-mcp-fly2.fly.dev`
- `as_base  = https://mittwald-oauth-server.fly.dev`
- `resource_path = /mcp`

What’s covered:
- MCP health (GET /health)
- MCP protected resource metadata (GET /.well-known/oauth-protected-resource)
- MCP preflight (OPTIONS /mcp) and CORS header exposure
- MCP unauthenticated challenge (POST /mcp → 401)
- OAuth server discovery (AS metadata), JWKS, and /auth without params → 400
- Optional compatibility: Redirect at `/.well-known/oauth-authorization-server/mcp`

Run with newman:
```bash
npx newman run tests/postman/Mittwald-MCP.postman_collection.json \
  -e tests/postman/Mittwald-MCP.postman_environment.json \
  --timeout-request 10000
```

> **Note:** This project intentionally remains CLI‑centric; the `--token` parameter in the `mw` CLI was implemented specifically to support this architecture.

```bash
# Clone the repository
git clone https://github.com/robertDouglass/mittwald-mcp.git
cd mittwald-mcp

# Switch to stable version (optional)
git checkout fly  # Working OAuth proxy implementation

# Or stay on v2 development branch
git checkout oauth-server-v2  # New microservices architecture

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Configure OAuth issuer and client; no PATs used
```

### 🎯 New Architecture Benefits

**Problems Solved:**
- ❌ Eliminates recursive OAuth flows
- ❌ Removes complex proxy state management
- ❌ Fixes mcp-remote connection instability
- ❌ Resolves PKCE conflict resolution issues

**New Capabilities:**
- ✅ Stateless JWT validation
- ✅ Clean microservices separation
- ✅ Standards-compliant OAuth 2.1
- ✅ Scalable deployment architecture
- ✅ Multi-tenant user isolation

## 🛠️ Planned Features

**Target: 140+ Tools** covering all major Mittwald functionality:

### Core Categories
- **🚀 Applications**: WordPress, Shopware, TYPO3 management
- **🗄️ Databases**: MySQL and Redis operations
- **🌐 Domains**: DNS and virtual host configuration
- **📧 Mail**: Email management and delivery
- **👥 Projects**: Project creation and management
- **🔐 Users**: SSH/SFTP and organization management
- **⚙️ Automation**: Cron jobs and backups
- **🐳 Containers**: Stack deployment and management

### Implementation Approach
**v1 (fly branch)**: CLI wrapper pattern  
**v2 (this branch)**: CLI wrapper pattern with OAuth 2.1 + PKCE (per‑command `--token`)

> **Note:** Tool implementations will be migrated from the working `fly` branch during Phase 2.

## 🏗️ New Architecture (v2)

**Microservices OAuth 2.1 Architecture** - Clean separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    MCP Client                           │
│              (Claude, VS Code, etc.)                   │
└────────────────────────┬────────────────────────────────┘
                         │ OAuth 2.1 + JWT
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  OAuth Server                           │
│              (auth.domain.com)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │   OAuth 2.1 │  │    PKCE     │  │      JWT       │  │
│  │     Flow    │  │   Security  │  │    Tokens      │  │
│  └─────────────┘  └─────────────┘  └────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ JWT Validation
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   MCP Server                            │
│               (mcp.domain.com)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │     JWT     │  │  Mittwald   │  │      MCP       │  │
│  │ Validation  │  │ API Client  │  │   Protocol     │  │
│  └─────────────┘  └─────────────┘  └────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ Direct API Calls
┌────────────────────────┴────────────────────────────────┐
│                  Mittwald Platform                      │
│     (Projects, Apps, Databases, Domains, etc.)         │
└─────────────────────────────────────────────────────────┘
```

### Key Improvements

**🔄 From Proxy → Microservices**
- Eliminates complex OAuth proxy logic
- Clean separation between auth and MCP concerns
- Stateless JWT validation

**🛡️ Enhanced Security**
- Standards-compliant OAuth 2.1 with PKCE
- JWT tokens with proper validation
- Multi-tenant user isolation

**⚡ Performance & Reliability**
- No recursive OAuth flows
- Simplified connection management
- Scalable microservices deployment

**🔧 Implementation**
- **OAuth**: Mittwald Studio OAuth 2.1 + PKCE (no client secret)
- **MCP**: Single service orchestrating CLI calls with `--token`
- **Deployment**: Standard container with pinned CLI version

## 📁 Project Structure (v2)

```
mittwald-mcp-v2/
├── packages/
│   ├── oauth-server/                          # Standalone OAuth server
│   │   ├── src/
│   │   │   ├── server.ts                      # OAuth 2.1 server setup
│   │   │   ├── config/                        # OAuth configuration
│   │   │   ├── handlers/                      # OAuth flow handlers
│   │   │   └── middleware/                    # PKCE, JWT middleware
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── mcp-server/                           # MCP protocol server
│       ├── src/
│       │   ├── server.ts                     # MCP server setup
│       │   ├── middleware/
│       │   │   └── jwt-auth.ts               # JWT validation
│       │   ├── handlers/
│       │   │   └── tools/mittwald/           # Direct API tools
│       │   ├── services/
│       │   │   └── mittwald-client.ts        # API client
│       │   └── types/mittwald/               # TypeScript types
│       ├── Dockerfile
│       └── package.json
│
├── docs/
│   ├── ARCHITECTURE.md                       # New architecture guide
│   ├── DEPLOYMENT.md                         # Deployment instructions
│   └── MIGRATION.md                          # v1 → v2 migration guide
│
├── docker-compose.yml                        # Multi-service deployment
├── fly.toml                                  # Fly.io deployment config
└── .env.example                              # Environment configuration
```

### Service Separation

**OAuth Server (`packages/oauth-server/`)**
- OAuth 2.1 authorization flows
- PKCE implementation
- JWT token issuance
- User session management

**MCP Server (`packages/mcp-server/`)**
- MCP protocol handling
- JWT token validation
- Mittwald API integration
- Tool implementations

## 🔧 Development (v2)

### Prerequisites
- Node.js 18+
- Docker and Docker Compose  
- Mittwald account with API access
- Understanding of OAuth 2.1 and JWT

### Development Setup

```bash
# Clone and switch to v2 branch
git clone https://github.com/robertDouglass/mittwald-mcp.git
cd mittwald-mcp
git checkout oauth-server-v2

# Install dependencies (workspace setup)
npm install

# Set up environment for both services
cp .env.example .env
# Configure OAuth and MCP environment variables

# Development mode (both services)
npm run dev:oauth    # Terminal 1: OAuth server
npm run dev:mcp      # Terminal 2: MCP server
```

### Development Commands

```bash
# Workspace commands
npm run build         # Build both services
npm run dev           # Run both services in development
npm run test          # Run all tests
npm run lint          # Lint all packages

# Service-specific commands
npm run oauth:build   # Build OAuth server
npm run mcp:build     # Build MCP server
npm run oauth:dev     # OAuth server development
npm run mcp:dev       # MCP server development
```

### Adding New Tools (v2 Pattern)

1. **Create tool definition** in `packages/mcp-server/src/tools/[tool].ts`
2. **Implement with direct API**:
   ```typescript
   export const handleProjectList: ToolHandler = async (args, context) => {
     // Validate JWT token (automatic via middleware)
     const { mittwaldToken } = context.auth;
     
     // Direct API call
     const response = await mittwaldClient.get('/v2/projects', {
       headers: { Authorization: `Bearer ${mittwaldToken}` }
     });
     
     return {
       success: true,
       data: response.data.projects
     };
   };
   ```
3. **Register tool** in tool registry
4. **Add tests** with JWT mocking

## 📊 Testing

### Test Categories
- **Unit Tests**: Individual tool handler validation
- **Integration Tests**: CLI execution and response parsing
- **Functional Tests**: End-to-end workflow testing
- **Container Tests**: Docker deployment verification

### Running Tests
```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:functional

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment (v2 - Planned)

### Microservices Deployment
```bash
# Build both services
docker-compose build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d

# Scale independently
docker-compose up -d --scale oauth-server=2 --scale mcp-server=3
```

### Fly.io Deployment (Target)
```bash
# Deploy OAuth server
fly deploy --config packages/oauth-server/fly.toml

# Deploy MCP server  
fly deploy --config packages/mcp-server/fly.toml

# Configure custom domains
fly certs create auth.your-domain.com
fly certs create mcp.your-domain.com
```

### Environment Variables (v2)
```bash
# OAuth / Mittwald Studio
OAUTH_ISSUER=https://api.mittwald.de
MITTWALD_CLIENT_ID=mittwald-mcp-server

# Server
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

### Service URLs (Production)
```
OAuth Server:  https://auth.your-domain.com
MCP Server:    https://mcp.your-domain.com
MCP Endpoint:  https://mcp.your-domain.com/mcp
```

## 📖 Documentation

- **[CLI Reference](docs/cli-reference/)**: Complete Mittwald CLI command documentation
- **[Development Guide](docs/development/)**: Development best practices and lessons learned
- **[Architecture Guide](docs/architecture/)**: CLI wrapper architecture details
- **[Container Guide](docs/CONTAINERS.md)**: Container stack management
- **[Testing Guide](tests/README.md)**: Testing strategies and examples

## 🔍 Troubleshooting

### Common Issues

1. **"Project ID is required"**
   - Solution: Provide `projectId` parameter or set context with `mw context set --project-id=<ID>`

2. **"Request failed with status code 404"**
   - Solution: Check account permissions and resource availability

3. **"Command failed"**
   - Solution: Complete OAuth sign-in and check container logs for detailed errors

4. **CLI command not found**
   - Solution: Ensure Mittwald CLI is installed in container (check Dockerfile)

5. **Claude Desktop connection fails**
   - **Container not running**: Start container first with `docker run -d --name mittwald-mcp-container mittwald/mcp`
   - **Access token**: Complete OAuth sign‑in so the server can pass `--token` to the CLI

6. **HTTP mode not responding**
   - **Wrong port**: Ensure container is mapped to port 3000: `-p 3000:3000`
   - **Missing .env file**: Use `--env-file .env` or set environment variables
   - **Wrong endpoint**: Use `http://localhost:3000/mcp` not just `/`
   - **No access token**: Complete OAuth sign‑in so the server can pass `--token` to the CLI

### Debug Mode
```bash
# Enable debug logging
DEBUG=true docker-compose up

# View detailed logs
docker logs mittwald-mcp-container -f
```

## 🤝 Contributing (v2)

Contributions welcome! Please note the architectural changes:

### Development Guidelines
1. **Microservices Pattern**: Separate OAuth and MCP concerns
2. **Direct API Integration**: No CLI wrapper in v2
3. **OAuth 2.1 Compliance**: Follow RFC standards
4. **JWT Security**: Proper token validation
5. **TypeScript**: Full type safety
6. **Testing**: Unit and integration tests

### Contribution Workflow
1. Fork repository
2. Create feature branch from `oauth-server-v2`
3. Follow new architecture patterns
4. Add comprehensive tests
5. Update documentation
6. Submit pull request

### Code Patterns (v2)
- **OAuth Flows**: Use `ts-oauth2-server` patterns
- **API Clients**: Direct HTTP calls with proper error handling  
- **JWT Middleware**: Stateless validation
- **Tool Handlers**: Async/await with proper typing
- **Error Handling**: Structured error responses

## 🙏 Acknowledgments

- [Mittwald](https://mittwald.de) for their comprehensive hosting platform and CLI
- [Anthropic](https://anthropic.com) for the Model Context Protocol specification
- [Model Context Protocol](https://modelcontextprotocol.io) for the protocol standards

---

## 🚀 Ready for Production

This Mittwald MCP Server is production-ready and provides:
- ✅ **143 CLI tools** covering all major Mittwald functionality
- ✅ **Docker containerization** for easy deployment
- ✅ **Comprehensive error handling** with detailed diagnostics
- ✅ **Session management** for multiple concurrent clients
- ✅ **TypeScript type safety** throughout the codebase
- ✅ **Extensive documentation** and examples
- ✅ **Test coverage** for critical functionality

**Questions or Issues?** Please open an issue on GitHub or contact the development team.

Built with ❤️ for the Mittwald hosting platform.
