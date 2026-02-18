---
title: Download Backup
description: Download a backup
sidebar:
  label: Download Backup
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Download Backup
  - tag: meta
    attrs:
      name: og:description
      content: Download a backup
lastUpdated: 2026-01-23
---
## Overview

Download a backup

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupId` | `string` | Yes | ID or short ID of a backup |
| `format` | `tar \| zip` | No | Archive format (tar, zip) |
| `output` | `string` | No | Output file path |
| `password` | `string` | No | Password for encrypted archive |
| `generatePassword` | `boolean` | No | Generate a random password for encryption |
| `promptPassword` | `boolean` | No | Prompt for password |
| `resume` | `boolean` | No | Resume a previously interrupted download |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |

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

