---
title: "List Apps"
description: "List installed apps in a project."
sidebar:
  label: "List Apps"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "List Apps"
  - tag: meta
    attrs:
      name: og:description
      content: "List installed apps in a project."
lastUpdated: 2026-07-23
---
## Overview

List installed apps in a project.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | `string` | Yes | ID or short ID of a project; this flag is optional if a default project is set in the context |

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

