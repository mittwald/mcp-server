---
work_package_id: "WP07"
subtasks:
  - "T001"
title: "Generate Prompts - identity (17 tools)"
phase: "Phase 3 - Eval Prompt Generation"
lane: "for_review"
assignee: "claude"
agent: "claude"
shell_pid: "78380"
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-12-16T13:07:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-12-16T16:43:00Z"
    lane: "for_review"
    agent: "claude"
    shell_pid: "78380"
    action: "Generated 19 identity domain prompts (includes login/* tools)"
---

# Work Package Prompt: WP07 – Generate Prompts - identity (17 tools)

## Objective

Generate Langfuse-compatible eval prompts for all 17 tools in the identity domain. This domain contains mostly Tier 0 tools (no dependencies), making it ideal for initial validation.

## Domain Overview

| Domain | identity |
|--------|----------|
| Tool Count | 17 |
| Primary Tier | 0 (most tools) |
| Prefixes | `user/`, `context/` |
| Risk Level | Low (read-heavy, no destructive ops) |

## Tool List

### user/ tools (12)

| Tool | Tier | Dependencies | Destructive |
|------|------|--------------|-------------|
| `user/get` | 0 | None | No |
| `user/session/list` | 0 | None | No |
| `user/session/get` | 0 | session ID | No |
| `user/ssh-key/list` | 0 | None | No |
| `user/ssh-key/get` | 0 | key ID | No |
| `user/ssh-key/create` | 0 | None | No |
| `user/ssh-key/delete` | 0 | key ID | **Yes** |
| `user/ssh-key/import` | 0 | None | No |
| `user/api-token/list` | 0 | None | No |
| `user/api-token/get` | 0 | token ID | No |
| `user/api-token/create` | 0 | None | No |
| `user/api-token/revoke` | 0 | token ID | **Yes** |

### context/ tools (5)

| Tool | Tier | Dependencies | Destructive |
|------|------|--------------|-------------|
| `context/get` | 0 | None | No |
| `context/set` | 0 | None | No |
| `context/reset` | 0 | None | No |
| `context/accessible-projects` | 0 | None | No |
| `context/get-session` | 0 | None | No |

## Prompt Generation Instructions

For each tool, generate a JSON file following this structure:

```json
{
  "input": {
    "prompt": "[Full eval prompt text - see template]",
    "tool_name": "mcp__mittwald__mittwald_user_get",
    "display_name": "user/get",
    "context": {
      "dependencies": [],
      "setup_instructions": "No setup required - Tier 0 tool",
      "required_resources": []
    }
  },
  "expectedOutput": null,
  "metadata": {
    "domain": "identity",
    "tier": 0,
    "tool_description": "Get profile information for a user",
    "success_indicators": [
      "Returns user profile data",
      "Response includes user ID",
      "No authentication errors"
    ],
    "self_assessment_required": true,
    "eval_version": "1.0.0",
    "created_at": "2025-12-16T00:00:00Z",
    "tags": ["identity", "tier-0", "read-only"]
  }
}
```

## Tool-Specific Details

### user/get

**Description**: Retrieve current user's profile information

**Success Indicators**:
- Returns user profile object
- Includes userId, email, name fields
- No authentication errors

**Example Parameters**: None required (defaults to current user)

---

### user/session/list

**Description**: List all active sessions for the current user

**Success Indicators**:
- Returns array of sessions
- Each session has tokenId and device info
- Current session included in list

**Example Parameters**: None required

---

### user/session/get

**Description**: Get details of a specific session

**Success Indicators**:
- Returns session details
- Includes device, location, timestamp
- Session ID matches request

**Example Parameters**: `tokenId` - session token ID

---

### user/ssh-key/list

**Description**: List all SSH keys for the current user

**Success Indicators**:
- Returns array of SSH keys
- Each key has keyId and fingerprint
- No errors

**Example Parameters**: None required

---

### user/ssh-key/get

**Description**: Get details of a specific SSH key

**Success Indicators**:
- Returns SSH key details
- Includes public key fingerprint
- Key ID matches request

**Example Parameters**: `keyId` - SSH key ID

---

### user/ssh-key/create

**Description**: Create and import a new SSH key

**Success Indicators**:
- Returns new key ID
- Key appears in list
- Public key stored correctly

**Example Parameters**:
- `comment`: Optional description
- `expires`: Optional expiry interval
- `output`: Filename for key storage

**Resources Created**: SSH key (track for cleanup)

---

### user/ssh-key/delete

**Description**: Delete an SSH key

**Success Indicators**:
- Key removed from list
- Confirmation received
- No errors

**Example Parameters**:
- `keyId`: Key to delete
- `confirm`: Must be `true`

**Destructive**: Yes - ensure test key exists first

---

### user/ssh-key/import

**Description**: Import an existing SSH public key

**Success Indicators**:
- Key imported successfully
- Appears in key list
- Fingerprint matches

**Example Parameters**:
- `input`: Path to public key file
- `expires`: Optional expiry

**Resources Created**: SSH key (track for cleanup)

---

### user/api-token/list

**Description**: List all API tokens

**Success Indicators**:
- Returns array of tokens
- Each token has tokenId and description
- No errors

**Example Parameters**: None required

---

### user/api-token/get

**Description**: Get details of a specific API token

**Success Indicators**:
- Returns token details
- Includes roles and expiry
- Token ID matches request

**Example Parameters**: `tokenId` - API token ID

---

### user/api-token/create

**Description**: Create a new API token

**Success Indicators**:
- Returns new token ID and value
- Token appears in list
- Roles assigned correctly

**Example Parameters**:
- `description`: Token description
- `roles`: Array of roles (e.g., `["api_read", "api_write"]`)
- `expires`: Optional expiry interval

**Resources Created**: API token (track for cleanup - tokens are sensitive)

---

### user/api-token/revoke

**Description**: Revoke an API token

**Success Indicators**:
- Token revoked successfully
- No longer appears in list
- Confirmation received

**Example Parameters**:
- `tokenId`: Token to revoke
- `confirm`: Must be `true`

**Destructive**: Yes - ensure test token exists first

---

### context/get

**Description**: Get current CLI context parameters

**Success Indicators**:
- Returns context object
- Shows current project/org/server if set
- No errors

**Example Parameters**: None required

---

### context/set

**Description**: Set context parameters

**Success Indicators**:
- Context updated successfully
- New values reflected in context/get
- No validation errors

**Example Parameters**:
- `projectId`: Optional project context
- `orgId`: Optional org context
- `serverId`: Optional server context

---

### context/reset

**Description**: Reset all context parameters

**Success Indicators**:
- Context cleared
- Subsequent context/get shows empty/defaults
- No errors

**Example Parameters**: None required

---

### context/accessible-projects

**Description**: List projects accessible to current user

**Success Indicators**:
- Returns array of accessible projects
- Includes project IDs and names
- Respects user permissions

**Example Parameters**: None required

---

### context/get-session

**Description**: Get current user context from Redis session

**Success Indicators**:
- Returns session context
- Shows stored preferences
- No errors

**Example Parameters**: None required

## Deliverables

- [ ] `evals/prompts/identity/user-get.json`
- [ ] `evals/prompts/identity/user-session-list.json`
- [ ] `evals/prompts/identity/user-session-get.json`
- [ ] `evals/prompts/identity/user-ssh-key-list.json`
- [ ] `evals/prompts/identity/user-ssh-key-get.json`
- [ ] `evals/prompts/identity/user-ssh-key-create.json`
- [ ] `evals/prompts/identity/user-ssh-key-delete.json`
- [ ] `evals/prompts/identity/user-ssh-key-import.json`
- [ ] `evals/prompts/identity/user-api-token-list.json`
- [ ] `evals/prompts/identity/user-api-token-get.json`
- [ ] `evals/prompts/identity/user-api-token-create.json`
- [ ] `evals/prompts/identity/user-api-token-revoke.json`
- [ ] `evals/prompts/identity/context-get.json`
- [ ] `evals/prompts/identity/context-set.json`
- [ ] `evals/prompts/identity/context-reset.json`
- [ ] `evals/prompts/identity/context-accessible-projects.json`
- [ ] `evals/prompts/identity/context-get-session.json`

**Total**: 17 JSON files

## Acceptance Criteria

1. All 17 prompt files created
2. Each file validates against Langfuse schema
3. All files include self-assessment instructions
4. Destructive tools clearly marked
5. Success indicators specific to each tool

## Parallelization Notes

This WP can run **fully in parallel** with all other Phase 3 WPs (WP-08 through WP-17).

All Phase 3 WPs depend only on:
- **WP-04** (Tool Inventory)
- **WP-02** (Eval Prompt Generator) - if using automated generation

## Execution Priority

Execute this domain **first** during Phase 4 because:
1. Mostly Tier 0 tools (no dependencies)
2. Low risk (read-heavy)
3. Validates authentication and basic connectivity
4. Provides baseline for other domains

