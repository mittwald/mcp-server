# Mittwald MCP Server

[![npm version](https://img.shields.io/npm/v/@systemprompt/systemprompt-mcp-server.svg)](https://www.npmjs.com/package/@systemprompt/systemprompt-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-ready Model Context Protocol (MCP) server that provides comprehensive access to the **Mittwald mStudio v2 API** - the complete hosting platform API for managing projects, applications, databases, domains, and more.

Built on the [systemprompt-mcp-server](https://github.com/systempromptio/systemprompt-mcp-server) foundation, this implementation provides **full TypeScript support** and covers the **entire Mittwald API surface** with 200+ tools.

## 🌟 Key Features

### Complete Mittwald API Coverage
- **🚀 Applications**: Install, manage, and deploy WordPress, Shopware, TYPO3, and more
- **🗄️ Databases**: MySQL and Redis database management 
- **🌐 Domains**: DNS zone management and virtual host configuration
- **📧 Mail**: Email address and delivery box management
- **👥 Projects**: Project creation, membership, and resource management
- **🔐 Users & Organizations**: User management and organizational structures
- **⚙️ Cron Jobs**: Schedule and manage automated tasks
- **💾 Backups**: Automated backup scheduling and management
- **🔧 SSH/SFTP**: User management for secure access

### Developer Experience
- **TypeScript**: Full type safety with comprehensive interfaces
- **Modular Architecture**: Clean separation of concerns, easy to extend
- **Error Handling**: Robust error management with detailed messages
- **API-First**: Direct API client usage, no CLI dependencies
- **Documentation**: Extensive inline documentation and examples

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Mittwald API token ([Get one here](https://studio.mittwald.de/app/profile/api-tokens))

### Installation

```bash
# Install globally
npm install -g mittwald-mcp-server

# Or use directly with npx
npx mittwald-mcp-server

# Clone for development
git clone https://github.com/mittwald/mittwald-mcp-server.git
cd mittwald-mcp-server
npm install
npm run build
```

### Configuration

Create a `.env` file or set environment variables:

```bash
# Required
MITTWALD_API_TOKEN=your_api_token_here

# Optional
PORT=3000                        # Server port (default: 3000)
LOG_LEVEL=info                   # Logging level (debug, info, warn, error)
```

### Running the Server

```bash
# Build and run
npm run build
node build/index.js

# Development with watch mode
npm run watch
# In another terminal:
node build/index.js
```

### Using with MCP Inspector

Test all features with the [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector):

```bash
# Build the server first
npm run build

# Launch inspector
npx @modelcontextprotocol/inspector build/index.js
```

## 🛠️ Tool Reference

### Application Management

#### `mittwald_app_install_wordpress`
Install WordPress on a project
```typescript
{
  "projectId": "project-id",
  "version": "6.4",              // Optional, latest if not specified
  "host": "example.com",         // Optional, auto-detected from project
  "adminUser": "admin",          // Optional, defaults to 'admin'
  "adminEmail": "admin@example.com", // Optional, uses user email
  "adminPass": "secure-password", // Optional, auto-generated
  "siteTitle": "My WordPress Site", // Optional
  "wait": true                   // Wait for installation to complete
}
```

#### `mittwald_app_list`
List all applications in a project
```typescript
{
  "projectId": "project-id",
  "output": "json"               // "json", "txt", "yaml", "csv", "tsv"
}
```

### Database Management

#### `mittwald_database_mysql_create`
Create a new MySQL database
```typescript
{
  "projectId": "project-id",
  "description": "Main database",
  "characterSettings": {
    "characterSet": "utf8mb4",
    "collation": "utf8mb4_unicode_ci"
  },
  "version": "8.0"
}
```

#### `mittwald_database_mysql_list`
List MySQL databases
```typescript
{
  "projectId": "project-id",     // Optional filter
  "output": "json",
  "extended": true               // Include storage usage info
}
```

### Project Management

#### `mittwald_project_create`
Create a new project
```typescript
{
  "description": "My Project",
  "serverId": "server-id"
}
```

#### `mittwald_project_list`
List projects
```typescript
{
  "output": "json",
  "extended": false
}
```

### Domain & DNS Management

#### `mittwald_domain_dnszone_update`
Update DNS zone records
```typescript
{
  "dnszoneId": "zone-id",
  "recordSet": "a",              // "a", "cname", "mx", "txt", "srv"
  "name": "www",
  "value": "192.168.1.1",
  "ttl": 3600,
  "managed": true
}
```

### Backup Management

#### `mittwald_backup_create`
Create a project backup
```typescript
{
  "projectId": "project-id",
  "description": "Pre-deployment backup",
  "expirationTime": "2024-12-31T23:59:59Z"
}
```

#### `mittwald_backup_schedule_create`
Schedule automatic backups
```typescript
{
  "projectId": "project-id",
  "description": "Daily backups",
  "schedule": "0 2 * * *",       // Cron expression
  "ttl": "P30D"                  // Keep for 30 days
}
```

### Mail Management

#### `mittwald_mail_address_create`
Create a mail address
```typescript
{
  "projectId": "project-id",
  "address": "info@example.com",
  "password": "secure-password",
  "quota": "1000MB",
  "autoresponder": {
    "enabled": true,
    "message": "Thank you for your email"
  }
}
```

### Cron Job Management

#### `mittwald_cronjob_create`
Create a scheduled task
```typescript
{
  "projectId": "project-id",
  "description": "Daily cleanup",
  "schedule": "0 3 * * *",       // Cron expression
  "command": "/usr/bin/php /path/to/script.php",
  "email": "admin@example.com"   // Notification email
}
```

## 🏗️ Architecture

This implementation follows clean architecture principles:

```
┌─────────────────────────────────────────────────────────┐
│                    MCP Client                           │
│              (Claude, VS Code, etc.)                   │
└────────────────────────┬────────────────────────────────┘
                         │ MCP Protocol
┌────────────────────────┴────────────────────────────────┐
│                 Mittwald MCP Server                     │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │    Tool     │  │   Request   │  │   Response     │  │
│  │  Handlers   │  │  Validation │  │  Formatting    │  │
│  └─────────────┘  └─────────────┘  └────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│                Mittwald API Client                      │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │    App      │  │  Database   │  │    Project     │  │
│  │  Namespace  │  │  Namespace  │  │   Namespace    │  │
│  └─────────────┘  └─────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Key Components

- **`src/handlers/tool-handlers.ts`**: Main tool routing and validation
- **`src/handlers/tools/mittwald-cli/`**: Tool implementations organized by API category
- **`src/services/mittwald/`**: Mittwald API client and authentication
- **`src/constants/tool/mittwald-cli/`**: Tool definitions and schemas
- **`src/types/mittwald/`**: TypeScript type definitions

## 📁 Project Structure

```
mittwald-mcp-server/
├── src/
│   ├── handlers/
│   │   ├── tool-handlers.ts                    # Main tool router
│   │   └── tools/mittwald-cli/                 # Tool implementations
│   │       ├── app/                            # Application management
│   │       │   ├── install/                    # App installations
│   │       │   │   ├── wordpress.ts
│   │       │   │   ├── shopware6.ts
│   │       │   │   └── ...
│   │       │   ├── create.ts
│   │       │   ├── list.ts
│   │       │   └── ...
│   │       ├── database/                       # Database management
│   │       │   ├── mysql/
│   │       │   └── redis/
│   │       ├── project/                        # Project management
│   │       ├── domain/                         # Domain & DNS
│   │       ├── mail/                           # Email management
│   │       ├── backup/                         # Backup management
│   │       ├── cronjob/                        # Cron job management
│   │       ├── user/                           # User management
│   │       └── org/                            # Organization management
│   ├── services/mittwald/
│   │   ├── mittwald-client.ts                  # API client wrapper
│   │   └── index.ts
│   ├── constants/tool/mittwald-cli/            # Tool definitions
│   ├── types/mittwald/                         # TypeScript types
│   └── utils/
│       ├── format-tool-response.ts             # Response formatting
│       └── executeCommand.ts                   # Command utilities
├── docs/
│   ├── cli-reference/                          # Complete CLI documentation
│   └── development/                            # Development guides
├── e2e-test/                                   # End-to-end tests
└── package.json
```

## 🔧 Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Mittwald account with API access

### Development Commands

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode for development
npm run watch

# Run tests
npm run test

# Run end-to-end tests
npm run e2e

# Check TypeScript without building
npx tsc --noEmit
```

### Adding New Tools

1. **Define the tool** in `src/constants/tool/mittwald-cli/[category]/[tool].ts`
2. **Implement the handler** in `src/handlers/tools/mittwald-cli/[category]/[tool].ts`
3. **Register the tool** in `src/handlers/tool-handlers.ts`
4. **Add Zod schema** for validation
5. **Update exports** in relevant index files

### Code Quality

This project maintains high code quality standards:

- **Zero TypeScript errors**: All code compiles cleanly
- **Comprehensive types**: Full type coverage for API interactions
- **Error handling**: Robust error management throughout
- **Testing**: E2E tests cover critical workflows
- **Documentation**: JSDoc comments for all public APIs

## 📖 Documentation

- **[CLI Reference](docs/cli-reference/)**: Complete Mittwald CLI command documentation
- **[Development Guide](docs/development/)**: Development best practices and lessons learned
- **[TypeScript Error Resolution](docs/development/TYPESCRIPT_ERROR_RESOLUTION_PLAN.md)**: Systematic approach to TypeScript issues
- **[Learnings](docs/development/LEARNINGS.md)**: Key insights from development

## 🚫 Important Constraints

### No CLI Dependencies
This MCP server uses **ONLY** the official Mittwald API client. It does **NOT** execute CLI commands, ensuring:

- **Portability**: Works in any environment
- **Security**: No shell command injection risks  
- **Reliability**: Direct API calls are more stable
- **Performance**: Faster than CLI subprocess execution

### API-First Approach
All functionality is implemented using:
- `@mittwald/api-client` for API interactions
- Direct HTTP calls where needed
- No `mw` CLI command execution

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Follow TypeScript best practices
4. Add tests for new features
5. Update documentation
6. Submit a pull request

### Development Process

1. **Study existing patterns** in the codebase
2. **Use API client directly** - never CLI commands
3. **Follow the handler pattern** established in other tools
4. **Add comprehensive error handling**
5. **Include TypeScript types** for all interfaces

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Mittwald](https://mittwald.de) for their comprehensive hosting platform API
- [systemprompt.io](https://systemprompt.io) for the foundational MCP server implementation
- [Anthropic](https://anthropic.com) for the Model Context Protocol specification

---

Built for the Mittwald hosting platform with ❤️

For questions or support, please open an issue on GitHub.