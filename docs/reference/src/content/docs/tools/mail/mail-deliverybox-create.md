---
title: Create Delivery Box
description: Create a new delivery box.
sidebar:
  label: Create Delivery Box
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Create Delivery Box
  - tag: meta
    attrs:
      name: og:description
      content: Create a new delivery box.
lastUpdated: 2026-01-23
---
## Overview

Create a new delivery box.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | `string` | Yes | Description for the delivery box |
| `projectId` | `string` | Yes | ID or short ID of a project; this flag is optional if a default project is set in the context |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `password` | `string` | No | Delivery box password (CAUTION: providing this flag may log your password in shell history) |
| `randomPassword` | `boolean` | No | Generate a random password |

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

