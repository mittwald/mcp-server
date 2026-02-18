---
title: Create Static App
description: Create a static app.
sidebar:
  label: Create Static App
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Create Static App
  - tag: meta
    attrs:
      name: og:description
      content: Create a static app.
lastUpdated: 2026-01-23
---
## Overview

Create a static app.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project; this argument is optional if a default project is set in the context |
| `siteTitle` | `string` | No | Title for the new app |
| `documentRoot` | `string` | Yes | Document root directory for the static application |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `wait` | `boolean` | No | Wait for the app to be ready |
| `waitTimeout` | `number` | No | Timeout for the wait operation in seconds |

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

