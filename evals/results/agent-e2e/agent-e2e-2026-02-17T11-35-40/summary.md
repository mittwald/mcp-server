# Agent E2E Summary: agent-e2e-2026-02-17T11-35-40

- Generated: 2026-02-17T11:36:07.133Z
- Coverage mode: all-agents
- Required coverage: 0%
- Gate: FAIL
- Cleanup test projects: enabled
- Cleanup project prefix: agent-e2e-2026-02-17T11-35-40

## Counts

- Total tools: 218
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
| codex | 0 | 0 | 0 | 0% |
| opencode | 0 | 0 | 0 | 0% |

## Preflight Failures

- claude: Claude reports MCP server needs OAuth authentication Remediation: Run 'claude' and authenticate the mittwald MCP server via '/mcp', or update /Users/robert/Code/MittwaldCoWork/mittwald-mcp/.mcp.json to a valid authenticated server.
- opencode: Probe did not call expected tool mcp__mittwald__mittwald_user_get Remediation: Configure and authenticate mittwald in opencode ('opencode mcp add' then 'opencode mcp auth mittwald').

## Uncovered Tools

| Tool | Domain | Status by Agent |
| --- | --- | --- |
| mcp__mittwald__mittwald_sftp_user-create | access-users | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_sftp_user-delete | access-users | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_sftp_user-list | access-users | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_sftp_user-update | access-users | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_ssh_user-create | access-users | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_ssh_user-delete | access-users | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_ssh_user-list | access-users | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_ssh_user-update | access-users | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_create_node | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_create_php-worker | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_create_php | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_create_python | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_create_static | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_dependency-list | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_dependency-update | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_dependency-versions | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_download | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_install_contao | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_install_joomla | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_install_matomo | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_install_nextcloud | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_install_shopware5 | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_install_shopware6 | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_install_typo3 | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_install_wordpress | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_list-upgrade-candidates | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_open | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_ssh | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_upload | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_cronjob_execution-abort | automation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_cronjob_execution-get | automation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_cronjob_execution-list | automation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_cronjob_execution-logs | automation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_backup_download | backups | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_backup_schedule-create | backups | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_backup_schedule-delete | backups | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_backup_schedule-list | backups | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_backup_schedule-update | backups | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_container_delete | containers | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_container_list-services | containers | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_container_logs | containers | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_container_recreate | containers | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_container_restart | containers | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_container_run | containers | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_container_start | containers | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_container_stop | containers | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_container_update | containers | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_volume_create | containers | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_volume_delete | containers | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_list | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_mysql_charsets | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_mysql_dump | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_mysql_import | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_mysql_phpmyadmin | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_mysql_port-forward | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_mysql_shell | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_mysql_user-create | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_mysql_user-delete | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_mysql_user-get | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_mysql_user-list | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_mysql_user-update | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_domain_virtualhost-create | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_domain_virtualhost-delete | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_domain_virtualhost-get | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_domain_virtualhost-list | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_context_accessible-projects | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_context_get | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_context_reset | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_context_set | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_user_api-token_create | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_user_api-token_get | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_user_api-token_list | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_user_api-token_revoke | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_user_ssh-key_create | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_user_ssh-key_delete | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_user_ssh-key_get | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_user_ssh-key_import | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_user_ssh-key_list | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_conversation_close | misc | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_ddev_init | misc | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_ddev_render-config | misc | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_login_reset | misc | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_login_status | misc | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_login_token | misc | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_extension_install | organization | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_extension_list-installed | organization | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_extension_list | organization | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_extension_uninstall | organization | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_org_delete | organization | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_org_invite-list-own | organization | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_org_invite-list | organization | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_org_invite-revoke | organization | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_org_membership-list-own | organization | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_org_membership-list | organization | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_org_membership-revoke | organization | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_project_filesystem-usage | project-foundation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_project_invite-get | project-foundation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_project_invite-list-own | project-foundation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_project_invite-list | project-foundation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_project_membership-get-own | project-foundation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_project_membership-get | project-foundation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_project_membership-list-own | project-foundation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_project_membership-list | project-foundation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_sftp_user_delete | sftp | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_sftp_user_list | sftp | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_ssh_user_create | ssh | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_ssh_user_delete | ssh | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_ssh_user_list | ssh | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_ssh_user_update | ssh | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_copy | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_get | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_list_upgrade_candidates | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_list | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_uninstall | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_update | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_upgrade | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_app_versions | apps | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_cronjob_create | automation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_cronjob_delete | automation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_cronjob_execute | automation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_cronjob_execution_abort | automation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_cronjob_execution_get | automation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_cronjob_execution_list | automation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_cronjob_get | automation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_cronjob_list | automation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_cronjob_update | automation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_backup_create | backups | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_backup_delete | backups | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_backup_get | backups | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_backup_list | backups | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_backup_schedule_create | backups | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_backup_schedule_delete | backups | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_backup_schedule_list | backups | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_backup_schedule_update | backups | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_container_list | containers | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_registry_create | containers | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_registry_delete | containers | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_registry_list | containers | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_registry_update | containers | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_stack_delete | containers | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_stack_deploy | containers | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_stack_list | containers | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_stack_ps | containers | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_volume_list | containers | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_context_get_session | context | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_context_reset_session | context | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_context_set_session | context | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_mysql_create | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_mysql_delete | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_mysql_get | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_mysql_list | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_mysql_user_create | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_mysql_user_delete | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_mysql_user_get | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_mysql_user_list | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_mysql_user_update | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_mysql_versions | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_redis_create | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_redis_get | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_redis_list | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_database_redis_versions | databases | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_certificate_list | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_certificate_request | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_domain_dnszone_get | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_domain_dnszone_list | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_domain_dnszone_update | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_domain_get | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_domain_list | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_domain_virtualhost_create | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_domain_virtualhost_delete | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_domain_virtualhost_get | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_domain_virtualhost_list | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_mail_address_create | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_mail_address_delete | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_mail_address_get | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_mail_address_list | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_mail_address_update | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_mail_deliverybox_create | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_mail_deliverybox_delete | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_mail_deliverybox_get | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_mail_deliverybox_list | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_mail_deliverybox_update | domains-mail | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_user_api_token_create | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_user_api_token_get | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_user_api_token_list | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_user_api_token_revoke | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_user_get | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_user_session_get | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_user_session_list | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_user_ssh_key_create | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_user_ssh_key_delete | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_user_ssh_key_get | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_user_ssh_key_import | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_user_ssh_key_list | identity | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_conversation_categories | misc | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_conversation_create | misc | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_conversation_list | misc | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_conversation_reply | misc | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_conversation_show | misc | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_org_get | organization | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_org_invite_list | organization | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_org_invite_revoke | organization | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_org_invite | organization | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_org_list | organization | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_org_membership_list | organization | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_org_membership_revoke | organization | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_project_create | project-foundation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_project_delete | project-foundation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_project_get | project-foundation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_project_invite_get | project-foundation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_project_invite_list | project-foundation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_project_list | project-foundation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_project_membership_get | project-foundation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_project_membership_list | project-foundation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_project_ssh | project-foundation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_project_update | project-foundation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_server_get | project-foundation | claude:not_run, codex:not_run, opencode:not_run |
| mcp__mittwald__mittwald_server_list | project-foundation | claude:not_run, codex:not_run, opencode:not_run |

## Gate Failure Reasons

- Preflight failed for: claude, opencode
