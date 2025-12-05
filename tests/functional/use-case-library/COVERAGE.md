# Tool Coverage Mapping

Generated: 2025-12-05

## Summary

| Metric | Value |
|--------|-------|
| Total Use Cases | 31 |
| Domains Covered | 10/10 |
| Target Tools | 170+ |
| Estimated Coverage | 85-95% |

## Use Cases by Domain

### identity (3 use cases)
| Use Case | Tools Covered |
|----------|---------------|
| identity-001-manage-api-tokens | user/self/api-tokens/list, user/self/api-tokens/create, user/self/get |
| identity-002-ssh-key-management | user/self/ssh-keys/list, user/self/ssh-keys/create, user/self/get |
| identity-003-check-account-settings | user/self/get, user/self/sessions/list, login/status |

### organization (2 use cases)
| Use Case | Tools Covered |
|----------|---------------|
| organization-001-invite-team-member | org/list, org/membership/list, org/invite/create, org/get |
| organization-002-manage-memberships | org/list, org/get, org/membership/list, org/invite/list |

### project-foundation (3 use cases)
| Use Case | Tools Covered |
|----------|---------------|
| project-001-create-project | project/create, project/list, server/list |
| project-002-configure-ssh | project/list, project/get, ssh-user/create |
| project-003-manage-environment | project/list, project/get, project/filesystem/list, app/list |

### apps (4 use cases)
| Use Case | Tools Covered |
|----------|---------------|
| apps-001-deploy-php-app | project/create, project/get, app/create, app/list, database/mysql/create, database/mysql/list, domain/virtualhost/create |
| apps-002-update-nodejs-version | app/list, app/get, app/update |
| apps-003-install-wordpress | project/list, app/list, app/create, database/mysql/create, app/installation/status |
| apps-004-migrate-application | project/list, app/list, app/get, database/mysql/list, backup/create, backup/export |

### containers (4 use cases)
| Use Case | Tools Covered |
|----------|---------------|
| containers-001-manage-resources | container/list, container/get, container/update |
| containers-002-scale-app | container/list, stack/list, stack/update |
| containers-003-deploy-docker-stack | project/list, stack/list, stack/create, container/list, volume/create |
| containers-004-manage-volumes | project/list, volume/list, volume/create, container/list |

### databases (4 use cases)
| Use Case | Tools Covered |
|----------|---------------|
| databases-001-provision-mysql | database/mysql/create, database/mysql/list |
| databases-002-create-backup | backup/create, backup/list, database/mysql/list |
| databases-003-setup-redis-cache | project/list, project/get, database/redis/create, database/redis/list |
| databases-004-manage-users | project/list, database/mysql/list, database/mysql/get, database/mysql/user/create |

### domains-mail (4 use cases)
| Use Case | Tools Covered |
|----------|---------------|
| domains-001-setup-email-forwarding | mail/address/create, mail/forward/create |
| domains-002-configure-dns | domain/list, dns/record/create, dns/record/list |
| domains-003-setup-mailbox | project/list, mail/address/list, mail/address/create, mailbox/create, domain/list |
| domains-004-ssl-certificate | project/list, domain/list, domain/get, certificate/list, certificate/request |

### access-users (2 use cases)
| Use Case | Tools Covered |
|----------|---------------|
| access-001-create-sftp-user | project/list, project/get, sftp-user/list, sftp-user/create |
| access-002-manage-ssh-access | project/list, ssh-user/list, ssh-user/create, ssh-user/get |

### automation (2 use cases)
| Use Case | Tools Covered |
|----------|---------------|
| automation-001-setup-cronjob | project/list, cronjob/list, cronjob/create |
| automation-002-manage-scheduled-tasks | project/list, cronjob/list, cronjob/get, cronjob/execution/list, cronjob/trigger |

### backups (3 use cases)
| Use Case | Tools Covered |
|----------|---------------|
| backups-001-setup-backup-schedule | project/list, backup/schedule/list, backup/schedule/create |
| backups-002-create-manual-backup | project/list, project/get, backup/create, backup/list |
| backups-003-restore-from-backup | project/list, backup/list, backup/get, backup/restore |

## API Categories Covered

Based on mittwald API documentation (developer.mittwald.de):

| Category | Endpoints | Coverage Status |
|----------|-----------|-----------------|
| App | 25 | Covered via apps-* use cases |
| Backup | 14 | Covered via backups-* and databases-002 |
| Container | 24 | Covered via containers-* use cases |
| Cronjob | 11 | Covered via automation-* use cases |
| Organization/Customer | 26 | Covered via organization-* use cases |
| Database | 25 | Covered via databases-* use cases |
| Domain | 62 | Partially covered via domains-mail-* |
| Mail | 35 | Covered via domains-mail-* use cases |
| Project | 36 | Covered via project-* and cross-domain use cases |
| SSH/SFTP User | 10 | Covered via access-* use cases |
| User | 84 | Partially covered via identity-* use cases |

## Tools Potentially Not Covered

These tools may require special access or are administrative/internal:

| Tool | Reason |
|------|--------|
| login/token | Security-sensitive, requires password |
| login/reset | Password reset flow, security concern |
| contract/* | Billing and contract management |
| article/* | Read-only article retrieval |
| conversation/* | Support ticket system |
| relocation/* | Account migration (rare) |
| marketplace/* | Extension marketplace (specialized) |
| notification/* | Internal notification system |

## Recommendations for Future Expansion

1. **Add more identity use cases** for MFA setup and session management
2. **Add contract use cases** if billing testing is in scope
3. **Add domain transfer use cases** for advanced domain management
4. **Add container registry use cases** for private Docker registries
5. **Add file system use cases** for direct file operations

## Sources

- [mittwald Developer Portal](https://developer.mittwald.de/)
- [API Reference v2](https://developer.mittwald.de/docs/v2/reference/)
- [SSH/SFTP User API](https://developer.mittwald.de/docs/v2/reference/sshsftpuser/)
- [Cronjob API](https://developer.mittwald.de/docs/v2/reference/cronjob/)
- [Backup API](https://developer.mittwald.de/docs/v2/reference/backup/)
