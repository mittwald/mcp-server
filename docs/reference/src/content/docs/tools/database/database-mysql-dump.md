---
title: Export MySQL Database
description: Create a dump of a MySQL database.
sidebar:
  label: Export MySQL Database
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Export MySQL Database
  - tag: meta
    attrs:
      name: og:description
      content: Create a dump of a MySQL database.
lastUpdated: 2026-01-23
---
## Overview

Create a dump of a MySQL database.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `databaseId` | `string` | Yes | The ID or name of the database |
| `output` | `string` | Yes | The output file to write the dump to ('-' for stdout) |
| `quiet` | `boolean` | No | Suppress process output and only display a machine-readable summary |
| `mysqlPassword` | `string` | No | The password to use for the MySQL user (security risk - prefer environment variable MYSQL_PWD) |
| `mysqlCharset` | `string` | No | The character set to use for the MySQL connection |
| `temporaryUser` | `boolean` | No | Create a temporary user for the dump (recommended for security) |
| `sshUser` | `string` | No | Override the SSH user to connect with |
| `sshIdentityFile` | `string` | No | The SSH identity file (private key) to use for public key authentication |
| `gzip` | `boolean` | No | Compress the dump with gzip (recommended for large databases) |

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

