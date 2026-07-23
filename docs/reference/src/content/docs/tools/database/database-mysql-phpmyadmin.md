---
title: "Get phpMyAdmin URL"
description: "Get the phpMyAdmin URL for a MySQL database's main user. This tool does not open a browser - open the returned URL yourself."
sidebar:
  label: "Get phpMyAdmin URL"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "Get phpMyAdmin URL"
  - tag: meta
    attrs:
      name: og:description
      content: "Get the phpMyAdmin URL for a MySQL database's main user. This tool does not open a browser - open the returned URL yourself."
lastUpdated: 2026-07-23
---
## Overview

Get the phpMyAdmin URL for a MySQL database's main user. This tool does not open a browser - open the returned URL yourself.

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

