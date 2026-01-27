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

### 1. Add the developer to the organization

Use [`org/membership/create`](/reference/tools/org/org-membership-create/) to add the new team member to your agency organization.

### 2. Create an SSH key entry

Use [`ssh/key/create`](/reference/tools/ssh/ssh-key-create/) to register the developer's SSH public key.

### 3. Set up SFTP access

Use [`sftp/user/create`](/reference/tools/sftp/sftp-user-create/) to create an SFTP user with the correct home directory.

### 4. Grant project-specific permissions

Use [`project/membership/create`](/reference/tools/project/project-membership-create/) to assign the developer to the projects they need.

### 5. Verify access

Ask the developer to confirm SSH and SFTP access and ensure project permissions match the expected scope.

## What You'll Achieve

- Consistent onboarding with fewer access mistakes
- Faster time-to-first-commit for new hires
- Clear audit trail of who has access to what

## Tools Reference

| Tool | Purpose |
| --- | --- |
| [`org/membership/create`](/reference/tools/org/org-membership-create/) | Add the developer to the organization |
| [`ssh/key/create`](/reference/tools/ssh/ssh-key-create/) | Register SSH public keys |
| [`sftp/user/create`](/reference/tools/sftp/sftp-user-create/) | Create SFTP credentials |
| [`project/membership/create`](/reference/tools/project/project-membership-create/) | Grant project access |

## Related Tutorials

- [Agency Multi-Project Management](/case-studies/agency-multi-project-management/)
