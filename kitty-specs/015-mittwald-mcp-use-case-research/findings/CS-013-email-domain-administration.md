# CS-013: Email & Domain Administration

## Persona

**Segment**: SEG-001 Freelance Web Developer
**Role**: Solo freelancer managing hosting and email for 12 small business clients
**Context**: A long-time client, "Müller & Schmidt Consulting", just completed a rebrand to "Nexus Advisory GmbH". They need all email addresses migrated from the old domain (mueller-schmidt.de) to the new domain (nexus-advisory.de), with proper forwarding during the transition period, and complete cleanup of the old configuration afterward.

## Problem

Domain migrations are among the most error-prone tasks for freelancers. The client has 5 email addresses on the old domain, each with its own deliverybox and forwarding rules. Manually migrating through MStudio means: clicking into each email address to understand its configuration, setting up forwarding rules to prevent lost mail during transition, creating equivalent addresses on the new domain, adjusting deliverybox quotas, and eventually cleaning up the old domain—all while ensuring no email gets lost. One missed forwarding rule or premature deletion means angry clients calling about missing emails. The manual process takes 2-3 hours and generates anxiety about making mistakes that could cost the client business.

## Solution: MCP Workflow

### Prerequisites

- Mittwald MCP server connected to Claude Code
- Both domains (mueller-schmidt.de, nexus-advisory.de) configured in the project
- Project admin access
- Client approval for migration timeline

### Step 1: Inspect Current Domain Configuration

```
Get the details for the domain mueller-schmidt.de.
I need to understand the current configuration before starting migration.
```

**Tools Used**: `domain/get`
**Expected Output**: Domain details for `mueller-schmidt.de`:
- **Domain ID**: dom-mueller-schmidt
- **Status**: Active
- **Created**: 2019-03-15
- **DNS managed by**: Mittwald
- **SSL certificate**: Let's Encrypt (valid until 2025-03-20)
- **Virtual host**: Configured, pointing to /html/old-site/
- **Email addresses**: 5 configured
- **MX records**: Mittwald mail servers

### Step 2: List All DNS Zones

```
List all DNS zones in this project. I want to see both the old
and new domain configurations side by side.
```

**Tools Used**: `domain/dnszone/list`
**Expected Output**: DNS zones in project:
| Domain | Zone ID | Records | Status |
|--------|---------|---------|--------|
| mueller-schmidt.de | zone-ms-001 | 12 | Active |
| nexus-advisory.de | zone-na-001 | 8 | Active |

Both domains have DNS zones configured.

### Step 3: Get DNS Zone Details

```
Get the DNS zone details for mueller-schmidt.de.
I need to verify MX records and understand current email routing.
```

**Tools Used**: `domain/dnszone/get`
**Expected Output**: DNS zone for `mueller-schmidt.de`:
| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 93.184.216.34 | 3600 |
| CNAME | www | mueller-schmidt.de | 3600 |
| MX | @ | mx1.mittwald.de (priority 10) | 3600 |
| MX | @ | mx2.mittwald.de (priority 20) | 3600 |
| TXT | @ | v=spf1 include:mittwald.de ~all | 3600 |

MX records correctly pointing to Mittwald mail servers.

### Step 4: List All Email Addresses and Deliveryboxes

```
List all email addresses and deliveryboxes for mueller-schmidt.de.
I need the complete inventory before migration.
```

**Tools Used**: `mail/address/list`, `mail/deliverybox/list`
**Expected Output**:
**Email addresses** on mueller-schmidt.de:
| Address | Type | Forwards To |
|---------|------|-------------|
| info@mueller-schmidt.de | Deliverybox | - |
| kontakt@mueller-schmidt.de | Forward | info@mueller-schmidt.de |
| thomas@mueller-schmidt.de | Deliverybox | - |
| anna@mueller-schmidt.de | Deliverybox | - |
| buchhaltung@mueller-schmidt.de | Forward | anna@mueller-schmidt.de |

**Deliveryboxes**:
| Address | Quota | Used | Messages |
|---------|-------|------|----------|
| info@mueller-schmidt.de | 5GB | 2.1GB | 4,532 |
| thomas@mueller-schmidt.de | 5GB | 1.8GB | 2,891 |
| anna@mueller-schmidt.de | 5GB | 3.2GB | 5,104 |

### Step 5: Get Email Address Details

```
Get the details for info@mueller-schmidt.de.
I need to understand its exact configuration for replication.
```

**Tools Used**: `mail/address/get`
**Expected Output**: Email address details for `info@mueller-schmidt.de`:
- **Address ID**: mail-info-ms
- **Type**: Primary with deliverybox
- **Created**: 2019-03-20
- **Deliverybox ID**: dbox-info-ms
- **Autoresponder**: Disabled
- **Spam filter**: Enabled (moderate)
- **Catch-all**: No
- **Aliases**: kontakt@ forwards here

### Step 6: Get Deliverybox Details

```
Get the deliverybox details for info@mueller-schmidt.de.
I need quota and storage information for the new configuration.
```

**Tools Used**: `mail/deliverybox/get`
**Expected Output**: Deliverybox details for `info@mueller-schmidt.de`:
- **Deliverybox ID**: dbox-info-ms
- **Quota**: 5GB
- **Used**: 2.1GB (42%)
- **Messages**: 4,532
- **Oldest message**: 2020-01-15
- **IMAP enabled**: Yes
- **POP3 enabled**: No
- **Last access**: 2025-01-18 09:45:00

### Step 7: Update Email Addresses with Forwarding

```
Update info@mueller-schmidt.de to forward all incoming mail
to info@nexus-advisory.de. This ensures no mail is lost during
the transition period while clients update their address books.
```

**Tools Used**: `mail/address/update`
**Expected Output**: Email address updated:
- **Address**: info@mueller-schmidt.de
- **Change**: Added forwarding to info@nexus-advisory.de
- **Original deliverybox**: Still active (copy kept locally)
- **Mode**: Forward and keep copy
- **Status**: Active

Incoming mail to the old address will now be forwarded to the new address while keeping a copy in the old mailbox for safety.

### Step 8: Update Deliverybox Quotas on New Domain

```
Update the deliverybox quota for info@nexus-advisory.de to 10GB.
The client is expanding and needs more storage.
```

**Tools Used**: `mail/deliverybox/update`
**Expected Output**: Deliverybox updated:
- **Address**: info@nexus-advisory.de
- **Previous quota**: 5GB
- **New quota**: 10GB
- **Current usage**: 0.3GB (initial import)
- **Status**: Active

### Step 9: Delete Old Email Addresses (After Migration Confirmed)

```
The client confirmed all email is working on nexus-advisory.de.
Delete the old email addresses on mueller-schmidt.de.
Start with kontakt@ which was just a forwarder.
```

**Tools Used**: `mail/address/delete`
**Expected Output**: Email address deleted:
- **Address**: kontakt@mueller-schmidt.de
- **Type**: Forwarder (no mailbox data lost)
- **Status**: Deleted
- **Forwarding rule**: Removed

⚠️ Warning: This action is permanent. The address can be recreated but forwarding rules are gone.

### Step 10: Delete Old Deliveryboxes

```
Delete the deliverybox for thomas@mueller-schmidt.de.
He confirmed his mail client is now using the new address.
```

**Tools Used**: `mail/deliverybox/delete`
**Expected Output**: Deliverybox deleted:
- **Address**: thomas@mueller-schmidt.de
- **Data deleted**: 1.8GB (2,891 messages)
- **Status**: Deleted
- **Note**: Data is not recoverable

⚠️ Warning: 2,891 messages permanently deleted. Ensure client has archived if needed.

### Step 11: Get Virtual Host Configuration

```
Get the virtualhost configuration for mueller-schmidt.de.
I need to verify it before removal.
```

**Tools Used**: `domain/virtualhost/get`
**Expected Output**: Virtual host details for `mueller-schmidt.de`:
- **VHost ID**: vhost-ms-001
- **Domain**: mueller-schmidt.de
- **Document root**: /html/old-site/
- **SSL**: Let's Encrypt (active)
- **PHP version**: 8.1
- **Redirects**: None configured
- **Status**: Active

### Step 12: Delete Old Virtual Host

```
Delete the virtualhost for mueller-schmidt.de.
The new website is live on nexus-advisory.de and we're setting up
a redirect at the DNS level.
```

**Tools Used**: `domain/virtualhost/delete`
**Expected Output**: Virtual host deleted:
- **Domain**: mueller-schmidt.de
- **VHost ID**: vhost-ms-001
- **Document root**: /html/old-site/ (files preserved)
- **SSL certificate**: Released
- **Status**: Deleted

The domain no longer serves web content from this project. Consider adding a redirect DNS record.

### Step 13: Generate Migration Summary

```
Give me a migration completion summary:
- Old domain status (email and web)
- New domain configuration
- What was migrated vs deleted
```

**Tools Used**: `domain/get`, `mail/address/list`, `mail/deliverybox/list`
**Expected Output**:

## Domain Migration Summary
**From**: mueller-schmidt.de → **To**: nexus-advisory.de
**Date**: 2025-01-19 | **Project**: Nexus Advisory

### Email Migration
| Old Address | New Address | Status |
|-------------|-------------|--------|
| info@ | info@nexus-advisory.de | ✅ Migrated, old forwarding |
| kontakt@ | kontakt@nexus-advisory.de | ✅ Migrated, old deleted |
| thomas@ | thomas@nexus-advisory.de | ✅ Migrated, old deleted |
| anna@ | anna@nexus-advisory.de | ✅ Migrated (in progress) |
| buchhaltung@ | buchhaltung@nexus-advisory.de | ✅ Migrated (in progress) |

### Deliverybox Status
| Address | Old Quota | New Quota | Data |
|---------|-----------|-----------|------|
| info@ | 5GB | 10GB | Migrated via IMAP |
| thomas@ | 5GB | 5GB | Migrated, old deleted |
| anna@ | 5GB | 5GB | Migration in progress |

### Web Configuration
- **Old virtualhost**: Deleted (redirect DNS recommended)
- **New virtualhost**: Active on nexus-advisory.de
- **Files**: Preserved in /html/old-site/ for archive

### Cleanup Completed
- 3 old email addresses deleted
- 2 old deliveryboxes deleted (4.9GB freed)
- 1 old virtualhost removed
- Forwarding active for transition safety

## Outcomes

- **Time Saved**: 2-3 hours of careful MStudio navigation reduced to a 30-minute MCP workflow. Each configuration is visible and verifiable before deletion.
- **Error Reduction**: No missed forwarding rules (all addresses have forwarding before deletion), no premature deletions (get details before delete), complete inventory prevents overlooked addresses. The conversational workflow creates a natural audit trail.
- **Next Steps**:
  - Complete forwarding deletion after 30-day transition period
  - Archive /html/old-site/ directory and remove
  - Update DNS to add redirect from old domain to new
  - Cancel old domain renewal if not needed

---

## Tools Used in This Case Study

| Tool | Domain | Purpose |
|------|--------|---------|
| `domain/get` | domains-mail | Inspect domain configuration |
| `domain/dnszone/list` | domains-mail | List all DNS zones |
| `domain/dnszone/get` | domains-mail | Get DNS zone details |
| `mail/address/list` | domains-mail | List email addresses |
| `mail/address/get` | domains-mail | Get email address details |
| `mail/address/update` | domains-mail | Configure forwarding |
| `mail/address/delete` | domains-mail | Remove old addresses |
| `mail/deliverybox/list` | domains-mail | List mailboxes |
| `mail/deliverybox/get` | domains-mail | Get mailbox details |
| `mail/deliverybox/update` | domains-mail | Update quotas |
| `mail/deliverybox/delete` | domains-mail | Remove old mailboxes |
| `domain/virtualhost/get` | domains-mail | Get virtualhost config |
| `domain/virtualhost/delete` | domains-mail | Remove old virtualhost |

**Total Tools**: 13 primary workflow tools (all from domains-mail domain)
