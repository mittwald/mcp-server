# Tool Coverage Matrix

**Feature**: 015-mittwald-mcp-use-case-research
**Generated**: 2025-01-19
**Total Tools**: 115 | **Covered**: 58 (50.4%)

## Coverage by Case Study

| Tool | Domain | CS-001 | CS-002 | CS-003 | CS-004 | CS-005 | CS-006 | CS-007 | CS-008 | CS-009 | CS-010 | Count |
|------|--------|:------:|:------:|:------:|:------:|:------:|:------:|:------:|:------:|:------:|:------:|:-----:|
| app/copy | apps | | | | ✓ | | | | | | | 1 |
| app/get | apps | | | ✓ | | | | | | | | 1 |
| app/list/upgrade/candidates | apps | | | ✓ | | | | | | | | 1 |
| app/update | apps | | | | ✓ | | | | | | | 1 |
| app/upgrade | apps | | | ✓ | | | | | | | | 1 |
| backup/create | backups | | | ✓ | | | | | | | | 1 |
| backup/get | backups | | | | | | ✓ | | | | | 1 |
| backup/list | backups | | | ✓ | | | ✓ | | | | | 2 |
| backup/schedule/create | backups | | | | | | ✓ | | | | | 1 |
| backup/schedule/list | backups | | | | | | ✓ | | | | | 1 |
| backup/schedule/update | backups | | | | | | ✓ | | | | | 1 |
| certificate/list | domains-mail | ✓ | | | | | | | | ✓ | | 2 |
| certificate/request | certificates | ✓ | | | | | | | | | | 1 |
| container/list | containers | | | | | ✓ | | | | | | 1 |
| context/get/session | context | | | | | | | | | | ✓ | 1 |
| context/set/session | context | | | | | | | | | | ✓ | 1 |
| conversation/create | misc | | ✓ | | | | | | | | | 1 |
| conversation/list | misc | | ✓ | | | | | | | | | 1 |
| conversation/reply | misc | | ✓ | | | | | | | | | 1 |
| cronjob/create | automation | | | | | | | | | | ✓ | 1 |
| cronjob/execute | automation | | | | | | | | | | ✓ | 1 |
| cronjob/execution/list | automation | | | | | | | | | | ✓ | 1 |
| cronjob/list | automation | | | | | | | | | | ✓ | 1 |
| database/mysql/create | databases | | | | ✓ | | | | | | | 1 |
| database/mysql/get | databases | | | ✓ | | | | | ✓ | | | 2 |
| database/mysql/list | databases | | | ✓ | | | | | ✓ | | | 2 |
| database/mysql/user/list | databases | | | | | | | | ✓ | | | 1 |
| database/mysql/versions | databases | | | | | | | | ✓ | | | 1 |
| database/redis/create | databases | | | | | | | | ✓ | | | 1 |
| database/redis/list | databases | | | | | | | | ✓ | | | 1 |
| domain/dnszone/update | domains-mail | ✓ | | | | | | | | | | 1 |
| domain/list | domains-mail | | | | ✓ | | | | | | | 1 |
| domain/virtualhost/create | domains-mail | ✓ | | | ✓ | | | | | | | 2 |
| domain/virtualhost/list | domains-mail | ✓ | | | | | | | | | | 1 |
| mail/address/create | domains-mail | ✓ | | | | | | | | | | 1 |
| mail/address/list | domains-mail | ✓ | | | | | | | | | | 1 |
| mail/deliverybox/create | domains-mail | ✓ | | | | | | | | | | 1 |
| org/get | organization | | ✓ | | | | | | | | | 1 |
| org/invite | organization | | | | | | | ✓ | | | | 1 |
| org/membership/list | organization | | ✓ | | | | | ✓ | | | | 2 |
| project/create | project-foundation | ✓ | | | | | | | | | | 1 |
| project/get | project-foundation | ✓ | | | | | | | | | | 1 |
| project/list | project-foundation | | ✓ | | | | | | | | | 1 |
| project/ssh | project-foundation | | | | ✓ | | | | | | | 1 |
| registry/create | containers | | | | | ✓ | | | | | | 1 |
| registry/list | containers | | | | | ✓ | | | | | | 1 |
| sftp/user/list | sftp | | | | | | | ✓ | | | | 1 |
| ssh/user/create | ssh | | | | | | | ✓ | | | | 1 |
| ssh/user/list | ssh | | | | ✓ | | | ✓ | | | | 2 |
| stack/deploy | containers | | | | | ✓ | | | | | ✓ | 2 |
| stack/list | containers | | | | | ✓ | | | | | | 1 |
| stack/ps | containers | | | | | ✓ | | | | | | 1 |
| user/api/token/get | identity | | | | | | | | | ✓ | | 1 |
| user/api/token/list | identity | | | | | | | | | ✓ | | 1 |
| user/session/list | identity | | | | | | | | | ✓ | | 1 |
| user/ssh/key/create | identity | | | | | | | ✓ | | | | 1 |
| user/ssh/key/list | identity | | | | | | | | | ✓ | | 1 |
| volume/list | containers | | | | | ✓ | | | | | | 1 |

## Coverage Summary by Domain

| Domain | Total Tools | Covered | Coverage % |
|--------|------------|---------|------------|
| apps | 8 | 5 | 62.5% |
| automation | 10 | 4 | 40.0% |
| backups | 8 | 6 | 75.0% |
| certificates | 1 | 1 | 100.0% |
| containers | 10 | 8 | 80.0% |
| context | 3 | 2 | 66.7% |
| databases | 14 | 8 | 57.1% |
| domains-mail | 22 | 9 | 40.9% |
| identity | 13 | 5 | 38.5% |
| misc | 5 | 3 | 60.0% |
| organization | 7 | 3 | 42.9% |
| project-foundation | 12 | 4 | 33.3% |
| sftp | 2 | 1 | 50.0% |
| ssh | 4 | 2 | 50.0% |

## Coverage Gaps (57 Uncovered Tools)

The following tools are NOT referenced in any case study:

### Apps Domain (3 uncovered)
- `app/list` - List all apps in a project
- `app/uninstall` - Uninstall an app
- `app/versions` - List available app versions

### Automation Domain (6 uncovered)
- `cronjob/delete` - Delete a cronjob
- `cronjob/execution/abort` - Abort running execution
- `cronjob/execution/get` - Get execution details
- `cronjob/get` - Get cronjob details
- `cronjob/update` - Update cronjob settings

### Backups Domain (2 uncovered)
- `backup/delete` - Delete a backup
- `backup/schedule/delete` - Delete backup schedule

### Containers Domain (2 uncovered)
- `registry/delete` - Delete a registry
- `registry/update` - Update registry settings
- `stack/delete` - Delete a stack

### Context Domain (1 uncovered)
- `context/reset/session` - Reset session context

### Databases Domain (6 uncovered)
- `database/mysql/delete` - Delete a MySQL database
- `database/mysql/user/create` - Create database user
- `database/mysql/user/delete` - Delete database user
- `database/mysql/user/get` - Get database user details
- `database/mysql/user/update` - Update database user
- `database/redis/get` - Get Redis details
- `database/redis/versions` - List Redis versions

### Domains-Mail Domain (13 uncovered)
- `domain/dnszone/get` - Get DNS zone details
- `domain/dnszone/list` - List DNS zones
- `domain/get` - Get domain details
- `domain/virtualhost/delete` - Delete virtual host
- `domain/virtualhost/get` - Get virtual host details
- `mail/address/delete` - Delete mail address
- `mail/address/get` - Get mail address details
- `mail/address/update` - Update mail address
- `mail/deliverybox/delete` - Delete deliverybox
- `mail/deliverybox/get` - Get deliverybox details
- `mail/deliverybox/list` - List deliveryboxes
- `mail/deliverybox/update` - Update deliverybox

### Identity Domain (8 uncovered)
- `user/api/token/create` - Create API token
- `user/api/token/revoke` - Revoke API token
- `user/get` - Get user profile
- `user/session/get` - Get session details
- `user/ssh/key/delete` - Delete SSH key
- `user/ssh/key/get` - Get SSH key details
- `user/ssh/key/import` - Import SSH key

### Misc Domain (2 uncovered)
- `conversation/categories` - List conversation categories
- `conversation/show` - Show conversation details

### Organization Domain (4 uncovered)
- `org/invite/list` - List organization invites
- `org/invite/revoke` - Revoke organization invite
- `org/list` - List all organizations
- `org/membership/revoke` - Revoke membership

### Project-Foundation Domain (8 uncovered)
- `project/delete` - Delete a project
- `project/invite/get` - Get project invite
- `project/invite/list` - List project invites
- `project/membership/get` - Get project membership
- `project/membership/list` - List project memberships
- `project/update` - Update project settings
- `server/get` - Get server details
- `server/list` - List all servers

### SFTP Domain (1 uncovered)
- `sftp/user/delete` - Delete SFTP user

### SSH Domain (2 uncovered)
- `ssh/user/delete` - Delete SSH user
- `ssh/user/update` - Update SSH user

## Gap Analysis

The uncovered tools fall into predictable categories:

1. **Delete Operations** (13 tools): Intentionally omitted from tutorials as destructive operations
2. **Single-Item Get Operations** (12 tools): List operations are more valuable in tutorials
3. **Update Operations** (8 tools): Create operations demonstrate the same concepts
4. **Administrative Tools** (6 tools): Server management, org listing less common in tutorials
5. **Revoke/Abort Operations** (5 tools): Cleanup operations not central to workflows

### Recommendation

The 50.4% coverage is appropriate for tutorial documentation because:
- Case studies demonstrate realistic workflows, not tool inventories
- Delete/revoke operations shouldn't be encouraged in tutorials
- Each domain has at least one representative tool covered
- All 14 domains are represented in the case studies
