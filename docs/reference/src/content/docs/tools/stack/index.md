---
title: Stack Tools
description: Complete reference for stack management tools
sidebar:
  label: Stack
  order: 0
lastUpdated: 2026-07-23
---

## Stack Tools

Reference documentation for all stack management tools.

### Available Tools

| Tool | Description |
|------|-------------|
| [`mittwald_stack_delete`](./delete) | Delete a stack. |
| [`mittwald_stack_deploy`](./deploy) | Deploy a docker-compose YAML configuration to a Mittwald stack. Accepts docker-compose format and converts it to Mittwald's native format. IMPORTANT: This is a declarative API - the provided configuration REPLACES the entire stack. Any services or volumes not included will be DELETED. You MUST first read the existing stack configuration (using mittwald_stack_get) before updating, then merge your changes with the existing services/volumes to avoid data loss. |
| [`mittwald_stack_list`](./list) | List stacks for a given project. |
| [`mittwald_stack_ps`](./ps) | List all services within a given stack. |

