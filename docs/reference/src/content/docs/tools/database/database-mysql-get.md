---
title: Get MySQL Database Details
description: Get a MySQL database.
sidebar:
  label: Get MySQL Database Details
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Get MySQL Database Details
  - tag: meta
    attrs:
      name: og:description
      content: Get a MySQL database.
lastUpdated: 2026-01-23
---
## Overview

Get a MySQL database.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `databaseId` | `string` | Yes | The ID or name of the database |
| `output` | `txt \| json \| yaml` | No | Output format (default: json for structured data) |

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

