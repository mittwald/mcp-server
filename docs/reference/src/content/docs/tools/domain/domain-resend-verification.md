---
title: "Resend Domain Verification Email"
description: "Resend the email that asks the domain owner to verify their email address. For .de domains it is sent from noreply@mittwald.de and must be confirmed within 7 days; for other domains our registrar sends it and the deadline is stated in the email. Domains whose owner email is not verified in time are blocked."
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
      content: "Resend the email that asks the domain owner to verify their email address. For .de domains it is sent from noreply@mittwald.de and must be confirmed within 7 days; for other domains our registrar sends it and the deadline is stated in the email. Domains whose owner email is not verified in time are blocked."
lastUpdated: 2026-10-29
---
## Overview

Resend the email that asks the domain owner to verify their email address. For .de domains it is sent from noreply@mittwald.de and must be confirmed within 7 days; for other domains our registrar sends it and the deadline is stated in the email. Domains whose owner email is not verified in time are blocked.

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

