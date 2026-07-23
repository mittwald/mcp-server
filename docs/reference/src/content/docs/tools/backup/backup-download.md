---
title: "Get Backup Download URL"
description: "Get the download URL for a backup, requesting an export first if none exists yet. This tool does not download anything itself - fetch the returned URL locally. Exports are prepared asynchronously; if no URL is returned yet, call this tool again in a few seconds."
sidebar:
  label: "Get Backup Download URL"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "Get Backup Download URL"
  - tag: meta
    attrs:
      name: og:description
      content: "Get the download URL for a backup, requesting an export first if none exists yet. This tool does not download anything itself - fetch the returned URL locally. Exports are prepared asynchronously; if no URL is returned yet, call this tool again in a few seconds."
lastUpdated: 2026-07-23
---
## Overview

Get the download URL for a backup, requesting an export first if none exists yet. This tool does not download anything itself - fetch the returned URL locally. Exports are prepared asynchronously; if no URL is returned yet, call this tool again in a few seconds.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupId` | `string` | Yes | ID or short ID of a backup |
| `format` | `tar \| zip` | No | Archive format to export the backup in (default: tar) |
| `password` | `string` | No | Password to protect the archive with (only applied when a new export is created) |
| `recreate` | `boolean` | No | Request a fresh export even if a usable one already exists |

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

