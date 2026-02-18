---
title: Create SSH Key
description: Create and import a new SSH key.. Generates a new SSH key pair and imports the public key.
sidebar:
  label: Create SSH Key
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Create SSH Key
  - tag: meta
    attrs:
      name: og:description
      content: Create and import a new SSH key.. Generates a new SSH key pair and imports the public key.
lastUpdated: 2026-01-23
---
## Overview

Create and import a new SSH key.. Generates a new SSH key pair and imports the public key.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `expires` | `string` | No | An interval after which the SSH key expires (examples: 30m, 30d, 1y) |
| `output` | `string` | No | A filename in your ~/.ssh directory to write the SSH key to (default: mstudio-cli) |
| `noPassphrase` | `boolean` | No | Use this flag to not set a passphrase for the SSH key |
| `comment` | `string` | No | A comment for the SSH key |

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

