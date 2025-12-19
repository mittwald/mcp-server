# Agent 5: Domains & Access (Tier 4)

**Phase**: 3 (Parallel Execution)
**Workload**: 27 tools
**Domains**: domains-mail, access-users (sftp, ssh), certificates
**Dependencies**: Agent 2 must complete first (needs project context)
**Estimated Duration**: 25-30 minutes

---

## ⚠️ CRITICAL INSTRUCTIONS

1. **Wait for Agent 2** to complete before starting
2. **Execute ALL 27 evals** - Do NOT batch or skip
3. **CALL MCP tools directly** - No scripts
4. **Save immediately** to `evals/results/active/{domain}/{tool-name}-result.json`
5. **Can run in parallel** with Agents 3 and 4

---

## Domain: Domains & Mail (21 tools)

Read from `evals/prompts/domains-mail/*.json`, save to `evals/results/active/domains-mail/`:

1. domain-list → `domain-list-result.json`
2. domain-get → `domain-get-result.json`
3. domain-dnszone-list → `domain-dnszone-list-result.json`
4. domain-dnszone-get → `domain-dnszone-get-result.json`
5. domain-dnszone-update → `domain-dnszone-update-result.json`
6. domain-virtualhost-list → `domain-virtualhost-list-result.json`
7. domain-virtualhost-create → `domain-virtualhost-create-result.json`
8. domain-virtualhost-get → `domain-virtualhost-get-result.json`
9. domain-virtualhost-delete → `domain-virtualhost-delete-result.json`
10. certificate-list → `certificate-list-result.json`
11. certificate-request → `certificate-request-result.json`
12. mail-address-list → `mail-address-list-result.json`
13. mail-address-create → `mail-address-create-result.json`
14. mail-address-get → `mail-address-get-result.json`
15. mail-address-update → `mail-address-update-result.json`
16. mail-address-delete → `mail-address-delete-result.json`
17. mail-deliverybox-list → `mail-deliverybox-list-result.json`
18. mail-deliverybox-create → `mail-deliverybox-create-result.json`
19. mail-deliverybox-get → `mail-deliverybox-get-result.json`
20. mail-deliverybox-update → `mail-deliverybox-update-result.json`
21. mail-deliverybox-delete → `mail-deliverybox-delete-result.json`

---

## Domain: Access Users - SFTP (2 tools)

Read from `evals/prompts/access-users/*.json`, save to `evals/results/active/access-users/`:

1. sftp-user-list → `sftp-user-list-result.json`
2. sftp-user-delete → `sftp-user-delete-result.json`

---

## Domain: Access Users - SSH (4 tools)

Read from `evals/prompts/access-users/*.json`, save to `evals/results/active/access-users/`:

1. ssh-user-list → `ssh-user-list-result.json`
2. ssh-user-create → `ssh-user-create-result.json`
3. ssh-user-update → `ssh-user-update-result.json`
4. ssh-user-delete → `ssh-user-delete-result.json`

---

## Progress Tracking

- [ ] Domains & Mail (21/21)
- [ ] SFTP (2/2)
- [ ] SSH (4/4)

**Tools Completed**: _____ / 27

## Success Criteria

✅ All 27 tools executed
✅ All results saved
✅ No batching detected
