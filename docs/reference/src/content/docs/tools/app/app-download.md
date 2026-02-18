---
title: Download App Files
description: Download the filesystem of an app within a project to your local machine.
sidebar:
  label: Download App Files
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Download App Files
  - tag: meta
    attrs:
      name: og:description
      content: Download the filesystem of an app within a project to your local machine.
lastUpdated: 2026-01-23
---
## Overview

Download the filesystem of an app within a project to your local machine.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `installationId` | `string` | Yes | ID or short ID of an app installation; this argument is optional if a default app installation is set in the context |
| `target` | `string` | Yes | Target directory to download the app installation to |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `sshUser` | `string` | No | Override the SSH user to connect with; if omitted, your own user will be used |
| `sshIdentityFile` | `string` | No | The SSH identity file (private key) to use for public key authentication |
| `exclude` | `array` | No | Exclude files matching the given patterns |
| `dryRun` | `boolean` | No | Do not actually download the app installation |
| `delete` | `boolean` | No | Delete local files that are not present on the server |
| `remoteSubDirectory` | `string` | No | Specify a sub-directory within the app installation to download |

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

