---
title: Get Backup Details
description: Get details of a backup
sidebar:
  label: Get Backup Details
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Get Backup Details
  - tag: meta
    attrs:
      name: og:description
      content: Get details of a backup
lastUpdated: 2026-01-23
---
## Overview

Get details of a backup

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupId` | `string` | Yes | ID or short ID of a backup |
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

