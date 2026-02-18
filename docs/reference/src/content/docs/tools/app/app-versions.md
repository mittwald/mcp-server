---
title: List App Versions
description: List supported Apps and Versions.
sidebar:
  label: List App Versions
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: List App Versions
  - tag: meta
    attrs:
      name: og:description
      content: List supported Apps and Versions.
lastUpdated: 2026-01-23
---
## Overview

List supported Apps and Versions.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `app` | `string` | No | Name of specific app to get versions for |

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

