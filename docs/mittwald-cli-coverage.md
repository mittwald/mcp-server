# Mittwald CLI Coverage Matrix

Total CLI commands: 178

Covered by MCP tools: 137

Missing wrappers: 41

Status legend: ✅ Covered, ⚠️ Missing, ➖ Not Applicable

## app

| CLI Command | Description | Status | MCP Tool | Tool Definition | Notes |
| --- | --- | --- | --- | --- | --- |
| app copy | Copy an app within a project | ✅ Covered | mittwald_app_copy | src/constants/tool/mittwald-cli/app/copy-cli.ts |  |
| app create node | Creates new custom Node.js installation. | ✅ Covered | mittwald_app_create_node | src/constants/tool/mittwald-cli/app/create/node-cli.ts |  |
| app create php | Creates new custom PHP installation. | ✅ Covered | mittwald_app_create_php | src/constants/tool/mittwald-cli/app/create/php-cli.ts |  |
| app create php-worker | Creates new PHP worker installation. | ✅ Covered | mittwald_app_create_php_worker | src/constants/tool/mittwald-cli/app/create/php-worker-cli.ts |  |
| app create python | Creates new custom python site installation. | ✅ Covered | mittwald_app_create_python | src/constants/tool/mittwald-cli/app/create/python-cli.ts |  |
| app create static | Creates new custom static site installation. | ✅ Covered | mittwald_app_create_static | src/constants/tool/mittwald-cli/app/create/static-cli.ts |  |
| app dependency list | Get all available dependencies | ⚠️ Missing |  |  | Dependency inspection/update commands not yet exposed via MCP. — Allowed missing (intentional): Workstream C1 will implement dependency inspection wrappers; CLI command temporarily excluded. |
| app dependency update |  | ⚠️ Missing |  |  | Dependency inspection/update commands not yet exposed via MCP. — Allowed missing (intentional): Workstream C1 backlog item; update functionality to be wrapped once CLI parser is stabilized. |
| app dependency versions | Get all available versions of a particular dependency | ⚠️ Missing |  |  | Dependency inspection/update commands not yet exposed via MCP. — Allowed missing (intentional): Workstream C1 backlog item; awaiting shared schema for dependency metadata. |
| app download | This command downloads the filesystem of an app installation to your local machine via rsync. For this, rsync needs to be installed on your system. This command relies on connecting to your hosting environment via SSH. For this, it will use your systems SSH client under the hood, and will respect your SSH configuration in ~/.ssh/config. An exception to this is the 'User' configuration, which will be overridden by this command to either your authenticated mStudio user or the user specified with the --ssh-user flag. See https://linux.die.net/man/5/ssh_config for a reference on the configuration file. This command will also look for a file named .mw-rsync-filter in the current directory and use it as a filter file for rsync. Have a look at https://manpages.ubuntu.com/manpages/noble/en/man1/rsync.1.html#filter%20rules for more information on how to write filter rules. | ✅ Covered | mittwald_app_download | src/constants/tool/mittwald-cli/app/download-cli.ts |  |
| app exec | This command relies on connecting to your hosting environment via SSH. For this, it will use your systems SSH client under the hood, and will respect your SSH configuration in ~/.ssh/config. An exception to this is the 'User' configuration, which will be overridden by this command to either your authenticated mStudio user or the user specified with the --ssh-user flag. See https://linux.die.net/man/5/ssh_config for a reference on the configuration file. | ⚠️ Missing |  |  | Interactive SSH exec; requires terminal streaming not supported in MCP context. — Allowed missing (interactive): Requires MCP streaming transport; pending SDK evaluation and security review (see Workstream D) — Allowed missing (interactive): Requires MCP streaming transport; pending SDK evaluation and security review (see Workstream D) |
| app get | Get details about an app installation | ✅ Covered | mittwald_app_get | src/constants/tool/mittwald-cli/app/get-cli.ts |  |
| app install contao | Creates new Contao installation. | ✅ Covered | mittwald_app_install_contao | src/constants/tool/mittwald-cli/app/install/contao-cli.ts |  |
| app install joomla | Creates new Joomla! installation. | ✅ Covered | mittwald_app_install_joomla | src/constants/tool/mittwald-cli/app/install/joomla-cli.ts |  |
| app install matomo | Creates new Matomo installation. | ✅ Covered | mittwald_app_install_matomo | src/constants/tool/mittwald-cli/app/install/matomo-cli.ts |  |
| app install nextcloud | Creates new Nextcloud installation. | ✅ Covered | mittwald_app_install_nextcloud | src/constants/tool/mittwald-cli/app/install/nextcloud-cli.ts |  |
| app install shopware5 | Creates new Shopware 5 installation. | ✅ Covered | mittwald_app_install_shopware5 | src/constants/tool/mittwald-cli/app/install/shopware5-cli.ts |  |
| app install shopware6 | Creates new Shopware 6 installation. | ✅ Covered | mittwald_app_install_shopware6 | src/constants/tool/mittwald-cli/app/install/shopware6-cli.ts |  |
| app install typo3 | Creates new TYPO3 installation. | ✅ Covered | mittwald_app_install_typo3 | src/constants/tool/mittwald-cli/app/install/typo3-cli.ts |  |
| app install wordpress | Creates new WordPress installation. | ✅ Covered | mittwald_app_install_wordpress | src/constants/tool/mittwald-cli/app/install/wordpress-cli.ts |  |
| app list | List installed apps in a project. | ✅ Covered | mittwald_app_list | src/constants/tool/mittwald-cli/app/list-cli.ts |  |
| app list-upgrade-candidates | List upgrade candidates for an app installation. | ✅ Covered | mittwald_app_list_upgrade_candidates | src/constants/tool/mittwald-cli/app/list-upgrade-candidates-cli.ts |  |
| app open | This command opens an app installation in the browser. For this to work, there needs to be at least one virtual host linked to the app installation. | ✅ Covered | mittwald_app_open | src/constants/tool/mittwald-cli/app/open-cli.ts |  |
| app ssh | Establishes an interactive SSH connection to an app installation. This command is a wrapper around your systems SSH client, and will respect your SSH configuration in ~/.ssh/config. An exception to this is the 'User' configuration, which will be overridden by this command to either your authenticated mStudio user or the user specified with the --ssh-user flag. See https://linux.die.net/man/5/ssh_config for a reference on the configuration file. | ✅ Covered | mittwald_app_ssh | src/constants/tool/mittwald-cli/app/ssh-cli.ts |  |
| app uninstall | Uninstall an app | ✅ Covered | mittwald_app_uninstall | src/constants/tool/mittwald-cli/app/uninstall-cli.ts |  |
| app update |  | ✅ Covered | mittwald_app_update | src/constants/tool/mittwald-cli/app/update-cli.ts |  |
| app upgrade | Upgrade app installation to target version | ✅ Covered | mittwald_app_upgrade | src/constants/tool/mittwald-cli/app/upgrade-cli.ts |  |
| app upload | Upload the filesystem of an app from your local machine to a project. For this, rsync needs to be installed on your system. CAUTION: This is a potentially destructive operation. It will overwrite files on the server with the files from your local machine. This is NOT a turnkey deployment solution. It is intended for development purposes only. This command relies on connecting to your hosting environment via SSH. For this, it will use your systems SSH client under the hood, and will respect your SSH configuration in ~/.ssh/config. An exception to this is the 'User' configuration, which will be overridden by this command to either your authenticated mStudio user or the user specified with the --ssh-user flag. See https://linux.die.net/man/5/ssh_config for a reference on the configuration file. This command will also look for a file named .mw-rsync-filter in the current directory and use it as a filter file for rsync. Have a look at https://manpages.ubuntu.com/manpages/noble/en/man1/rsync.1.html#filter%20rules for more information on how to write filter rules. | ✅ Covered | mittwald_app_upload | src/constants/tool/mittwald-cli/app/upload-cli.ts |  |
| app version-info | show information about specific app versions | ⚠️ Missing |  |  | New CLI metadata command; wrapper not yet added. — Allowed missing (intentional): Workstream C1 backlog; CLI output shape still under review. |
| app versions | List supported Apps and Versions | ✅ Covered | mittwald_app_versions | src/constants/tool/mittwald-cli/app/versions-cli.ts |  |

## backup

| CLI Command | Description | Status | MCP Tool | Tool Definition | Notes |
| --- | --- | --- | --- | --- | --- |
| backup create |  | ✅ Covered | mittwald_backup_create | src/constants/tool/mittwald-cli/backup/create-cli.ts |  |
| backup delete | Delete a backup | ✅ Covered | mittwald_backup_delete | src/constants/tool/mittwald-cli/backup/delete-cli.ts |  |
| backup download | Download a backup to your local disk | ✅ Covered | mittwald_backup_download | src/constants/tool/mittwald-cli/backup/download-cli.ts |  |
| backup get | Show details of a backup. | ✅ Covered | mittwald_backup_get | src/constants/tool/mittwald-cli/backup/get-cli.ts |  |
| backup list | List Backups for a given Project. | ✅ Covered | mittwald_backup_list | src/constants/tool/mittwald-cli/backup/list-cli.ts |  |
| backup schedule create |  | ✅ Covered | mittwald_backup_schedule_create | src/constants/tool/mittwald-cli/backup/schedule-create-cli.ts |  |
| backup schedule delete | Delete a backup schedule | ✅ Covered | mittwald_backup_schedule_delete | src/constants/tool/mittwald-cli/backup/schedule-delete-cli.ts |  |
| backup schedule list | List backup schedules belonging to a given project. | ✅ Covered | mittwald_backup_schedule_list | src/constants/tool/mittwald-cli/backup/schedule-list-cli.ts |  |
| backup schedule update | Update an existing backup schedule | ✅ Covered | mittwald_backup_schedule_update | src/constants/tool/mittwald-cli/backup/schedule-update-cli.ts |  |

## container

| CLI Command | Description | Status | MCP Tool | Tool Definition | Notes |
| --- | --- | --- | --- | --- | --- |
| container cp | The syntax is similar to docker cp: - Copy from container to host: mw container cp CONTAINER:SRC_PATH DEST_PATH - Copy from host to container: mw container cp SRC_PATH CONTAINER:DEST_PATH Where CONTAINER can be a container ID, short ID, or service name. | ⚠️ Missing |  |  | File transfer via docker cp semantics not implemented; needs streaming support. — Allowed missing (interactive): Requires MCP streaming transport; pending SDK evaluation and security review (see Workstream D) — Allowed missing (interactive): Requires MCP streaming transport; pending SDK evaluation and security review (see Workstream D) |
| container delete | Delete a container | ✅ Covered | mittwald_container_delete | src/constants/tool/mittwald-cli/container/delete-cli.ts |  |
| container exec | This command relies on connecting to your hosting environment via SSH. For this, it will use your systems SSH client under the hood, and will respect your SSH configuration in ~/.ssh/config. An exception to this is the 'User' configuration, which will be overridden by this command to either your authenticated mStudio user or the user specified with the --ssh-user flag. See https://linux.die.net/man/5/ssh_config for a reference on the configuration file. | ⚠️ Missing |  |  | Requires interactive SSH tunnel; absent for security and missing streaming support. — Allowed missing (interactive): Requires MCP streaming transport; pending SDK evaluation and security review (see Workstream D) — Allowed missing (interactive): Requires MCP streaming transport; pending SDK evaluation and security review (see Workstream D) |
| container list | List containers belonging to a project. | ✅ Covered | mittwald_container_list | src/constants/tool/mittwald-cli/container/list-services-cli.ts |  |
| container logs | This command prints the log output of a specific container. When this command is run in a terminal, the output is piped through a pager. The pager is determined by your PAGER environment variable, with defaulting to "less". You can disable this behavior with the --no-pager flag. | ✅ Covered | mittwald_container_logs | src/constants/tool/mittwald-cli/container/logs-cli.ts |  |
| container port-forward | This command forwards a TCP port from a container to a local port on your machine. This allows you to connect to services running in the container as if they were running on your local machine. This command relies on connecting to your hosting environment via SSH. For this, it will use your systems SSH client under the hood, and will respect your SSH configuration in ~/.ssh/config. An exception to this is the 'User' configuration, which will be overridden by this command to either your authenticated mStudio user or the user specified with the --ssh-user flag. See https://linux.die.net/man/5/ssh_config for a reference on the configuration file. | ⚠️ Missing |  |  | Requires interactive SSH tunnel; absent for security and missing streaming support. — Allowed missing (interactive): Requires MCP streaming transport; pending SDK evaluation and security review (see Workstream D) — Allowed missing (interactive): Requires MCP streaming transport; pending SDK evaluation and security review (see Workstream D) |
| container recreate |  | ✅ Covered | mittwald_container_recreate | src/constants/tool/mittwald-cli/container/recreate-cli.ts |  |
| container restart |  | ✅ Covered | mittwald_container_restart | src/constants/tool/mittwald-cli/container/restart-cli.ts |  |
| container run |  | ✅ Covered | mittwald_container_run | src/constants/tool/mittwald-cli/container/run-cli.ts |  |
| container ssh | Establishes an interactive SSH connection to a container. This command is a wrapper around your systems SSH client, and will respect your SSH configuration in ~/.ssh/config. An exception to this is the 'User' configuration, which will be overridden by this command to either your authenticated mStudio user or the user specified with the --ssh-user flag. See https://linux.die.net/man/5/ssh_config for a reference on the configuration file. | ⚠️ Missing |  |  | Requires interactive SSH tunnel; absent for security and missing streaming support. — Allowed missing (interactive): Requires MCP streaming transport; pending SDK evaluation and security review (see Workstream D) — Allowed missing (interactive): Requires MCP streaming transport; pending SDK evaluation and security review (see Workstream D) |
| container start |  | ✅ Covered | mittwald_container_start | src/constants/tool/mittwald-cli/container/start-cli.ts |  |
| container stop |  | ✅ Covered | mittwald_container_stop | src/constants/tool/mittwald-cli/container/stop-cli.ts |  |
| container update | Updates attributes of an existing container such as image, environment variables, etc. | ⚠️ Missing |  |  | Container mutation command not wrapped yet. — Allowed missing (intentional): Workstream C2: non-interactive container lifecycle command pending wrapper. |

## context

| CLI Command | Description | Status | MCP Tool | Tool Definition | Notes |
| --- | --- | --- | --- | --- | --- |
| context get | The context allows you to persistently set values for common parameters, like --project-id or --server-id, so you don't have to specify them on every command. | ✅ Covered | mittwald_context_get | src/constants/tool/mittwald-cli/context/get-cli.ts |  |
| context reset | This command resets any values for common parameters that you've previously set with 'context set'. | ✅ Covered | mittwald_context_reset | src/constants/tool/mittwald-cli/context/reset-cli.ts |  |
| context set | The context allows you to persistently set values for common parameters, like --project-id or --server-id, so you don't have to specify them on every command. | ✅ Covered | mittwald_context_set | src/constants/tool/mittwald-cli/context/set-cli.ts |  |

## conversation

| CLI Command | Description | Status | MCP Tool | Tool Definition | Notes |
| --- | --- | --- | --- | --- | --- |
| conversation categories | Get all conversation categories. | ✅ Covered | mittwald_conversation_categories | src/constants/tool/mittwald-cli/conversation/categories-cli.ts |  |
| conversation close | Close a conversation | ✅ Covered | mittwald_conversation_close | src/constants/tool/mittwald-cli/conversation/close-cli.ts |  |
| conversation create | Create a new conversation | ✅ Covered | mittwald_conversation_create | src/constants/tool/mittwald-cli/conversation/create-cli.ts |  |
| conversation list | Get all conversations the authenticated user has created or has access to. | ✅ Covered | mittwald_conversation_list | src/constants/tool/mittwald-cli/conversation/list-cli.ts |  |
| conversation reply | Reply to a conversation | ✅ Covered | mittwald_conversation_reply | src/constants/tool/mittwald-cli/conversation/reply-cli.ts |  |
| conversation show | Show a conversation and message history | ✅ Covered | mittwald_conversation_show | src/constants/tool/mittwald-cli/conversation/show-cli.ts |  |

## cronjob

| CLI Command | Description | Status | MCP Tool | Tool Definition | Notes |
| --- | --- | --- | --- | --- | --- |
| cronjob create |  | ✅ Covered | mittwald_cronjob_create | src/constants/tool/mittwald-cli/cronjob/create-cli.ts |  |
| cronjob delete | Delete a cron job | ✅ Covered | mittwald_cronjob_delete | src/constants/tool/mittwald-cli/cronjob/delete-cli.ts |  |
| cronjob execute |  | ✅ Covered | mittwald_cronjob_execute | src/constants/tool/mittwald-cli/cronjob/execute-cli.ts |  |
| cronjob execution abort |  | ✅ Covered | mittwald_cronjob_execution_abort | src/constants/tool/mittwald-cli/cronjob/execution-abort-cli.ts |  |
| cronjob execution get | Get a cron job execution. | ✅ Covered | mittwald_cronjob_execution_get | src/constants/tool/mittwald-cli/cronjob/execution-get-cli.ts |  |
| cronjob execution list | List CronjobExecutions belonging to a Cronjob. | ✅ Covered | mittwald_cronjob_execution_list | src/constants/tool/mittwald-cli/cronjob/execution-list-cli.ts |  |
| cronjob execution logs | This command prints the log output of a cronjob execution. When this command is run in a terminal, the output is piped through a pager. The pager is determined by your PAGER environment variable, with defaulting to "less". You can disable this behavior with the --no-pager flag. | ✅ Covered | mittwald_cronjob_execution_logs | src/constants/tool/mittwald-cli/cronjob/execution-logs-cli.ts |  |
| cronjob get | Get details of a cron job | ✅ Covered | mittwald_cronjob_get | src/constants/tool/mittwald-cli/cronjob/get-cli.ts |  |
| cronjob list | List cron jobs belonging to a project. | ✅ Covered | mittwald_cronjob_list | src/constants/tool/mittwald-cli/cronjob/list-cli.ts |  |
| cronjob update | Update an existing cron job | ✅ Covered | mittwald_cronjob_update | src/constants/tool/mittwald-cli/cronjob/update-cli.ts |  |

## database

| CLI Command | Description | Status | MCP Tool | Tool Definition | Notes |
| --- | --- | --- | --- | --- | --- |
| database list | List all kinds of databases belonging to a project. | ✅ Covered | mittwald_database_list | src/constants/tool/mittwald-cli/database/list-cli.ts |  |
| database mysql charsets | List available MySQL character sets and collations, optionally filtered by a MySQLVersion. | ✅ Covered | mittwald_database_mysql_charsets | src/constants/tool/mittwald-cli/database/mysql/charsets-cli.ts |  |
| database mysql create |  | ✅ Covered | mittwald_database_mysql_create | src/constants/tool/mittwald-cli/database/mysql/create-cli.ts |  |
| database mysql delete | Delete a MySQL database | ✅ Covered | mittwald_database_mysql_delete | src/constants/tool/mittwald-cli/database/mysql/delete-cli.ts |  |
| database mysql dump | This command creates a dump of a MySQL database via mysqldump and saves it to a local file. This command relies on connecting to your hosting environment via SSH. For this, it will use your systems SSH client under the hood, and will respect your SSH configuration in ~/.ssh/config. An exception to this is the 'User' configuration, which will be overridden by this command to either your authenticated mStudio user or the user specified with the --ssh-user flag. See https://linux.die.net/man/5/ssh_config for a reference on the configuration file. | ✅ Covered | mittwald_database_mysql_dump | src/constants/tool/mittwald-cli/database/mysql/dump-cli.ts |  |
| database mysql get | Get a MySQLDatabase. | ✅ Covered | mittwald_database_mysql_get | src/constants/tool/mittwald-cli/database/mysql/get-cli.ts |  |
| database mysql import | This command imports a mysqldump file from your local filesystem into a MySQL database. This command relies on connecting to your hosting environment via SSH. For this, it will use your systems SSH client under the hood, and will respect your SSH configuration in ~/.ssh/config. An exception to this is the 'User' configuration, which will be overridden by this command to either your authenticated mStudio user or the user specified with the --ssh-user flag. See https://linux.die.net/man/5/ssh_config for a reference on the configuration file. | ✅ Covered | mittwald_database_mysql_import | src/constants/tool/mittwald-cli/database/mysql/import-cli.ts |  |
| database mysql list | List MySQLDatabases belonging to a Project. | ✅ Covered | mittwald_database_mysql_list | src/constants/tool/mittwald-cli/database/mysql/list-cli.ts |  |
| database mysql phpmyadmin |  | ✅ Covered | mittwald_database_mysql_phpmyadmin | src/constants/tool/mittwald-cli/database/mysql/phpmyadmin-cli.ts |  |
| database mysql port-forward | This command forwards the TCP port of a MySQL database to a local port on your machine. This allows you to connect to the database as if it were running on your local machine. This command relies on connecting to your hosting environment via SSH. For this, it will use your systems SSH client under the hood, and will respect your SSH configuration in ~/.ssh/config. An exception to this is the 'User' configuration, which will be overridden by this command to either your authenticated mStudio user or the user specified with the --ssh-user flag. See https://linux.die.net/man/5/ssh_config for a reference on the configuration file. | ✅ Covered | mittwald_database_mysql_port_forward | src/constants/tool/mittwald-cli/database/mysql/port-forward-cli.ts |  |
| database mysql shell | This command opens an interactive mysql shell to a MySQL database. This command relies on connecting to your hosting environment via SSH. For this, it will use your systems SSH client under the hood, and will respect your SSH configuration in ~/.ssh/config. An exception to this is the 'User' configuration, which will be overridden by this command to either your authenticated mStudio user or the user specified with the --ssh-user flag. See https://linux.die.net/man/5/ssh_config for a reference on the configuration file. | ✅ Covered | mittwald_database_mysql_shell | src/constants/tool/mittwald-cli/database/mysql/shell-cli.ts |  |
| database mysql user create | Create a new MySQL user | ⚠️ Missing |  |  | MySQL user management subcommands not wrapped; need new handlers. — Allowed missing (intentional): Workstream C3: MySQL user management tooling in progress. |
| database mysql user delete | Delete a MySQL user | ⚠️ Missing |  |  | MySQL user management subcommands not wrapped; need new handlers. — Allowed missing (intentional): Workstream C3: MySQL user management tooling in progress. |
| database mysql user get | Get a MySQL user. | ⚠️ Missing |  |  | MySQL user management subcommands not wrapped; need new handlers. — Allowed missing (intentional): Workstream C3: MySQL user management tooling in progress. |
| database mysql user list | List MySQL users belonging to a database. | ⚠️ Missing |  |  | MySQL user management subcommands not wrapped; need new handlers. — Allowed missing (intentional): Workstream C3: MySQL user management tooling in progress. |
| database mysql user update | Update an existing MySQL user | ⚠️ Missing |  |  | MySQL user management subcommands not wrapped; need new handlers. — Allowed missing (intentional): Workstream C3: MySQL user management tooling in progress. |
| database mysql versions | List available MySQL versions. | ✅ Covered | mittwald_database_mysql_versions | src/constants/tool/mittwald-cli/database/mysql/versions-cli.ts |  |
| database redis create |  | ⚠️ Missing |  |  | Redis database lifecycle commands have no wrappers yet. — Allowed missing (intentional): Workstream C3: Redis lifecycle tooling pending CLI schema finalisation. |
| database redis get | Get a Redis database. | ⚠️ Missing |  |  | Redis database lifecycle commands have no wrappers yet. — Allowed missing (intentional): Workstream C3: Redis lifecycle tooling pending CLI schema finalisation. |
| database redis list | List Redis databases belonging to a project. | ⚠️ Missing |  |  | Redis database lifecycle commands have no wrappers yet. — Allowed missing (intentional): Workstream C3: Redis lifecycle tooling pending CLI schema finalisation. |
| database redis shell | This command opens an interactive redis-cli shell to a Redis database. This command relies on connecting to your hosting environment via SSH. For this, it will use your systems SSH client under the hood, and will respect your SSH configuration in ~/.ssh/config. An exception to this is the 'User' configuration, which will be overridden by this command to either your authenticated mStudio user or the user specified with the --ssh-user flag. See https://linux.die.net/man/5/ssh_config for a reference on the configuration file. | ⚠️ Missing |  |  | Redis database lifecycle commands have no wrappers yet. — Allowed missing (interactive): Requires MCP streaming transport; pending SDK evaluation and security review (see Workstream D) — Allowed missing (interactive): Requires MCP streaming transport; pending SDK evaluation and security review (see Workstream D) |
| database redis versions | List available Redis versions. | ⚠️ Missing |  |  | Redis database lifecycle commands have no wrappers yet. — Allowed missing (intentional): Workstream C3: Redis lifecycle tooling pending CLI schema finalisation. |

## ddev

| CLI Command | Description | Status | MCP Tool | Tool Definition | Notes |
| --- | --- | --- | --- | --- | --- |
| ddev init | This command initializes a new ddev configuration for an existing app installation in the current directory. More precisely, this command will do the following: 1. Create a new ddev configuration file in the .ddev directory, appropriate for the reference app installation 2. Initialize a new ddev project with the given configuration 3. Install the official mittwald DDEV addon 4. Add SSH credentials to the DDEV project This command can be run repeatedly to update the DDEV configuration of the project. Please note that this command requires DDEV to be installed on your system. | ⚠️ Missing |  |  | DDEV helpers defined but not exported as ToolRegistration; wiring incomplete. — Allowed missing (intentional): Workstream C6: DDEV wrappers require additional context injection. |
| ddev render-config | This command initializes a new ddev configuration in the current directory. | ⚠️ Missing |  |  | DDEV helpers defined but not exported as ToolRegistration; wiring incomplete. — Allowed missing (intentional): Workstream C6: DDEV wrappers require additional context injection. |

## domain

| CLI Command | Description | Status | MCP Tool | Tool Definition | Notes |
| --- | --- | --- | --- | --- | --- |
| domain dnszone get | gets a specific zone | ✅ Covered | mittwald_domain_dnszone_get | src/constants/tool/mittwald-cli/domain/dnszone/get-cli.ts |  |
| domain dnszone list | list all DNS zones by project ID | ✅ Covered | mittwald_domain_dnszone_list | src/constants/tool/mittwald-cli/domain/dnszone/list-cli.ts |  |
| domain dnszone update | Updates a record set of a DNS zone | ✅ Covered | mittwald_domain_dnszone_update | src/constants/tool/mittwald-cli/domain/dnszone/update-cli.ts |  |
| domain get | gets a specific domain | ✅ Covered | mittwald_domain_get | src/constants/tool/mittwald-cli/domain/get-cli.ts |  |
| domain list | List domains belonging to a project. | ✅ Covered | mittwald_domain_list | src/constants/tool/mittwald-cli/domain/list-cli.ts |  |
| domain virtualhost create | Create a new ingress | ✅ Covered | mittwald_domain_virtualhost_create | src/constants/tool/mittwald-cli/domain/virtualhost-create-cli.ts |  |
| domain virtualhost delete | Delete a virtual host | ✅ Covered | mittwald_domain_virtualhost_delete | src/constants/tool/mittwald-cli/domain/virtualhost-delete-cli.ts |  |
| domain virtualhost get | Get a virtual host. | ✅ Covered | mittwald_domain_virtualhost_get | src/constants/tool/mittwald-cli/domain/virtualhost-get-cli.ts |  |
| domain virtualhost list | List virtualhosts for a project. | ✅ Covered | mittwald_domain_virtualhost_list | src/constants/tool/mittwald-cli/domain/virtualhost-list-cli.ts |  |

## extension

| CLI Command | Description | Status | MCP Tool | Tool Definition | Notes |
| --- | --- | --- | --- | --- | --- |
| extension install | Install an extension in a project or organization | ✅ Covered | mittwald_extension_install | src/constants/tool/mittwald-cli/extension/install-cli.ts |  |
| extension list | Get all available extensions. | ✅ Covered | mittwald_extension_list | src/constants/tool/mittwald-cli/extension/list-cli.ts |  |
| extension list-installed | List installed extensions in an organization or project. | ✅ Covered | mittwald_extension_list_installed | src/constants/tool/mittwald-cli/extension/list-installed-cli.ts |  |
| extension uninstall | Remove an extension from an organization | ✅ Covered | mittwald_extension_uninstall | src/constants/tool/mittwald-cli/extension/uninstall-cli.ts |  |

## login

| CLI Command | Description | Status | MCP Tool | Tool Definition | Notes |
| --- | --- | --- | --- | --- | --- |
| login reset | Reset your local authentication state | ✅ Covered | mittwald_login_reset | src/constants/tool/mittwald-cli/login/reset-cli.ts |  |
| login status | Checks your current authentication status | ⚠️ Missing |  |  | Intentionally disabled; MCP server relies on token-based auth and per-command --token injection. — Allowed missing (intentional): MCP server uses per-command token injection; CLI login state not applicable — Allowed missing (intentional): MCP server uses per-command token injection; CLI login state not applicable |
| login token | Authenticate using an API token | ✅ Covered | mittwald_login_token | src/constants/tool/mittwald-cli/login/token-cli.ts |  |

## mail

| CLI Command | Description | Status | MCP Tool | Tool Definition | Notes |
| --- | --- | --- | --- | --- | --- |
| mail address create | This command can be used to create a new mail address in a project. A mail address is either associated with a mailbox, or forwards to another address. To create a forwarding address, use the --forward-to flag. This flag can be used multiple times to forward to multiple addresses. When no --forward-to flag is given, the command will create a mailbox for the address. In this case, the --catch-all flag can be used to make the mailbox a catch-all mailbox. When running this command with the --quiet flag, the output will contain the ID of the newly created address. In addition, when run with --generated-password the output will be the ID of the newly created address, followed by a tab character and the generated password. | ✅ Covered | mittwald_mail_address_create | src/constants/tool/mittwald-cli/mail/address/create-cli.ts |  |
| mail address delete | Delete a mail address | ✅ Covered | mittwald_mail_address_delete | src/constants/tool/mittwald-cli/mail/address/delete-cli.ts |  |
| mail address get | Get a specific mail address | ✅ Covered | mittwald_mail_address_get | src/constants/tool/mittwald-cli/mail/address/get-cli.ts |  |
| mail address list | Get all mail addresses for a project ID | ✅ Covered | mittwald_mail_address_list | src/constants/tool/mittwald-cli/mail/address/list-cli.ts |  |
| mail address update | This command can be used to update a mail address in a project. A mail address is either associated with a mailbox, or forwards to another address. To set forwarding addresses, use the --forward-to flag. Use the --catch-all flag to make the mailbox a catch-all mailbox. Use the --no-catch-all flag to make the mailbox a regular mailbox. When running this command with --generated-password the output will be the newly generated and set password. | ✅ Covered | mittwald_mail_address_update | src/constants/tool/mittwald-cli/mail/address/update-cli.ts |  |
| mail deliverybox create | This command can be used to create a new mail delivery box in a project. When running this command with the --quiet flag, the output will contain the ID of the newly created delivery box. In addition, when run with --generated-password the output will be the ID of the newly created delivery box, followed by a tab character and the generated password. | ✅ Covered | mittwald_mail_deliverybox_create | src/constants/tool/mittwald-cli/mail/deliverybox/create-cli.ts |  |
| mail deliverybox delete | Delete a mail delivery box | ✅ Covered | mittwald_mail_deliverybox_delete | src/constants/tool/mittwald-cli/mail/deliverybox/delete-cli.ts |  |
| mail deliverybox get | Get a specific delivery box | ✅ Covered | mittwald_mail_deliverybox_get | src/constants/tool/mittwald-cli/mail/deliverybox/get-cli.ts |  |
| mail deliverybox list | Get all delivery boxes by project ID | ✅ Covered | mittwald_mail_deliverybox_list | src/constants/tool/mittwald-cli/mail/deliverybox/list-cli.ts |  |
| mail deliverybox update | This command can be used to update a mail delivery box in a project. A mail delivery box is either associated with a mailbox, or forwards to another address. When running this command with --generated-password the output will be the newly generated and set password. | ✅ Covered | mittwald_mail_deliverybox_update | src/constants/tool/mittwald-cli/mail/deliverybox/update-cli.ts |  |

## org

| CLI Command | Description | Status | MCP Tool | Tool Definition | Notes |
| --- | --- | --- | --- | --- | --- |
| org delete | Delete an organization | ⚠️ Missing |  |  | Organization management commands missing wrappers; only invite-* specific tools exist. — Allowed missing (intentional): Workstream C4: Organisation CRUD wrappers planned following permission review. |
| org get | Get an organization profile. | ⚠️ Missing |  |  | Organization management commands missing wrappers; only invite-* specific tools exist. — Allowed missing (intentional): Workstream C4: Organisation CRUD wrappers planned following permission review. |
| org invite | Invite a user to an organization. | ⚠️ Missing |  |  | Organization management commands missing wrappers; only invite-* specific tools exist. — Allowed missing (intentional): Workstream C4: Invitation flow being consolidated before exposing via MCP. |
| org invite list | List all invites for an organization. | ✅ Covered | mittwald_org_invite_list | src/constants/tool/mittwald-cli/org/invite-list-cli.ts |  |
| org invite list-own | List all organization invites for the executing user. | ✅ Covered | mittwald_org_invite_list_own | src/constants/tool/mittwald-cli/org/invite-list-own-cli.ts |  |
| org invite revoke | Revoke an invite to an organization | ✅ Covered | mittwald_org_invite_revoke | src/constants/tool/mittwald-cli/org/invite-revoke-cli.ts |  |
| org list | Get all organizations the authenticated user has access to. | ⚠️ Missing |  |  | Organization management commands missing wrappers; only invite-* specific tools exist. — Allowed missing (intentional): Workstream C4: Organisation listing requires pagination harmonisation. |
| org membership list | List all memberships belonging to an organization. | ⚠️ Missing |  |  | Organization management commands missing wrappers; only invite-* specific tools exist. — Allowed missing (intentional): Workstream C4: Membership endpoints pending shared schema. |
| org membership list-own | List all organization memberships for the executing user. | ⚠️ Missing |  |  | Organization management commands missing wrappers; only invite-* specific tools exist. — Allowed missing (intentional): Workstream C4: Membership endpoints pending shared schema. |
| org membership revoke | Revoke a user's membership to an organization | ⚠️ Missing |  |  | Organization management commands missing wrappers; only invite-* specific tools exist. — Allowed missing (intentional): Workstream C4: Membership revoke requires audit logging design. |

## project

| CLI Command | Description | Status | MCP Tool | Tool Definition | Notes |
| --- | --- | --- | --- | --- | --- |
| project create | Create a new project | ✅ Covered | mittwald_project_create | src/constants/tool/mittwald-cli/project/create-cli.ts |  |
| project delete | Delete a project | ✅ Covered | mittwald_project_delete | src/constants/tool/mittwald-cli/project/delete-cli.ts |  |
| project filesystem usage | Get a project directory filesystem usage. | ✅ Covered | mittwald_project_filesystem_usage | src/constants/tool/mittwald-cli/project/filesystem-usage-cli.ts |  |
| project get | Get details of a project | ✅ Covered | mittwald_project_get | src/constants/tool/mittwald-cli/project/get-cli.ts |  |
| project invite get | Get a ProjectInvite. | ✅ Covered | mittwald_project_invite_get | src/constants/tool/mittwald-cli/project/invite-get-cli.ts |  |
| project invite list | List all invites belonging to a project. | ✅ Covered | mittwald_project_invite_list | src/constants/tool/mittwald-cli/project/invite-list-cli.ts |  |
| project invite list-own | List all project invites for the executing user. | ✅ Covered | mittwald_project_invite_list_own | src/constants/tool/mittwald-cli/project/invite-list-own-cli.ts |  |
| project list | List all projects that you have access to | ✅ Covered | mittwald_project_list | src/constants/tool/mittwald-cli/project/list-cli.ts |  |
| project membership get | Get a ProjectMembership | ✅ Covered | mittwald_project_membership_get | src/constants/tool/mittwald-cli/project/membership-get-cli.ts |  |
| project membership get-own | Get the executing user's membership in a Project. | ✅ Covered | mittwald_project_membership_get_own | src/constants/tool/mittwald-cli/project/membership-get-own-cli.ts |  |
| project membership list | List all memberships for a Project. | ✅ Covered | mittwald_project_membership_list | src/constants/tool/mittwald-cli/project/membership-list-cli.ts |  |
| project membership list-own | List ProjectMemberships belonging to the executing user. | ✅ Covered | mittwald_project_membership_list_own | src/constants/tool/mittwald-cli/project/membership-list-own-cli.ts |  |
| project ssh | Establishes an interactive SSH connection to a project. This command is a wrapper around your systems SSH client, and will respect your SSH configuration in ~/.ssh/config. An exception to this is the 'User' configuration, which will be overridden by this command to either your authenticated mStudio user or the user specified with the --ssh-user flag. See https://linux.die.net/man/5/ssh_config for a reference on the configuration file. | ✅ Covered | mittwald_project_ssh | src/constants/tool/mittwald-cli/project/ssh-cli.ts |  |
| project update | Update an existing project | ✅ Covered | mittwald_project_update | src/constants/tool/mittwald-cli/project/update-cli.ts |  |

## registry

| CLI Command | Description | Status | MCP Tool | Tool Definition | Notes |
| --- | --- | --- | --- | --- | --- |
| registry create |  | ⚠️ Missing |  |  | Covered by mittwald_container_registry_* tools; CLI topic renamed to registry, wrappers not renamed. — Allowed missing (intentional): Workstream B1: Registry tool rename/implementation tracked with taxonomy alignment. |
| registry delete | Delete a container registry | ⚠️ Missing |  |  | Covered by mittwald_container_registry_* tools; CLI topic renamed to registry, wrappers not renamed. — Allowed missing (intentional): Workstream B1: Registry tool rename/implementation tracked with taxonomy alignment. |
| registry list | List container registries. | ⚠️ Missing |  |  | Covered by mittwald_container_registry_* tools; CLI topic renamed to registry, wrappers not renamed. — Allowed missing (intentional): Workstream B1: Registry tool rename/implementation tracked with taxonomy alignment. |
| registry update | Update an existing container registry | ⚠️ Missing |  |  | Covered by mittwald_container_registry_* tools; CLI topic renamed to registry, wrappers not renamed. — Allowed missing (intentional): Workstream B1: Registry tool rename/implementation tracked with taxonomy alignment. |

## server

| CLI Command | Description | Status | MCP Tool | Tool Definition | Notes |
| --- | --- | --- | --- | --- | --- |
| server get | Get a server. | ✅ Covered | mittwald_server_get | src/constants/tool/mittwald-cli/server/get-cli.ts |  |
| server list | List servers for an organization or user. | ✅ Covered | mittwald_server_list | src/constants/tool/mittwald-cli/server/list-cli.ts |  |

## sftp-user

| CLI Command | Description | Status | MCP Tool | Tool Definition | Notes |
| --- | --- | --- | --- | --- | --- |
| sftp-user create |  | ✅ Covered | mittwald_sftp_user_create | src/constants/tool/mittwald-cli/sftp/user-create-cli.ts |  |
| sftp-user delete | Delete an SFTP user | ✅ Covered | mittwald_sftp_user_delete | src/constants/tool/mittwald-cli/sftp/user-delete-cli.ts |  |
| sftp-user list | List all SFTP users for a project. | ✅ Covered | mittwald_sftp_user_list | src/constants/tool/mittwald-cli/sftp/user-list-cli.ts |  |
| sftp-user update | Update an existing SFTP user | ✅ Covered | mittwald_sftp_user_update | src/constants/tool/mittwald-cli/sftp/user-update-cli.ts |  |

## ssh-user

| CLI Command | Description | Status | MCP Tool | Tool Definition | Notes |
| --- | --- | --- | --- | --- | --- |
| ssh-user create |  | ✅ Covered | mittwald_ssh_user_create | src/constants/tool/mittwald-cli/ssh/user-create-cli.ts |  |
| ssh-user delete | Delete an SSH user | ✅ Covered | mittwald_ssh_user_delete | src/constants/tool/mittwald-cli/ssh/user-delete-cli.ts |  |
| ssh-user list | List all SSH users for a project. | ✅ Covered | mittwald_ssh_user_list | src/constants/tool/mittwald-cli/ssh/user-list-cli.ts |  |
| ssh-user update | Update an existing SSH user | ✅ Covered | mittwald_ssh_user_update | src/constants/tool/mittwald-cli/ssh/user-update-cli.ts |  |

## stack

| CLI Command | Description | Status | MCP Tool | Tool Definition | Notes |
| --- | --- | --- | --- | --- | --- |
| stack delete | Delete a container stack | ⚠️ Missing |  |  | Covered by mittwald_container_stack_* tools; align naming with new CLI stack topic. — Allowed missing (intentional): Workstream B2: Stack command renaming pending alignment with CLI topic. |
| stack deploy | Deploys a docker-compose compatible file to a mittwald container stack | ⚠️ Missing |  |  | Covered by mittwald_container_stack_* tools; align naming with new CLI stack topic. — Allowed missing (intentional): Workstream B2: Stack command renaming pending alignment with CLI topic. |
| stack list | List container stacks for a given project. | ⚠️ Missing |  |  | Covered by mittwald_container_stack_* tools; align naming with new CLI stack topic. — Allowed missing (intentional): Workstream B2: Stack command renaming pending alignment with CLI topic. |
| stack ps | List all services within a given container stack. | ⚠️ Missing |  |  | Covered by mittwald_container_stack_* tools; align naming with new CLI stack topic. — Allowed missing (intentional): Workstream B2: Stack command renaming pending alignment with CLI topic. |

## user

| CLI Command | Description | Status | MCP Tool | Tool Definition | Notes |
| --- | --- | --- | --- | --- | --- |
| user api-token create | Create a new API token | ✅ Covered | mittwald_user_api_token_create | src/constants/tool/mittwald-cli/user/api-token/create-cli.ts |  |
| user api-token get | Get a specific API token | ✅ Covered | mittwald_user_api_token_get | src/constants/tool/mittwald-cli/user/api-token/get-cli.ts |  |
| user api-token list | List all API tokens of the user | ✅ Covered | mittwald_user_api_token_list | src/constants/tool/mittwald-cli/user/api-token/list-cli.ts |  |
| user api-token revoke | Revoke an API token | ✅ Covered | mittwald_user_api_token_revoke | src/constants/tool/mittwald-cli/user/api-token/revoke-cli.ts |  |
| user get | Get profile information for a user. | ✅ Covered | mittwald_user_get | src/constants/tool/mittwald-cli/user/get-cli.ts |  |
| user session get | Get a specific session | ✅ Covered | mittwald_user_session_get | src/constants/tool/mittwald-cli/user/session/get-cli.ts |  |
| user session list | List all active sessions | ✅ Covered | mittwald_user_session_list | src/constants/tool/mittwald-cli/user/session/list-cli.ts |  |
| user ssh-key create | Create and import a new SSH key | ✅ Covered | mittwald_user_ssh_key_create | src/constants/tool/mittwald-cli/user/ssh-key/create-cli.ts |  |
| user ssh-key delete | Delete an SSH key | ✅ Covered | mittwald_user_ssh_key_delete | src/constants/tool/mittwald-cli/user/ssh-key/delete-cli.ts |  |
| user ssh-key get | Get a specific SSH key | ✅ Covered | mittwald_user_ssh_key_get | src/constants/tool/mittwald-cli/user/ssh-key/get-cli.ts |  |
| user ssh-key import | Import an existing (local) SSH key | ✅ Covered | mittwald_user_ssh_key_import | src/constants/tool/mittwald-cli/user/ssh-key/import-cli.ts |  |
| user ssh-key list | Get your stored ssh keys | ✅ Covered | mittwald_user_ssh_key_list | src/constants/tool/mittwald-cli/user/ssh-key/list-cli.ts |  |

## volume

| CLI Command | Description | Status | MCP Tool | Tool Definition | Notes |
| --- | --- | --- | --- | --- | --- |
| volume create | Creates a new named volume in the project stack. The volume will be available for use by containers. | ⚠️ Missing |  |  | Volume management commands absent from MCP wrapper. — Allowed missing (intentional): Workstream C5: Volume management wrappers awaiting context scaffolding. |
| volume delete | Removes named volumes from the project stack. Be careful as this will permanently delete the volume data. | ⚠️ Missing |  |  | Volume management commands absent from MCP wrapper. — Allowed missing (intentional): Workstream C5: Volume management wrappers awaiting context scaffolding. |
| volume list | List volumes belonging to a project. | ⚠️ Missing |  |  | Volume management commands absent from MCP wrapper. — Allowed missing (intentional): Workstream C5: Volume management wrappers awaiting context scaffolding. |

