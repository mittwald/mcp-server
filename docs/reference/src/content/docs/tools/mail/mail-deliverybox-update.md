---
title: Update Delivery Box
description: Update a delivery box.
sidebar:
  label: Update Delivery Box
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Update Delivery Box
  - tag: meta
    attrs:
      name: og:description
      content: Update a delivery box.
lastUpdated: 2026-01-23
---
## Overview

Update a delivery box.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | ID of the delivery box to update |
| `description` | `string` | No | New description for the delivery box |
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

