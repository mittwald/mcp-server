---
title: Get Cron Job Details
description: Get details of a cronjob.
sidebar:
  label: Get Cron Job Details
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Get Cron Job Details
  - tag: meta
    attrs:
      name: og:description
      content: Get details of a cronjob.
lastUpdated: 2026-01-23
---
## Overview

Get details of a cronjob.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cronjobId` | `string` | Yes | ID or short ID of a cronjob |
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

