---
title: Uninstall Extension
description: Remove an extension from an organization.
sidebar:
  label: Uninstall Extension
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Uninstall Extension
  - tag: meta
    attrs:
      name: og:description
      content: Remove an extension from an organization.
lastUpdated: 2026-01-23
---
## Overview

Remove an extension from an organization.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `extensionInstanceId` | `string` | Yes | ID of the extension instance to uninstall |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |

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

