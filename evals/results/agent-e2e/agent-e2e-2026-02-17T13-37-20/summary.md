# Agent E2E Summary: agent-e2e-2026-02-17T13-37-20

- Generated: 2026-02-17T13:37:22.414Z
- Coverage mode: all-agents
- Required coverage: 0%
- Gate: FAIL
- Cleanup test projects: enabled
- Cleanup project prefix: agent-e2e-2026-02-17T13-37-20

## Counts

- Total tools: 113
- Covered tools: 0
- Tool coverage: 0%
- Case runs: 0
- Passed runs: 0
- Failed runs: 0
- Matrix coverage: 0%

## Per-Agent Coverage

| Agent | Total | Passed | Failed | Coverage |
| --- | ---: | ---: | ---: | ---: |
| claude | 0 | 0 | 0 | 0% |

## Preflight Failures

- claude: Claude reports MCP server needs OAuth authentication Remediation: Run 'claude' and authenticate the mittwald MCP server via '/mcp', or update /Users/robert/Code/MittwaldCoWork/mittwald-mcp/.mcp.json to a valid authenticated server.

## Uncovered Tools

| Tool | Domain | Status by Agent |
| --- | --- | --- |
| mcp__mittwald__mittwald_app_copy | apps | claude:not_run |
| mcp__mittwald__mittwald_app_get | apps | claude:not_run |
| mcp__mittwald__mittwald_app_list_upgrade_candidates | apps | claude:not_run |
| mcp__mittwald__mittwald_app_list | apps | claude:not_run |
| mcp__mittwald__mittwald_app_uninstall | apps | claude:not_run |
| mcp__mittwald__mittwald_app_update | apps | claude:not_run |
| mcp__mittwald__mittwald_app_upgrade | apps | claude:not_run |
| mcp__mittwald__mittwald_app_versions | apps | claude:not_run |
| mcp__mittwald__mittwald_cronjob_create | automation | claude:not_run |
| mcp__mittwald__mittwald_cronjob_delete | automation | claude:not_run |
| mcp__mittwald__mittwald_cronjob_execute | automation | claude:not_run |
| mcp__mittwald__mittwald_cronjob_execution_abort | automation | claude:not_run |
| mcp__mittwald__mittwald_cronjob_execution_get | automation | claude:not_run |
| mcp__mittwald__mittwald_cronjob_execution_list | automation | claude:not_run |
| mcp__mittwald__mittwald_cronjob_get | automation | claude:not_run |
| mcp__mittwald__mittwald_cronjob_list | automation | claude:not_run |
| mcp__mittwald__mittwald_cronjob_update | automation | claude:not_run |
| mcp__mittwald__mittwald_backup_create | backups | claude:not_run |
| mcp__mittwald__mittwald_backup_delete | backups | claude:not_run |
| mcp__mittwald__mittwald_backup_get | backups | claude:not_run |
| mcp__mittwald__mittwald_backup_list | backups | claude:not_run |
| mcp__mittwald__mittwald_backup_schedule_create | backups | claude:not_run |
| mcp__mittwald__mittwald_backup_schedule_delete | backups | claude:not_run |
| mcp__mittwald__mittwald_backup_schedule_list | backups | claude:not_run |
| mcp__mittwald__mittwald_backup_schedule_update | backups | claude:not_run |
| mcp__mittwald__mittwald_certificate_request | certificates | claude:not_run |
| mcp__mittwald__mittwald_container_delete | container | claude:not_run |
| mcp__mittwald__mittwald_container_restart | container | claude:not_run |
| mcp__mittwald__mittwald_container_start | container | claude:not_run |
| mcp__mittwald__mittwald_container_stop | container | claude:not_run |
| mcp__mittwald__mittwald_container_list | containers | claude:not_run |
| mcp__mittwald__mittwald_registry_create | containers | claude:not_run |
| mcp__mittwald__mittwald_registry_delete | containers | claude:not_run |
| mcp__mittwald__mittwald_registry_list | containers | claude:not_run |
| mcp__mittwald__mittwald_registry_update | containers | claude:not_run |
| mcp__mittwald__mittwald_stack_delete | containers | claude:not_run |
| mcp__mittwald__mittwald_stack_deploy | containers | claude:not_run |
| mcp__mittwald__mittwald_stack_list | containers | claude:not_run |
| mcp__mittwald__mittwald_stack_ps | containers | claude:not_run |
| mcp__mittwald__mittwald_volume_list | containers | claude:not_run |
| mcp__mittwald__mittwald_context_get_session | context | claude:not_run |
| mcp__mittwald__mittwald_context_reset_session | context | claude:not_run |
| mcp__mittwald__mittwald_context_set_session | context | claude:not_run |
| mcp__mittwald__mittwald_database_mysql_create | databases | claude:not_run |
| mcp__mittwald__mittwald_database_mysql_delete | databases | claude:not_run |
| mcp__mittwald__mittwald_database_mysql_get | databases | claude:not_run |
| mcp__mittwald__mittwald_database_mysql_list | databases | claude:not_run |
| mcp__mittwald__mittwald_database_mysql_user_create | databases | claude:not_run |
| mcp__mittwald__mittwald_database_mysql_user_delete | databases | claude:not_run |
| mcp__mittwald__mittwald_database_mysql_user_get | databases | claude:not_run |
| mcp__mittwald__mittwald_database_mysql_user_list | databases | claude:not_run |
| mcp__mittwald__mittwald_database_mysql_user_update | databases | claude:not_run |
| mcp__mittwald__mittwald_database_mysql_versions | databases | claude:not_run |
| mcp__mittwald__mittwald_database_redis_create | databases | claude:not_run |
| mcp__mittwald__mittwald_database_redis_get | databases | claude:not_run |
| mcp__mittwald__mittwald_database_redis_list | databases | claude:not_run |
| mcp__mittwald__mittwald_database_redis_versions | databases | claude:not_run |
| mcp__mittwald__mittwald_certificate_list | domains-mail | claude:not_run |
| mcp__mittwald__mittwald_domain_dnszone_get | domains-mail | claude:not_run |
| mcp__mittwald__mittwald_domain_dnszone_list | domains-mail | claude:not_run |
| mcp__mittwald__mittwald_domain_dnszone_update | domains-mail | claude:not_run |
| mcp__mittwald__mittwald_domain_get | domains-mail | claude:not_run |
| mcp__mittwald__mittwald_domain_list | domains-mail | claude:not_run |
| mcp__mittwald__mittwald_domain_virtualhost_create | domains-mail | claude:not_run |
| mcp__mittwald__mittwald_domain_virtualhost_delete | domains-mail | claude:not_run |
| mcp__mittwald__mittwald_domain_virtualhost_get | domains-mail | claude:not_run |
| mcp__mittwald__mittwald_domain_virtualhost_list | domains-mail | claude:not_run |
| mcp__mittwald__mittwald_mail_address_create | domains-mail | claude:not_run |
| mcp__mittwald__mittwald_mail_address_delete | domains-mail | claude:not_run |
| mcp__mittwald__mittwald_mail_address_get | domains-mail | claude:not_run |
| mcp__mittwald__mittwald_mail_address_list | domains-mail | claude:not_run |
| mcp__mittwald__mittwald_mail_address_update | domains-mail | claude:not_run |
| mcp__mittwald__mittwald_mail_deliverybox_create | domains-mail | claude:not_run |
| mcp__mittwald__mittwald_mail_deliverybox_delete | domains-mail | claude:not_run |
| mcp__mittwald__mittwald_mail_deliverybox_get | domains-mail | claude:not_run |
| mcp__mittwald__mittwald_mail_deliverybox_list | domains-mail | claude:not_run |
| mcp__mittwald__mittwald_mail_deliverybox_update | domains-mail | claude:not_run |
| mcp__mittwald__mittwald_user_api_token_create | identity | claude:not_run |
| mcp__mittwald__mittwald_user_api_token_get | identity | claude:not_run |
| mcp__mittwald__mittwald_user_api_token_list | identity | claude:not_run |
| mcp__mittwald__mittwald_user_api_token_revoke | identity | claude:not_run |
| mcp__mittwald__mittwald_user_get | identity | claude:not_run |
| mcp__mittwald__mittwald_user_session_get | identity | claude:not_run |
| mcp__mittwald__mittwald_user_session_list | identity | claude:not_run |
| mcp__mittwald__mittwald_user_ssh_key_create | identity | claude:not_run |
| mcp__mittwald__mittwald_user_ssh_key_delete | identity | claude:not_run |
| mcp__mittwald__mittwald_user_ssh_key_get | identity | claude:not_run |
| mcp__mittwald__mittwald_user_ssh_key_import | identity | claude:not_run |
| mcp__mittwald__mittwald_user_ssh_key_list | identity | claude:not_run |
| mcp__mittwald__mittwald_org_get | organization | claude:not_run |
| mcp__mittwald__mittwald_org_invite_list | organization | claude:not_run |
| mcp__mittwald__mittwald_org_invite_revoke | organization | claude:not_run |
| mcp__mittwald__mittwald_org_invite | organization | claude:not_run |
| mcp__mittwald__mittwald_org_list | organization | claude:not_run |
| mcp__mittwald__mittwald_org_membership_list | organization | claude:not_run |
| mcp__mittwald__mittwald_org_membership_revoke | organization | claude:not_run |
| mcp__mittwald__mittwald_project_create | project-foundation | claude:not_run |
| mcp__mittwald__mittwald_project_delete | project-foundation | claude:not_run |
| mcp__mittwald__mittwald_project_get | project-foundation | claude:not_run |
| mcp__mittwald__mittwald_project_invite_get | project-foundation | claude:not_run |
| mcp__mittwald__mittwald_project_invite_list | project-foundation | claude:not_run |
| mcp__mittwald__mittwald_project_list | project-foundation | claude:not_run |
| mcp__mittwald__mittwald_project_membership_get | project-foundation | claude:not_run |
| mcp__mittwald__mittwald_project_membership_list | project-foundation | claude:not_run |
| mcp__mittwald__mittwald_project_ssh | project-foundation | claude:not_run |
| mcp__mittwald__mittwald_project_update | project-foundation | claude:not_run |
| mcp__mittwald__mittwald_server_get | project-foundation | claude:not_run |
| mcp__mittwald__mittwald_server_list | project-foundation | claude:not_run |
| mcp__mittwald__mittwald_ssh_user_create | ssh | claude:not_run |
| mcp__mittwald__mittwald_ssh_user_delete | ssh | claude:not_run |
| mcp__mittwald__mittwald_ssh_user_list | ssh | claude:not_run |
| mcp__mittwald__mittwald_ssh_user_update | ssh | claude:not_run |
| mcp__mittwald__mittwald_volume_create | volume | claude:not_run |

## Gate Failure Reasons

- Preflight failed for: claude
