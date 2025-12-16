# Cross-Domain Dependencies

This document identifies tools that depend on resources from other domains.

## Summary

| Relationship | Count |
|--------------|-------|
| access-users → project-foundation | 4 |
| apps → project-foundation | 14 |
| automation → apps | 2 |
| backups → project-foundation | 4 |
| containers → project-foundation | 8 |
| databases → project-foundation | 5 |
| domains-mail → project-foundation | 6 |

## Details

### access-users → project-foundation

- `sftp/user-create` depends on `project/list`
- `sftp/user-list` depends on `project/list`
- `ssh/user-create` depends on `project/list`
- `ssh/user-list` depends on `project/list`

### apps → project-foundation

- `app/create/node` depends on `project/list`
- `app/create/php` depends on `project/list`
- `app/create/php-worker` depends on `project/list`
- `app/create/python` depends on `project/list`
- `app/create/static` depends on `project/list`
- `app/install/contao` depends on `project/list`
- `app/install/joomla` depends on `project/list`
- `app/install/matomo` depends on `project/list`
- `app/install/nextcloud` depends on `project/list`
- `app/install/shopware5` depends on `project/list`
- `app/install/shopware6` depends on `project/list`
- `app/install/typo3` depends on `project/list`
- `app/install/wordpress` depends on `project/list`
- `app/list` depends on `project/list`

### automation → apps

- `cronjob/create` depends on `app/list`
- `cronjob/list` depends on `app/list`

### backups → project-foundation

- `backup/create` depends on `project/list`
- `backup/list` depends on `project/list`
- `backup/schedule-create` depends on `project/list`
- `backup/schedule-list` depends on `project/list`

### containers → project-foundation

- `container/list-services` depends on `project/list`
- `container/run` depends on `project/list`
- `registry/create` depends on `project/list`
- `registry/list` depends on `project/list`
- `stack/deploy` depends on `project/list`
- `stack/list` depends on `project/list`
- `volume/create` depends on `project/list`
- `volume/list` depends on `project/list`

### databases → project-foundation

- `database/list` depends on `project/list`
- `database/mysql/create` depends on `project/list`
- `database/mysql/list` depends on `project/list`
- `database/redis/create` depends on `project/list`
- `database/redis/list` depends on `project/list`

### domains-mail → project-foundation

- `certificate/list` depends on `project/list`
- `domain/list` depends on `project/list`
- `mail/address/create` depends on `project/list`
- `mail/address/list` depends on `project/list`
- `mail/deliverybox/create` depends on `project/list`
- `mail/deliverybox/list` depends on `project/list`

## Implications

1. When executing evals, ensure cross-domain dependencies are established first
2. Domain-parallel execution must respect these dependencies
3. Resource cleanup should follow reverse dependency order