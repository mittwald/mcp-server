---
title: "Get App SSH Connection Data"
description: "Get the SSH connection data (host, user, document root) for an app installation, plus a ready-to-run ssh command. This tool does not open a session itself - run the returned command locally to connect."
sidebar:
  label: "Get App SSH Connection Data"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "Get App SSH Connection Data"
  - tag: meta
    attrs:
      name: og:description
      content: "Get the SSH connection data (host, user, document root) for an app installation, plus a ready-to-run ssh command. This tool does not open a session itself - run the returned command locally to connect."
lastUpdated: 2026-07-23
---
## Overview

Get the SSH connection data (host, user, document root) for an app installation, plus a ready-to-run ssh command. This tool does not open a session itself - run the returned command locally to connect.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `installationId` | `string` | Yes | ID or short ID of an app installation |
| `sshUser` | `string` | No | Override the SSH user to connect with; if omitted, your own mStudio user will be used |
| `sshIdentityFile` | `string` | No | The SSH identity file (private key) to include in the returned ssh command |

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

