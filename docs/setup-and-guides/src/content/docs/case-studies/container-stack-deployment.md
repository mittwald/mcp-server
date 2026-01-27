---
title: Container Stack Deployment
description: Deploy Docker Compose stacks with registry, volumes, and health checks via Mittwald MCP
---

# Container Stack Deployment

In this tutorial, you will deploy a modern container stack (Next.js, Strapi, PostgreSQL) using Mittwald MCP, with repeatable deployments and fast health verification.

## Who Is This For?

- **Segment**: Modern Stack Developer
- **Role**: Full-stack developer building containerized SaaS
- **Context**: Deploying a Next.js + Strapi + PostgreSQL stack for a client

## What You'll Solve

- Cut initial container deployment time from hours to minutes
- Replace manual Docker commands with a repeatable MCP workflow
- Validate health, volumes, and registry usage in one pass

## Prerequisites

- Mittwald MCP server connected to your MCP client
- Active project with container hosting enabled
- Project ID (for example, `p-saasapp`)
- Docker Compose file ready (`docker-compose.yml`)
- Container images built and ready to push

## Step-by-Step Guide

### Step 1: Check existing container infrastructure

Confirm whether a container registry already exists for the project.

- Tool: [`registry/list`](/reference/tools/registry/registry-list/)
- Outcome: Registry inventory for the project

### Step 2: Create a container registry

Create a registry to store your stack images.

- Tool: [`registry/create`](/reference/tools/registry/registry-create/)
- Outcome: Registry URL and credentials for image pushes

### Step 3: Deploy the Docker Compose stack

Deploy the Next.js, Strapi, and PostgreSQL services from your compose file.

- Tool: [`stack/deploy`](/reference/tools/stack/stack-deploy/)
- Outcome: Stack deployment starts with services provisioning

### Step 4: List deployed stacks

Verify the stack exists and is running.

- Tool: [`stack/list`](/reference/tools/stack/stack-list/)
- Outcome: Stack inventory with status and service counts

### Step 5: Check container status

Inspect each service for health checks and runtime status.

- Tool: [`stack/ps`](/reference/tools/stack/stack-ps/)
- Outcome: Container status, health, and ports

### Step 6: Verify persistent volumes

Confirm database and upload volumes are mounted correctly.

- Tool: [`volume/list`](/reference/tools/volume/volume-list/)
- Outcome: Volume inventory with mount points and usage

### Step 7: List all running containers

Ensure no orphaned containers are consuming resources.

- Tool: [`container/list`](/reference/tools/container/container-list/)
- Outcome: Full container inventory across the project

### Step 8: Generate a deployment summary

Summarize stack health, volumes, and registry usage to close the rollout.

- Tools: [`stack/ps`](/reference/tools/stack/stack-ps/), [`volume/list`](/reference/tools/volume/volume-list/), [`registry/list`](/reference/tools/registry/registry-list/)
- Outcome: Deployment summary with readiness confirmation

## Tools Reference

| Tool | Purpose |
| --- | --- |
| [`registry/list`](/reference/tools/registry/registry-list/) | Check existing container registries |
| [`registry/create`](/reference/tools/registry/registry-create/) | Create a registry for stack images |
| [`stack/deploy`](/reference/tools/stack/stack-deploy/) | Deploy a Docker Compose stack |
| [`stack/list`](/reference/tools/stack/stack-list/) | List deployed stacks and status |
| [`stack/ps`](/reference/tools/stack/stack-ps/) | Inspect container status and health |
| [`volume/list`](/reference/tools/volume/volume-list/) | Verify persistent volume mounts |
| [`container/list`](/reference/tools/container/container-list/) | Review all running containers |

## Related Tutorials

- [CI/CD Pipeline Integration](/case-studies/cicd-pipeline-integration/)
