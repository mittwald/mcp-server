# CS-001: Freelancer Client Onboarding Automation

## Persona

**Segment**: SEG-001 Freelance Web Developer
**Role**: Solo WordPress developer managing 12 client websites
**Context**: Just signed a new client who needs a complete web presence: hosting project, custom domain, professional email addresses, and SSL certificate. The client is eager to launch within the week.

## Problem

Setting up a new client project manually through MStudio takes 45-60 minutes: navigate to create project, wait for provisioning, switch to domain settings, configure DNS records, create mail addresses, set up delivery boxes, and finally request an SSL certificate. Each step requires navigating different screens, and forgetting a single step (like creating the mail deliverybox after the address) causes email failures that frustrate the client. For a freelancer juggling multiple clients, this repetitive process eats into billable hours and introduces risk of human error.

## Solution: MCP Workflow

### Prerequisites

- Mittwald MCP server connected to Claude Code
- Active Mittwald organization with available project quota
- Client's domain name registered (e.g., `bakerei-mueller.de`)
- Client requirements gathered: project name, email addresses needed

### Step 1: Create the Client Project

```
Create a new Mittwald project called "Bäckerei Müller Website"
in my organization. Use the standard web hosting configuration.
```

**Tools Used**: `project/create`
**Expected Output**: Project created with ID `p-abc123`, server assigned, default directory structure provisioned. Confirmation includes the project short ID and server hostname.

### Step 2: Configure the Domain Virtual Host

```
Add the domain bakerei-mueller.de to my new project "Bäckerei Müller Website"
and configure it as the primary virtual host pointing to the web root.
```

**Tools Used**: `domain/virtualhost/create`
**Expected Output**: Virtual host created linking `bakerei-mueller.de` to the project. The domain is now associated with the project's document root at `/html/`.

### Step 3: Update DNS Records

```
Update the DNS zone for bakerei-mueller.de with:
- A record pointing to the project server IP
- CNAME for www subdomain
- MX records for Mittwald mail servers
```

**Tools Used**: `domain/dnszone/update`
**Expected Output**: DNS zone updated with A record (e.g., `93.184.216.34`), CNAME for `www` pointing to `bakerei-mueller.de`, and MX records configured for `mx1.mittwald.de` and `mx2.mittwald.de` with appropriate priorities.

### Step 4: Create Email Address

```
Create an email address info@bakerei-mueller.de for the client's
general inquiries in this project.
```

**Tools Used**: `mail/address/create`
**Expected Output**: Email address `info@bakerei-mueller.de` created and associated with the project. Address ID returned for subsequent configuration.

### Step 5: Create Mail Deliverybox

```
Create a deliverybox for info@bakerei-mueller.de with 5GB storage quota
so the client can receive and store emails.
```

**Tools Used**: `mail/deliverybox/create`
**Expected Output**: Deliverybox created with 5GB quota. IMAP/POP3 credentials generated. The client can now receive emails at `info@bakerei-mueller.de` using standard mail client configuration.

### Step 6: Request SSL Certificate

```
Request a free Let's Encrypt SSL certificate for bakerei-mueller.de
including the www subdomain.
```

**Tools Used**: `certificate/request`
**Expected Output**: Certificate request submitted for `bakerei-mueller.de` and `www.bakerei-mueller.de`. Let's Encrypt validation initiated. Certificate will be automatically installed once DNS propagation completes (typically 5-15 minutes).

### Step 7: Verify Complete Setup

```
Show me a summary of the project "Bäckerei Müller Website" including
the configured domain, email addresses, and certificate status.
```

**Tools Used**: `project/get`, `domain/virtualhost/list`, `mail/address/list`, `certificate/list`
**Expected Output**: Complete project summary showing:
- Project ID and status: `p-abc123`, active
- Domain: `bakerei-mueller.de` with virtual host configured
- Email: `info@bakerei-mueller.de` with deliverybox active
- SSL: Certificate pending or issued for domain and www subdomain

## Outcomes

- **Time Saved**: 45-60 minutes of manual MStudio navigation reduced to 3-5 minutes of conversational prompts. The workflow runs while you explain the setup to the client.
- **Error Reduction**: No forgotten deliverybox (causes bounced emails), no missed MX records (email never arrives), no overlooked SSL (browser security warnings). The natural conversation ensures all components are created together.
- **Next Steps**:
  - Set up a backup schedule using `backup/schedule/create`
  - Create additional email addresses for the client (e.g., `bestellung@bakerei-mueller.de`)
  - Install WordPress using the app installation workflow

---

## Tools Used in This Case Study

| Tool | Domain | Purpose |
|------|--------|---------|
| `project/create` | project-foundation | Create the hosting project |
| `domain/virtualhost/create` | domains-mail | Link domain to project |
| `domain/dnszone/update` | domains-mail | Configure DNS records |
| `mail/address/create` | domains-mail | Create email address |
| `mail/deliverybox/create` | domains-mail | Create mailbox storage |
| `certificate/request` | certificates | Request SSL certificate |
| `project/get` | project-foundation | Verify project setup |
| `domain/virtualhost/list` | domains-mail | Verify domain config |
| `mail/address/list` | domains-mail | Verify email setup |
| `certificate/list` | domains-mail | Verify certificate status |

**Total Tools**: 10 (6 primary workflow + 4 verification)
