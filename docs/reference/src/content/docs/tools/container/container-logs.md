---
title: View Container Logs
description: Display logs of a specific container.
sidebar:
  label: View Container Logs
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: View Container Logs
  - tag: meta
    attrs:
      name: og:description
      content: Display logs of a specific container.
lastUpdated: 2026-01-23
---
## Overview

Display logs of a specific container.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `containerId` | `string` | Yes | ID of the container for which to get logs |
| `projectId` | `string` | Yes | ID or short ID of a project (optional if default project is set in context) |
| `output` | `txt \| json \| yaml` | No | Output format (default: txt) |
| `noPager` | `boolean` | No | Disable pager for output (always true in CLI context) |

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

