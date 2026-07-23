---
title: "List Registries"
description: "List registries available in Mittwald."
sidebar:
  label: "List Registries"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "List Registries"
  - tag: meta
    attrs:
      name: og:description
      content: "List registries available in Mittwald."
lastUpdated: 2026-07-23
---
## Overview

List registries available in Mittwald.

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

