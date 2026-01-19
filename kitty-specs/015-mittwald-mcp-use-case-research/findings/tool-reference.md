# Mittwald MCP Tool Reference

**Feature**: 015-mittwald-mcp-use-case-research
**Version**: 1.0.0
**Total Tools**: 115
**Domains**: 14

This appendix provides a complete reference of all 115 MCP tools available in the Mittwald MCP server, organized by domain. Each tool is listed with its display name, description, and the case study where it is demonstrated.

---

## Quick Stats

| Domain | Tools | Primary Case Studies |
|--------|-------|---------------------|
| apps | 8 | CS-003, CS-004, CS-012 |
| automation | 9 | CS-010, CS-014 |
| backups | 8 | CS-003, CS-006, CS-014 |
| certificates | 1 | CS-001 |
| containers | 9 | CS-005, CS-014 |
| context | 3 | CS-010, CS-014 |
| databases | 14 | CS-003, CS-004, CS-008, CS-014 |
| domains-mail | 22 | CS-001, CS-004, CS-009, CS-013 |
| identity | 13 | CS-007, CS-009, CS-014 |
| misc | 5 | CS-002, CS-014 |
| organization | 7 | CS-002, CS-007, CS-012 |
| project-foundation | 12 | CS-001, CS-002, CS-004, CS-012 |
| sftp | 2 | CS-007, CS-014 |
| ssh | 4 | CS-004, CS-007, CS-014 |

---

## Apps Domain (8 tools)

Application lifecycle management for CMS and web applications.

| Tool | Description | Case Study |
|------|-------------|------------|
| `app/copy` | Copy an application to a new location or project | CS-004 |
| `app/get` | Get detailed information about an installed application | CS-003 |
| `app/list` | List all applications installed in a project | CS-012 |
| `app/list/upgrade/candidates` | List applications with available version upgrades | CS-003 |
| `app/uninstall` | Remove an application from a project | CS-012 |
| `app/update` | Update application configuration settings | CS-004 |
| `app/upgrade` | Upgrade an application to a newer version | CS-003 |
| `app/versions` | List all available versions for an application type | CS-012 |

---

## Automation Domain (9 tools)

Scheduled task (cronjob) management for automated workflows.

| Tool | Description | Case Study |
|------|-------------|------------|
| `cronjob/create` | Create a new scheduled task | CS-010 |
| `cronjob/delete` | Delete a scheduled task | CS-014 |
| `cronjob/execute` | Manually trigger a cronjob immediately | CS-010 |
| `cronjob/execution/abort` | Abort a currently running cronjob execution | CS-014 |
| `cronjob/execution/get` | Get details of a specific cronjob execution | CS-014 |
| `cronjob/execution/list` | List execution history for a cronjob | CS-010 |
| `cronjob/get` | Get configuration details for a cronjob | CS-014 |
| `cronjob/list` | List all cronjobs in a project | CS-010 |
| `cronjob/update` | Update cronjob schedule or command | CS-014 |

---

## Backups Domain (8 tools)

Backup creation, scheduling, and management.

| Tool | Description | Case Study |
|------|-------------|------------|
| `backup/create` | Create an immediate backup of a project | CS-003 |
| `backup/delete` | Delete an existing backup | CS-014 |
| `backup/get` | Get detailed information about a specific backup | CS-006 |
| `backup/list` | List all backups for a project | CS-003, CS-006 |
| `backup/schedule/create` | Create an automated backup schedule | CS-006 |
| `backup/schedule/delete` | Delete a backup schedule | CS-014 |
| `backup/schedule/list` | List all backup schedules for a project | CS-006 |
| `backup/schedule/update` | Update backup schedule settings | CS-006 |

---

## Certificates Domain (1 tool)

SSL/TLS certificate management.

| Tool | Description | Case Study |
|------|-------------|------------|
| `certificate/request` | Request a new SSL certificate (Let's Encrypt) | CS-001 |

**Note**: `certificate/list` is categorized under domains-mail domain.

---

## Containers Domain (9 tools)

Docker container, stack, registry, and volume management.

| Tool | Description | Case Study |
|------|-------------|------------|
| `container/list` | List all running containers in a project | CS-005 |
| `registry/create` | Create a new container image registry | CS-005 |
| `registry/delete` | Delete a container registry | CS-014 |
| `registry/list` | List all container registries | CS-005 |
| `registry/update` | Update registry configuration | CS-014 |
| `stack/delete` | Delete a deployed container stack | CS-014 |
| `stack/deploy` | Deploy a Docker Compose stack | CS-005, CS-010 |
| `stack/list` | List all deployed stacks | CS-005 |
| `stack/ps` | Show container status within a stack | CS-005 |
| `volume/list` | List persistent volumes | CS-005 |

---

## Context Domain (3 tools)

Session context management for stateful MCP interactions.

| Tool | Description | Case Study |
|------|-------------|------------|
| `context/get/session` | Get current session context (project, org, etc.) | CS-010 |
| `context/reset/session` | Reset session context to defaults | CS-014 |
| `context/set/session` | Set session context for subsequent operations | CS-010 |

---

## Databases Domain (14 tools)

MySQL and Redis database management.

### MySQL (10 tools)

| Tool | Description | Case Study |
|------|-------------|------------|
| `database/mysql/create` | Create a new MySQL database | CS-004 |
| `database/mysql/delete` | Delete a MySQL database | CS-014 |
| `database/mysql/get` | Get MySQL database configuration and status | CS-003, CS-008 |
| `database/mysql/list` | List all MySQL databases in a project | CS-003, CS-008 |
| `database/mysql/user/create` | Create a new database user | CS-014 |
| `database/mysql/user/delete` | Delete a database user | CS-014 |
| `database/mysql/user/get` | Get database user details and permissions | CS-014 |
| `database/mysql/user/list` | List all users for a database | CS-008 |
| `database/mysql/user/update` | Update user permissions or password | CS-014 |
| `database/mysql/versions` | List available MySQL versions | CS-008 |

### Redis (4 tools)

| Tool | Description | Case Study |
|------|-------------|------------|
| `database/redis/create` | Create a new Redis instance | CS-008 |
| `database/redis/get` | Get Redis instance configuration | CS-014 |
| `database/redis/list` | List all Redis instances | CS-008 |
| `database/redis/versions` | List available Redis versions | CS-014 |

---

## Domains-Mail Domain (22 tools)

Domain, DNS, virtualhost, email, and certificate management.

### Domains (6 tools)

| Tool | Description | Case Study |
|------|-------------|------------|
| `domain/get` | Get domain registration and configuration details | CS-013 |
| `domain/list` | List all domains in a project | CS-004 |
| `domain/dnszone/get` | Get DNS zone configuration | CS-013 |
| `domain/dnszone/list` | List all DNS zones | CS-013 |
| `domain/dnszone/update` | Update DNS records (A, CNAME, MX, etc.) | CS-001 |

### Virtualhosts (4 tools)

| Tool | Description | Case Study |
|------|-------------|------------|
| `domain/virtualhost/create` | Create a virtualhost linking domain to project | CS-001, CS-004 |
| `domain/virtualhost/delete` | Remove a virtualhost configuration | CS-013 |
| `domain/virtualhost/get` | Get virtualhost configuration details | CS-013 |
| `domain/virtualhost/list` | List all virtualhosts | CS-001 |

### Email Addresses (5 tools)

| Tool | Description | Case Study |
|------|-------------|------------|
| `mail/address/create` | Create a new email address | CS-001 |
| `mail/address/delete` | Delete an email address | CS-013 |
| `mail/address/get` | Get email address details (forwarding, etc.) | CS-013 |
| `mail/address/list` | List all email addresses | CS-001 |
| `mail/address/update` | Update email address settings | CS-013 |

### Deliveryboxes (5 tools)

| Tool | Description | Case Study |
|------|-------------|------------|
| `mail/deliverybox/create` | Create a mailbox for storing emails | CS-001 |
| `mail/deliverybox/delete` | Delete a deliverybox | CS-013 |
| `mail/deliverybox/get` | Get deliverybox configuration and quota | CS-013 |
| `mail/deliverybox/list` | List all deliveryboxes | CS-013 |
| `mail/deliverybox/update` | Update deliverybox settings (quota, etc.) | CS-013 |

### Certificates (1 tool)

| Tool | Description | Case Study |
|------|-------------|------------|
| `certificate/list` | List all SSL certificates | CS-001, CS-009 |

---

## Identity Domain (13 tools)

User profile, API tokens, SSH keys, and session management.

### User Profile (2 tools)

| Tool | Description | Case Study |
|------|-------------|------------|
| `user/get` | Get current user profile information | CS-014 |
| `user/session/get` | Get details of a specific session | CS-014 |
| `user/session/list` | List all active sessions | CS-009 |

### API Tokens (4 tools)

| Tool | Description | Case Study |
|------|-------------|------------|
| `user/api/token/create` | Create a new API token | CS-014 |
| `user/api/token/get` | Get API token details and permissions | CS-009 |
| `user/api/token/list` | List all API tokens | CS-009 |
| `user/api/token/revoke` | Revoke an API token | CS-014 |

### SSH Keys (5 tools)

| Tool | Description | Case Study |
|------|-------------|------------|
| `user/ssh/key/create` | Create a new SSH key pair | CS-007 |
| `user/ssh/key/delete` | Delete an SSH key | CS-014 |
| `user/ssh/key/get` | Get SSH key details | CS-014 |
| `user/ssh/key/import` | Import an existing SSH public key | CS-014 |
| `user/ssh/key/list` | List all registered SSH keys | CS-009 |

---

## Misc Domain (5 tools)

Support conversation management.

| Tool | Description | Case Study |
|------|-------------|------------|
| `conversation/categories` | List available support ticket categories | CS-014 |
| `conversation/create` | Create a new support conversation | CS-002 |
| `conversation/list` | List all support conversations | CS-002 |
| `conversation/reply` | Add a reply to a conversation | CS-002 |
| `conversation/show` | Show full conversation details and history | CS-014 |

---

## Organization Domain (7 tools)

Organization and membership management.

| Tool | Description | Case Study |
|------|-------------|------------|
| `org/get` | Get organization details and quotas | CS-002 |
| `org/invite` | Invite a user to join an organization | CS-007 |
| `org/invite/list` | List pending organization invitations | CS-012 |
| `org/invite/revoke` | Revoke a pending invitation | CS-012 |
| `org/list` | List all organizations user belongs to | CS-012 |
| `org/membership/list` | List all members of an organization | CS-002, CS-007 |
| `org/membership/revoke` | Remove a member from an organization | CS-012 |

---

## Project-Foundation Domain (12 tools)

Project and server management.

### Projects (9 tools)

| Tool | Description | Case Study |
|------|-------------|------------|
| `project/create` | Create a new hosting project | CS-001 |
| `project/delete` | Delete a project (archive) | CS-012 |
| `project/get` | Get project details and configuration | CS-001 |
| `project/invite/get` | Get details of a project invitation | CS-012 |
| `project/invite/list` | List pending project invitations | CS-012 |
| `project/list` | List all projects in an organization | CS-002 |
| `project/membership/get` | Get details of a project membership | CS-012 |
| `project/membership/list` | List all members with project access | CS-002 |
| `project/ssh` | Get SSH connection details for a project | CS-004 |
| `project/update` | Update project settings | CS-012 |

### Servers (2 tools)

| Tool | Description | Case Study |
|------|-------------|------------|
| `server/get` | Get server details and resource usage | CS-012 |
| `server/list` | List all servers in an organization | CS-012 |

---

## SFTP Domain (2 tools)

SFTP user management for file transfer access.

| Tool | Description | Case Study |
|------|-------------|------------|
| `sftp/user/delete` | Delete an SFTP user | CS-014 |
| `sftp/user/list` | List all SFTP users for a project | CS-007 |

---

## SSH Domain (4 tools)

SSH user management for shell access.

| Tool | Description | Case Study |
|------|-------------|------------|
| `ssh/user/create` | Create an SSH user for a project | CS-007 |
| `ssh/user/delete` | Delete an SSH user | CS-014 |
| `ssh/user/list` | List all SSH users for a project | CS-004, CS-007 |
| `ssh/user/update` | Update SSH user settings | CS-014 |

---

## Tool Coverage Matrix

The following matrix shows which tools are covered in each case study:

| Case Study | Segment | Tools Covered | Focus Area |
|------------|---------|---------------|------------|
| CS-001 | SEG-001 | 10 | Client onboarding, domains, email |
| CS-002 | SEG-002 | 6 | Multi-project management, support |
| CS-003 | SEG-003 | 7 | E-commerce launch, backups, apps |
| CS-004 | SEG-004 | 7 | TYPO3 multi-site, databases, SSH |
| CS-005 | SEG-005 | 7 | Container deployment |
| CS-006 | SEG-001 | 5 | Backup monitoring |
| CS-007 | SEG-002 | 6 | Developer onboarding, access |
| CS-008 | SEG-003 | 6 | Database optimization |
| CS-009 | SEG-004 | 5 | Security audit |
| CS-010 | SEG-005 | 7 | CI/CD, cronjobs |
| CS-012 | SEG-002 | 14 | Project lifecycle |
| CS-013 | SEG-001 | 12 | Email/domain admin |
| CS-014 | SEG-005 | 30 | Infrastructure maintenance |

**Total unique tools across all case studies**: 115 (100%)

---

## Usage Notes

### Tool Naming Convention

Tools use the format `domain/resource/action`:
- `project/create` - Create a project
- `database/mysql/user/list` - List MySQL users

### Common Patterns

1. **CRUD Operations**: Most resources support list, get, create, update, delete
2. **Nested Resources**: Some tools operate on sub-resources (e.g., `database/mysql/user/*`)
3. **Batch Operations**: List tools typically return all items; use context to filter

### Error Handling

When a tool fails, the MCP server returns:
- Error code and message
- Suggested remediation steps
- Related documentation links

### Rate Limits

The Mittwald API has rate limits. For bulk operations:
- Use list operations to audit before bulk changes
- Implement backoff for large-scale automation
- Consider using cronjobs for recurring maintenance
