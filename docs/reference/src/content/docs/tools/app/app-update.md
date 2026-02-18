---
title: Update App Properties
description: Update properties of an app installation. (use upgrade to update the app version)
sidebar:
  label: Update App Properties
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Update App Properties
  - tag: meta
    attrs:
      name: og:description
      content: Update properties of an app installation. (use upgrade to update the app version)
lastUpdated: 2026-01-23
---
## Overview

Update properties of an app installation. (use upgrade to update the app version)

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `installationId` | `string` | Yes | ID or short ID of an app installation; this argument is optional if a default app installation is set in the context |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `description` | `string` | No | Update the description of the app installation |
| `entrypoint` | `string` | No | Update the entrypoint of the app installation (Python and Node.js only) |
| `documentRoot` | `string` | No | Update the document root of the app installation |

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

