# Fixture Management System Guide

Complete guide to using the fixture management system for scenario-based MCP tool testing.

## Overview

The fixture management system provisions Mittwald resources before scenario execution, ensuring:
- **Zero assumptions** about pre-existing infrastructure
- **Automatic cleanup** after scenarios complete
- **Template interpolation** for dynamic resource references
- **State validation** against actual Mittwald API state

## Quick Start

### 1. Define Fixtures in Scenario

Add a `fixtures` block to your scenario JSON:

```json
{
  "id": "my-scenario",
  "name": "My Test Scenario",
  "fixtures": {
    "project": {
      "description": "Test Project {{RUN_ID}}"
    },
    "databases": {
      "mysql": [
        {
          "description": "Test MySQL {{RUN_ID}}",
          "version": "8.0"
        }
      ]
    }
  },
  "prompts": [
    "List databases in project {{PROJECT_ID}}",
    "Get configuration for MySQL database {{MYSQL_0_ID}}"
  ],
  "success_criteria": {
    "resources_created": {
      "project": 1,
      "mysql_database": 1
    }
  }
}
```

### 2. Run Scenario

```bash
# Standard run (provisions, executes, validates, cleans up)
npx tsx evals/scripts/scenario-runner.ts my-scenario

# Keep resources for debugging
npx tsx evals/scripts/scenario-runner.ts my-scenario --keep-resources

# Skip cleanup even on success
npx tsx evals/scripts/scenario-runner.ts my-scenario --skip-cleanup
```

## Fixture Types

### Project (Required for all other resources)

```json
{
  "fixtures": {
    "project": {
      "description": "My Project {{RUN_ID}}",
      "serverId": "s-xxxxx"  // Optional, falls back to DEFAULT_SERVER_ID env var
    }
  }
}
```

**Template variables:**
- `{{PROJECT_ID}}` - Created project ID

### Databases

```json
{
  "fixtures": {
    "databases": {
      "mysql": [
        {
          "description": "Production DB {{RUN_ID}}",
          "version": "8.0",
          "characterSet": "utf8mb4",
          "collation": "utf8mb4_unicode_ci"
        }
      ],
      "redis": [
        {
          "description": "Cache {{RUN_ID}}",
          "version": "7",
          "maxMemory": "512Mi",
          "maxMemoryPolicy": "allkeys-lru"
        }
      ]
    }
  }
}
```

**Template variables:**
- `{{MYSQL_0_ID}}` - First MySQL database ID
- `{{MYSQL_0_DESCRIPTION}}` - First MySQL database description
- `{{REDIS_0_ID}}` - First Redis database ID
- `{{REDIS_0_DESCRIPTION}}` - First Redis database description

### Apps

```json
{
  "fixtures": {
    "apps": [
      {
        "description": "WordPress Site {{RUN_ID}}",
        "appName": "wordpress",
        "appVersion": "6.4"
      }
    ]
  }
}
```

**Template variables:**
- `{{APP_0_ID}}` - First app installation ID
- `{{APP_0_DESCRIPTION}}` - First app description

### Domains and Virtualhosts

```json
{
  "fixtures": {
    "domains": [
      {
        "fqdn": "test-{{RUN_ID}}.example.com",
        "virtualhost": true
      }
    ]
  }
}
```

**Template variables:**
- `{{DOMAIN_0_FQDN}}` - First domain FQDN
- `{{DOMAIN_0_ID}}` - First domain ID
- `{{VIRTUALHOST_0_ID}}` - First virtualhost ID (if `virtualhost: true`)
- `{{VIRTUALHOST_0_HOSTNAME}}` - First virtualhost hostname

### Mail

```json
{
  "fixtures": {
    "mail": {
      "addresses": [
        {
          "address": "info@test-{{RUN_ID}}.example.com",
          "quota": "5Gi"
        }
      ],
      "deliveryboxes": [
        {
          "description": "Main Deliverybox {{RUN_ID}}"
        }
      ]
    }
  }
}
```

**Template variables:**
- `{{MAIL_ADDRESS_0_ID}}` - First mail address ID
- `{{MAIL_ADDRESS_0_ADDRESS}}` - First mail address
- `{{DELIVERYBOX_0_ID}}` - First deliverybox ID
- `{{DELIVERYBOX_0_DESCRIPTION}}` - First deliverybox description

### SSH Users

```json
{
  "fixtures": {
    "ssh_users": [
      {
        "description": "Deploy User {{RUN_ID}}",
        "publicKey": "~/.ssh/id_rsa.pub"
      }
    ]
  }
}
```

**Template variables:**
- `{{SSH_USER_0_ID}}` - First SSH user ID
- `{{SSH_USER_0_DESCRIPTION}}` - First SSH user description

### Backups

```json
{
  "fixtures": {
    "backups": {
      "schedules": [
        {
          "description": "Daily Backup {{RUN_ID}}",
          "schedule": "0 2 * * *",
          "ttl": "30d"
        }
      ]
    }
  }
}
```

**Template variables:**
- `{{BACKUP_SCHEDULE_0_ID}}` - First backup schedule ID
- `{{BACKUP_SCHEDULE_0_DESCRIPTION}}` - First backup schedule description

### Containers

```json
{
  "fixtures": {
    "containers": {
      "registries": [
        {
          "description": "Docker Hub {{RUN_ID}}",
          "uri": "registry.hub.docker.com",
          "username": "myuser"
        }
      ]
    }
  }
}
```

**Template variables:**
- `{{REGISTRY_0_ID}}` - First registry ID
- `{{REGISTRY_0_DESCRIPTION}}` - First registry description

## Template Variables

### Built-in Variables

- `{{RUN_ID}}` - Unique run identifier (timestamp-based, e.g., `2025-01-28T06-00-00`)

### Indexed Variables

Resources support indexed access (0-based):
- `{{MYSQL_0_ID}}`, `{{MYSQL_1_ID}}`, etc.
- `{{DOMAIN_0_FQDN}}`, `{{DOMAIN_1_FQDN}}`, etc.
- `{{APP_0_ID}}`, `{{APP_1_ID}}`, etc.

### Usage in Prompts

```json
{
  "prompts": [
    "Verify project {{PROJECT_ID}} has MySQL database {{MYSQL_0_ID}}",
    "Configure domain {{DOMAIN_0_FQDN}} to point to app {{APP_0_ID}}",
    "Send test email to {{MAIL_ADDRESS_0_ADDRESS}}"
  ]
}
```

## Provisioning Flow

1. **Project creation** (required first)
2. **Databases** (MySQL and Redis in parallel)
3. **Apps** (sequential to avoid rate limits)
4. **Domains and virtualhosts** (sequential)
5. **Mail resources** (sequential)
6. **SSH users** (sequential)
7. **Backup schedules** (sequential)
8. **Container registries** (sequential)

### Rollback on Failure

If provisioning fails mid-way:
- All created resources are deleted in reverse order
- Error is logged and re-thrown
- No orphaned resources left behind

## Validation

### State Validation (New)

After scenario execution, the runner validates:
- ✅ All provisioned resources exist in Mittwald
- ✅ Resources have correct configuration
- ✅ Scenario-specific criteria are met (SSL, DNS, etc.)

Validation uses `mw` CLI to query actual infrastructure state, not just logs.

### Legacy Validation (Fallback)

For scenarios without fixtures, falls back to:
- Log parsing for tool call counts
- Resource count validation from logs

## Cleanup

### Dependency-Aware Cleanup

Resources are deleted in reverse dependency order:

1. Container stacks (leaves)
2. Container registries
3. Apps
4. Virtualhosts
5. Domains
6. Mail deliveryboxes
7. Mail addresses
8. SSH users
9. Backup schedules
10. Databases (MySQL, Redis)
11. **Project (LAST - all resources depend on it)**

### Cleanup Modes

```bash
# Default: Clean up on success, keep on failure
npx tsx evals/scripts/scenario-runner.ts my-scenario

# Keep resources even on success (debugging)
npx tsx evals/scripts/scenario-runner.ts my-scenario --keep-resources

# Skip cleanup entirely
npx tsx evals/scripts/scenario-runner.ts my-scenario --skip-cleanup

# Force cleanup even on failure
npx tsx evals/scripts/scenario-runner.ts my-scenario --cleanup-on-failure
```

### Orphaned Resources

If cleanup fails, orphaned resources are logged to:
```
evals/results/orphaned-resources-YYYY-MM-DDTHH-MM-SS.json
```

Format:
```json
{
  "scenario_id": "my-scenario",
  "orphaned_at": "2025-01-28T06:00:00.000Z",
  "resources": [
    {
      "id": "mysql-xxxxx",
      "type": "mysql_database",
      "error": "Timeout during deletion"
    }
  ]
}
```

## Debugging

### Skip Fixture Provisioning

Test prompts without provisioning:

```bash
npx tsx evals/scripts/scenario-runner.ts my-scenario --skip-fixtures
```

This will:
- Skip fixture creation
- Execute prompts as-is (no interpolation)
- Use legacy validation

### Keep Resources for Inspection

Provision fixtures and run scenario, but keep resources:

```bash
npx tsx evals/scripts/scenario-runner.ts my-scenario --keep-resources
```

Then inspect manually:
```bash
mw project get {{PROJECT_ID}}
mw database mysql list --project-id {{PROJECT_ID}}
```

Clean up manually later:
```bash
mw project delete {{PROJECT_ID}} --confirm
```

### Dry Run (Not Implemented Yet)

Future enhancement: `--dry-run` flag to validate fixtures without provisioning.

## Environment Variables

### Required

- `DEFAULT_SERVER_ID` - Default server for project creation (if not specified in fixture)

### Optional

- `DEBUG_SCENARIO=true` - Enable MCP debug output during provisioning

## Migration from Legacy Scenarios

### Before (Legacy)

```json
{
  "prompts": [
    "Create a project called 'Baeckerei Mueller Website'",
    "Add domain bakerei-mueller.de",
    "Create mail address info@bakerei-mueller.de"
  ],
  "cleanup": [
    "Delete mail address info@bakerei-mueller.de",
    "Delete domain bakerei-mueller.de",
    "Delete project 'Baeckerei Mueller Website'"
  ]
}
```

**Problems:**
- Hardcoded resource names (not unique)
- Cleanup assumes prompts succeeded
- No validation of actual state

### After (Fixtures)

```json
{
  "fixtures": {
    "project": {
      "description": "Baeckerei Mueller Website {{RUN_ID}}"
    },
    "domains": [
      {
        "fqdn": "bakerei-mueller-test-{{RUN_ID}}.example.com",
        "virtualhost": true
      }
    ],
    "mail": {
      "addresses": [
        {
          "address": "info@bakerei-mueller-test-{{RUN_ID}}.example.com"
        }
      ]
    }
  },
  "prompts": [
    "Verify project {{PROJECT_ID}} has domain {{DOMAIN_0_FQDN}}",
    "Send test email to {{MAIL_ADDRESS_0_ADDRESS}}"
  ]
}
```

**Benefits:**
- Unique resource names (via `{{RUN_ID}}`)
- Guaranteed cleanup (dependency-aware)
- State validation via `mw` CLI
- No hardcoded resource IDs in prompts

## Best Practices

### 1. Always Use {{RUN_ID}} for Uniqueness

```json
{
  "description": "Test Project {{RUN_ID}}"  // ✅ Good
}
```

```json
{
  "description": "Test Project"  // ❌ Bad - not unique
}
```

### 2. Reference Resources by Template Variables

```json
{
  "prompts": [
    "Verify database {{MYSQL_0_ID}} exists"  // ✅ Good
  ]
}
```

```json
{
  "prompts": [
    "Verify database test-db exists"  // ❌ Bad - hardcoded
  ]
}
```

### 3. Use example.com Subdomains for Testing

```json
{
  "fqdn": "test-{{RUN_ID}}.example.com"  // ✅ Good - won't pollute DNS
}
```

```json
{
  "fqdn": "test.real-domain.com"  // ❌ Bad - requires actual DNS delegation
}
```

### 4. Keep Scenarios Minimal

Only provision what the scenario needs:

```json
{
  "fixtures": {
    "project": { "description": "Test {{RUN_ID}}" },
    "databases": {
      "mysql": [{ "description": "DB {{RUN_ID}}", "version": "8.0" }]
    }
  }
}
```

Don't provision unused resources.

### 5. Tag Scenarios Appropriately

```json
{
  "tags": ["fixtures", "simple", "read-only"]
}
```

Helps filter scenarios by complexity.

## Troubleshooting

### "Template variable not found: MYSQL_0_ID"

**Cause:** Fixture wasn't provisioned or index is wrong.

**Fix:** Check fixture definition:
```json
{
  "fixtures": {
    "databases": {
      "mysql": [...]  // Must have at least 1 entry for MYSQL_0_ID
    }
  }
}
```

### "No server ID provided and DEFAULT_SERVER_ID environment variable not set"

**Cause:** Missing server context.

**Fix:** Set environment variable:
```bash
export DEFAULT_SERVER_ID="s-xxxxx"
npx tsx evals/scripts/scenario-runner.ts my-scenario
```

Or specify in fixture:
```json
{
  "fixtures": {
    "project": {
      "description": "Test {{RUN_ID}}",
      "serverId": "s-xxxxx"
    }
  }
}
```

### "Failed to extract project ID from output"

**Cause:** MCP tool output format changed or CLI error.

**Fix:** Check Claude CLI logs for actual error:
```bash
DEBUG_SCENARIO=true npx tsx evals/scripts/scenario-runner.ts my-scenario
```

### Cleanup Fails with "Project has dependent resources"

**Cause:** Mittwald API requires child resources deleted first.

**Fix:** This should be handled automatically by dependency-aware cleanup. If it fails, check orphaned resources log:
```bash
cat evals/results/orphaned-resources-*.json
```

Manually clean up remaining resources:
```bash
mw project delete {{PROJECT_ID}} --confirm
```

## Examples

### Simple Read-Only Audit

```json
{
  "id": "database-audit",
  "fixtures": {
    "project": { "description": "Audit Test {{RUN_ID}}" },
    "databases": {
      "mysql": [{ "description": "Prod DB {{RUN_ID}}", "version": "8.0" }],
      "redis": [{ "description": "Cache {{RUN_ID}}", "version": "7" }]
    }
  },
  "prompts": [
    "List databases in {{PROJECT_ID}}",
    "Get MySQL config for {{MYSQL_0_ID}}",
    "Get Redis config for {{REDIS_0_ID}}"
  ],
  "success_criteria": {
    "resources_created": {
      "project": 1,
      "mysql_database": 1,
      "redis_database": 1
    }
  }
}
```

### Full Client Onboarding

```json
{
  "id": "client-onboarding",
  "fixtures": {
    "project": { "description": "Client Site {{RUN_ID}}" },
    "domains": [
      { "fqdn": "client-{{RUN_ID}}.example.com", "virtualhost": true }
    ],
    "mail": {
      "addresses": [{ "address": "info@client-{{RUN_ID}}.example.com" }],
      "deliveryboxes": [{ "description": "Main Deliverybox {{RUN_ID}}" }]
    }
  },
  "prompts": [
    "Update DNS zone for {{DOMAIN_0_FQDN}} with A record",
    "Request SSL certificate for {{DOMAIN_0_FQDN}}",
    "Verify email delivery to {{MAIL_ADDRESS_0_ADDRESS}}"
  ],
  "success_criteria": {
    "resources_configured": {
      "dns_configured": true,
      "ssl_requested": true
    }
  }
}
```

## Future Enhancements

- [ ] Dry-run mode (`--dry-run`)
- [ ] Fixture snapshots for test replay
- [ ] Parallel cleanup (safe subset)
- [ ] Custom template functions (e.g., `{{TIMESTAMP}}`)
- [ ] Fixture templates (reusable fixture sets)
