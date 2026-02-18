---
title: Create Cron Job
description: Create a cronjob.
sidebar:
  label: Create Cron Job
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Create Cron Job
  - tag: meta
    attrs:
      name: og:description
      content: Create a cronjob.
lastUpdated: 2026-01-23
---
## Overview

Create a cronjob.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | `string` | Yes | Description for the cronjob |
| `interval` | `string` | Yes | Cron expression for the interval |
| `installationId` | `string` | Yes | ID or short ID of an app installation; this argument is optional if a default app installation is set in the context |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `email` | `string` | No | Email address to send cronjob output to |
| `url` | `string` | No | URL to call for the cronjob |
| `command` | `string` | No | Command to execute for the cronjob |
| `interpreter` | `bash \| php` | No | Interpreter to use for the command |
| `disable` | `boolean` | No | Create the cronjob in disabled state |
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

