---
title: "List Redis Databases"
description: "List Redis databases for a project."
sidebar:
  label: "List Redis Databases"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "List Redis Databases"
  - tag: meta
    attrs:
      name: og:description
      content: "List Redis databases for a project."
lastUpdated: 2026-07-23
---
## Overview

List Redis databases for a project.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | Project ID to list Redis databases for |

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

