---
title: Delete Organization
description: Delete an organization. This is a destructive operation and cannot be undone.
sidebar:
  label: Delete Organization
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Delete Organization
  - tag: meta
    attrs:
      name: og:description
      content: Delete an organization. This is a destructive operation and cannot be undone.
lastUpdated: 2026-01-23
---
## Overview

Delete an organization. This is a destructive operation and cannot be undone.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organizationId` | `string` | Yes | Organization ID to delete (format: o-XXXXX) |
| `confirm` | `boolean` | Yes | Must be set to true to confirm deletion (DESTRUCTIVE OPERATION) |

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

