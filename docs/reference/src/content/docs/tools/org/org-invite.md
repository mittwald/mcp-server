---
title: Invite User to Organization
description: Invite a user to join an organization with a specified role.
sidebar:
  label: Invite User to Organization
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: Invite User to Organization
  - tag: meta
    attrs:
      name: og:description
      content: Invite a user to join an organization with a specified role.
lastUpdated: 2026-01-23
---
## Overview

Invite a user to join an organization with a specified role.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organizationId` | `string` | Yes | Organization ID that the user will be invited to (format: o-XXXXX) |
| `email` | `string` | Yes | Email address of the user to invite |
| `role` | `owner \| member \| accountant` | Yes | Role to assign to the invited user |
| `message` | `string` | No | Optional message to include in the invitation email |
| `expires` | `string` | No | Optional expiry interval for the invitation (e.g. 30d, 12h) |

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

