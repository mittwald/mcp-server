---
title: Install Extension
description: Install an extension in a project or organization.
sidebar:
  label: Install Extension
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Install Extension
  - tag: meta
    attrs:
      name: og:description
      content: Install an extension in a project or organization.
lastUpdated: 2026-01-23
---
## Overview

Install an extension in a project or organization.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `extensionId` | `string` | Yes | ID of the extension to install |
| `projectId` | `string` | Yes | ID of the project to install the extension in |
| `orgId` | `string` | No | ID of the organization to install the extension in |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `consent` | `boolean` | No | Consent to the extension having access to the requested scopes |

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

