# CS-012: Project Lifecycle Management

## Persona

**Segment**: SEG-002 Web Development Agency
**Role**: Operations manager at a 15-person web agency responsible for infrastructure hygiene
**Context**: It's Q4 audit time. The agency manages 60 projects across 3 organizations, but nobody knows exactly what's still active, which projects can be archived, who has access to what, or why some servers are at capacity. Three clients ended contracts last quarter, but their projects are still running. Two team members left, but may still have access.

## Problem

Web agencies accumulate infrastructure debt: projects that finished months ago still consume server resources, departed team members retain access through forgotten invitations, old WordPress installations sit unpatched and vulnerable, and nobody can answer "what's on that server?" without logging into MStudio and clicking through dozens of projects. The quarterly infrastructure audit—meant to clean up orphaned resources and verify security—takes 2-3 days of tedious manual inspection. Meanwhile, the agency pays for unused resources, carries security risk from stale access, and has no clear inventory of what they actually manage. When a client asks "what exactly is on my project?" the answer requires 30 minutes of investigation.

## Solution: MCP Workflow

### Prerequisites

- Mittwald MCP server connected to Claude Code
- Organization admin access to all agency organizations
- List of completed/cancelled client projects
- List of departed team members

### Step 1: List All Organizations

```
List all organizations I have access to. I need a complete
inventory of our agency's Mittwald infrastructure.
```

**Tools Used**: `org/list`
**Expected Output**: Organization inventory:
| Org ID | Name | Role | Projects | Members |
|--------|------|------|----------|---------|
| o-agency-main | WebCraft Digital GmbH | Owner | 42 | 12 |
| o-agency-clients | Client Projects | Admin | 15 | 8 |
| o-agency-archive | Archived Projects | Admin | 3 | 2 |

Total: 3 organizations, 60 projects, varying membership.

### Step 2: Inventory Servers and Capacity

```
List all servers in the main agency organization.
I need to understand our infrastructure capacity and identify
which servers might be overloaded or underutilized.
```

**Tools Used**: `server/list`
**Expected Output**: Server inventory:
| Server ID | Name | Projects | Capacity | Status |
|-----------|------|----------|----------|--------|
| srv-prod-01 | Production-01 | 18 | 85% ⚠️ | Active |
| srv-prod-02 | Production-02 | 14 | 62% | Active |
| srv-staging | Staging | 8 | 45% | Active |
| srv-legacy | Legacy-Apps | 2 | 12% | Active |

Note: `srv-prod-01` at 85% capacity—may need project migration.
Note: `srv-legacy` has only 2 projects—candidate for consolidation.

### Step 3: Get Server Details

```
Get details for the legacy server srv-legacy. I want to understand
what's running there and whether those projects can be migrated.
```

**Tools Used**: `server/get`
**Expected Output**: Server details for `srv-legacy`:
- **Server ID**: srv-legacy
- **Hostname**: legacy.webcraftdigital.de
- **Plan**: Space Server S
- **CPU**: 2 cores (15% avg usage)
- **RAM**: 4GB (1.2GB used)
- **Storage**: 100GB (23GB used)
- **Projects**:
  - `p-old-client-1`: Last activity 8 months ago ⚠️
  - `p-test-sandbox`: Last activity 14 months ago ⚠️
- **Monthly cost**: €29.90

Recommendation: Both projects are inactive. Candidate for cleanup/archival.

### Step 4: Audit Project Memberships

```
Get the membership details for the old client project p-old-client-1.
I need to verify who has access and whether any access should be revoked.
```

**Tools Used**: `project/membership/get`
**Expected Output**: Project membership for `p-old-client-1`:
| User | Email | Role | Added | Last Access |
|------|-------|------|-------|-------------|
| Maria Schmidt | maria@agency.de | Admin | 2022-03 | 2024-05-10 |
| Thomas Weber | thomas@agency.de | Member | 2022-06 | 2024-03-22 |
| OLD: Jan Müller | jan@agency.de | Member | 2023-01 | 2024-01-15 ⚠️ |

⚠️ Alert: Jan Müller left the company 10 months ago but still has project access.

### Step 5: List Pending Invitations

```
List all pending project invitations for the main organization.
I need to clean up invitations that were never accepted.
```

**Tools Used**: `project/invite/list`
**Expected Output**: Pending project invitations:
| Invitation ID | Project | Email | Sent | Status |
|---------------|---------|-------|------|--------|
| inv-001 | Fashion Store | extern@contractor.de | 2024-08-15 | Pending (5mo) ⚠️ |
| inv-002 | Legal Firm | new-dev@agency.de | 2024-12-01 | Pending (3wk) |
| inv-003 | Auto Parts | test@example.com | 2024-07-01 | Pending (6mo) ⚠️ |

⚠️ Alert: 2 invitations pending for 5+ months—should be revoked.

### Step 6: Get Invitation Details and Revoke Old Invitations

```
Get details for invitation inv-001, then revoke it since it's been
pending for 5 months. The contractor never started.
```

**Tools Used**: `project/invite/get`, `org/invite/revoke`
**Expected Output**:
Invitation details for `inv-001`:
- Project: Fashion Store
- Email: extern@contractor.de
- Role: Developer
- Sent: 2024-08-15
- Expires: Never (no auto-expiration)
- Status: Never accepted

Invitation revoked:
- inv-001: Revoked successfully
- Reason: Contractor engagement cancelled
- Security: Access path eliminated

### Step 7: Revoke Organization Access for Departed Members

```
Revoke organization membership for jan@agency.de in the main organization.
He left the company in January and shouldn't have access anymore.
```

**Tools Used**: `org/membership/revoke`
**Expected Output**: Membership revoked:
- User: Jan Müller (jan@agency.de)
- Organization: WebCraft Digital GmbH
- Previous role: Member
- Status: Access revoked
- Cascading effect: Removed from 8 projects
- Security: All organization access eliminated

### Step 8: Audit Applications on Old Project

```
List all applications installed in the old client project p-old-client-1.
I need to understand what's running before archiving.
```

**Tools Used**: `app/list`
**Expected Output**: Applications in `p-old-client-1`:
| App ID | Name | Version | Installed | Last Updated |
|--------|------|---------|-----------|--------------|
| app-wp-001 | WordPress | 5.9.3 | 2022-03-15 | 2023-06-10 ⚠️ |
| app-php-001 | Custom PHP | 8.0 | 2022-04-01 | 2022-04-01 |

⚠️ Alert: WordPress 5.9.3 is severely outdated (security risk). Current version is 6.4.

### Step 9: Check Available Versions and Uninstall

```
Show available WordPress versions, then uninstall the outdated WordPress
from p-old-client-1 since we're archiving this project.
```

**Tools Used**: `app/versions`, `app/uninstall`
**Expected Output**:
Available WordPress versions:
- 6.4.2 (Latest stable)
- 6.3.2 (Previous stable)
- 5.9.3 ⚠️ (Installed - 2 years outdated, known vulnerabilities)

Application uninstalled:
- App: WordPress 5.9.3
- Project: p-old-client-1
- Status: Uninstalled successfully
- Data: Database preserved for archive
- Security: Vulnerable application removed

### Step 10: Update and Delete Project

```
Update the project p-old-client-1 to mark it as archived in the description,
then delete it after confirming data backup.
```

**Tools Used**: `project/update`, `project/delete`
**Expected Output**:
Project updated:
- Project: p-old-client-1
- Description: "[ARCHIVED 2025-01-19] Former client - Backup ID: bak-archive-001"
- Status: Updated

Project deletion initiated:
- Project: p-old-client-1
- Type: Soft delete (30-day recovery window)
- Backup: Confirmed (bak-archive-001)
- Resources freed: 8GB storage, 2 database connections
- Cost savings: ~€15/month

⚠️ Warning: Project will be permanently deleted after 30 days unless restored.

### Step 11: Generate Lifecycle Audit Report

```
Give me a complete lifecycle audit summary:
- Organizations and server utilization
- Revoked access (members and invitations)
- Uninstalled applications
- Archived/deleted projects
- Cost impact
```

**Tools Used**: `org/list`, `server/list`, `org/invite/list`
**Expected Output**:

## Q4 Infrastructure Lifecycle Audit Report
**Agency**: WebCraft Digital GmbH | **Date**: 2025-01-19

### Infrastructure Overview
- **Organizations**: 3 (main, clients, archive)
- **Total Projects**: 59 (was 60, 1 archived)
- **Servers**: 4 (1 candidate for consolidation)

### Access Revocations
| Action | Target | Reason |
|--------|--------|--------|
| Membership revoked | jan@agency.de | Left company 10mo ago |
| Invitation revoked | extern@contractor.de | Never accepted (5mo) |
| Invitation revoked | test@example.com | Test invitation (6mo) |

### Application Cleanup
- WordPress 5.9.3 uninstalled (security vulnerability)
- 1 outdated PHP application identified for review

### Project Lifecycle Changes
- **Archived**: p-old-client-1 (inactive 8mo)
- **Identified for review**: p-test-sandbox (inactive 14mo)

### Cost Impact
- Immediate savings: €15/month (archived project)
- Server consolidation opportunity: €29.90/month (srv-legacy)
- Potential monthly savings: €44.90

### Security Posture
- ✅ Departed employee access revoked
- ✅ Stale invitations cleaned up
- ✅ Vulnerable WordPress removed
- ⚠️ 1 more project to review (p-test-sandbox)

## Outcomes

- **Time Saved**: 2-3 days of manual audit reduced to a 45-minute MCP session. Complete visibility across all organizations, servers, and projects without navigating MStudio screens.
- **Error Reduction**: No missed departed employee access (Jan would have retained access indefinitely), no forgotten stale invitations, no vulnerable applications running unnoticed. Systematic approach ensures complete coverage.
- **Next Steps**:
  - Schedule monthly access reviews using `org/membership/list` and `project/membership/get`
  - Create offboarding checklist that includes MCP access revocation
  - Migrate srv-legacy projects and decommission server
  - Review p-test-sandbox for archival next quarter

---

## Tools Used in This Case Study

| Tool | Domain | Purpose |
|------|--------|---------|
| `org/list` | organization | List all organizations |
| `server/list` | project-foundation | Inventory servers |
| `server/get` | project-foundation | Get server details |
| `project/membership/get` | project-foundation | Audit project access |
| `project/invite/list` | project-foundation | List pending invitations |
| `project/invite/get` | project-foundation | Get invitation details |
| `org/invite/revoke` | organization | Revoke stale invitations |
| `org/membership/revoke` | organization | Revoke departed member access |
| `app/list` | apps | List installed applications |
| `app/versions` | apps | Check available app versions |
| `app/uninstall` | apps | Remove vulnerable applications |
| `project/update` | project-foundation | Update project metadata |
| `project/delete` | project-foundation | Archive/delete old projects |
| `org/invite/list` | organization | Generate audit report |

**Total Tools**: 14 primary workflow tools across 3 domains (organization, project-foundation, apps)
