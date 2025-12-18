# Tier Classification Analysis

**Generated**: 2025-12-18
**Feature**: 013-agent-based-mcp-tool-evaluation
**Total Tools**: 115

## Tier Distribution

| Tier | Description | Tool Count | Percentage |
|------|-------------|------------|------------|
| 0 | No dependencies | 17 | 15% |
| 1 | Organization-level | 6 | 5% |
| 2 | Server-level | 1 | 1% |
| 3 | Project creation | 5 | 4% |
| 4 | Requires project | 86 | 75% |

**Total**: 115 tools

## Tier Definitions

### Tier 0: No Dependencies (17 tools)
Tools that can be executed without any prerequisite resources. These are foundational operations.

**Examples**:
- context/get/session
- context/reset/session
- context/set/session
- org/list
- server/list
- user/api/token/create
- user/api/token/get
- user/api/token/list
- user/api/token/revoke
- user/get

### Tier 1: Organization-Level (6 tools)
Tools that operate on organization resources but don't require server or project context.

**Examples**:
- org/get
- org/invite
- org/invite/list
- org/invite/revoke
- org/membership/list
- org/membership/revoke

### Tier 2: Server-Level (1 tools)
Tools that operate on server resources.

**Examples**:
- server/get

### Tier 3: Project Creation (5 tools)
Tools for project lifecycle management (create, list, get, update, delete).

**Examples**:
- project/create
- project/delete
- project/get
- project/list
- project/update

### Tier 4: Requires Project (86 tools)
Tools that require an existing project context. This includes apps, databases, backups, etc.

**Examples**:
- app/copy
- app/get
- app/list
- app/list/upgrade/candidates
- app/uninstall
- app/update
- app/upgrade
- app/versions
- backup/create
- backup/delete

## Complete Tool List by Tier

### Tier 0: 17 tools
- context/get/session (context)
- context/reset/session (context)
- context/set/session (context)
- org/list (organization)
- server/list (project-foundation)
- user/api/token/create (identity)
- user/api/token/get (identity)
- user/api/token/list (identity)
- user/api/token/revoke (identity)
- user/get (identity)
- user/session/get (identity)
- user/session/list (identity)
- user/ssh/key/create (identity)
- user/ssh/key/delete (identity)
- user/ssh/key/get (identity)
- user/ssh/key/import (identity)
- user/ssh/key/list (identity)

### Tier 1: 6 tools
- org/get (organization)
- org/invite (organization)
- org/invite/list (organization)
- org/invite/revoke (organization)
- org/membership/list (organization)
- org/membership/revoke (organization)

### Tier 2: 1 tools
- server/get (project-foundation)

### Tier 3: 5 tools
- project/create (project-foundation)
- project/delete (project-foundation)
- project/get (project-foundation)
- project/list (project-foundation)
- project/update (project-foundation)

### Tier 4: 86 tools
- app/copy (apps)
- app/get (apps)
- app/list (apps)
- app/list/upgrade/candidates (apps)
- app/uninstall (apps)
- app/update (apps)
- app/upgrade (apps)
- app/versions (apps)
- backup/create (backups)
- backup/delete (backups)
- backup/get (backups)
- backup/list (backups)
- backup/schedule/create (backups)
- backup/schedule/delete (backups)
- backup/schedule/list (backups)
- backup/schedule/update (backups)
- certificate/list (domains-mail)
- certificate/request (certificates)
- container/list (containers)
- conversation/categories (misc)
- conversation/create (misc)
- conversation/list (misc)
- conversation/reply (misc)
- conversation/show (misc)
- cronjob/create (automation)
- cronjob/delete (automation)
- cronjob/execute (automation)
- cronjob/execution/abort (automation)
- cronjob/execution/get (automation)
- cronjob/execution/list (automation)
- cronjob/get (automation)
- cronjob/list (automation)
- cronjob/update (automation)
- database/mysql/create (databases)
- database/mysql/delete (databases)
- database/mysql/get (databases)
- database/mysql/list (databases)
- database/mysql/user/create (databases)
- database/mysql/user/delete (databases)
- database/mysql/user/get (databases)
- database/mysql/user/list (databases)
- database/mysql/user/update (databases)
- database/mysql/versions (databases)
- database/redis/create (databases)
- database/redis/get (databases)
- database/redis/list (databases)
- database/redis/versions (databases)
- domain/dnszone/get (domains-mail)
- domain/dnszone/list (domains-mail)
- domain/dnszone/update (domains-mail)
- domain/get (domains-mail)
- domain/list (domains-mail)
- domain/virtualhost/create (domains-mail)
- domain/virtualhost/delete (domains-mail)
- domain/virtualhost/get (domains-mail)
- domain/virtualhost/list (domains-mail)
- mail/address/create (domains-mail)
- mail/address/delete (domains-mail)
- mail/address/get (domains-mail)
- mail/address/list (domains-mail)
- mail/address/update (domains-mail)
- mail/deliverybox/create (domains-mail)
- mail/deliverybox/delete (domains-mail)
- mail/deliverybox/get (domains-mail)
- mail/deliverybox/list (domains-mail)
- mail/deliverybox/update (domains-mail)
- project/invite/get (project-foundation)
- project/invite/list (project-foundation)
- project/membership/get (project-foundation)
- project/membership/list (project-foundation)
- project/ssh (project-foundation)
- registry/create (containers)
- registry/delete (containers)
- registry/list (containers)
- registry/update (containers)
- sftp/user/delete (sftp)
- sftp/user/list (sftp)
- ssh/user/create (ssh)
- ssh/user/delete (ssh)
- ssh/user/list (ssh)
- ssh/user/update (ssh)
- stack/delete (containers)
- stack/deploy (containers)
- stack/list (containers)
- stack/ps (containers)
- volume/list (containers)
