---
title: CI/CD Pipeline Integration
description: Automate deployments with cronjobs, context management, and automated workflows
---

# CI/CD Pipeline Integration

In this tutorial, you will connect CI/CD automation to Mittwald MCP so deployments, scheduled tasks, and environment context stay in sync.

## Who Is This For?

- **Segment**: Modern Stack Developer
- **Role**: DevOps engineer at a SaaS team
- **Context**: Managing staging and production deployments with automation and audits

## What You'll Solve

- Reduce context switching across CI/CD, cron, and deployments
- Gain visibility into scheduled tasks and automation health
- Standardize production automation with repeatable checks

## Prerequisites

- Mittwald MCP server connected to your MCP client
- Active project with container hosting enabled
- Docker stack deployed (for example, from the Container Stack Deployment tutorial)
- Project IDs for staging and production environments

## Step-by-Step Guide

### Step 1: Check the current session context

Confirm which environment you are targeting before making changes.

- Tool: [`context/get/session`](/reference/tools/context/context-get-session/)
- Outcome: Current project, organization, and user context

### Step 2: Switch to the production context

Set your session to the production project before configuring automation.

- Tool: [`context/set/session`](/reference/tools/context/context-set-session/)
- Outcome: Session context updated to production

### Step 3: List existing cron jobs

Audit scheduled tasks that already run in production.

- Tool: [`cronjob/list`](/reference/tools/cronjob/cronjob-list/)
- Outcome: Cron job inventory with schedules and status

### Step 4: Create a deployment monitoring cron job

Add a health-check job to confirm the stack stays healthy.

- Tool: [`cronjob/create`](/reference/tools/cronjob/cronjob-create/)
- Outcome: New cron job active with a defined schedule

### Step 5: Review cron execution history

Investigate failing jobs before you add new automation.

- Tool: [`cronjob/execution/list`](/reference/tools/cronjob/cronjob-execution-list/)
- Outcome: Execution history with status and exit codes

### Step 6: Manually execute the new cron job

Validate your automation before waiting for the next schedule.

- Tool: [`cronjob/execute`](/reference/tools/cronjob/cronjob-execute/)
- Outcome: Manual run results with status and runtime

### Step 7: Deploy the latest container stack

Roll out an updated release using your production configuration.

- Tool: [`stack/deploy`](/reference/tools/stack/stack-deploy/)
- Outcome: Deployment status with services updated

### Step 8: Manage pipeline secrets

Store tokens and credentials in your CI/CD system or secret manager, not in MCP prompts or logs. Document the secret names used by your deployment workflow so audits can trace access without exposing values.

### Step 9: Generate an automation overview

Capture a compliance-friendly summary of automation and context.

- Tools: [`cronjob/list`](/reference/tools/cronjob/cronjob-list/), [`context/get/session`](/reference/tools/context/context-get-session/), [`cronjob/execution/list`](/reference/tools/cronjob/cronjob-execution-list/)
- Outcome: Consolidated overview of jobs, context, and recent activity

## Tools Reference

| Tool | Purpose |
| --- | --- |
| [`context/get/session`](/reference/tools/context/context-get-session/) | Confirm active project context |
| [`context/set/session`](/reference/tools/context/context-set-session/) | Switch environment contexts |
| [`cronjob/list`](/reference/tools/cronjob/cronjob-list/) | List scheduled tasks |
| [`cronjob/create`](/reference/tools/cronjob/cronjob-create/) | Create monitoring or deployment jobs |
| [`cronjob/execution/list`](/reference/tools/cronjob/cronjob-execution-list/) | Review cron execution history |
| [`cronjob/execute`](/reference/tools/cronjob/cronjob-execute/) | Trigger a cron job manually |
| [`stack/deploy`](/reference/tools/stack/stack-deploy/) | Deploy updated container stacks |

## Related Tutorials

- [Container Stack Deployment](/case-studies/container-stack-deployment/)
