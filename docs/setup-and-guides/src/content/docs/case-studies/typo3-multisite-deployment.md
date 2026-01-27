---
title: TYPO3 Multi-Site Deployment
description: Deploy and manage TYPO3 multi-site installations with shared databases and domains
---

# TYPO3 Multi-Site Deployment

In this tutorial, you will roll out a new TYPO3 multi-site setup for an enterprise client, starting from an existing base installation and scaling it across multiple domains.

## Who Is This For?

- **Segment**: Enterprise TYPO3 Developer
- **Role**: TYPO3-certified developer with corporate clients
- **Context**: Rolling out a new TYPO3 multi-site for an enterprise client with multiple language domains

## What You'll Solve

- Reduce multi-site setup time by reusing a proven base installation
- Keep database and domain configuration consistent across sites
- Establish least-privilege SSH access for deployment automation

## Prerequisites

- Mittwald MCP server connected to your MCP client
- An existing TYPO3 12 LTS base installation in your project
- Project ID (for example, `p-autosupplier`)
- Registered domains for each language site (for example, `example.com`, `example.fr`)

## Step-by-Step Guide

### Step 1: Clone the base TYPO3 site

Use the base installation as a template for your next language site.

- Tool: [`app/copy`](/reference/tools/app/app-copy/)
- Outcome: A new TYPO3 application directory for the language site

### Step 2: Create a database for the new site

Provision a dedicated MySQL database to keep data isolated while sharing the same database server version and settings.

- Tool: [`database/mysql/create`](/reference/tools/database/database-mysql-create/)
- Outcome: A new database and user credentials for the site

### Step 3: Attach the language domain

Point the domain for the new language site to its document root.

- Tool: [`domain/virtualhost/create`](/reference/tools/domain/domain-virtualhost-create/)
- Outcome: Virtual host and SSL provisioning for the new domain

### Step 4: Configure SSH access for deployment

Add a dedicated SSH user for CI/CD and ensure the team has the right access.

- Tool: [`ssh/user/create`](/reference/tools/ssh/ssh-user-create/)
- Outcome: Deployment-ready SSH access with least-privilege credentials

### Step 5: Verify the multi-site setup

Visit each domain and confirm that the site identifier, base URL, and database connection are correct. Repeat steps 1–4 for each additional language site.

## Tools Reference

| Tool | Purpose |
| --- | --- |
| [`app/copy`](/reference/tools/app/app-copy/) | Clone the base TYPO3 application for each site |
| [`database/mysql/create`](/reference/tools/database/database-mysql-create/) | Create language-specific databases |
| [`domain/virtualhost/create`](/reference/tools/domain/domain-virtualhost-create/) | Map domains to site document roots |
| [`ssh/user/create`](/reference/tools/ssh/ssh-user-create/) | Provision SSH users for deployment |

## Related Tutorials

- [Security Audit Automation](/case-studies/security-audit-automation/)
