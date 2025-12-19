# Agent 1: Foundation Tier (Tier 0)

**Phase**: 1 (Foundation)
**Workload**: 22 tools
**Domains**: identity, organization, context
**Dependencies**: None - run first
**Estimated Duration**: 20-25 minutes

---

## ⚠️ CRITICAL INSTRUCTIONS

1. **Execute ALL 22 evals** - Do NOT batch, skip, or write scripts
2. **CALL MCP tools directly** for each eval
3. **Save results immediately** after each eval to `evals/results/active/{domain}/{tool-name}-result.json`
4. **No batching** - If you feel overwhelmed, STOP and report progress
5. **One tool at a time** - Complete eval, save result, move to next

---

## Domain 1: Identity (12 tools)

### Eval 1: user/get
**Tool**: `mcp__mittwald__mittwald_user_get`
**Prompt**: Read from `evals/prompts/identity/user-get.json` → `jq -r '.input.prompt'`
**Save to**: `evals/results/active/identity/user-get-result.json`

### Eval 2: user/api-token/list
**Tool**: `mcp__mittwald__mittwald_user_api_token_list`
**Prompt**: Read from `evals/prompts/identity/user-api-token-list.json`
**Save to**: `evals/results/active/identity/user-api-token-list-result.json`

### Eval 3: user/api-token/create
**Tool**: `mcp__mittwald__mittwald_user_api_token_create`
**Prompt**: Read from `evals/prompts/identity/user-api-token-create.json`
**Save to**: `evals/results/active/identity/user-api-token-create-result.json`

### Eval 4: user/api-token/get
**Tool**: `mcp__mittwald__mittwald_user_api_token_get`
**Prompt**: Read from `evals/prompts/identity/user-api-token-get.json`
**Save to**: `evals/results/active/identity/user-api-token-get-result.json`

### Eval 5: user/api-token/revoke
**Tool**: `mcp__mittwald__mittwald_user_api_token_revoke`
**Prompt**: Read from `evals/prompts/identity/user-api-token-revoke.json`
**Save to**: `evals/results/active/identity/user-api-token-revoke-result.json`

### Eval 6: user/session/list
**Tool**: `mcp__mittwald__mittwald_user_session_list`
**Prompt**: Read from `evals/prompts/identity/user-session-list.json`
**Save to**: `evals/results/active/identity/user-session-list-result.json`

### Eval 7: user/session/get
**Tool**: `mcp__mittwald__mittwald_user_session_get`
**Prompt**: Read from `evals/prompts/identity/user-session-get.json`
**Save to**: `evals/results/active/identity/user-session-get-result.json`

### Eval 8: user/ssh-key/list
**Tool**: `mcp__mittwald__mittwald_user_ssh_key_list`
**Prompt**: Read from `evals/prompts/identity/user-ssh-key-list.json`
**Save to**: `evals/results/active/identity/user-ssh-key-list-result.json`

### Eval 9: user/ssh-key/create
**Tool**: `mcp__mittwald__mittwald_user_ssh_key_create`
**Prompt**: Read from `evals/prompts/identity/user-ssh-key-create.json`
**Save to**: `evals/results/active/identity/user-ssh-key-create-result.json`

### Eval 10: user/ssh-key/get
**Tool**: `mcp__mittwald__mittwald_user_ssh_key_get`
**Prompt**: Read from `evals/prompts/identity/user-ssh-key-get.json`
**Save to**: `evals/results/active/identity/user-ssh-key-get-result.json`

### Eval 11: user/ssh-key/import
**Tool**: `mcp__mittwald__mittwald_user_ssh_key_import`
**Prompt**: Read from `evals/prompts/identity/user-ssh-key-import.json`
**Save to**: `evals/results/active/identity/user-ssh-key-import-result.json`

### Eval 12: user/ssh-key/delete
**Tool**: `mcp__mittwald__mittwald_user_ssh_key_delete`
**Prompt**: Read from `evals/prompts/identity/user-ssh-key-delete.json`
**Save to**: `evals/results/active/identity/user-ssh-key-delete-result.json`

---

## Domain 2: Organization (7 tools)

### Eval 13: org/list
**Tool**: `mcp__mittwald__mittwald_org_list`
**Prompt**: Read from `evals/prompts/organization/org-list.json`
**Save to**: `evals/results/active/organization/org-list-result.json`

### Eval 14: org/get
**Tool**: `mcp__mittwald__mittwald_org_get`
**Prompt**: Read from `evals/prompts/organization/org-get.json`
**Save to**: `evals/results/active/organization/org-get-result.json`

### Eval 15: org/membership/list
**Tool**: `mcp__mittwald__mittwald_org_membership_list`
**Prompt**: Read from `evals/prompts/organization/org-membership-list.json`
**Save to**: `evals/results/active/organization/org-membership-list-result.json`

### Eval 16: org/invite
**Tool**: `mcp__mittwald__mittwald_org_invite`
**Prompt**: Read from `evals/prompts/organization/org-invite.json`
**Save to**: `evals/results/active/organization/org-invite-result.json`

### Eval 17: org/invite/list
**Tool**: `mcp__mittwald__mittwald_org_invite_list`
**Prompt**: Read from `evals/prompts/organization/org-invite-list.json`
**Save to**: `evals/results/active/organization/org-invite-list-result.json`

### Eval 18: org/invite/revoke
**Tool**: `mcp__mittwald__mittwald_org_invite_revoke`
**Prompt**: Read from `evals/prompts/organization/org-invite-revoke.json`
**Save to**: `evals/results/active/organization/org-invite-revoke-result.json`

### Eval 19: org/membership/revoke
**Tool**: `mcp__mittwald__mittwald_org_membership_revoke`
**Prompt**: Read from `evals/prompts/organization/org-membership-revoke.json`
**Save to**: `evals/results/active/organization/org-membership-revoke-result.json`

---

## Domain 3: Context (3 tools)

### Eval 20: context/get-session
**Tool**: `mcp__mittwald__mittwald_context_get_session`
**Prompt**: Read from `evals/prompts/context/context-get-session.json`
**Save to**: `evals/results/active/context/context-get-session-result.json`

### Eval 21: context/set-session
**Tool**: `mcp__mittwald__mittwald_context_set_session`
**Prompt**: Read from `evals/prompts/context/context-set-session.json`
**Save to**: `evals/results/active/context/context-set-session-result.json`

### Eval 22: context/reset-session
**Tool**: `mcp__mittwald__mittwald_context_reset_session`
**Prompt**: Read from `evals/prompts/context/context-reset-session.json`
**Save to**: `evals/results/active/context/context-reset-session-result.json`

---

## Progress Tracking

Mark each eval as complete after saving result:
- [ ] Identity (12/12)
- [ ] Organization (7/7)
- [ ] Context (3/3)

## Success Criteria

✅ All 22 tools executed
✅ All results saved to `evals/results/active/`
✅ No batching or scripting detected
✅ Ready for Agent 2 to proceed

---

**Start Time**: _______________
**End Time**: _______________
**Tools Completed**: _____ / 22
**Issues Encountered**: _______________
