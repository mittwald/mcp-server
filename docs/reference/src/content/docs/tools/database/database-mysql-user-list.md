---
title: "List MySQL Users"
description: "List MySQL users for a database."
sidebar:
  label: "List MySQL Users"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "List MySQL Users"
  - tag: meta
    attrs:
      name: og:description
      content: "List MySQL users for a database."
lastUpdated: 2026-07-23
---
## Overview

List MySQL users for a database.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `databaseId` | `string` | Yes | ID of the MySQL database to list users for |

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

