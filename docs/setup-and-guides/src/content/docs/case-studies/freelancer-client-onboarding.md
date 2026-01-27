---
title: Client Onboarding Automation
description: Automate new client setup with Mittwald MCP - project, domain, email, and SSL in minutes
---

In this tutorial, you'll automate the full client onboarding workflow so a new website is ready in minutes instead of an hour.

## Who Is This For?

- **Segment**: Freelance Web Developer
- **Role**: Solo WordPress developer managing 12+ client websites
- **Context**: You just signed a new client and need hosting, domain, email, and SSL ready this week

## What You'll Solve

- Replace 45-60 minutes of manual MStudio navigation with a repeatable, scripted workflow
- Eliminate missed steps like deliverybox creation, MX records, or SSL requests

## Prerequisites

- [Mittwald MCP connected](/getting-started/)
- An active Mittwald organization with available project quota
- The client's domain name already registered
- Client requirements gathered (project name, email addresses needed)

## Step-by-Step Guide

### Step 1: Create the Client Project

Create a new project for the client using [`project/create`](/reference/tools/project/project-create/).

Example prompt:

```
Create a new Mittwald project called "Baeckerei Mueller Website"
in my organization. Use the standard web hosting configuration.
```

### Step 2: Configure the Domain Virtual Host

Attach the client's domain to the project with [`domain/virtualhost/create`](/reference/tools/domain/domain-virtualhost-create/).

Example prompt:

```
Add the domain bakerei-mueller.de to my new project "Baeckerei Mueller Website"
and configure it as the primary virtual host pointing to the web root.
```

### Step 3: Update DNS Records

Apply the required DNS records via [`domain/dnszone/update`](/reference/tools/domain/domain-dnszone-update/).

Example prompt:

```
Update the DNS zone for bakerei-mueller.de with:
- A record pointing to the project server IP
- CNAME for www subdomain
- MX records for Mittwald mail servers
```

### Step 4: Create Email Address

Create the primary mailbox address with [`mail/address/create`](/reference/tools/mail/mail-address-create/).

Example prompt:

```
Create an email address info@bakerei-mueller.de for the client's
general inquiries in this project.
```

### Step 5: Create Mail Deliverybox

Provision storage for the mailbox using [`mail/deliverybox/create`](/reference/tools/mail/mail-deliverybox-create/).

Example prompt:

```
Create a deliverybox for info@bakerei-mueller.de with 5GB storage quota
so the client can receive and store emails.
```

### Step 6: Request SSL Certificate

Request a certificate with [`certificate/request`](/reference/tools/certificate/certificate-request/).

Example prompt:

```
Request a free Let's Encrypt SSL certificate for bakerei-mueller.de
including the www subdomain.
```

### Step 7: Verify Complete Setup

Confirm everything is in place using:

- [`project/get`](/reference/tools/project/project-get/)
- [`domain/virtualhost/list`](/reference/tools/domain/domain-virtualhost-list/)
- [`mail/address/list`](/reference/tools/mail/mail-address-list/)
- [`certificate/list`](/reference/tools/certificate/certificate-list/)

Example prompt:

```
Show me a summary of the project "Baeckerei Mueller Website" including
the configured domain, email addresses, and certificate status.
```

## What You'll Achieve

- **Time saved**: 45-60 minutes reduced to 3-5 minutes
- **Error reduction**: No missed deliveryboxes, MX records, or SSL requests
- **Next steps**:
  - Create a backup schedule with [`backup/schedule/create`](/reference/tools/backup/backup-schedule-create/)
  - Add more client mailboxes with [`mail/address/create`](/reference/tools/mail/mail-address-create/)
  - Install WordPress using your preferred app workflow

## Tools Reference

| Tool | Domain | Purpose in This Tutorial |
|------|--------|--------------------------|
| [`project/create`](/reference/tools/project/project-create/) | project | Create the hosting project |
| [`domain/virtualhost/create`](/reference/tools/domain/domain-virtualhost-create/) | domain | Attach the primary domain |
| [`domain/dnszone/update`](/reference/tools/domain/domain-dnszone-update/) | domain | Configure DNS records |
| [`mail/address/create`](/reference/tools/mail/mail-address-create/) | mail | Create the mailbox address |
| [`mail/deliverybox/create`](/reference/tools/mail/mail-deliverybox-create/) | mail | Provision mailbox storage |
| [`certificate/request`](/reference/tools/certificate/certificate-request/) | certificate | Request SSL certificate |
| [`project/get`](/reference/tools/project/project-get/) | project | Verify project setup |
| [`domain/virtualhost/list`](/reference/tools/domain/domain-virtualhost-list/) | domain | Verify domain configuration |
| [`mail/address/list`](/reference/tools/mail/mail-address-list/) | mail | Verify mailbox setup |
| [`certificate/list`](/reference/tools/certificate/certificate-list/) | certificate | Verify certificate status |
| [`backup/schedule/create`](/reference/tools/backup/backup-schedule-create/) | backup | Create follow-up backup schedule |

## Related Tutorials

- [Automated Backup Monitoring](/case-studies/automated-backup-monitoring/) - Monitor backup health across client projects
