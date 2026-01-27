---
title: Security Audit Automation
description: Audit API tokens, SSH keys, certificates, and sessions for enterprise compliance
---

# Security Audit Automation

In this tutorial, you will assemble a compliance-ready security inventory for an enterprise TYPO3 client in minutes instead of hours.

## Who Is This For?

- **Segment**: Enterprise TYPO3 Developer
- **Role**: TYPO3-certified consultant serving regulated enterprise clients
- **Context**: Preparing evidence for ISO 27001 or SOC 2 audits

## What You'll Solve

- Quickly inventory credentials and sessions across projects
- Identify expiring certificates and weak SSH keys before audits
- Produce a clear compliance snapshot for auditors and stakeholders

## Prerequisites

- Mittwald MCP server connected to your MCP client
- Admin-level access to the organization and relevant projects
- A list of project IDs in scope for the audit

## Step-by-Step Guide

### Step 1: List all API tokens

Start with a full token inventory so you can flag stale or over-permissioned tokens.

- Tool: [`user/api/token/list`](/reference/tools/user/user-api-token-list/)
- Outcome: Token list with scopes, creation dates, and last-used timestamps

### Step 2: Audit SSH keys

Check for keys that are outdated or no longer in use.

- Tool: [`user/ssh/key/list`](/reference/tools/user/user-ssh-key-list/)
- Outcome: SSH key inventory with key types and fingerprints

### Step 3: Review certificate expiration

Identify certificates that are expiring soon or already expired.

- Tool: [`certificate/list`](/reference/tools/certificate/certificate-list/)
- Outcome: Certificate list with expiration dates and status

### Step 4: Review active sessions

Confirm there are no unexpected sessions and document current activity.

- Tool: [`user/session/list`](/reference/tools/user/user-session-list/)
- Outcome: Active session inventory with devices and last active timestamps

### Step 5: Generate a compliance report

Summarize the findings with risk flags (expired certificates, weak keys, inactive sessions) and recommended actions for the audit trail.

## Tools Reference

| Tool | Purpose |
| --- | --- |
| [`user/api/token/list`](/reference/tools/user/user-api-token-list/) | Inventory API tokens and permissions |
| [`user/ssh/key/list`](/reference/tools/user/user-ssh-key-list/) | Audit SSH keys and key strength |
| [`certificate/list`](/reference/tools/certificate/certificate-list/) | Check certificate validity and expiration |
| [`user/session/list`](/reference/tools/user/user-session-list/) | Review active user sessions |

## Related Tutorials

- [TYPO3 Multi-Site Deployment](/case-studies/typo3-multisite-deployment/)
