# Baseline Eval Report: Mittwald MCP Tools

**Generated**: 2025-12-16T15:49:52.013Z

## Executive Summary

- **Total Tools**: 175
- **Executed**: 0 (0.0%)
- **Successful**: 0 (0.0%)
- **Failed**: 0

## Coverage by Domain

| Domain | Tools | Executed | Success | Failure | Success Rate | Coverage |
|--------|-------|----------|---------|---------|--------------|----------|
| access-users | 8 | 0 | 0 | 0 | 0.0% | 0.0% |
| apps | 28 | 0 | 0 | 0 | 0.0% | 0.0% |
| automation | 10 | 0 | 0 | 0 | 0.0% | 0.0% |
| backups | 9 | 0 | 0 | 0 | 0.0% | 0.0% |
| containers | 20 | 0 | 0 | 0 | 0.0% | 0.0% |
| databases | 22 | 0 | 0 | 0 | 0.0% | 0.0% |
| domains-mail | 21 | 0 | 0 | 0 | 0.0% | 0.0% |
| identity | 19 | 0 | 0 | 0 | 0.0% | 0.0% |
| misc | 8 | 0 | 0 | 0 | 0.0% | 0.0% |
| organization | 14 | 0 | 0 | 0 | 0.0% | 0.0% |
| project-foundation | 16 | 0 | 0 | 0 | 0.0% | 0.0% |

## Coverage by Tier

| Tier | Description | Tools | Executed | Success | Failure | Success Rate |
|------|-------------|-------|----------|---------|---------|--------------|
| 0 | No prerequisites | 24 | 0 | 0 | 0 | 0.0% |
| 1 | Organization-level | 12 | 0 | 0 | 0 | 0.0% |
| 2 | Server-level | 1 | 0 | 0 | 0 | 0.0% |
| 3 | Project creation | 1 | 0 | 0 | 0 | 0.0% |
| 4 | Requires project | 137 | 0 | 0 | 0 | 0.0% |

## Tools Without Assessment

175 tools have not been evaluated yet:

**app/** (28):
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
- ... and 18 more

**backup/** (9):
- `backup/create`
- `backup/delete`
- `backup/download`
- `backup/get`
- `backup/list`
- `backup/schedule-create`
- `backup/schedule-delete`
- `backup/schedule-list`
- `backup/schedule-update`

**certificate/** (2):
- `certificate/list`
- `certificate/request`

**container/** (9):
- `container/delete`
- `container/list-services`
- `container/logs`
- `container/recreate`
- `container/restart`
- `container/run`
- `container/start`
- `container/stop`
- `container/update`

**context/** (4):
- `context/accessible-projects`
- `context/get`
- `context/reset`
- `context/set`

**conversation/** (6):
- `conversation/categories`
- `conversation/close`
- `conversation/create`
- `conversation/list`
- `conversation/reply`
- `conversation/show`

**cronjob/** (10):
- `cronjob/create`
- `cronjob/delete`
- `cronjob/execute`
- `cronjob/execution-abort`
- `cronjob/execution-get`
- `cronjob/execution-list`
- `cronjob/execution-logs`
- `cronjob/get`
- `cronjob/list`
- `cronjob/update`

**database/** (22):
- `database/index`
- `database/list`
- `database/mysql/charsets`
- `database/mysql/create`
- `database/mysql/delete`
- `database/mysql/dump`
- `database/mysql/get`
- `database/mysql/import`
- `database/mysql/list`
- `database/mysql/phpmyadmin`
- ... and 12 more

**ddev/** (2):
- `ddev/init`
- `ddev/render-config`

**domain/** (9):
- `domain/dnszone/get`
- `domain/dnszone/list`
- `domain/dnszone/update`
- `domain/get`
- `domain/list`
- `domain/virtualhost-create`
- `domain/virtualhost-delete`
- `domain/virtualhost-get`
- `domain/virtualhost-list`

**extension/** (4):
- `extension/install`
- `extension/list`
- `extension/list-installed`
- `extension/uninstall`

**login/** (3):
- `login/reset`
- `login/status`
- `login/token`

**mail/** (10):
- `mail/address/create`
- `mail/address/delete`
- `mail/address/get`
- `mail/address/list`
- `mail/address/update`
- `mail/deliverybox/create`
- `mail/deliverybox/delete`
- `mail/deliverybox/get`
- `mail/deliverybox/list`
- `mail/deliverybox/update`

**org/** (10):
- `org/delete`
- `org/get`
- `org/invite`
- `org/invite-list`
- `org/invite-list-own`
- `org/invite-revoke`
- `org/list`
- `org/membership-list`
- `org/membership-list-own`
- `org/membership-revoke`

**project/** (14):
- `project/create`
- `project/delete`
- `project/filesystem-usage`
- `project/get`
- `project/invite-get`
- `project/invite-list`
- `project/invite-list-own`
- `project/list`
- `project/membership-get`
- `project/membership-get-own`
- ... and 4 more

**registry/** (4):
- `registry/create`
- `registry/delete`
- `registry/list`
- `registry/update`

**server/** (2):
- `server/get`
- `server/list`

**sftp/** (4):
- `sftp/user-create`
- `sftp/user-delete`
- `sftp/user-list`
- `sftp/user-update`

**ssh/** (4):
- `ssh/user-create`
- `ssh/user-delete`
- `ssh/user-list`
- `ssh/user-update`

**stack/** (4):
- `stack/delete`
- `stack/deploy`
- `stack/list`
- `stack/ps`

**user/** (12):
- `user/api-token/create`
- `user/api-token/get`
- `user/api-token/list`
- `user/api-token/revoke`
- `user/get`
- `user/session/get`
- `user/session/list`
- `user/ssh-key/create`
- `user/ssh-key/delete`
- `user/ssh-key/get`
- ... and 2 more

**volume/** (3):
- `volume/create`
- `volume/delete`
- `volume/list`


## Recommendations

1. Investigate tools with `auth_error` problems - may need scope configuration
2. Review `resource_not_found` errors - may indicate dependency issues
3. Consider retry strategy for `timeout` errors
4. Tools with `permission_denied` may need role elevation

---

*This baseline report was generated by the Langfuse MCP Eval Suite.*