---
title: "Create MySQL Database"
description: "Create a new MySQL database."
sidebar:
  label: "Create MySQL Database"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "Create MySQL Database"
  - tag: meta
    attrs:
      name: og:description
      content: "Create a new MySQL database."
lastUpdated: 2026-07-23
---
## Overview

Create a new MySQL database.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | `string` | Yes | A description for the database |
| `version` | `string` | Yes | The MySQL version in '<major>.<minor>' format, e.g. '8.0' or '8.4' |
| `projectId` | `string` | Yes | ID or short ID of a project; optional if a default project is set in the context |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `collation` | `string` | No | The collation to use (default: utf8mb4_unicode_ci) |
| `characterSet` | `string` | No | The character set to use (default: utf8mb4) |
| `userPassword` | `string` | No | The password for the default user. If omitted, a secure password is auto-generated. Requirements: min 8 chars, at least one special character (#!~%^*_+-=?{}()<>\|.,;$:/), cannot start with -_; |
| `userExternal` | `boolean` | No | Enable external access for default user |
| `userAccessLevel` | `full \| readonly` | No | The access level preset for the default user (default: full) |

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

