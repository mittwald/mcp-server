---
title: Delete SSH Key
description: Delete an SSH key.. Permanently removes the specified SSH key.
sidebar:
  label: Delete SSH Key
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Delete SSH Key
  - tag: meta
    attrs:
      name: og:description
      content: Delete an SSH key.. Permanently removes the specified SSH key.
lastUpdated: 2026-01-23
---
## Overview

Delete an SSH key.. Permanently removes the specified SSH key.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keyId` | `string` | Yes | ID of the SSH key to be deleted |
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

