# Research: MCP Functional Test Suite

**Date**: 2025-12-04
**Feature**: 005-mcp-functional-test

## Tool Discovery Summary

**Total MCP Tools**: 176 CLI tool files discovered
**Excluded Tools**: 2 (mittwald_login_reset, mittwald_login_token - security/multi-tenancy)
**Active Tools**: ~174

### Tool Categories by Domain

| Domain | Count | Description |
|--------|-------|-------------|
| app | 28 | App creation, installation, management |
| backup | 9 | Project backup operations |
| container | 9 | Container lifecycle management |
| context | 7 | Local environment context |
| conversation | 6 | Support ticket management |
| cronjob | 10 | Scheduled job management |
| database | 24 | MySQL and Redis databases |
| ddev | 2 | Local development integration |
| domain | 7 | Domain and DNS management |
| extension | 4 | Organization extensions |
| login | 3 | Authentication (2 excluded) |
| mail | 10 | Email addresses and deliveryboxes |
| org | 9 | Organization management |
| project | 14 | Project lifecycle management |
| registry | 4 | Container registries |
| server | 2 | Server read operations |
| sftp | 4 | SFTP user management |
| ssh | 4 | SSH user management |
| stack | 4 | Container stack deployment |
| user | 11 | User account and keys |
| volume | 3 | Volume management |

## Mittwald API Architecture

### Resource Hierarchy (from developer.mittwald.de)

```
Organization
├── Server (shared resource pool)
│   └── Project (multiple per server)
│       ├── App Installations
│       ├── Containers / Stacks
│       ├── Databases (MySQL, Redis)
│       ├── Cronjobs
│       ├── Domains / Virtualhosts
│       ├── Mail Addresses / Deliveryboxes
│       ├── SSH/SFTP Users
│       ├── Volumes
│       └── Backups
└── Standalone Project (proSpace - direct billing)
```

### Key API Behaviors

1. **Eventual Consistency**: POST/PUT/PATCH/DELETE operations may not be immediately reflected in GET requests
2. **Polling Required**: Use 30-second polling intervals to detect async operation completion
3. **Rate Limiting**: Headers `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Dependency Chains for Testing

### Tier 0: Foundational (No Prerequisites)

These tools can be tested without any existing resources:

```
user/get                    # Read own profile
user/api-token/list         # List own tokens
user/api-token/create       # Create API token
user/session/list           # List sessions
user/ssh-key/list           # List SSH keys
login/status                # Check auth status
context/get                 # Read local context
context/reset               # Clear local context
org/list                    # List accessible orgs
server/list                 # List accessible servers
```

### Tier 1: Organization-Level

**Requires**: Existing organization access

```
org/get                     # Read org details
org/invite                  # Invite users
org/invite-list             # List invites
org/membership-list         # List members
extension/list              # List available extensions
extension/install           # Install org extension
```

### Tier 2: Server-Level

**Requires**: Existing server access

```
server/get                  # Read server details
```

### Tier 3: Project Creation

**Requires**: Server ID (server-based) OR Billing auth (proSpace)

```
project/create              # Create new project (CLEAN-ROOM TEST)
project/list                # List projects
```

### Tier 4: Project-Level Operations

**Requires**: Existing project

All remaining tools require a project context. Sub-grouped by functional domain:

#### 4a. Project Management
```
project/get
project/update
project/delete
project/filesystem-usage
project/ssh
project/invite-*
project/membership-*
```

#### 4b. App Management
```
app/versions                # List available app types (no project needed)
app/create/*                # Create custom apps (node, php, python, static)
app/install/*               # Install managed apps (wordpress, typo3, etc.)
app/list                    # List installed apps
app/get
app/update
app/upgrade
app/copy
app/upload
app/download
app/ssh
app/uninstall
app/dependency-*
```

#### 4c. Container/Stack Management
```
volume/create               # Create volume (needed for some containers)
volume/list
volume/delete
registry/create             # Create private registry
registry/list
container/run               # Run container
container/list-services
container/logs
container/start/stop/restart/recreate
container/update
container/delete
stack/deploy                # Deploy docker-compose
stack/list
stack/ps
stack/delete
```

#### 4d. Database Management
```
database/list
database/mysql/versions
database/mysql/create
database/mysql/list
database/mysql/get
database/mysql/user-create
database/mysql/user-list
database/mysql/dump
database/mysql/import
database/mysql/shell
database/mysql/phpmyadmin
database/mysql/delete
database/redis/versions
database/redis/create
database/redis/list
database/redis/get
```

#### 4e. Domain/Mail Management
```
domain/list
domain/get
domain/virtualhost-create
domain/virtualhost-list
domain/dnszone-*
mail/address/create
mail/address/list
mail/deliverybox/create
mail/deliverybox/list
```

#### 4f. Access Management
```
sftp/user-create
sftp/user-list
ssh/user-create
ssh/user-list
```

#### 4g. Automation
```
cronjob/create
cronjob/list
cronjob/execute
cronjob/execution-*
```

#### 4h. Backup Management
```
backup/schedule-create
backup/create
backup/list
backup/get
backup/download
backup/delete
```

## Test Domain Groupings

Based on dependency analysis, tests should be grouped into these functional domains for resource sharing and cleanup:

### Domain 1: Identity (Clean-room, no cleanup needed)
- user/*, login/status, context/*
- **Cleanup**: None (read-only or local state)

### Domain 2: Organization (Minimal cleanup)
- org/*, extension/*
- **Cleanup**: Revoke invites, uninstall extensions

### Domain 3: Project Foundation (Heavy cleanup)
- project/create (CLEAN-ROOM)
- project/*, server/*
- **Cleanup**: Delete test projects

### Domain 4: Apps (Grouped cleanup)
- app/create/*, app/install/*, app/*
- **Cleanup**: Uninstall apps

### Domain 5: Containers (Grouped cleanup)
- volume/*, registry/*, container/*, stack/*
- **Cleanup**: Delete stacks → containers → registries → volumes

### Domain 6: Databases (Grouped cleanup)
- database/mysql/*, database/redis/*
- **Cleanup**: Delete databases

### Domain 7: Domains & Mail (Grouped cleanup)
- domain/*, mail/*
- **Cleanup**: Delete mail addresses → virtualhosts

### Domain 8: Access Users (Grouped cleanup)
- sftp/*, ssh/*
- **Cleanup**: Delete users

### Domain 9: Automation (Grouped cleanup)
- cronjob/*
- **Cleanup**: Delete cronjobs

### Domain 10: Backups (Grouped cleanup)
- backup/*
- **Cleanup**: Delete backups → schedules

## Research Decisions

### Decision 1: Tool Discovery Method
**Chosen**: Dynamic discovery from MCP server at runtime
**Rationale**: Always reflects actual deployed state; tools are scanned from `src/constants/tool/mittwald-cli/`
**Alternatives**: Static JSON manifest (rejected - would require maintenance)

### Decision 2: Dependency Grouping Strategy
**Chosen**: 10 functional domains based on resource lifecycle
**Rationale**: Balances test isolation with efficiency; enables grouped cleanup
**Alternatives**: Per-tool cleanup (rejected - too slow); flat parallel (rejected - dependency conflicts)

### Decision 3: Clean-Room Test Identification
**Chosen**: Only `project/create` requires true clean-room testing
**Rationale**: Most operations can use harness-created resources; project creation is the critical foundation
**Alternatives**: All creation operations clean-room (rejected - too slow)

### Decision 4: Test Execution Order
**Chosen**: Domain-based with dependency ordering
**Rationale**:
1. Identity (Tier 0) - parallel, no dependencies
2. Organization (Tier 1) - requires org access
3. Project Foundation (Tier 3) - creates project for subsequent tests
4. Project-level domains (Tier 4) - parallel within domain, sequential across domains with shared project

### Decision 5: Resource Naming Convention
**Chosen**: `test-{domain}-{timestamp}-{random4}`
**Example**: `test-apps-20251204-a3f9`
**Rationale**: Prevents parallel test conflicts; enables cleanup identification
