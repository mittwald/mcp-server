---
title: Get MySQL User
description: Retrieve details for a specific MySQL user.
sidebar:
  label: Get MySQL User
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Get MySQL User
  - tag: meta
    attrs:
      name: og:description
      content: Retrieve details for a specific MySQL user.
lastUpdated: 2026-01-23
---
## Overview

Retrieve details for a specific MySQL user.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | `string` | Yes | ID or short ID of the MySQL user to retrieve. |
| `outputFormat` | `json \| yaml \| txt` | No | Preferred CLI output format. JSON enables structured responses. |

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

