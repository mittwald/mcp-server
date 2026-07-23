---
title: "List Containers"
description: "List containers belonging to a project."
sidebar:
  label: "List Containers"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "List Containers"
  - tag: meta
    attrs:
      name: og:description
      content: "List containers belonging to a project."
lastUpdated: 2026-07-23
---
## Overview

List containers belonging to a project.

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

