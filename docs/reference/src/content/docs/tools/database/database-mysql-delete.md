---
title: Delete MySQL Database
description: Delete a MySQL database.
sidebar:
  label: Delete MySQL Database
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Delete MySQL Database
  - tag: meta
    attrs:
      name: og:description
      content: Delete a MySQL database.
lastUpdated: 2026-01-23
---
## Overview

Delete a MySQL database.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `databaseId` | `string` | Yes | The ID or name of the database |
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

