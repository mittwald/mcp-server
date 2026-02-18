---
title: Delete Delivery Box
description: Delete a delivery box.
sidebar:
  label: Delete Delivery Box
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Delete Delivery Box
  - tag: meta
    attrs:
      name: og:description
      content: Delete a delivery box.
lastUpdated: 2026-01-23
---
## Overview

Delete a delivery box.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | ID of the delivery box to delete |
| `confirm` | `boolean` | Yes | Must be set to true to confirm deletion (DESTRUCTIVE OPERATION - cannot be undone). |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `force` | `boolean` | No | Do not ask for confirmation |

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

