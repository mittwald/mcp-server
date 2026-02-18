---
title: Update DNS Zone Records
description: Update DNS zone records..
sidebar:
  label: Update DNS Zone Records
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Update DNS Zone Records
  - tag: meta
    attrs:
      name: og:description
      content: Update DNS zone records..
lastUpdated: 2026-01-23
---
## Overview

Update DNS zone records..

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dnszoneId` | `string` | Yes | The DNS zone ID |
| `recordSet` | `a \| mx \| txt \| srv \| cname` | Yes | The record set type to update |
| `projectId` | `string` | Yes | ID or short ID of a project |
| `set` | `array` | No | Set record values |
| `recordId` | `string` | No | Specific record ID to update |
| `unset` | `array` | No | Unset record values |
| `quiet` | `boolean` | No | Suppress output except for errors |
| `managed` | `boolean` | No | Update managed records |
| `record` | `array` | No | Record values to set |
| `ttl` | `number` | No | Time to live for the record |

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

