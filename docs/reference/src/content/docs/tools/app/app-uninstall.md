---
title: Uninstall App
description: Uninstall an app.
sidebar:
  label: Uninstall App
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Uninstall App
  - tag: meta
    attrs:
      name: og:description
      content: Uninstall an app.
lastUpdated: 2026-01-23
---
## Overview

Uninstall an app.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `installationId` | `string` | Yes | ID or short ID of an app installation; this argument is optional if a default app installation is set in the context |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `force` | `boolean` | No | Do not ask for confirmation |

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

