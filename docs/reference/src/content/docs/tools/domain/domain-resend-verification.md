---
title: "Resend Domain Verification Email"
description: "Resend the email that asks the domain owner to verify their email address. It is sent from noreply@mittwald.de and must be confirmed within 7 days of registering the domain, otherwise the domain is suspended."
sidebar:
  label: "Resend Domain Verification Email"
  order: 109
head:
  - tag: meta
    attrs:
      name: og:title
      content: "Resend Domain Verification Email"
  - tag: meta
    attrs:
      name: og:description
      content: "Resend the email that asks the domain owner to verify their email address. It is sent from noreply@mittwald.de and must be confirmed within 7 days of registering the domain, otherwise the domain is suspended."
lastUpdated: 2026-10-29
---
## Overview

Resend the email that asks the domain owner to verify their email address. It is sent from noreply@mittwald.de and must be confirmed within 7 days of registering the domain, otherwise the domain is suspended.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainId` | `string` | Yes | The domain ID (see mittwald_domain_list) |

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

