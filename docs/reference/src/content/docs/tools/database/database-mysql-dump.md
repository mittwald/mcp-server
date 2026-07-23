---
title: "Get MySQL Dump Instructions"
description: "Get a ready-to-run command that dumps a MySQL database via SSH and mysqldump into a local file. This tool does not create the dump itself - run the returned command locally."
sidebar:
  label: "Get MySQL Dump Instructions"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "Get MySQL Dump Instructions"
  - tag: meta
    attrs:
      name: og:description
      content: "Get a ready-to-run command that dumps a MySQL database via SSH and mysqldump into a local file. This tool does not create the dump itself - run the returned command locally."
lastUpdated: 2026-07-23
---
## Overview

Get a ready-to-run command that dumps a MySQL database via SSH and mysqldump into a local file. This tool does not create the dump itself - run the returned command locally.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `databaseId` | `string` | Yes | The ID or name of the database |
| `output` | `string` | No | Local file the dump should be written to; defaults to <database>.sql (or .sql.gz with gzip) |
| `mysqlPassword` | `string` | No | Password of the MySQL user; if omitted, the returned command contains a placeholder to fill in |
| `mysqlCharset` | `string` | No | Character set for the MySQL connection; defaults to the database's own character set |
| `gzip` | `boolean` | No | Compress the dump with gzip (recommended for large databases) |
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

