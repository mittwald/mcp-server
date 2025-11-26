# Tool Concurrency Guide

> Understanding which Mittwald MCP tools can be safely called in parallel.

## Summary

The Mittwald MCP server provides **173 tools**. When executing multiple tools in parallel (batch requests), understanding their concurrency characteristics is important.

| Category | Count | Percentage |
|----------|-------|------------|
| **Safe** (read-only) | 82 | 47.4% |
| **Potentially Racy** (mutations) | 91 | 52.6% |
| **Total** | 173 | 100% |

## What This Means

### Safe Tools
- **Can be called concurrently** without issues
- Perform read-only operations
- Don't modify system state
- Examples: `list`, `get`, `show`, `dump`, `status`

### Potentially Racy Tools
- **May conflict** if called in parallel on the same resource
- Perform write, create, delete, or update operations
- Modify system state
- Examples: `create`, `delete`, `update`, `deploy`, `restart`

> **Note:** "Potentially racy" doesn't mean all concurrent calls will fail. Calls affecting **different resources** may still be safe. The risk is concurrent operations on the **same resource**.

---

## Safe Tools (82 total)

These tools can be called concurrently without coordination.

### App Management (8 tools)
| Tool | Description |
|------|-------------|
| `app_dependency-list` | List app dependencies |
| `app_dependency-versions` | Show dependency versions |
| `app_download` | Download app files |
| `app_get` | Get app details |
| `app_list` | List apps |
| `app_open` | Open app URL |
| `app_ssh` | SSH into app |
| `app_versions` | List app versions |

### Backup (3 tools)
| Tool | Description |
|------|-------------|
| `backup_download` | Download backup |
| `backup_get` | Get backup details |
| `backup_list` | List backups |

### Container (2 tools)
| Tool | Description |
|------|-------------|
| `container_list-services` | List container services |
| `container_logs` | View container logs |

### Context (3 tools)
| Tool | Description |
|------|-------------|
| `context_accessible-projects` | List accessible projects |
| `context_get` | Get current context |
| `context_set` | Set context (local state only) |

### Conversation (4 tools)
| Tool | Description |
|------|-------------|
| `conversation_categories` | List conversation categories |
| `conversation_list` | List conversations |
| `conversation_reply` | Reply to conversation |
| `conversation_show` | Show conversation details |

### Cronjob (5 tools)
| Tool | Description |
|------|-------------|
| `cronjob_execution-get` | Get execution details |
| `cronjob_execution-list` | List executions |
| `cronjob_execution-logs` | View execution logs |
| `cronjob_get` | Get cronjob details |
| `cronjob_list` | List cronjobs |

### Database (16 tools)
| Tool | Description |
|------|-------------|
| `database_index` | List database index |
| `database_list` | List databases |
| `database_mysql_charsets` | List MySQL charsets |
| `database_mysql_dump` | Dump MySQL database |
| `database_mysql_get` | Get MySQL database details |
| `database_mysql_list` | List MySQL databases |
| `database_mysql_phpmyadmin` | Open phpMyAdmin |
| `database_mysql_port-forward` | Port forward MySQL |
| `database_mysql_shell` | Open MySQL shell |
| `database_mysql_user-get` | Get MySQL user |
| `database_mysql_user-list` | List MySQL users |
| `database_mysql_versions` | List MySQL versions |
| `database_redis_get` | Get Redis database |
| `database_redis_list` | List Redis databases |
| `database_redis_versions` | List Redis versions |

### Domain (6 tools)
| Tool | Description |
|------|-------------|
| `domain_dnszone-get` | Get DNS zone |
| `domain_dnszone-list` | List DNS zones |
| `domain_get` | Get domain details |
| `domain_list` | List domains |
| `domain_virtualhost-get` | Get virtualhost |
| `domain_virtualhost-list` | List virtualhosts |

### Extension (1 tool)
| Tool | Description |
|------|-------------|
| `extension_list` | List extensions |

### Login (2 tools)
| Tool | Description |
|------|-------------|
| `login_status` | Check login status |
| `login_token` | Get/show token |

### Mail (4 tools)
| Tool | Description |
|------|-------------|
| `mail_address-get` | Get mail address |
| `mail_address-list` | List mail addresses |
| `mail_deliverybox-get` | Get deliverybox |
| `mail_deliverybox-list` | List deliveryboxes |

### Organization (5 tools)
| Tool | Description |
|------|-------------|
| `org_get` | Get organization details |
| `org_list` | List organizations |
| `org_membership-get` | Get membership details |
| `org_membership-list` | List memberships |
| `org_membership-list-own` | List own memberships |

### Project (8 tools)
| Tool | Description |
|------|-------------|
| `project_filesystem-usage` | Get filesystem usage |
| `project_get` | Get project details |
| `project_list` | List projects |
| `project_membership-get` | Get membership |
| `project_membership-get-own` | Get own membership |
| `project_membership-list` | List memberships |
| `project_membership-list-own` | List own memberships |
| `project_ssh` | SSH into project |

### Registry (1 tool)
| Tool | Description |
|------|-------------|
| `registry_list` | List registries |

### Server (2 tools)
| Tool | Description |
|------|-------------|
| `server_get` | Get server details |
| `server_list` | List servers |

### SFTP (1 tool)
| Tool | Description |
|------|-------------|
| `sftp_user-list` | List SFTP users |

### SSH (1 tool)
| Tool | Description |
|------|-------------|
| `ssh_user-list` | List SSH users |

### Stack (2 tools)
| Tool | Description |
|------|-------------|
| `stack_list` | List stacks |
| `stack_ps` | Show stack processes |

### User (7 tools)
| Tool | Description |
|------|-------------|
| `user_api-token-get` | Get API token |
| `user_api-token-list` | List API tokens |
| `user_get` | Get user details |
| `user_session-get` | Get session |
| `user_session-list` | List sessions |
| `user_ssh-key-get` | Get SSH key |
| `user_ssh-key-list` | List SSH keys |

### Volume (1 tool)
| Tool | Description |
|------|-------------|
| `volume_list` | List volumes |

### Development (2 tools)
| Tool | Description |
|------|-------------|
| `ddev_init` | Initialize DDEV |
| `ddev_render-config` | Render DDEV config |

---

## Potentially Racy Tools (91 total)

These tools should be coordinated when operating on the same resource.

### App Management (20 tools)
| Tool | Description | Risk |
|------|-------------|------|
| `app_copy` | Copy app | Duplicate resource creation |
| `app_create_node` | Create Node.js app | Resource conflict |
| `app_create_php` | Create PHP app | Resource conflict |
| `app_create_php-worker` | Create PHP worker | Resource conflict |
| `app_create_python` | Create Python app | Resource conflict |
| `app_create_static` | Create static app | Resource conflict |
| `app_dependency-update` | Update dependencies | State mutation |
| `app_install_contao` | Install Contao | Installation conflict |
| `app_install_joomla` | Install Joomla | Installation conflict |
| `app_install_matomo` | Install Matomo | Installation conflict |
| `app_install_nextcloud` | Install Nextcloud | Installation conflict |
| `app_install_shopware5` | Install Shopware 5 | Installation conflict |
| `app_install_shopware6` | Install Shopware 6 | Installation conflict |
| `app_install_typo3` | Install TYPO3 | Installation conflict |
| `app_install_wordpress` | Install WordPress | Installation conflict |
| `app_uninstall` | Uninstall app | Deletion conflict |
| `app_update` | Update app | State mutation |
| `app_upgrade` | Upgrade app | State mutation |
| `app_upload` | Upload to app | File conflict |

### Backup (6 tools)
| Tool | Description | Risk |
|------|-------------|------|
| `backup_create` | Create backup | Resource creation |
| `backup_delete` | Delete backup | Deletion conflict |
| `backup_schedule-create` | Create schedule | Resource creation |
| `backup_schedule-delete` | Delete schedule | Deletion conflict |
| `backup_schedule-list` | List schedules | N/A (safe) |
| `backup_schedule-update` | Update schedule | State mutation |

### Container (7 tools)
| Tool | Description | Risk |
|------|-------------|------|
| `container_delete` | Delete container | Deletion conflict |
| `container_recreate` | Recreate container | State mutation |
| `container_restart` | Restart container | State conflict |
| `container_run` | Run container | Resource creation |
| `container_start` | Start container | State conflict |
| `container_stop` | Stop container | State conflict |
| `container_update` | Update container | State mutation |

### Context (1 tool)
| Tool | Description | Risk |
|------|-------------|------|
| `context_reset` | Reset context | State mutation |

### Conversation (2 tools)
| Tool | Description | Risk |
|------|-------------|------|
| `conversation_close` | Close conversation | State mutation |
| `conversation_create` | Create conversation | Resource creation |

### Cronjob (5 tools)
| Tool | Description | Risk |
|------|-------------|------|
| `cronjob_create` | Create cronjob | Resource creation |
| `cronjob_delete` | Delete cronjob | Deletion conflict |
| `cronjob_execute` | Execute cronjob | Execution conflict |
| `cronjob_execution-abort` | Abort execution | State mutation |
| `cronjob_update` | Update cronjob | State mutation |

### Database (7 tools)
| Tool | Description | Risk |
|------|-------------|------|
| `database_mysql_create` | Create MySQL DB | Resource creation |
| `database_mysql_delete` | Delete MySQL DB | Deletion conflict |
| `database_mysql_import` | Import to MySQL | Data conflict |
| `database_mysql_user-create` | Create MySQL user | Resource creation |
| `database_mysql_user-delete` | Delete MySQL user | Deletion conflict |
| `database_mysql_user-update` | Update MySQL user | State mutation |
| `database_redis_create` | Create Redis DB | Resource creation |

### Domain (3 tools)
| Tool | Description | Risk |
|------|-------------|------|
| `domain_dnszone-update` | Update DNS zone | State mutation |
| `domain_virtualhost-create` | Create virtualhost | Resource creation |
| `domain_virtualhost-delete` | Delete virtualhost | Deletion conflict |

### Extension (3 tools)
| Tool | Description | Risk |
|------|-------------|------|
| `extension_install` | Install extension | Resource creation |
| `extension_list-installed` | List installed | N/A (safe) |
| `extension_uninstall` | Uninstall extension | Deletion conflict |

### Login (1 tool)
| Tool | Description | Risk |
|------|-------------|------|
| `login_reset` | Reset login | State mutation |

### Mail (6 tools)
| Tool | Description | Risk |
|------|-------------|------|
| `mail_address-create` | Create mail address | Resource creation |
| `mail_address-delete` | Delete mail address | Deletion conflict |
| `mail_address-update` | Update mail address | State mutation |
| `mail_deliverybox-create` | Create deliverybox | Resource creation |
| `mail_deliverybox-delete` | Delete deliverybox | Deletion conflict |
| `mail_deliverybox-update` | Update deliverybox | State mutation |

### Organization (6 tools)
| Tool | Description | Risk |
|------|-------------|------|
| `org_delete` | Delete organization | Deletion conflict |
| `org_invite` | Invite to org | Resource creation |
| `org_invite-list` | List invites | N/A (safe) |
| `org_invite-list-own` | List own invites | N/A (safe) |
| `org_invite-revoke` | Revoke invite | Deletion conflict |
| `org_membership-revoke` | Revoke membership | Deletion conflict |

### Project (6 tools)
| Tool | Description | Risk |
|------|-------------|------|
| `project_create` | Create project | Resource creation |
| `project_delete` | Delete project | Deletion conflict |
| `project_invite-get` | Get invite | N/A (safe) |
| `project_invite-list` | List invites | N/A (safe) |
| `project_invite-list-own` | List own invites | N/A (safe) |
| `project_update` | Update project | State mutation |

### Registry (3 tools)
| Tool | Description | Risk |
|------|-------------|------|
| `registry_create` | Create registry | Resource creation |
| `registry_delete` | Delete registry | Deletion conflict |
| `registry_update` | Update registry | State mutation |

### SFTP (4 tools)
| Tool | Description | Risk |
|------|-------------|------|
| `sftp_user-create` | Create SFTP user | Resource creation |
| `sftp_user-delete` | Delete SFTP user | Deletion conflict |
| `sftp_user-list` | List SFTP users | N/A (safe) |
| `sftp_user-update` | Update SFTP user | State mutation |

### SSH (4 tools)
| Tool | Description | Risk |
|------|-------------|------|
| `ssh_user-create` | Create SSH user | Resource creation |
| `ssh_user-delete` | Delete SSH user | Deletion conflict |
| `ssh_user-list` | List SSH users | N/A (safe) |
| `ssh_user-update` | Update SSH user | State mutation |

### Stack (2 tools)
| Tool | Description | Risk |
|------|-------------|------|
| `stack_delete` | Delete stack | Deletion conflict |
| `stack_deploy` | Deploy stack | State mutation |

### User (5 tools)
| Tool | Description | Risk |
|------|-------------|------|
| `user_api-token-create` | Create API token | Resource creation |
| `user_api-token-revoke` | Revoke API token | Deletion conflict |
| `user_ssh-key-create` | Create SSH key | Resource creation |
| `user_ssh-key-delete` | Delete SSH key | Deletion conflict |
| `user_ssh-key-import` | Import SSH key | Resource creation |

### Volume (2 tools)
| Tool | Description | Risk |
|------|-------------|------|
| `volume_create` | Create volume | Resource creation |
| `volume_delete` | Delete volume | Deletion conflict |

---

## Recommendations for MCP Clients

### Safe Parallelization

All 82 safe tools can be called concurrently without coordination:

```
✓ Batch multiple `list` operations freely
✓ Run `get` operations in parallel
✓ No resource locking needed
✓ Mix safe tools from different categories
```

**Example - Safe parallel calls:**
```
Parallel:
├── project_list
├── app_list
├── backup_list
└── database_mysql_list
```

### Racy Tool Coordination

For the 91 potentially racy tools, implement these safeguards:

#### 1. Resource-Level Locks
Prevent concurrent calls on the same resource ID:

```
❌ Parallel (same resource):
├── app_update (app-123)
└── app_update (app-123)

✓ Parallel (different resources):
├── app_update (app-123)
└── app_update (app-456)
```

#### 2. Sequential Execution
For dependent operations, execute in order:

```
Sequential:
1. project_create → (get project ID)
2. app_create_php → (get app ID)
3. database_mysql_create → (get DB ID)
4. app_update (configure DB)
```

#### 3. Idempotency Checks
Before mutations, verify the operation hasn't completed:

```
1. Check current state (get/list)
2. If already in desired state, skip
3. Otherwise, perform mutation
```

### Example Scenarios

| Scenario | Safe? | Reason |
|----------|-------|--------|
| Fetching project list + app list + backup list simultaneously | ✓ | All read-only |
| Creating two apps in the same project | ⚠️ | May conflict on project resources |
| Reading project info while creating a backup | ✓ | Different operation types |
| Deleting and recreating the same container | ❌ | Race condition on same resource |
| Updating two different MySQL databases | ✓ | Different resources |

### Implementation Pattern

```javascript
// Pseudocode for MCP client batch execution
async function executeBatch(tools) {
  const safe = tools.filter(t => isSafe(t));
  const racy = tools.filter(t => !isSafe(t));

  // Run all safe tools in parallel
  const safeResults = await Promise.all(
    safe.map(t => execute(t))
  );

  // Group racy tools by resource
  const byResource = groupByResource(racy);

  // Run each resource group sequentially
  for (const [resource, resourceTools] of byResource) {
    for (const tool of resourceTools) {
      await execute(tool);
    }
  }
}
```

## Related Documentation

- [OAuth Scope Caching](./oauth-scope-caching.md)
- [Claude Desktop Integration Guide](./guides/claude-desktop.md)
- [ChatGPT Integration Guide](./guides/chatgpt.md)
- [Cursor Integration Guide](./guides/cursor.md)
