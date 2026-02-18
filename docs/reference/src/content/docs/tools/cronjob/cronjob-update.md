---
title: Update Cron Job
description: Update a cronjob.
sidebar:
  label: Update Cron Job
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Update Cron Job
  - tag: meta
    attrs:
      name: og:description
      content: Update a cronjob.
lastUpdated: 2026-01-23
---
## Overview

Update a cronjob.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cronjobId` | `string` | Yes | ID or short ID of a cronjob |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `description` | `string` | No | Description for the cronjob |
| `interval` | `string` | No | Cron expression for the interval |
| `email` | `string` | No | Email address to send cronjob output to |
| `url` | `string` | No | URL to call for the cronjob |
| `command` | `string` | No | Command to execute for the cronjob |
| `interpreter` | `bash \| php` | No | Interpreter to use for the command |
| `enable` | `boolean` | No | Enable the cronjob |
| `disable` | `boolean` | No | Disable the cronjob |
| `timeout` | `string` | No | Timeout for the cronjob execution |

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

