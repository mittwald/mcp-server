---
title: "List Redis Versions"
description: "List available Redis versions."
sidebar:
  label: "List Redis Versions"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "List Redis Versions"
  - tag: meta
    attrs:
      name: og:description
      content: "List available Redis versions."
lastUpdated: 2026-07-23
---
## Overview

List available Redis versions.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | No | Project ID to filter available versions (different projects may have different versions available) |

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

