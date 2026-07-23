---
title: "Deploy Stack"
description: "Deploy a docker-compose YAML configuration to a Mittwald stack. Accepts docker-compose format and converts it to Mittwald's native format. IMPORTANT: This is a declarative API - the provided configuration REPLACES the entire stack. Any services or volumes not included will be DELETED. You MUST first read the existing stack configuration (using mittwald_stack_get) before updating, then merge your changes with the existing services/volumes to avoid data loss."
sidebar:
  label: "Deploy Stack"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "Deploy Stack"
  - tag: meta
    attrs:
      name: og:description
      content: "Deploy a docker-compose YAML configuration to a Mittwald stack. Accepts docker-compose format and converts it to Mittwald's native format. IMPORTANT: This is a declarative API - the provided configuration REPLACES the entire stack. Any services or volumes not included will be DELETED. You MUST first read the existing stack configuration (using mittwald_stack_get) before updating, then merge your changes with the existing services/volumes to avoid data loss."
lastUpdated: 2026-07-23
---
## Overview

Deploy a docker-compose YAML configuration to a Mittwald stack. Accepts docker-compose format and converts it to Mittwald's native format. IMPORTANT: This is a declarative API - the provided configuration REPLACES the entire stack. Any services or volumes not included will be DELETED. You MUST first read the existing stack configuration (using mittwald_stack_get) before updating, then merge your changes with the existing services/volumes to avoid data loss.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `stackId` | `string` | Yes | ID of the stack to deploy to |
| `composeYaml` | `string` | Yes | Docker-compose YAML content as a string. Supports services with image, ports, environment, volumes, command, and entrypoint. Example: "version: '3'\nservices:\n  web:\n    image: nginx:alpine\n    ports:\n      - '80:80'" |
| `envOverrides` | `object` | No | Optional environment variable overrides to apply to all services (key-value pairs) |

## Return Type

**Type**: `object`

**Description**: Tool execution result with status, message, and data

**Example Response**:

```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": null,
  "metadata": {
    "durationMs": 0
  }
}
```

