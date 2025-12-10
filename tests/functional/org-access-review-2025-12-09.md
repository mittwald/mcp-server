# Organization Access Review Report

**Review Date:** 2025-12-09
**Reviewed By:** Automated Script
**Total Organizations:** 2

---

## Executive Summary

The authenticated user has access to **2 organizations** with owner-level permissions in both. There are currently **no pending invitations** across all organizations.

---

## Organization 1: Nexus

### Basic Information
- **Name:** Nexus
- **Organization ID:** 0080fa08-4f75-4825-9210-2a4eb9a09bea
- **Customer Number:** 4155776
- **Created:** 2025-06-05T19:23:20.000Z
- **Deletion Status:** Allowed to delete (no active contracts)

### Organization Settings
- **Member Count:** 1
- **Project Count:** 0
- **VAT ID Validation:** Unspecified
- **Order Permissions:** Allowed to place orders

### Current Members (1)

| Email | User ID | Role | Membership ID |
|-------|---------|------|---------------|
| rob@robshouse.net | 0f452bff-81b5-496f-957f-ac30e4f37f9d | owner | N/A |

### User's Role
- **owner**

### Pending Invitations
- None

---

## Organization 2: mittwald MCP Server Dev

### Basic Information
- **Name:** mittwald MCP Server Dev
- **Organization ID:** c0256a2f-ccb0-4e00-b6ed-579bdb758675
- **Customer Number:** 4157271
- **Created:** 2025-08-19T06:42:51.000Z
- **Deletion Status:** Prohibited (has active contracts)

### Organization Settings
- **Member Count:** 2
- **Project Count:** 0
- **VAT ID Validation:** Unspecified
- **Order Permissions:** Allowed to place orders
- **Deletion Prohibited By:** Active Contracts

### Current Members (2)

| Email | User ID | Role | Membership ID |
|-------|---------|------|---------------|
| m.helmich@mittwald.de | e01b0326-4ae3-4ea4-b71c-d11364b8e4aa | owner | N/A |
| rob@robshouse.net | 0f452bff-81b5-496f-957f-ac30e4f37f9d | owner | N/A |

### User's Role
- **owner**

### Pending Invitations
- None

---

## Key Findings

1. **Access Level:** The authenticated user (rob@robshouse.net) has owner-level access to both organizations
2. **Membership:**
   - Sole owner of "Nexus" organization
   - Co-owner of "mittwald MCP Server Dev" organization (alongside m.helmich@mittwald.de)
3. **Organization Status:**
   - "Nexus" can be deleted (no active contracts)
   - "mittwald MCP Server Dev" has active contracts preventing deletion
4. **Invitations:** No pending invitations in any organization
5. **Projects:** Neither organization currently has active projects

---

## Security Notes

- Both organizations have owner-level permissions enabled for the user
- No suspicious pending invitations detected
- All member accounts appear to be legitimate
- VAT ID validation is unspecified for both organizations

---

## Recommended Actions

1. Consider adding VAT ID information if applicable for business operations
2. Review whether both owner-level memberships in "mittwald MCP Server Dev" are necessary
3. Monitor active contracts in "mittwald MCP Server Dev" organization

---

**Report Generated:** 2025-12-09T23:12:58.871Z
**Script Location:** /Users/robert/Code/mittwald-mcp/.worktrees/008-mcp-server-instruction/tests/functional/comprehensive-org-review.ts
