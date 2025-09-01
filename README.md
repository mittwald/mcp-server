# Mittwald MCP Server

A production-ready Model Context Protocol (MCP) server that provides comprehensive access to the **Mittwald hosting platform** through the official Mittwald CLI. This server acts as a bridge between MCP clients (like Claude) and the Mittwald infrastructure management platform.

## 🌟 Key Features

### Complete Mittwald CLI Integration
- **🚀 Applications**: Install, manage, and deploy WordPress, Shopware, TYPO3, and more
- **🗄️ Databases**: MySQL and Redis database creation and management
- **🌐 Domains**: DNS zone management and virtual host configuration
- **📧 Mail**: Email address and delivery box management
- **👥 Projects**: Project creation, membership, and resource management
- **🔐 Users & Organizations**: User management and organizational structures
- **⚙️ Cron Jobs**: Schedule and manage automated tasks
- **💾 Backups**: Automated backup scheduling and management
- **🔧 SSH/SFTP**: User management for secure access
- **🐳 Containers**: Container stack management and deployment

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

```
┌─────────────────────────────────────────────────────────┐
│                    MCP Client                           │
│              (Claude, VS Code, etc.)                   │
└────────────────────────┬────────────────────────────────┘
                         │ MCP Protocol (HTTP/STDIO)
┌────────────────────────┴────────────────────────────────┐
│                 Mittwald MCP Server                     │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │    Tool     │  │   Session   │  │   Response     │  │
│  │  Handlers   │  │  Management │  │  Formatting    │  │
│  └─────────────┘  └─────────────┘  └────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ CLI Execution
┌────────────────────────┴────────────────────────────────┐
│               Official Mittwald CLI                     │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │    App      │  │  Database   │  │    Project     │  │
│  │  Commands   │  │  Commands   │  │   Commands     │  │
│  └─────────────┘  └─────────────┘  └────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ Mittwald API
┌────────────────────────┴────────────────────────────────┐
│                  Mittwald Platform                      │
│     (Projects, Apps, Databases, Domains, etc.)         │
└─────────────────────────────────────────────────────────┘
```

### Key Components

- **CLI Wrapper**: Executes `mw` CLI commands via `src/utils/cli-wrapper.ts`
- **Tool Handlers**: Process MCP requests and format CLI commands
- **Session Management**: Handles multiple concurrent MCP client sessions
- **Error Handling**: Comprehensive error processing and user-friendly messages
- **Docker Container**: Includes pre-installed Mittwald CLI

## 🎯 Why CLI Wrapper Approach?

### Advantages
✅ **Maximum Compatibility**: Uses official Mittwald CLI for 100% API compatibility  
✅ **Automatic Updates**: Benefits from CLI updates without code changes  
✅ **Proven Stability**: Leverages battle-tested CLI implementation  
✅ **Comprehensive Coverage**: Access to all CLI features immediately  
✅ **Error Messages**: Users get CLI's polished, user-tested error messages  

### Design Philosophy
- **Reliability**: CLI is Mittwald's primary interface, ensuring long-term stability
- **Maintainability**: Less code to maintain compared to direct API implementation
- **User Experience**: Consistent behavior with what users expect from CLI
- **Future-Proof**: Automatically supports new CLI features and API changes

## 📁 Project Structure

```
mittwald-mcp-server/
├── src/
│   ├── handlers/
│   │   ├── tool-handlers.ts                    # Main tool router
│   │   └── tools/mittwald-cli/                 # CLI tool handlers
│   │       ├── app/                            # Application management
│   │       ├── database/                       # Database management
│   │       ├── project/                        # Project management
│   │       ├── domain/                         # Domain & DNS
│   │       ├── container/                      # Container management
│   │       └── ...                             # Other categories
│   ├── constants/tool/mittwald-cli/            # Tool definitions
│   ├── utils/
│   │   ├── cli-wrapper.ts                      # CLI execution wrapper
│   │   └── format-tool-response.ts             # Response formatting
│   ├── server/
│   │   ├── mcp.ts                              # MCP protocol handler
│   │   └── config.ts                           # Server configuration
│   ├── types/mittwald/                         # TypeScript types
│   └── index.ts                                # Main entry point
├── docs/
│   ├── cli-reference/                          # Complete CLI documentation
│   ├── development/                            # Development guides
│   └── architecture/                           # Architecture documentation
├── tests/                                      # Test suites
├── Dockerfile                                  # Container configuration
├── docker-compose.yml                          # Docker Compose setup
└── .env.example                                # Environment configuration
```

## 🔧 Development

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- Mittwald account with API access

### Development Setup

```bash
# Clone the repository
git clone https://github.com/robertDouglass/mittwald-mcp.git
cd mittwald-mcp

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API token

# Build TypeScript
npm run build

# Run in development mode
npm run watch
# In another terminal:
node build/index.js
```

### Development Commands

```bash
# Build the project
npm run build

# Watch mode for development
npm run watch

# Run tests
npm run test

# Run functional tests
npm run test:functional

# Build and run Docker container
docker-compose up --build

# Run MCP Inspector for testing
npm run inspector
```

### Adding New Tools

1. **Create tool definition** in `src/constants/tool/mittwald-cli/[category]/[tool]-cli.ts`
2. **Implement handler** in `src/handlers/tools/mittwald-cli/[category]/[tool]-cli.ts`
3. **Use CLI wrapper pattern**:
   ```typescript
   export const handleMyTool: MittwaldToolHandler<MyArgs> = async (args) => {
     const cliArgs = ['my', 'command', '--flag', args.value];
     const result = await executeCli('mw', cliArgs, {
       env: { MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN }
     });
     
     if (result.exitCode !== 0) {
       return formatToolResponse("error", result.stderr);
     }
     
     return formatToolResponse("success", "Operation completed", result.stdout);
   };
   ```

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

## 🚀 Deployment

### Docker Deployment (Recommended)
```bash
# Build and run
docker-compose up -d

# Scale for multiple instances
docker-compose up -d --scale mittwald-mcp=3

# Check logs
docker-compose logs -f
```

### Manual Deployment
```bash
# Build the project
npm run build

# Run with PM2 (production)
pm2 start build/index.js --name mittwald-mcp

# Or run directly
node build/index.js
```

### Environment Variables
```bash
# Required
MITTWALD_API_TOKEN=your_api_token_here

# Optional
PORT=3000                        # Server port
DISABLE_OAUTH=true               # Disable OAuth (recommended)
LOG_LEVEL=info                   # Logging level
DEBUG=false                      # Debug mode

# Tool filtering (optional)
TOOL_FILTER_ENABLED=false        # Enable tool filtering
MAX_TOOLS_PER_RESPONSE=50        # Max tools per response
ALLOWED_TOOL_CATEGORIES=app,project,database  # Allowed categories
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
   - Solution: Verify API token and check container logs for detailed errors

4. **CLI command not found**
   - Solution: Ensure Mittwald CLI is installed in container (check Dockerfile)

5. **Claude Desktop connection fails (STDIO mode)**
   - **Missing `-i` flag**: Ensure `docker exec -i` includes the interactive flag
   - **Wrong entry point**: Use `build/stdio-server.js` not `build/index.js`
   - **Container not running**: Start container first with `docker run -d --name mittwald-mcp-container mittwald/mcp`
   - **Environment variables**: Ensure `MITTWALD_API_TOKEN` is set in Claude Desktop config

6. **HTTP mode not responding**
   - **Wrong port**: Ensure container is mapped to port 3000: `-p 3000:3000`
   - **Missing .env file**: Use `--env-file .env` or set environment variables
   - **Wrong endpoint**: Use `http://localhost:3000/mcp` not just `/`

### Debug Mode
```bash
# Enable debug logging
DEBUG=true docker-compose up

# View detailed logs
docker logs mittwald-mcp-container -f
```

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Follow the CLI wrapper pattern
4. Add tests for new functionality
5. Update documentation
6. Submit a pull request

### Development Guidelines
- Use the established CLI wrapper pattern
- Follow TypeScript best practices
- Add comprehensive error handling
- Include JSDoc documentation
- Write tests for new features

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
