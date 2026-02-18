---
title: Create Virtual Host
description: Create a domain virtualhost.
sidebar:
  label: Create Virtual Host
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Create Virtual Host
  - tag: meta
    attrs:
      name: og:description
      content: Create a domain virtualhost.
lastUpdated: 2026-01-23
---
## Overview

Create a domain virtualhost.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `hostname` | `string` | Yes | Hostname for the virtualhost |
| `projectId` | `string` | Yes | ID or short ID of a project; this argument is optional if a default project is set in the context |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `pathToApp` | `array` | No | Path mappings to apps |
| `pathToUrl` | `array` | No | Path mappings to URLs |
| `pathToContainer` | `array` | No | Path mappings to containers |

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

