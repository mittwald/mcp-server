---
title: Create Project
description: Create a new project.
sidebar:
  label: Create Project
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Create Project
  - tag: meta
    attrs:
      name: og:description
      content: Create a new project.
lastUpdated: 2026-01-23
---
## Overview

Create a new project.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | `string` | Yes | A description for the project |
| `serverId` | `string` | Yes | ID or short ID of a server; this flag is optional if a default server is set in the context |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `wait` | `boolean` | No | Wait for the resource to be ready |
| `waitTimeout` | `string` | No | The duration to wait for the resource to be ready (common units like 'ms', 's', 'm' are accepted) |
| `updateContext` | `boolean` | No | Update the CLI context to use the newly created project |

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

