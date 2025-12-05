---
work_package_id: "WP05"
subtasks:
  - "T027"
  - "T028"
  - "T029"
  - "T030"
  - "T031"
  - "T032"
  - "T033"
  - "T034"
  - "T035"
title: "Use Case Library - First 10 Scenarios"
phase: "Phase 2 - Core Infrastructure"
lane: "doing"
assignee: ""
agent: "claude"
shell_pid: "6568"
history:
  - timestamp: "2025-12-05T10:15:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-05T10:38:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "6568"
    action: "Started implementation"
---

# Work Package Prompt: WP05 – Use Case Library - First 10 Scenarios

## Objectives & Success Criteria

- Research Mittwald documentation for common customer workflows
- Create 10 realistic use cases covering 5 key domains
- Write naive prompts WITHOUT MCP tool hints
- Map expected tools per use case for coverage tracking

**Success Metric**: 10 JSON files load and validate against schema from WP04

## Context & Constraints

### Prerequisites
- WP04: Use Case Type Definitions (for schema validation)

### Key References
- `kitty-specs/007-real-world-use/spec.md` - FR-001 through FR-005
- `kitty-specs/007-real-world-use/data-model.md` - UseCase JSON format
- Mittwald Developer Docs: https://developer.mittwald.de/

### Constraints
- Use cases must be ADJACENT to tutorials, NOT copies
- Prompts must NOT mention MCP tools, `mw` CLI, or implementation specifics
- Prompts MAY reference standard Linux tools (curl, grep, sed, awk)
- Must cover 5 domains with 2 use cases each

## Subtasks & Detailed Guidance

### Subtask T027 – Research Mittwald documentation for common workflows

- **Purpose**: Understand real customer scenarios to create realistic tests.

- **Steps**:
  1. Review Mittwald developer documentation
  2. Study tutorials for: app deployment, databases, email, projects
  3. Identify common patterns and workflows
  4. Note which MCP tools each workflow would use
  5. Document findings for use case creation

- **Files**:
  - Create: `tests/functional/use-case-library/README.md` (document research)

- **Parallel?**: No (research phase)

- **Key Documentation Areas**:
  - App deployment (PHP, Node.js, static sites)
  - Database provisioning (MySQL, Redis)
  - Domain and DNS configuration
  - Email setup (mailboxes, forwarding)
  - Project management

### Subtask T028 – Create 2 apps domain use cases

- **Purpose**: Cover app deployment and management scenarios.

- **Steps**:
  1. Create `tests/functional/use-case-library/apps/` directory
  2. Create `apps-001-deploy-php-app.json`
  3. Create `apps-002-update-nodejs-version.json`
  4. Write naive prompts describing user goals
  5. Map expected tools

- **Files**:
  - Create: `tests/functional/use-case-library/apps/apps-001-deploy-php-app.json`
  - Create: `tests/functional/use-case-library/apps/apps-002-update-nodejs-version.json`

- **Parallel?**: Yes (different domain)

- **Example: apps-001-deploy-php-app.json**:
```json
{
  "id": "apps-001-deploy-php-app",
  "title": "Deploy PHP Application with Database",
  "description": "Customer wants to deploy a PHP website that connects to a MySQL database. The site should be accessible at a subdomain.",
  "domain": "apps",
  "prompt": "I need to set up a new website for my client's business. It's a PHP application that needs a MySQL database for storing customer information. The website should be accessible at a subdomain of my main domain. Please create everything needed and let me know the URL when it's ready to test.",
  "expectedDomains": ["project-foundation", "apps", "databases", "domains-mail"],
  "expectedTools": [
    "project/create",
    "app/create",
    "database/mysql/create",
    "domain/virtualhost/create"
  ],
  "successCriteria": [
    {
      "description": "App deployment completes without errors",
      "method": "log-pattern",
      "config": {
        "pattern": "app/create.*success",
        "minOccurrences": 1
      }
    }
  ],
  "cleanupRequirements": [
    { "resourceType": "app", "identificationMethod": "log-parse", "deletionTool": "app/delete", "order": 1 },
    { "resourceType": "database", "identificationMethod": "log-parse", "deletionTool": "database/mysql/delete", "order": 2 },
    { "resourceType": "project", "identificationMethod": "log-parse", "deletionTool": "project/delete", "order": 3 }
  ],
  "questionAnswers": [
    { "questionPattern": "PHP version", "answer": "PHP 8.2 please" },
    { "questionPattern": "database name", "answer": "clientsite_db" },
    { "questionPattern": "which project", "answer": "Create a new project for this" }
  ],
  "estimatedDuration": 5,
  "timeout": 15,
  "priority": "P1",
  "tags": ["deployment", "php", "mysql", "subdomain"]
}
```

### Subtask T029 – Create 2 databases domain use cases

- **Purpose**: Cover database provisioning and backup scenarios.

- **Steps**:
  1. Create `tests/functional/use-case-library/databases/` directory
  2. Create `databases-001-provision-mysql.json`
  3. Create `databases-002-create-backup.json`
  4. Write naive prompts
  5. Map expected tools

- **Files**:
  - Create: `tests/functional/use-case-library/databases/databases-001-provision-mysql.json`
  - Create: `tests/functional/use-case-library/databases/databases-002-create-backup.json`

- **Parallel?**: Yes

- **Example Prompt for databases-002**:
```
"I need to create a backup of my production database before making some changes. Can you help me set up a backup and confirm it was created successfully? I want to be able to restore from this backup if something goes wrong."
```

### Subtask T030 – Create 2 domains-mail use cases

- **Purpose**: Cover domain configuration and email setup.

- **Steps**:
  1. Create `tests/functional/use-case-library/domains-mail/` directory
  2. Create `domains-001-setup-email-forwarding.json`
  3. Create `domains-002-configure-dns.json`
  4. Write naive prompts
  5. Map expected tools

- **Files**:
  - Create: `tests/functional/use-case-library/domains-mail/domains-001-setup-email-forwarding.json`
  - Create: `tests/functional/use-case-library/domains-mail/domains-002-configure-dns.json`

- **Parallel?**: Yes

- **Example Prompt for domains-001**:
```
"I want to set up email forwarding so that messages sent to contact@mydomain.com get forwarded to my personal Gmail address. Can you help me configure this?"
```

### Subtask T031 – Create 2 project-foundation use cases

- **Purpose**: Cover project creation and configuration.

- **Steps**:
  1. Create `tests/functional/use-case-library/project-foundation/` directory
  2. Create `project-001-create-project.json`
  3. Create `project-002-configure-ssh.json`
  4. Write naive prompts
  5. Map expected tools

- **Files**:
  - Create: `tests/functional/use-case-library/project-foundation/project-001-create-project.json`
  - Create: `tests/functional/use-case-library/project-foundation/project-002-configure-ssh.json`

- **Parallel?**: Yes

- **Example Prompt for project-001**:
```
"I'm starting a new web project and need to set up the hosting environment. I'll need a place to deploy my code with SSH access for deployments. Can you help me get this set up?"
```

### Subtask T032 – Create 2 containers use cases

- **Purpose**: Cover container management scenarios.

- **Steps**:
  1. Create `tests/functional/use-case-library/containers/` directory
  2. Create `containers-001-manage-resources.json`
  3. Create `containers-002-scale-app.json`
  4. Write naive prompts
  5. Map expected tools

- **Files**:
  - Create: `tests/functional/use-case-library/containers/containers-001-manage-resources.json`
  - Create: `tests/functional/use-case-library/containers/containers-002-scale-app.json`

- **Parallel?**: Yes

### Subtask T033 – Write naive prompts without MCP tool hints for all 10

- **Purpose**: Ensure prompts simulate a real user who doesn't know implementation details.

- **Steps**:
  1. Review all 10 use case prompts
  2. Remove any references to:
     - MCP tools or tool names
     - `mw` CLI commands
     - Internal Mittwald terminology
     - Specific API endpoints
  3. Use business/user language only
  4. Describe desired outcomes, not steps

- **Files**:
  - Modify: All JSON files in use-case-library/

- **Parallel?**: No (review pass)

- **Checklist for Each Prompt**:
  - [ ] No tool names mentioned
  - [ ] No `mw` CLI mentioned
  - [ ] No API references
  - [ ] Describes what user wants, not how
  - [ ] Includes success criteria in user terms

### Subtask T034 – Map expected tools per use case for coverage tracking

- **Purpose**: Document which tools each use case should exercise.

- **Steps**:
  1. For each use case, list MCP tools expected to be called
  2. Use tool names from inventory (e.g., "app/create", "database/mysql/create")
  3. Include both primary and auxiliary tools
  4. Add to expectedTools array in JSON

- **Files**:
  - Modify: All JSON files in use-case-library/

- **Parallel?**: No (requires use case understanding)

- **Reference**: `tests/functional/src/inventory/grouping.ts` for tool names

### Subtask T035 – Create use-case-library directory structure

- **Purpose**: Organize use cases by domain.

- **Steps**:
  1. Create base directory: `tests/functional/use-case-library/`
  2. Create subdirectories for each domain
  3. Add README.md with structure documentation

- **Files**:
  - Create directories under `tests/functional/use-case-library/`

- **Parallel?**: No (do first)

- **Structure**:
```
tests/functional/use-case-library/
├── README.md
├── apps/
│   ├── apps-001-deploy-php-app.json
│   └── apps-002-update-nodejs-version.json
├── databases/
├── domains-mail/
├── project-foundation/
└── containers/
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Use cases too similar to tutorials | Focus on adjacent scenarios |
| Prompts accidentally hint at tools | Review pass in T033 |
| Use cases too complex | Start simple, add complexity in WP11 |
| Tool mapping incomplete | Cross-reference with inventory |

## Definition of Done Checklist

- [ ] T027: Documentation research completed
- [ ] T028: 2 apps use cases created
- [ ] T029: 2 databases use cases created
- [ ] T030: 2 domains-mail use cases created
- [ ] T031: 2 project-foundation use cases created
- [ ] T032: 2 containers use cases created
- [ ] T033: All prompts reviewed for tool hints
- [ ] T034: Expected tools mapped for all 10
- [ ] T035: Directory structure created
- [ ] All JSON files validate against schema

## Review Guidance

- **Key Checkpoint**: Load all JSON files with WP04 loader and validate
- **Verify**: No tool names in prompts
- **Verify**: Each use case covers different tools
- **Look For**: Realistic user language in prompts

## Activity Log

- 2025-12-05T10:15:00Z – system – lane=planned – Prompt created.
