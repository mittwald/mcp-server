---
title: "List MySQL Databases"
description: "List MySQL databases."
sidebar:
  label: "List MySQL Databases"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "List MySQL Databases"
  - tag: meta
    attrs:
      name: og:description
      content: "List MySQL databases."
lastUpdated: 2026-07-23
---
## Overview

List MySQL databases.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | Project ID to list databases for |

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

