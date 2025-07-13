# Mittwald CLI Commands Index

This directory contains documentation for all `mw` CLI commands and their subcommands.

- [mw](mw.md) - Main command

## app

- [mw app](mw-app.md) - Manage apps, and app installations in your projects

  - [mw app copy](mw-app-copy.md)
  - [mw app download](mw-app-download.md)
  - [mw app get](mw-app-get.md)
  - [mw app list](mw-app-list.md)
  - [mw app list-upgrade-candidates](mw-app-list-upgrade-candidates.md)
  - [mw app open](mw-app-open.md)
  - [mw app ssh](mw-app-ssh.md)
  - [mw app uninstall](mw-app-uninstall.md)
  - [mw app update](mw-app-update.md)
  - [mw app upgrade](mw-app-upgrade.md)
  - [mw app upload](mw-app-upload.md)
  - [mw app versions](mw-app-versions.md)
### app create

- [mw app create](mw-app-create.md)

  - [mw app create node](mw-app-create-node.md)
  - [mw app create php](mw-app-create-php.md)
  - [mw app create php-worker](mw-app-create-php-worker.md)
  - [mw app create python](mw-app-create-python.md)
  - [mw app create static](mw-app-create-static.md)
### app dependency

- [mw app dependency](mw-app-dependency.md)

  - [mw app dependency list](mw-app-dependency-list.md)
  - [mw app dependency update](mw-app-dependency-update.md)
  - [mw app dependency versions](mw-app-dependency-versions.md)
### app install

- [mw app install](mw-app-install.md)

  - [mw app install contao](mw-app-install-contao.md)
  - [mw app install joomla](mw-app-install-joomla.md)
  - [mw app install matomo](mw-app-install-matomo.md)
  - [mw app install nextcloud](mw-app-install-nextcloud.md)
  - [mw app install shopware5](mw-app-install-shopware5.md)
  - [mw app install shopware6](mw-app-install-shopware6.md)
  - [mw app install typo3](mw-app-install-typo3.md)
  - [mw app install wordpress](mw-app-install-wordpress.md)

## backup

- [mw backup](mw-backup.md) - Manage backups of your projects

  - [mw backup create](mw-backup-create.md)
  - [mw backup delete](mw-backup-delete.md)
  - [mw backup download](mw-backup-download.md)
  - [mw backup get](mw-backup-get.md)
  - [mw backup list](mw-backup-list.md)
### backup schedule

- [mw backup schedule](mw-backup-schedule.md)

  - [mw backup schedule create](mw-backup-schedule-create.md)
  - [mw backup schedule delete](mw-backup-schedule-delete.md)
  - [mw backup schedule list](mw-backup-schedule-list.md)
  - [mw backup schedule update](mw-backup-schedule-update.md)

## context

- [mw context](mw-context.md) - Save certain environment parameters for later use

  - [mw context get](mw-context-get.md)
  - [mw context reset](mw-context-reset.md)
  - [mw context set](mw-context-set.md)

## contributor

- [mw contributor](mw-contributor.md) - Commands for mStudio marketplace contributors


## conversation

- [mw conversation](mw-conversation.md) - Manage your support cases

  - [mw conversation categories](mw-conversation-categories.md)
  - [mw conversation close](mw-conversation-close.md)
  - [mw conversation create](mw-conversation-create.md)
  - [mw conversation list](mw-conversation-list.md)
  - [mw conversation reply](mw-conversation-reply.md)
  - [mw conversation show](mw-conversation-show.md)

## cronjob

- [mw cronjob](mw-cronjob.md) - Manage cronjobs of your projects

  - [mw cronjob create](mw-cronjob-create.md)
  - [mw cronjob delete](mw-cronjob-delete.md)
  - [mw cronjob execute](mw-cronjob-execute.md)
  - [mw cronjob get](mw-cronjob-get.md)
  - [mw cronjob list](mw-cronjob-list.md)
  - [mw cronjob update](mw-cronjob-update.md)
### cronjob execution

- [mw cronjob execution](mw-cronjob-execution.md)

  - [mw cronjob execution abort](mw-cronjob-execution-abort.md)
  - [mw cronjob execution get](mw-cronjob-execution-get.md)
  - [mw cronjob execution list](mw-cronjob-execution-list.md)
  - [mw cronjob execution logs](mw-cronjob-execution-logs.md)

## database

- [mw database](mw-database.md) - Manage databases (like MySQL and Redis) in your projects

  - [mw database list](mw-database-list.md)
### database mysql

- [mw database mysql](mw-database-mysql.md)

  - [mw database mysql charsets](mw-database-mysql-charsets.md)
  - [mw database mysql create](mw-database-mysql-create.md)
  - [mw database mysql delete](mw-database-mysql-delete.md)
  - [mw database mysql dump](mw-database-mysql-dump.md)
  - [mw database mysql get](mw-database-mysql-get.md)
  - [mw database mysql import](mw-database-mysql-import.md)
  - [mw database mysql list](mw-database-mysql-list.md)
  - [mw database mysql phpmyadmin](mw-database-mysql-phpmyadmin.md)
  - [mw database mysql port-forward](mw-database-mysql-port-forward.md)
  - [mw database mysql shell](mw-database-mysql-shell.md)
  - [mw database mysql versions](mw-database-mysql-versions.md)
### database redis

- [mw database redis](mw-database-redis.md)

  - [mw database redis create](mw-database-redis-create.md)
  - [mw database redis get](mw-database-redis-get.md)
  - [mw database redis list](mw-database-redis-list.md)
  - [mw database redis shell](mw-database-redis-shell.md)
  - [mw database redis versions](mw-database-redis-versions.md)

## ddev

- [mw ddev](mw-ddev.md) - Integrate your mittwald projects with DDEV

  - [mw ddev init](mw-ddev-init.md)
  - [mw ddev render-config](mw-ddev-render-config.md)

## domain

- [mw domain](mw-domain.md) - Manage domains, virtual hosts and DNS settings in your projects

  - [mw domain get](mw-domain-get.md)
  - [mw domain list](mw-domain-list.md)
### domain dnszone

- [mw domain dnszone](mw-domain-dnszone.md)

  - [mw domain dnszone get](mw-domain-dnszone-get.md)
  - [mw domain dnszone list](mw-domain-dnszone-list.md)
  - [mw domain dnszone update](mw-domain-dnszone-update.md)
### domain virtualhost

- [mw domain virtualhost](mw-domain-virtualhost.md)

  - [mw domain virtualhost create](mw-domain-virtualhost-create.md)
  - [mw domain virtualhost delete](mw-domain-virtualhost-delete.md)
  - [mw domain virtualhost get](mw-domain-virtualhost-get.md)
  - [mw domain virtualhost list](mw-domain-virtualhost-list.md)

## extension

- [mw extension](mw-extension.md) - Install and manage extensions in your organisations and projects

  - [mw extension install](mw-extension-install.md)
  - [mw extension list](mw-extension-list.md)
  - [mw extension list-installed](mw-extension-list-installed.md)
  - [mw extension uninstall](mw-extension-uninstall.md)

## login

- [mw login](mw-login.md) - Manage your client authentication

  - [mw login status](mw-login-status.md)

## mail

- [mw mail](mw-mail.md) - Manage mailboxes and mail addresses in your projects

### mail address

- [mw mail address](mw-mail-address.md)

  - [mw mail address create](mw-mail-address-create.md)
  - [mw mail address delete](mw-mail-address-delete.md)
  - [mw mail address get](mw-mail-address-get.md)
  - [mw mail address list](mw-mail-address-list.md)
  - [mw mail address update](mw-mail-address-update.md)
### mail deliverybox

- [mw mail deliverybox](mw-mail-deliverybox.md)

  - [mw mail deliverybox create](mw-mail-deliverybox-create.md)
  - [mw mail deliverybox delete](mw-mail-deliverybox-delete.md)
  - [mw mail deliverybox get](mw-mail-deliverybox-get.md)
  - [mw mail deliverybox list](mw-mail-deliverybox-list.md)
  - [mw mail deliverybox update](mw-mail-deliverybox-update.md)

## org

- [mw org](mw-org.md) - Manage your organizations, and also any kinds of user memberships concerning these organizations.

  - [mw org delete](mw-org-delete.md)
  - [mw org get](mw-org-get.md)
  - [mw org invite](mw-org-invite.md)
  - [mw org list](mw-org-list.md)
### org invite

- [mw org invite](mw-org-invite.md)

### org membership

- [mw org membership](mw-org-membership.md)

  - [mw org membership list](mw-org-membership-list.md)
  - [mw org membership list-own](mw-org-membership-list-own.md)
  - [mw org membership revoke](mw-org-membership-revoke.md)

## project

- [mw project](mw-project.md) - Manage your projects, and also any kinds of user memberships concerning these projects.

  - [mw project create](mw-project-create.md)
  - [mw project delete](mw-project-delete.md)
  - [mw project get](mw-project-get.md)
  - [mw project list](mw-project-list.md)
  - [mw project ssh](mw-project-ssh.md)
  - [mw project update](mw-project-update.md)
### project filesystem

- [mw project filesystem](mw-project-filesystem.md)

  - [mw project filesystem usage](mw-project-filesystem-usage.md)
### project invite

- [mw project invite](mw-project-invite.md)

  - [mw project invite get](mw-project-invite-get.md)
  - [mw project invite list](mw-project-invite-list.md)
  - [mw project invite list-own](mw-project-invite-list-own.md)
### project membership

- [mw project membership](mw-project-membership.md)

  - [mw project membership get](mw-project-membership-get.md)
  - [mw project membership get-own](mw-project-membership-get-own.md)
  - [mw project membership list](mw-project-membership-list.md)
  - [mw project membership list-own](mw-project-membership-list-own.md)

## server

- [mw server](mw-server.md) - Manage your servers

  - [mw server get](mw-server-get.md)
  - [mw server list](mw-server-list.md)

## sftp-user

- [mw sftp-user](mw-sftp-user.md) - Manage SFTP users of your projects

  - [mw sftp-user create](mw-sftp-user-create.md)
  - [mw sftp-user delete](mw-sftp-user-delete.md)
  - [mw sftp-user list](mw-sftp-user-list.md)
  - [mw sftp-user update](mw-sftp-user-update.md)

## ssh-user

- [mw ssh-user](mw-ssh-user.md) - Manage SSH users of your projects

  - [mw ssh-user create](mw-ssh-user-create.md)
  - [mw ssh-user delete](mw-ssh-user-delete.md)
  - [mw ssh-user list](mw-ssh-user-list.md)
  - [mw ssh-user update](mw-ssh-user-update.md)

## user

- [mw user](mw-user.md) - Manage your own user account

  - [mw user get](mw-user-get.md)
### user api-token

- [mw user api-token](mw-user-api-token.md)

  - [mw user api-token create](mw-user-api-token-create.md)
