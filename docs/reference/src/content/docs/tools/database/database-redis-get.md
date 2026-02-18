---
title: Get Redis Database
description: Retrieve details for a Redis database.
sidebar:
  label: Get Redis Database
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Get Redis Database
  - tag: meta
    attrs:
      name: og:description
      content: Retrieve details for a Redis database.
lastUpdated: 2026-01-23
---
## Overview

Retrieve details for a Redis database.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `redisId` | `string` | Yes | ID or short ID of the Redis database to retrieve. |
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

