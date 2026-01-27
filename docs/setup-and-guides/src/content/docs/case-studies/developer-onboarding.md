---
title: Developer Onboarding
description: Onboard new team members with proper SSH, SFTP, and project access via Mittwald MCP
---

# Developer Onboarding

This tutorial walks a technical lead through onboarding a new developer with the right access and credentials across your Mittwald organization and projects.

## Who Is This For?

- **Segment:** Web Development Agency
- **Role:** Technical lead onboarding a new developer
- **Context:** Need to grant access quickly without over-provisioning

## What You'll Solve

Onboarding often involves manual steps across multiple screens, which leads to delays and inconsistent permissions. You'll create a repeatable, audited flow for every new hire.

## Before You Start

- Mittwald MCP is configured in your client
- You have permission to manage organization and project access
- You know the organization ID and the target project IDs

## Step-by-Step Guide

### 1. Invite the developer to the organization

Use [`org/invite`](/reference/tools/org/org-invite/) to send an invitation to the new team member to join your agency organization.

### 2. Create SSH user access

Use [`ssh/user/create`](/reference/tools/ssh/ssh-user-create/) to create SSH access for the developer with their public key.

### 3. Set up SFTP access

Use [`sftp/user/create`](/reference/tools/sftp/sftp-user-create/) to create an SFTP user with the correct home directory.

### 4. Verify project memberships

After inviting the developer to projects (via Mittwald portal), use [`project/membership/list`](/reference/tools/project/project-membership-list/) to confirm they have the correct project access.

### 5. Verify access

Ask the developer to confirm SSH and SFTP access and ensure project permissions match the expected scope.

## What You'll Achieve

- Consistent onboarding with fewer access mistakes
- Faster time-to-first-commit for new hires
- Clear audit trail of who has access to what

## Tools Reference

| Tool | Purpose |
| --- | --- |
| [`org/invite`](/reference/tools/org/org-invite/) | Invite the developer to the organization |
| [`ssh/user/create`](/reference/tools/ssh/ssh-user-create/) | Create SSH access with public key |
| [`sftp/user/create`](/reference/tools/sftp/sftp-user-create/) | Create SFTP credentials |
| [`project/membership/list`](/reference/tools/project/project-membership-list/) | Verify project access after invitation |

## Related Tutorials

- [Agency Multi-Project Management](/case-studies/agency-multi-project-management/)
