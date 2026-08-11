---
title: "List Stack Services"
description: "List all services within a given stack."
sidebar:
  label: "List Stack Services"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "List Stack Services"
  - tag: meta
    attrs:
      name: og:description
      content: "List all services within a given stack."
lastUpdated: 2026-08-11
---
## Overview

List all services within a given stack.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `stackId` | `string` | Yes | ID of a stack |
| `projectId` | `string` | Yes | ID of the project containing the stack |

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

