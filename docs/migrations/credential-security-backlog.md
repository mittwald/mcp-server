# Credential Security Migration Backlog

Tools identified as handling credentials that need migration to S1 standard:

## High Priority (User Management)
- [ ] `src/handlers/tools/mittwald-cli/mail/address/create-cli.ts`
- [ ] `src/handlers/tools/mittwald-cli/mail/address/update-cli.ts`
- [ ] `src/handlers/tools/mittwald-cli/mail/address/delete-cli.ts`
- [ ] `src/handlers/tools/mittwald-cli/mail/deliverybox/create-cli.ts`
- [ ] `src/handlers/tools/mittwald-cli/mail/deliverybox/update-cli.ts`
- [ ] `src/handlers/tools/mittwald-cli/sftp/user-create-cli.ts`
- [ ] `src/handlers/tools/mittwald-cli/sftp/user-update-cli.ts`
- [ ] `src/handlers/tools/mittwald-cli/ssh/user-create-cli.ts`
- [ ] `src/handlers/tools/mittwald-cli/ssh/user-update-cli.ts`

## Medium Priority (API Tokens)
- [ ] `src/handlers/tools/mittwald-cli/login/token-cli.ts`
- [ ] `src/handlers/tools/mittwald-cli/registry/create-cli.ts`
- [ ] `src/handlers/tools/mittwald-cli/registry/update-cli.ts`
- [ ] `src/handlers/tools/mittwald-cli/user/api-token/create-cli.ts`
- [ ] `src/handlers/tools/mittwald-cli/user/api-token/get-cli.ts`
- [ ] `src/handlers/tools/mittwald-cli/user/api-token/list-cli.ts`
- [ ] `src/handlers/tools/mittwald-cli/user/api-token/revoke-cli.ts`
- [ ] `src/handlers/tools/mittwald-cli/user/session/get-cli.ts`
- [ ] `src/handlers/tools/mittwald-cli/user/session/list-cli.ts`

## Low Priority (SSH Keys)
- [ ] `src/handlers/tools/mittwald-cli/backup/download-cli.ts`
- [ ] `src/handlers/tools/mittwald-cli/database/mysql/create-cli.ts`
- [ ] `src/handlers/tools/mittwald-cli/database/mysql/dump-cli.ts`
- [ ] `src/handlers/tools/mittwald-cli/database/mysql/import-cli.ts`
- [ ] `src/handlers/tools/mittwald-cli/database/mysql/port-forward-cli.ts`
- [ ] `src/handlers/tools/mittwald-cli/database/mysql/shell-cli.ts`

## Already Migrated ✅
- [x] `database/mysql/user-create-cli.ts`
- [x] `database/mysql/user-update-cli.ts`

---
**Auto-generated**: 2025-10-02
