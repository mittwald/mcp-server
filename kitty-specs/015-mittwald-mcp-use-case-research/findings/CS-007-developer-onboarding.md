# CS-007: New Developer Onboarding

## Persona

**Segment**: SEG-002 Web Development Agency
**Role**: Operations lead at a 15-person web development agency
**Context**: Two junior developers are starting next Monday. They need access to 6 client projects for their first sprint. The last onboarding took 3 days because access requests kept getting forgotten—one developer couldn't deploy for a week because their SSH key was never added.

## Problem

Onboarding new developers at an agency is a security-sensitive process spread across multiple systems. For each new hire, you need to: invite them to the organization, create SSH users for relevant projects, add their SSH public keys, verify SFTP access for file transfers, and document what access they have. When done manually through MStudio, steps get missed—the developer has MStudio access but can't SSH to deploy, or they have SSH but forgot to add their key. Even worse, when developers leave, the offboarding is equally fragmented, leaving orphaned accounts that create security vulnerabilities. A complete onboarding takes 2-3 hours spread across multiple days of back-and-forth.

## Solution: MCP Workflow

### Prerequisites

- Mittwald MCP server connected to Claude Code
- Organization admin access
- New developer's email address and SSH public key
- List of projects the developer needs access to

### Step 1: Review Current Organization Members

```
List all current members of our organization. I need to verify
our team roster before adding the new developers.
```

**Tools Used**: `org/membership/list`
**Expected Output**: Current organization members:
| User | Email | Role | Joined |
|------|-------|------|--------|
| Maria Schmidt | maria@agency.de | Owner | 2022-03-15 |
| Thomas Weber | thomas@agency.de | Admin | 2022-06-01 |
| ... 12 more members ... | | Member | |

Total: 14 active members (2 slots available for new hires).

### Step 2: Invite New Developer to Organization

```
Invite lisa.neumann@agency.de to our organization as a member.
She's our new junior frontend developer starting Monday.
```

**Tools Used**: `org/invite`
**Expected Output**: Invitation sent:
- Email: lisa.neumann@agency.de
- Role: Member
- Status: Pending acceptance
- Invitation expires: 7 days
- Note: Lisa will receive an email to accept the invitation

### Step 3: Create SSH User for Projects

```
Create an SSH user for Lisa Neumann on the "Fashion Store" project.
Username should be "l-neumann" following our naming convention.
```

**Tools Used**: `ssh/user/create`
**Expected Output**: SSH user created:
- Username: `l-neumann`
- Project: Fashion Store (p-fashionstore)
- Home directory: `/home/l-neumann/`
- Shell: `/bin/bash`
- Status: Active (pending key upload)
- Note: SSH key required before login will work

### Step 4: Add SSH Public Key

```
Add Lisa's SSH public key to her user account. Her key is:
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... lisa@macbook
```

**Tools Used**: `user/ssh/key/create`
**Expected Output**: SSH key added:
- Key type: ED25519
- Fingerprint: SHA256:abc123...
- Comment: lisa@macbook
- Added to: l-neumann (Fashion Store)
- Status: Active
- Lisa can now SSH to the project server

### Step 5: Verify SFTP Access

```
List all SFTP users configured for the Fashion Store project.
I need to confirm Lisa has SFTP access for file uploads.
```

**Tools Used**: `sftp/user/list`
**Expected Output**: SFTP users for Fashion Store:
| Username | Home Directory | Status |
|----------|---------------|--------|
| p-fashionstore | /html/ | Active |
| l-neumann | /home/l-neumann/ | Active |
| t-weber | /home/t-weber/ | Active |

✅ Lisa's SSH user includes SFTP access automatically.

### Step 6: Audit All SSH Users Across Projects

```
List all SSH users across all our projects. I need a complete
access inventory for our security documentation.
```

**Tools Used**: `ssh/user/list`
**Expected Output**: SSH user inventory across 6 onboarding projects:
| Project | Users | Last Updated |
|---------|-------|--------------|
| Fashion Store | 4 (added l-neumann) | Today |
| Dental Practice | 3 | 2 weeks ago |
| Legal Firm | 2 | 1 month ago |
| Bakery Shop | 3 | 3 days ago |
| Auto Parts | 4 | 1 week ago |
| Restaurant Site | 2 | 2 months ago |

Total: 18 SSH users across 6 projects.

### Step 7: Generate Onboarding Summary

```
Give me an onboarding summary for Lisa Neumann:
- Organization membership status
- SSH access across all assigned projects
- SSH key status
```

**Tools Used**: `org/membership/list`, `ssh/user/list`, `user/ssh/key/create`
**Expected Output**: Onboarding Summary for Lisa Neumann:
- **Organization**: Invitation pending (sent to lisa.neumann@agency.de)
- **SSH Users**: Created on 6 projects (naming: l-neumann)
- **SSH Key**: ED25519 key added and active
- **SFTP**: Enabled via SSH user (no separate config needed)
- **Ready to work**: Monday, once org invitation accepted

📋 Checklist for Lisa's first day:
- [ ] Accept organization invitation
- [ ] Verify SSH access: `ssh l-neumann@fashionstore.mittwald.de`
- [ ] Clone project repos
- [ ] Review project documentation

## Outcomes

- **Time Saved**: 2-3 hours of fragmented onboarding reduced to a 15-minute MCP session. All access configured in one sitting, no forgotten steps across multiple days.
- **Error Reduction**: SSH keys added at the same time as users (no "can't deploy" delays), SFTP access verified immediately, complete access inventory for documentation. No orphaned accounts from incomplete setup.
- **Next Steps**:
  - Create offboarding workflow to revoke access when developers leave
  - Set up project-specific access templates for common role combinations
  - Schedule quarterly access audit using `ssh/user/list` and `org/membership/list`
  - Document the onboarding process for other admins

---

## Tools Used in This Case Study

| Tool | Domain | Purpose |
|------|--------|---------|
| `org/membership/list` | organization | Review current team members |
| `org/invite` | organization | Invite new developer |
| `ssh/user/create` | ssh | Create SSH user on projects |
| `user/ssh/key/create` | identity | Add SSH public key |
| `sftp/user/list` | sftp | Verify SFTP access |
| `ssh/user/list` | ssh | Audit all SSH users |

**Total Tools**: 6 primary workflow tools across 4 domains (organization, ssh, identity, sftp)
