---
title: Copy App
description: Copy an app within a project.
sidebar:
  label: Copy App
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Copy App
  - tag: meta
    attrs:
      name: og:description
      content: Copy an app within a project.
lastUpdated: 2026-01-23
---
## Overview

Copy an app within a project.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `installationId` | `string` | Yes | ID or short ID of an app installation; this argument is optional if a default app installation is set in the context |
| `description` | `string` | Yes | Set a description for the new app installation |
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

