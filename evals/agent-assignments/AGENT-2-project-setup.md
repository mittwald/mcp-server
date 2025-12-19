# Agent 2: Project Setup (Tier 1-3)

**Phase**: 2 (Project Setup)
**Workload**: 17 tools
**Domains**: project-foundation, misc
**Dependencies**: Agent 1 must complete first
**Estimated Duration**: 15-20 minutes

---

## ⚠️ CRITICAL INSTRUCTIONS

1. **Wait for Agent 1** to complete before starting
2. **Execute ALL 17 evals** - Do NOT batch or skip
3. **CALL MCP tools directly** - No scripts
4. **Save immediately** to `evals/results/active/{domain}/{tool-name}-result.json`
5. **One at a time** - Complete, save, next

---

## Domain: Project Foundation (12 tools)

Read prompts from `evals/prompts/project-foundation/*.json` and save to `evals/results/active/project-foundation/`:

1. **server-list** → `server-list-result.json`
2. **server-get** → `server-get-result.json`
3. **project-list** → `project-list-result.json`
4. **project-create** → `project-create-result.json`
5. **project-get** → `project-get-result.json`
6. **project-update** → `project-update-result.json`
7. **project-membership-list** → `project-membership-list-result.json`
8. **project-membership-get** → `project-membership-get-result.json`
9. **project-invite-list** → `project-invite-list-result.json`
10. **project-invite-get** → `project-invite-get-result.json`
11. **project-ssh** → `project-ssh-result.json`
12. **project-delete** → `project-delete-result.json`

---

## Domain: Misc (5 tools)

Read prompts from `evals/prompts/misc/*.json` and save to `evals/results/active/misc/`:

1. **conversation-categories** → `conversation-categories-result.json`
2. **conversation-list** → `conversation-list-result.json`
3. **conversation-create** → `conversation-create-result.json`
4. **conversation-show** → `conversation-show-result.json`
5. **conversation-reply** → `conversation-reply-result.json`

---

## Execution Template

For each eval:
```bash
# 1. Read prompt
jq -r '.input.prompt' evals/prompts/{domain}/{tool-name}.json

# 2. Execute eval (CALL MCP tool directly)

# 3. Generate self-assessment JSON

# 4. Save result
cat > evals/results/active/{domain}/{tool-name}-result.json <<'EOF'
{
  "success": true/false,
  "confidence": "high/medium/low",
  "tool_executed": "mcp__mittwald__mittwald_{tool}",
  "timestamp": "2025-12-19T...",
  "problems_encountered": [],
  "resources_created": [],
  "tool_response_summary": "...",
  "execution_notes": "..."
}
EOF
```

---

## Progress Tracking

- [ ] Project Foundation (12/12)
- [ ] Misc (5/5)

## Success Criteria

✅ All 17 tools executed
✅ Project context established for Agents 3-5
✅ All results saved
✅ No errors blocking downstream agents

---

**Start Time**: _______________
**End Time**: _______________
**Tools Completed**: _____ / 17
