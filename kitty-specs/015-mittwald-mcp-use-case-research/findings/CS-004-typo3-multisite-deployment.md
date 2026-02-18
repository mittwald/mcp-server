# CS-004: TYPO3 Multi-Site Deployment

## Persona

**Segment**: SEG-004 Enterprise TYPO3 Developer
**Role**: Senior TYPO3 integrator at a certified TYPO3 partner agency
**Context**: A German automotive supplier has contracted your agency to build their new corporate website with 5 language versions (DE, EN, FR, ES, CN). Each language site needs its own domain, database, and deployment pipeline. The client expects all sites to launch simultaneously in 6 weeks.

## Problem

Enterprise TYPO3 multi-site deployments are notoriously complex. Each language version requires its own database (for performance isolation), separate domain configuration, and coordinated deployment access. Manually setting up 5 sites means repeating the same 15-step process 5 times—creating databases, configuring virtual hosts, setting up SSH access for the CI/CD pipeline, and ensuring consistent TYPO3 configuration across all instances. A single misconfiguration (wrong database credentials, missing domain record) can delay the entire launch. The coordination overhead typically adds 2-3 days to the project timeline, and post-launch issues from inconsistent configurations are common.

## Solution: MCP Workflow

### Prerequisites

- Mittwald MCP server connected to Claude Code
- Active Mittwald project with TYPO3 12 LTS base installation
- Project ID available (e.g., `p-autosupplier`)
- Domain names registered: autoteile-global.de, autoteile-global.com, autoteile-global.fr, autoteile-global.es, autoteile-global.cn

### Step 1: Review Current Domain Configuration

```
List all domains currently configured for the AutoSupplier project.
I need to see what's already set up before adding the language-specific domains.
```

**Tools Used**: `domain/list`
**Expected Output**: Current domain inventory:
- `autoteile-global.de` - Primary domain (DE site base)
- No additional language domains configured yet
- DNS status: Active, pointing to project server

### Step 2: Create Database for English Site

```
Create a new MySQL database called "autoteile_en" for the English
language version of the TYPO3 site. Use the same MySQL version
as the German site for consistency.
```

**Tools Used**: `database/mysql/create`
**Expected Output**: Database created:
- Database name: `autoteile_en`
- MySQL version: 8.0.35 (matching DE site)
- Character set: utf8mb4
- User created: `autoteile_en_user` with full privileges
- Connection details provided for TYPO3 configuration

### Step 3: Clone TYPO3 Installation for English Site

```
Copy the TYPO3 installation from the German base site to create
the English version. The new installation should use the autoteile_en
database we just created.
```

**Tools Used**: `app/copy`
**Expected Output**: TYPO3 installation cloned:
- Source: TYPO3 12.4 LTS (DE base)
- Target directory: `/html/en/`
- Status: Copy in progress
- Note: Database configuration needs manual update in LocalConfiguration.php

### Step 4: Configure English Domain Virtual Host

```
Create a virtual host for autoteile-global.com pointing to the
English TYPO3 installation at /html/en/public.
```

**Tools Used**: `domain/virtualhost/create`
**Expected Output**: Virtual host configured:
- Domain: `autoteile-global.com`
- Document root: `/html/en/public`
- SSL: Auto-provisioned via Let's Encrypt
- Status: Active (pending DNS propagation)

### Step 5: Update TYPO3 Configuration for English Site

```
Update the TYPO3 application settings for the English site to use
the correct database and site configuration. Set the site identifier
to "en" and update the base URL.
```

**Tools Used**: `app/update`
**Expected Output**: Application configuration updated:
- Site identifier: `en`
- Database: `autoteile_en`
- Base URL: `https://autoteile-global.com/`
- Language: English (default)
- TYPO3 cache cleared

### Step 6: Verify SSH Access for Deployment

```
Show me the SSH connection details for the AutoSupplier project.
I need to configure our GitLab CI/CD pipeline for automated deployments.
```

**Tools Used**: `project/ssh`
**Expected Output**: SSH connection details:
- Host: `ssh.autoteile-global.de`
- Port: 22
- User: `p-autosupplier`
- Key authentication: Required
- Home directory: `/home/p-autosupplier/`
- Note: Add GitLab runner's public key for CI/CD access

### Step 7: Audit SSH Users for Deployment Team

```
List all SSH users configured for this project. I need to verify
which team members have deployment access and add our new DevOps engineer.
```

**Tools Used**: `ssh/user/list`
**Expected Output**: SSH user inventory:
- `p-autosupplier` (primary project user)
- `deploy-gitlab` (CI/CD runner)
- `m-weber` (Senior developer - Marcus)
- `s-chen` (New DevOps engineer - needs to be added)
- Total: 3 active SSH users

### Step 8: Repeat for Remaining Language Sites

```
Now let me create the infrastructure for the remaining 3 language sites
(FR, ES, CN). For each site, I need:
1. A new MySQL database (autoteile_fr, autoteile_es, autoteile_cn)
2. A cloned TYPO3 installation
3. A configured virtual host for each domain

Start with the French site (autoteile-global.fr).
```

**Tools Used**: `database/mysql/create`, `app/copy`, `domain/virtualhost/create`
**Expected Output**: French site infrastructure:
- Database: `autoteile_fr` created
- TYPO3 cloned to `/html/fr/`
- Virtual host: `autoteile-global.fr` → `/html/fr/public`
- Repeat instructions provided for ES and CN sites

## Outcomes

- **Time Saved**: 2-3 days of manual multi-site setup reduced to a 1-hour MCP session. Each language site setup (database + app copy + domain) takes approximately 10 minutes instead of 3-4 hours.
- **Error Reduction**: Consistent database configurations (all MySQL 8.0.35, utf8mb4), uniform directory structures (`/html/{lang}/public`), and verified SSH access eliminate the "works on DE, broken on FR" syndrome. The conversational workflow ensures no steps are skipped.
- **Next Steps**:
  - Create shared TYPO3 extension directory for cross-site assets
  - Configure TYPO3 Site Configuration for hreflang tags
  - Set up backup schedules for all 5 databases
  - Add remaining SSH users for the deployment team

---

## Tools Used in This Case Study

| Tool | Domain | Purpose |
|------|--------|---------|
| `domain/list` | domains-mail | Review existing domain configuration |
| `database/mysql/create` | databases | Create language-specific databases |
| `app/copy` | apps | Clone TYPO3 installation for each language |
| `domain/virtualhost/create` | domains-mail | Configure language domain virtual hosts |
| `app/update` | apps | Update TYPO3 site configuration |
| `project/ssh` | project-foundation | Get SSH connection details for CI/CD |
| `ssh/user/list` | ssh | Audit deployment team access |

**Total Tools**: 7 primary workflow tools
