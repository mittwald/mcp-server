---
title: Recreate Container
description: Recreate a container.
sidebar:
  label: Recreate Container
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Recreate Container
  - tag: meta
    attrs:
      name: og:description
      content: Recreate a container.
lastUpdated: 2026-01-23
---
## Overview

Recreate a container.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `containerId` | `string` | Yes | ID or short ID of the container to recreate |
| `projectId` | `string` | Yes | ID or short ID of a project (optional if default project is set in context) |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `pull` | `boolean` | No | Pull the container image before recreating the container |
| `force` | `boolean` | No | Also recreate the container when it is already up to date |

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

