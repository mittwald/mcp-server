---
title: Delete MySQL User
description: Delete an existing MySQL user.
sidebar:
  label: Delete MySQL User
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Delete MySQL User
  - tag: meta
    attrs:
      name: og:description
      content: Delete an existing MySQL user.
lastUpdated: 2026-01-23
---
## Overview

Delete an existing MySQL user.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | `string` | Yes | ID or short ID of the MySQL user to delete (format: mysql-user-XXXXX). |
| `confirm` | `boolean` | Yes | Must be set to true to confirm deletion (DESTRUCTIVE OPERATION - cannot be undone). |
| `force` | `boolean` | No | Skip confirmation prompts when deleting the user. |
| `quiet` | `boolean` | No | Suppress CLI output for machine-friendly responses. |

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

