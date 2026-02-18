---
title: Open phpMyAdmin
description: Open phpMyAdmin for a MySQL database (provides command for browser execution)
sidebar:
  label: Open phpMyAdmin
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Open phpMyAdmin
  - tag: meta
    attrs:
      name: og:description
      content: Open phpMyAdmin for a MySQL database (provides command for browser execution)
lastUpdated: 2026-01-23
---
## Overview

Open phpMyAdmin for a MySQL database (provides command for browser execution)

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `databaseId` | `string` | Yes | The ID or name of the database |

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

