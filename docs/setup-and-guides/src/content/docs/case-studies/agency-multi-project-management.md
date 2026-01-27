---
title: Agency Multi-Project Management
description: Manage 45+ client projects, team access, and support tickets with Mittwald MCP
---

# Agency Multi-Project Management

This tutorial shows how a technical lead at a web development agency can use Mittwald MCP to get a fast, reliable weekly overview across dozens of client projects.

## Who Is This For?

- **Segment:** Web Development Agency
- **Role:** Technical lead at a 12-person agency managing 45 client projects
- **Context:** Monday standup prep, need a complete project overview before the team sync

## What You'll Solve

Manual dashboard hopping takes 2+ hours each week. You'll replace that with a repeatable workflow that surfaces project health, team access, and support status in minutes.

## Before You Start

- Mittwald MCP is configured in your client
- You have org-level access for your agency
- You know the organization ID you want to review

## Step-by-Step Guide

### 1. Get an organization overview

Use [`org/get`](/reference/tools/org/org-get/) to confirm the org details you are about to review.

### 2. List all active projects

Use [`project/list`](/reference/tools/project/project-list/) to pull the full set of active client projects and filter to the ones that need attention this week.

### 3. Audit team member access

Use [`org/membership/list`](/reference/tools/org/org-membership-list/) to review who has access and spot gaps before tasks are assigned.

### 4. Review open support conversations

Use [`conversation/list`](/reference/tools/conversation/conversation-list/) to surface ongoing issues tied to projects in your weekly report.

### 5. Create missing support tickets

Use [`conversation/create`](/reference/tools/conversation/conversation-create/) to open new tickets for incidents identified in step 4.

### 6. Update existing tickets

Use [`conversation/reply`](/reference/tools/conversation/conversation-reply/) to add clarifying details or status updates without leaving your workflow.

### 7. Generate the weekly status summary

Combine the project list, access audit, and support status into a single weekly summary for your team.

## What You'll Achieve

- Faster weekly reporting with consistent coverage
- Fewer access mistakes when reassigning work
- Full visibility into project health and support load

## Tools Reference

| Tool | Purpose |
| --- | --- |
| [`org/get`](/reference/tools/org/org-get/) | Confirm org details and scope |
| [`project/list`](/reference/tools/project/project-list/) | Pull active project inventory |
| [`org/membership/list`](/reference/tools/org/org-membership-list/) | Audit team access |
| [`conversation/list`](/reference/tools/conversation/conversation-list/) | Review open support work |
| [`conversation/create`](/reference/tools/conversation/conversation-create/) | Open new support tickets |
| [`conversation/reply`](/reference/tools/conversation/conversation-reply/) | Update existing tickets |

## Related Tutorials

- [Developer Onboarding](/case-studies/developer-onboarding/)
