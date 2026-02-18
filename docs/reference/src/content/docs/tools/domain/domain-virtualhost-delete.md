---
title: Delete Virtual Host
description: Delete a domain virtualhost.
sidebar:
  label: Delete Virtual Host
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Delete Virtual Host
  - tag: meta
    attrs:
      name: og:description
      content: Delete a domain virtualhost.
lastUpdated: 2026-01-23
---
## Overview

Delete a domain virtualhost.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `virtualhostId` | `string` | Yes | ID of the virtualhost to delete |
| `confirm` | `boolean` | Yes | Must be set to true to confirm deletion (DESTRUCTIVE OPERATION - cannot be undone). |
| `force` | `boolean` | No | Skip confirmation prompt |

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

