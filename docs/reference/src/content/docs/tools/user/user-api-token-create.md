---
title: Create API Token
description: Create a new API token.. API tokens can be used to authenticate API requests.
sidebar:
  label: Create API Token
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Create API Token
  - tag: meta
    attrs:
      name: og:description
      content: Create a new API token.. API tokens can be used to authenticate API requests.
lastUpdated: 2026-01-23
---
## Overview

Create a new API token.. API tokens can be used to authenticate API requests.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | `string` | Yes | Description of the API token |
| `roles` | `array` | Yes | Roles of the API token. Valid values: api_read, api_write. At least one required. |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `expires` | `string` | No | An interval after which the API token expires (examples: 30m, 30d, 1y) |

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

