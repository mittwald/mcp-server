---
title: Create Backup
description: Create a new backup
sidebar:
  label: Create Backup
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Create Backup
  - tag: meta
    attrs:
      name: og:description
      content: Create a new backup
lastUpdated: 2026-01-23
---
## Overview

Create a new backup

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project; this argument is optional if a default project is set in the context |
| `expires` | `string` | Yes | Set an expiration date for the backup (format: 30d, 1y, 30m etc.) |
| `description` | `string` | No | Set a description for the backup |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `wait` | `boolean` | No | Wait for the backup to be completed |
| `waitTimeout` | `string` | No | Timeout for the wait operation (default: 15m) |

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

