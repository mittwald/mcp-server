# Tier Analysis: Mittwald MCP Tools

**Generated**: 2025-12-16T15:41:43.534Z
**Total Tools**: 175

## Tier Distribution

| Tier | Description | Tools | % | Domains |
|------|-------------|-------|---|---------|
| 0 | No prerequisites - can execute immediately | 21 | 12.0% | identity, organization, project-foundation |
| 1 | Organization-level - requires authenticated user context | 12 | 6.9% | organization |
| 2 | Server-level - requires access to a server | 1 | 0.6% | project-foundation |
| 3 | Project creation - creates project resources | 1 | 0.6% | project-foundation |
| 4 | Project-dependent - requires existing project/resources | 140 | 80.0% | apps, backups, domains-mail, containers, misc, automation, databases, identity, project-foundation, access-users |

## Tier Details

### Tier 0: No prerequisites - can execute immediately

**Tool Count**: 21 (12.0%)

**Execution Notes**:
- Execute first to validate authentication and basic connectivity
- No setup required - ideal for smoke testing
- Failures here indicate fundamental issues (auth, network, server)

**Tools**:

*identity*:
- `context/accessible-projects`
- `context/get`
- `context/reset`
- `context/set`
- `login/status`
- `user/api-token/create`
- `user/api-token/get`
- `user/api-token/list`
- `user/api-token/revoke` ⚠️
- `user/get`
- `user/session/get`
- `user/session/list`
- `user/ssh-key/create`
- `user/ssh-key/delete` ⚠️
- `user/ssh-key/get`
- `user/ssh-key/import`
- `user/ssh-key/list`

*organization*:
- `org/list`
- `org/membership-list-own`

*project-foundation*:
- `project/list`
- `server/list`

### Tier 1: Organization-level - requires authenticated user context

**Tool Count**: 12 (6.9%)

**Execution Notes**:
- Verify organization membership before executing
- Some tools may modify org settings - review before execution
- Extension tools may have additional prerequisites

**Tools**:

*organization*:
- `extension/install`
- `extension/list`
- `extension/list-installed`
- `extension/uninstall` ⚠️
- `org/delete` ⚠️
- `org/get`
- `org/invite`
- `org/invite-list`
- `org/invite-list-own`
- `org/invite-revoke` ⚠️
- `org/membership-list`
- `org/membership-revoke` ⚠️

### Tier 2: Server-level - requires access to a server

**Tool Count**: 1 (0.6%)

**Execution Notes**:
- Requires access to at least one server
- Use server/list to identify available servers first

**Tools**:

*project-foundation*:
- `server/get`

### Tier 3: Project creation - creates project resources

**Tool Count**: 1 (0.6%)

**Execution Notes**:
- CRITICAL: These tools create resources that affect quotas
- Consider using a dedicated test project
- Track created resources for cleanup

**Tools**:

*project-foundation*:
- `project/create`

### Tier 4: Project-dependent - requires existing project/resources

**Tool Count**: 140 (80.0%)

**Execution Notes**:
- Largest tier - contains most operational tools
- Execute after Tier 3 establishes project context
- Many tools are domain-isolated (can run in parallel within domain)
- WARNING: Contains destructive operations (delete, uninstall)
- Execute destructive tools last within each domain

**Tools**:

*apps*:
- `app/copy`
- `app/create/node`
- `app/create/php`
- `app/create/php-worker`
- `app/create/python`
- `app/create/static`
- `app/dependency-list`
- `app/dependency-update`
- `app/dependency-versions`
- `app/download`
- `app/get`
- `app/install/contao`
- `app/install/joomla`
- `app/install/matomo`
- `app/install/nextcloud`
- `app/install/shopware5`
- `app/install/shopware6`
- `app/install/typo3`
- `app/install/wordpress`
- `app/list`
- `app/list-upgrade-candidates`
- `app/open`
- `app/ssh`
- `app/uninstall` ⚠️
- `app/update`
- `app/upgrade`
- `app/upload`
- `app/versions`

*backups*:
- `backup/create`
- `backup/delete` ⚠️
- `backup/download`
- `backup/get`
- `backup/list`
- `backup/schedule-create`
- `backup/schedule-delete` ⚠️
- `backup/schedule-list`
- `backup/schedule-update`

*domains-mail*:
- `certificate/list`
- `certificate/request`
- `domain/dnszone/get`
- `domain/dnszone/list`
- `domain/dnszone/update`
- `domain/get`
- `domain/list`
- `domain/virtualhost-create`
- `domain/virtualhost-delete` ⚠️
- `domain/virtualhost-get`
- `domain/virtualhost-list`
- `mail/address/create`
- `mail/address/delete` ⚠️
- `mail/address/get`
- `mail/address/list`
- `mail/address/update`
- `mail/deliverybox/create`
- `mail/deliverybox/delete` ⚠️
- `mail/deliverybox/get`
- `mail/deliverybox/list`
- `mail/deliverybox/update`

*containers*:
- `container/delete` ⚠️
- `container/list-services`
- `container/logs`
- `container/recreate`
- `container/restart`
- `container/run`
- `container/start`
- `container/stop`
- `container/update`
- `registry/create`
- `registry/delete` ⚠️
- `registry/list`
- `registry/update`
- `stack/delete` ⚠️
- `stack/deploy`
- `stack/list`
- `stack/ps`
- `volume/create`
- `volume/delete` ⚠️
- `volume/list`

*misc*:
- `conversation/categories`
- `conversation/close`
- `conversation/create`
- `conversation/list`
- `conversation/reply`
- `conversation/show`
- `ddev/init`
- `ddev/render-config`

*automation*:
- `cronjob/create`
- `cronjob/delete` ⚠️
- `cronjob/execute`
- `cronjob/execution-abort` ⚠️
- `cronjob/execution-get`
- `cronjob/execution-list`
- `cronjob/execution-logs`
- `cronjob/get`
- `cronjob/list`
- `cronjob/update`

*databases*:
- `database/index`
- `database/list`
- `database/mysql/charsets`
- `database/mysql/create`
- `database/mysql/delete` ⚠️
- `database/mysql/dump`
- `database/mysql/get`
- `database/mysql/import`
- `database/mysql/list`
- `database/mysql/phpmyadmin`
- `database/mysql/port-forward`
- `database/mysql/shell`
- `database/mysql/user-create`
- `database/mysql/user-delete` ⚠️
- `database/mysql/user-get`
- `database/mysql/user-list`
- `database/mysql/user-update`
- `database/mysql/versions`
- `database/redis/create`
- `database/redis/get`
- `database/redis/list`
- `database/redis/versions`

*identity*:
- `login/reset`
- `login/token`

*project-foundation*:
- `project/delete` ⚠️
- `project/filesystem-usage`
- `project/get`
- `project/invite-get`
- `project/invite-list`
- `project/invite-list-own`
- `project/membership-get`
- `project/membership-get-own`
- `project/membership-list`
- `project/membership-list-own`
- `project/ssh`
- `project/update`

*access-users*:
- `sftp/user-create`
- `sftp/user-delete` ⚠️
- `sftp/user-list`
- `sftp/user-update`
- `ssh/user-create`
- `ssh/user-delete` ⚠️
- `ssh/user-list`
- `ssh/user-update`

## Recommended Execution Order

### Phase 0: Foundation (parallel)

- **Tier**: 0
- **Tools**: 21
- **Notes**: All Tier 0 tools can run in parallel

**Tools**: `context/accessible-projects`, `context/get`, `context/reset`, `context/set`, `login/status`... and 16 more

### Phase 1: Organization (parallel)

- **Tier**: 1
- **Tools**: 12
- **Notes**: Org-level tools, parallel within domain

**Tools**: `extension/install`, `extension/list`, `extension/list-installed`, `extension/uninstall`, `org/delete`... and 7 more

### Phase 2: Resource Creation (sequential)

- **Tier**: 3
- **Tools**: 2
- **Notes**: Sequential execution - creates shared resources

**Tools**:
- `server/get`
- `project/create`

### Phase 3: apps - Operations (parallel)

- **Tier**: 4
- **Tools**: 27
- **Notes**: Non-destructive apps tools

**Tools**: `app/copy`, `app/create/node`, `app/create/php`, `app/create/php-worker`, `app/create/python`... and 22 more

### Phase 4: apps - Cleanup (sequential)

- **Tier**: 4
- **Tools**: 1
- **Notes**: Destructive apps tools - execute last

**Tools**:
- `app/uninstall`

### Phase 5: backups - Operations (parallel)

- **Tier**: 4
- **Tools**: 7
- **Notes**: Non-destructive backups tools

**Tools**:
- `backup/create`
- `backup/download`
- `backup/get`
- `backup/list`
- `backup/schedule-create`
- `backup/schedule-list`
- `backup/schedule-update`

### Phase 6: backups - Cleanup (sequential)

- **Tier**: 4
- **Tools**: 2
- **Notes**: Destructive backups tools - execute last

**Tools**:
- `backup/delete`
- `backup/schedule-delete`

### Phase 7: domains-mail - Operations (parallel)

- **Tier**: 4
- **Tools**: 18
- **Notes**: Non-destructive domains-mail tools

**Tools**: `certificate/list`, `certificate/request`, `domain/dnszone/get`, `domain/dnszone/list`, `domain/dnszone/update`... and 13 more

### Phase 8: domains-mail - Cleanup (sequential)

- **Tier**: 4
- **Tools**: 3
- **Notes**: Destructive domains-mail tools - execute last

**Tools**:
- `domain/virtualhost-delete`
- `mail/address/delete`
- `mail/deliverybox/delete`

### Phase 9: containers - Operations (parallel)

- **Tier**: 4
- **Tools**: 16
- **Notes**: Non-destructive containers tools

**Tools**: `container/list-services`, `container/logs`, `container/recreate`, `container/restart`, `container/run`... and 11 more

### Phase 10: containers - Cleanup (sequential)

- **Tier**: 4
- **Tools**: 4
- **Notes**: Destructive containers tools - execute last

**Tools**:
- `container/delete`
- `registry/delete`
- `stack/delete`
- `volume/delete`

### Phase 11: misc - Operations (parallel)

- **Tier**: 4
- **Tools**: 8
- **Notes**: Non-destructive misc tools

**Tools**:
- `conversation/categories`
- `conversation/close`
- `conversation/create`
- `conversation/list`
- `conversation/reply`
- `conversation/show`
- `ddev/init`
- `ddev/render-config`

### Phase 12: automation - Operations (parallel)

- **Tier**: 4
- **Tools**: 8
- **Notes**: Non-destructive automation tools

**Tools**:
- `cronjob/create`
- `cronjob/execute`
- `cronjob/execution-get`
- `cronjob/execution-list`
- `cronjob/execution-logs`
- `cronjob/get`
- `cronjob/list`
- `cronjob/update`

### Phase 13: automation - Cleanup (sequential)

- **Tier**: 4
- **Tools**: 2
- **Notes**: Destructive automation tools - execute last

**Tools**:
- `cronjob/delete`
- `cronjob/execution-abort`

### Phase 14: databases - Operations (parallel)

- **Tier**: 4
- **Tools**: 20
- **Notes**: Non-destructive databases tools

**Tools**: `database/index`, `database/list`, `database/mysql/charsets`, `database/mysql/create`, `database/mysql/dump`... and 15 more

### Phase 15: databases - Cleanup (sequential)

- **Tier**: 4
- **Tools**: 2
- **Notes**: Destructive databases tools - execute last

**Tools**:
- `database/mysql/delete`
- `database/mysql/user-delete`

### Phase 16: identity - Operations (parallel)

- **Tier**: 4
- **Tools**: 2
- **Notes**: Non-destructive identity tools

**Tools**:
- `login/reset`
- `login/token`

### Phase 17: project-foundation - Operations (parallel)

- **Tier**: 4
- **Tools**: 11
- **Notes**: Non-destructive project-foundation tools

**Tools**: `project/filesystem-usage`, `project/get`, `project/invite-get`, `project/invite-list`, `project/invite-list-own`... and 6 more

### Phase 18: project-foundation - Cleanup (sequential)

- **Tier**: 4
- **Tools**: 1
- **Notes**: Destructive project-foundation tools - execute last

**Tools**:
- `project/delete`

### Phase 19: access-users - Operations (parallel)

- **Tier**: 4
- **Tools**: 6
- **Notes**: Non-destructive access-users tools

**Tools**:
- `sftp/user-create`
- `sftp/user-list`
- `sftp/user-update`
- `ssh/user-create`
- `ssh/user-list`
- `ssh/user-update`

### Phase 20: access-users - Cleanup (sequential)

- **Tier**: 4
- **Tools**: 2
- **Notes**: Destructive access-users tools - execute last

**Tools**:
- `sftp/user-delete`
- `ssh/user-delete`

## Parallelization Opportunities

### Safe for Parallel Execution
- All Tier 0 tools (no dependencies)
- Tier 4 tools within the same domain (after dependencies met)
- Read-only operations (list, get) across domains

### Require Sequential Execution
- Tier 3 (project creation) - affects shared state
- Destructive operations within each domain
- Tools with cross-domain dependencies

### Recommended Parallelization Strategy
1. Execute Tier 0 in parallel (foundation check)
2. Execute Tier 1-3 sequentially (resource setup)
3. Execute Tier 4 with domain-level parallelism
4. Execute destructive operations last (sequential)

## Legend

- ⚠️ = Destructive operation (delete, uninstall, revoke)
- Domains can be executed in parallel after Tier 3 completes