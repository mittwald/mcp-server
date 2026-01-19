# CS-002: Agency Multi-Project Management

## Persona

**Segment**: SEG-002 Web Development Agency
**Role**: Technical lead at a 12-person web development agency managing 45 client projects
**Context**: Monday morning standup is approaching, and you need a quick overview of all active projects, team member assignments, and any pending support issues. The team just onboarded 3 new clients last month.

## Problem

Managing 45 client projects across a 12-person team means constant context switching: checking MStudio for project status, verifying which team members have access to which projects, and monitoring support conversations scattered across the Mittwald dashboard. When a client escalates an issue, finding the relevant support ticket history requires clicking through multiple conversations. The agency's project manager spends 2+ hours weekly just gathering status information that should be available at a glance. Missed support conversations have led to client frustration and delayed response times.

## Solution: MCP Workflow

### Prerequisites

- Mittwald MCP server connected to Claude Code
- Organization admin access to the agency's Mittwald account
- Knowledge of organization ID (e.g., `o-abc123`)

### Step 1: Get Organization Overview

```
Show me the details of my organization including the name,
billing information, and current resource quotas.
```

**Tools Used**: `org/get`
**Expected Output**: Organization details including:
- Name: "WebCraft Digital GmbH"
- Organization ID: `o-abc123`
- Quota: 50 projects (45 used)
- Billing contact and current plan tier

### Step 2: List All Active Projects

```
List all projects in my organization with their current status
and when they were last updated.
```

**Tools Used**: `project/list`
**Expected Output**: Table of 45 projects showing:
- Project ID and name (e.g., `p-client1`, "Müller Maschinenbau Website")
- Server assignment
- Status (active, maintenance, etc.)
- Last modification timestamp

### Step 3: Audit Team Member Access

```
Show me all members of my organization and their roles
to verify who has access to our Mittwald resources.
```

**Tools Used**: `org/membership/list`
**Expected Output**: List of 12 team members with:
- User ID and email
- Role (owner, admin, member)
- Join date
- Last active timestamp

### Step 4: Review Open Support Conversations

```
List all support conversations for my organization,
especially any that are unresolved or awaiting response.
```

**Tools Used**: `conversation/list`
**Expected Output**: List of support tickets showing:
- Conversation ID and subject
- Status (open, pending, resolved)
- Created date and last response
- Related project (if any)

### Step 5: Create Support Ticket for Client Issue

```
Create a support conversation about slow database performance
on the "Bäckerei Schmidt Webshop" project. The client reported
checkout taking 15+ seconds during peak hours yesterday.
```

**Tools Used**: `conversation/create`
**Expected Output**: New conversation created:
- Conversation ID: `conv-xyz789`
- Subject: "Slow database performance - Bäckerei Schmidt Webshop"
- Category: Technical Support
- Status: Open
- Reference ticket number provided for client communication

### Step 6: Add Technical Details to Support Ticket

```
Reply to the support conversation conv-xyz789 with additional details:
"We've observed the slow queries coincide with the 12:00-13:00 lunch
rush. The project is on a Space Server M plan. MySQL slow query log
shows queries exceeding 5 seconds on the cart_items table."
```

**Tools Used**: `conversation/reply`
**Expected Output**: Reply added to conversation:
- Message timestamp
- Confirmation of attachment to ticket
- Updated conversation status (awaiting Mittwald response)

### Step 7: Generate Weekly Status Summary

```
Give me a summary for our Monday standup:
- Total active projects and any in maintenance mode
- Team members and their recent activity
- Open support tickets requiring attention
```

**Tools Used**: `project/list`, `org/membership/list`, `conversation/list`
**Expected Output**: Consolidated summary:
- Projects: 45 active, 0 maintenance, 5 remaining quota
- Team: 12 members, 3 active in last 24h
- Support: 2 open tickets (1 awaiting response, 1 in progress)

## Outcomes

- **Time Saved**: 2+ hours weekly of manual dashboard navigation reduced to 5-minute morning check-in. Status gathering becomes a conversational query instead of clicking through 45 projects.
- **Error Reduction**: No missed support conversations (all visible in one query), no forgotten team member access reviews, complete project visibility prevents "orphan project" situations.
- **Next Steps**:
  - Automate weekly status reports using cronjobs
  - Set up project-specific access audits using `project/membership/list`
  - Create templates for common support ticket types

---

## Tools Used in This Case Study

| Tool | Domain | Purpose |
|------|--------|---------|
| `org/get` | organization | Get organization details and quotas |
| `project/list` | project-foundation | List all client projects |
| `org/membership/list` | organization | Audit team member access |
| `conversation/list` | misc | Review support tickets |
| `conversation/create` | misc | Create new support ticket |
| `conversation/reply` | misc | Add details to support ticket |

**Total Tools**: 6 primary workflow tools
