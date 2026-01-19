# CS-009: Security Audit Automation

## Persona

**Segment**: SEG-004 Enterprise TYPO3 Developer
**Role**: Senior TYPO3 consultant at a certified partner agency serving enterprise clients
**Context**: A major automotive client is preparing for their annual ISO 27001 audit next month. The auditor will ask about API token management, SSH key rotation policies, certificate validity, and active session monitoring. You need to produce a comprehensive security inventory.

## Problem

Enterprise clients with compliance requirements (ISO 27001, SOC 2, GDPR) need regular security audits of their hosting infrastructure. Currently, gathering this information requires: checking MStudio for API tokens (where are they all?), logging into each project to review SSH keys, tracking certificate expiration dates in a spreadsheet, and having no visibility into active sessions. The manual audit takes 4-6 hours per client, produces incomplete documentation, and risks missing expired certificates or forgotten API tokens with excessive permissions. When auditors ask "show me all API tokens with write access," you're scrambling to compile the answer.

## Solution: MCP Workflow

### Prerequisites

- Mittwald MCP server connected to Claude Code
- User account with admin access to organization and projects
- Knowledge of compliance requirements (ISO 27001, SOC 2, etc.)
- Client's project IDs for scope definition

### Step 1: Inventory All API Tokens

```
List all API tokens associated with my user account.
I need to audit token permissions, creation dates, and last usage
for our ISO 27001 compliance review.
```

**Tools Used**: `user/api/token/list`
**Expected Output**: API token inventory:
| Token ID | Name | Created | Last Used | Scopes |
|----------|------|---------|-----------|--------|
| tok-prod-001 | Production Deploy | 2024-03-15 | 2025-01-18 | project:write, app:write |
| tok-ci-002 | GitLab CI | 2024-06-20 | 2025-01-19 | project:read, app:read |
| tok-old-003 | Legacy Script | 2023-01-10 | 2024-02-15 ⚠️ | ALL |
| tok-backup-004 | Backup Service | 2024-09-01 | 2025-01-19 | backup:read, backup:write |

⚠️ Alert: `tok-old-003` has ALL permissions and hasn't been used in 11 months—security risk.

### Step 2: Get Detailed Token Information

```
Get details for the suspicious token tok-old-003.
I need to understand its full permissions and determine if it
should be revoked.
```

**Tools Used**: `user/api/token/get`
**Expected Output**: Token details for `tok-old-003`:
- **Name**: Legacy Script
- **Created**: 2023-01-10
- **Created by**: Former employee (m.schmidt@agency.de)
- **Last used**: 2024-02-15 (11 months ago)
- **Scopes**: ALL (full access to all resources)
- **Expiration**: Never (no expiration set)
- **IP restrictions**: None

🚨 **Security Risk**: This token grants full access, was created by a former employee, hasn't been used in 11 months, and has no expiration. Recommend immediate revocation.

### Step 3: Audit SSH Keys

```
List all SSH keys registered to my user account.
I need to verify which keys are active and identify any
that should be rotated or removed.
```

**Tools Used**: `user/ssh/key/list`
**Expected Output**: SSH key inventory:
| Key ID | Name | Type | Added | Fingerprint |
|--------|------|------|-------|-------------|
| key-001 | MacBook Pro | ED25519 | 2024-01-15 | SHA256:abc123... |
| key-002 | CI/CD Runner | RSA-4096 | 2024-03-20 | SHA256:def456... |
| key-003 | Old Laptop | RSA-2048 | 2022-06-10 ⚠️ | SHA256:ghi789... |

⚠️ Alert: `key-003` is RSA-2048 (weak by 2025 standards) and was added 2.5 years ago—should be replaced with ED25519.

### Step 4: Review SSL Certificates

```
List all SSL certificates across the client's projects.
I need to identify any certificates expiring in the next 90 days
for proactive renewal.
```

**Tools Used**: `certificate/list`
**Expected Output**: Certificate inventory:
| Domain | Type | Issued | Expires | Status |
|--------|------|--------|---------|--------|
| corporate.client.de | Let's Encrypt | 2024-12-20 | 2025-03-20 | ✅ Valid |
| shop.client.de | Let's Encrypt | 2024-11-15 | 2025-02-13 | ⚠️ Expires in 25 days |
| api.client.de | Let's Encrypt | 2025-01-05 | 2025-04-05 | ✅ Valid |
| staging.client.de | Let's Encrypt | 2024-10-01 | 2025-01-01 | 🚨 Expired |

🚨 Alert: `staging.client.de` certificate expired 18 days ago.
⚠️ Alert: `shop.client.de` expires in 25 days—schedule renewal.

### Step 5: Audit Active Sessions

```
List all active sessions for my user account.
I need to verify there are no unauthorized sessions and document
session management for the auditor.
```

**Tools Used**: `user/session/list`
**Expected Output**: Active session inventory:
| Session ID | Device | Location | Started | Last Active |
|------------|--------|----------|---------|-------------|
| sess-001 | Chrome/Mac | Munich, DE | 2025-01-19 08:00 | 2025-01-19 14:32 |
| sess-002 | Claude Code | Munich, DE | 2025-01-19 14:00 | 2025-01-19 14:35 |
| sess-003 | Firefox/Win | Berlin, DE ⚠️ | 2025-01-15 | 2025-01-15 |

⚠️ Alert: `sess-003` from Berlin hasn't been active for 4 days—verify if legitimate or potential credential compromise.

### Step 6: Generate Compliance Audit Report

```
Generate a comprehensive security audit summary for ISO 27001 compliance:
- API token status with risk flags
- SSH key inventory with rotation recommendations
- Certificate status with expiration warnings
- Session activity overview
```

**Tools Used**: `user/api/token/list`, `user/ssh/key/list`, `certificate/list`, `user/session/list`
**Expected Output**:

## ISO 27001 Security Audit Report
**Generated**: 2025-01-19 | **Client**: Automotive Corp | **Auditor**: TYPO3 Partner Agency

### Executive Summary
- **Critical Issues**: 2 (expired certificate, legacy API token)
- **Warnings**: 3 (expiring certificate, weak SSH key, inactive session)
- **Compliant Items**: 8

### API Token Management (A.9.4.3)
- Total tokens: 4
- 🚨 1 token requires immediate revocation (legacy, full access, unused)
- ✅ 3 tokens properly scoped and actively used

### Cryptographic Controls (A.10.1.1)
- SSH Keys: 3 registered
- ⚠️ 1 key using deprecated RSA-2048 (upgrade to ED25519)
- ✅ 2 keys using current standards

### Certificate Management (A.10.1.2)
- Total certificates: 4
- 🚨 1 expired (staging.client.de)
- ⚠️ 1 expiring within 30 days (shop.client.de)
- ✅ 2 valid with 60+ days remaining

### Session Management (A.9.4.2)
- Active sessions: 3
- ⚠️ 1 inactive session requires verification
- ✅ 2 sessions from expected locations

### Recommended Actions
1. **Immediate**: Revoke token `tok-old-003`
2. **Immediate**: Renew certificate for `staging.client.de`
3. **7 days**: Renew certificate for `shop.client.de`
4. **30 days**: Rotate SSH key `key-003` to ED25519
5. **Verify**: Session `sess-003` legitimacy

## Outcomes

- **Time Saved**: 4-6 hours of manual audit reduced to a 20-minute MCP session. Complete security inventory with compliance mapping in one conversation.
- **Error Reduction**: No missed expired certificates (staging.client.de would have been discovered at an embarrassing moment), no forgotten legacy tokens with excessive permissions, complete session visibility. Auditor questions can be answered with exportable documentation.
- **Next Steps**:
  - Revoke identified legacy API token immediately
  - Renew expired and expiring certificates
  - Establish quarterly security audit cadence using this workflow
  - Create alert for certificates expiring within 30 days
  - Document SSH key rotation policy (annual rotation, ED25519 minimum)

---

## Tools Used in This Case Study

| Tool | Domain | Purpose |
|------|--------|---------|
| `user/api/token/list` | identity | Inventory all API tokens |
| `user/api/token/get` | identity | Get detailed token information |
| `user/ssh/key/list` | identity | Audit SSH keys |
| `certificate/list` | domains-mail | Review SSL certificates |
| `user/session/list` | identity | Audit active sessions |

**Total Tools**: 5 primary workflow tools (4 identity, 1 domains-mail)
