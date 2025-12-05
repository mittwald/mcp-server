# Use Case Library

This directory contains realistic test scenarios for the Mittwald MCP functional testing system. Each use case represents a common customer workflow that exercises one or more MCP tools.

## Research Summary (T027)

### Mittwald Platform Capabilities

Based on the Mittwald developer documentation and platform capabilities:

1. **App Deployment** - Deploy PHP, Node.js, Python, and static sites
2. **Database Management** - MySQL, Redis database provisioning and management
3. **Domain Configuration** - DNS records, virtual hosts, SSL certificates
4. **Email Services** - Mailboxes, forwarding, catch-all addresses
5. **Project Management** - Project creation, settings, resource allocation
6. **Container Management** - Container stacks, volumes, registries
7. **Access Control** - SSH keys, SFTP users, permissions
8. **Automation** - Cron jobs, scheduled tasks
9. **Backups** - Backup schedules, restoration

### Common Customer Workflows

1. **New Website Setup** - Create project, deploy app, configure domain
2. **Database-Backed App** - Deploy app with MySQL/Redis database
3. **Email Configuration** - Set up mailboxes and forwarding
4. **SSL Setup** - Configure HTTPS for domains
5. **Scaling** - Adjust container resources
6. **DevOps** - SSH access, deployment automation

## Directory Structure

```
use-case-library/
├── README.md                 # This file
├── apps/                     # App deployment scenarios
│   ├── apps-001-deploy-php-app.json
│   └── apps-002-update-nodejs-version.json
├── databases/               # Database provisioning scenarios
│   ├── databases-001-provision-mysql.json
│   └── databases-002-create-backup.json
├── domains-mail/            # Domain and email scenarios
│   ├── domains-001-setup-email-forwarding.json
│   └── domains-002-configure-dns.json
├── project-foundation/      # Project management scenarios
│   ├── project-001-create-project.json
│   └── project-002-configure-ssh.json
└── containers/              # Container management scenarios
    ├── containers-001-manage-resources.json
    └── containers-002-scale-app.json
```

## Use Case JSON Format

Each use case follows this structure (see data-model.md for full schema):

```json
{
  "id": "domain-nnn-short-name",
  "title": "Human Readable Title",
  "description": "Detailed description of the scenario",
  "domain": "primary-domain",
  "prompt": "Natural language prompt WITHOUT tool hints",
  "expectedDomains": ["domain1", "domain2"],
  "expectedTools": ["tool/name", "other/tool"],
  "successCriteria": [...],
  "cleanupRequirements": [...],
  "questionAnswers": [...],
  "estimatedDuration": 5,
  "timeout": 15,
  "priority": "P1",
  "tags": ["tag1", "tag2"]
}
```

## Prompt Guidelines

Prompts must:
- Use natural user language (not technical jargon)
- Describe desired outcomes, not implementation steps
- NOT mention MCP tools, `mw` CLI, or API endpoints
- Include enough context for Claude to understand the goal
- Allow for predefined question answers

## Tool Coverage

Initial 10 use cases target coverage across:
- `project/create`, `project/list`, `project/get`
- `app/create`, `app/update`, `app/list`
- `database/mysql/create`, `database/mysql/list`
- `domain/virtualhost/create`, `domain/dns/record/set`
- `mail/deliverybox/create`, `mail/address/create`
- `ssh/user/create`, `ssh/key/create`
- `container/list`, `container/update`
- `backup/create`

See WP10 (Coverage Tracking) for detailed coverage analysis.
