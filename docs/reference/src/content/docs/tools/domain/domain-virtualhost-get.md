---
title: Get Virtual Host Details
description: Get details of a domain virtualhost.
sidebar:
  label: Get Virtual Host Details
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Get Virtual Host Details
  - tag: meta
    attrs:
      name: og:description
      content: Get details of a domain virtualhost.
lastUpdated: 2026-01-23
---
## Overview

Get details of a domain virtualhost.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `virtualhostId` | `string` | Yes | ID of the virtualhost to get details for |
| `output` | `txt \| json \| yaml` | No | Output format (txt, json, yaml) |

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

