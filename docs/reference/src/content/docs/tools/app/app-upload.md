---
title: Upload App Files
description: Upload the filesystem of an app to a project.
sidebar:
  label: Upload App Files
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Upload App Files
  - tag: meta
    attrs:
      name: og:description
      content: Upload the filesystem of an app to a project.
lastUpdated: 2026-01-23
---
## Overview

Upload the filesystem of an app to a project.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `installationId` | `string` | Yes | ID or short ID of an app installation; this argument is optional if a default app installation is set in the context |
| `source` | `string` | Yes | Source directory from which to upload the app installation |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `sshUser` | `string` | No | Override the SSH user to connect with; if omitted, your own user will be used |
| `sshIdentityFile` | `string` | No | The SSH identity file (private key) to use for public key authentication |
| `exclude` | `array` | No | Exclude files matching the given patterns |
| `dryRun` | `boolean` | No | Do not actually upload the app installation |
| `delete` | `boolean` | No | Delete remote files that are not present locally |
| `remoteSubDirectory` | `string` | No | Specify a sub-directory within the app installation to upload |

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

