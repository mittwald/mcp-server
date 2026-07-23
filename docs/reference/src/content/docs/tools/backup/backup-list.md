---
title: "List Backups"
description: "List backups"
sidebar:
  label: "List Backups"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "List Backups"
  - tag: meta
    attrs:
      name: og:description
      content: "List backups"
lastUpdated: 2026-07-23
---
## Overview

List backups

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project |

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

