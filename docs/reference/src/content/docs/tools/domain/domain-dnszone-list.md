---
title: "List DNS Zones"
description: "List DNS zones for a project.."
sidebar:
  label: "List DNS Zones"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "List DNS Zones"
  - tag: meta
    attrs:
      name: og:description
      content: "List DNS zones for a project.."
lastUpdated: 2026-07-23
---
## Overview

List DNS zones for a project..

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

