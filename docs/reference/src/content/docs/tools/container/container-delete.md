---
title: Delete Container
description: Delete a container.
sidebar:
  label: Delete Container
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Delete Container
  - tag: meta
    attrs:
      name: og:description
      content: Delete a container.
lastUpdated: 2026-01-23
---
## Overview

Delete a container.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `containerId` | `string` | Yes | ID or short ID of the container to delete |
| `projectId` | `string` | Yes | ID or short ID of a project (optional if default project is set in context) |
| `confirm` | `boolean` | Yes | Must be set to true to confirm deletion (DESTRUCTIVE OPERATION - cannot be undone). |
| `force` | `boolean` | No | Do not ask for confirmation |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |

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

