---
title: Stop Container
description: Stop a running container.
sidebar:
  label: Stop Container
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Stop Container
  - tag: meta
    attrs:
      name: og:description
      content: Stop a running container.
lastUpdated: 2026-01-23
---
## Overview

Stop a running container.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `containerId` | `string` | Yes | ID or short ID of the container to stop |
| `projectId` | `string` | Yes | ID or short ID of a project (optional if default project is set in context) |
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

